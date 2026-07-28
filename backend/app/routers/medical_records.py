"""
Medical Records Router — secure, user-scoped endpoints.
Handles uploading, fetching, and deleting pet medical documents via Supabase Storage.

POST   /api/medical-records/upload          — Upload a record (ownership enforced)
GET    /api/medical-records/{pet_profile_id} — Fetch records for a pet (ownership enforced)
DELETE /api/medical-records/{record_id}      — Delete a record (ownership enforced)
PATCH  /api/medical-records/{record_id}/favorite — Toggle favorite status
"""

import time
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from app.supabase_client import supabase as global_supabase, supabase_admin
from app.utils.auth import get_current_user_id, get_user_supabase
from supabase import Client

router = APIRouter()

from app.services.medical_record_service import MedicalRecordService

@router.post("/upload")
async def upload_medical_record(
    pet_profile_id: str = Form(...),
    title: str = Form(...),
    category: str = Form(...),
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_user_supabase)
):
    try:
        # Validate inputs
        if not pet_profile_id or not title or not category:
            raise HTTPException(status_code=400, detail="Missing required fields")

        # SECURITY: Verify the pet belongs to the authenticated user
        pet_res = supabase.table("pet_profiles").select("user_id").eq("id", pet_profile_id).execute()
        if not pet_res.data:
            raise HTTPException(status_code=404, detail="Pet profile not found")
        if pet_res.data[0].get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="You do not have permission to upload records for this pet")

        # 1) Upload to Storage Bucket using MedicalRecordService
        safe_filename = file.filename.replace(" ", "_") if file.filename else "document"
        file_bytes = await file.read()
        file_size = len(file_bytes)
        
        if file_size > 10 * 1024 * 1024: # 10MB limit
             raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")

        public_url, storage_path = MedicalRecordService.upload_file(file_bytes, safe_filename, file.content_type)

        # Insert record into DB
        db_record = {
            "pet_profile_id": pet_profile_id,
            "user_id": user_id,
            "title": title,
            "category": category,
            "file_url": public_url,
            "file_name": file.filename,
            "file_type": file.content_type,
            "file_size": file_size,
            "storage_path": storage_path
        }

        try:
            db_res = supabase.table("medical_records").insert(db_record).execute()
        except Exception as ins_err:
            # Fallback if user_id column doesn't exist in DB schema yet
            if "user_id" in str(ins_err):
                db_record.pop("user_id", None)
                db_res = supabase.table("medical_records").insert(db_record).execute()
            else:
                raise ins_err
        
        if not db_res.data:
            # If DB insert fails, try to clean up the uploaded file
            MedicalRecordService.delete_file(storage_path)
            raise HTTPException(status_code=500, detail="Failed to save record metadata to database")
            
        return {
            "message": "Upload successful",
            "record": db_res.data[0]
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Medical upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload document: {str(e)}")

@router.get("/{pet_profile_id}")
async def get_medical_records(
    pet_profile_id: str, 
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_user_supabase)
):
    """Fetch all medical records for a specific pet (ownership enforced)."""
    try:
        # SECURITY: Verify pet ownership via pet_profiles
        pet_res = supabase.table("pet_profiles").select("user_id").eq("id", pet_profile_id).execute()
        if pet_res.data and pet_res.data[0].get("user_id") and pet_res.data[0].get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="You do not have permission to view records for this pet")

        # 1) Try querying with user_id + pet_profile_id filter
        try:
            res = (
                supabase.table("medical_records")
                .select("id, title, file_name, file_url, file_type, file_size, category, is_favorite, created_at, pet_profile_id")
                .eq("pet_profile_id", pet_profile_id)
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .execute()
            )
            return res.data or []
        except Exception as filter_err:
            print(f"[medical_records] Query with user_id failed: {filter_err}. Falling back to pet_profile_id query.")

        # 2) Fallback: Query by pet_profile_id alone
        res = (
            supabase.table("medical_records")
            .select("id, title, file_name, file_url, file_type, file_size, category, is_favorite, created_at, pet_profile_id")
            .eq("pet_profile_id", pet_profile_id)
            .order("created_at", desc=True)
            .execute()
        )
        return res.data or []
    except HTTPException:
        raise
    except Exception as e:
        print(f"Fetch records error: {e}")
        return []

@router.delete("/{record_id}")
async def delete_medical_record(
    record_id: str, 
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_user_supabase)
):
    """Delete a medical record from both DB and Storage (ownership enforced)."""
    try:
        # 1) Get record
        res = None
        try:
            res = supabase.table("medical_records").select("id, user_id, pet_profile_id, storage_path").eq("id", record_id).execute()
        except Exception:
            res = supabase.table("medical_records").select("id, pet_profile_id, storage_path").eq("id", record_id).execute()

        if not res or not res.data:
            raise HTTPException(status_code=404, detail="Record not found")
        
        record = res.data[0]
        record_user_id = record.get("user_id")
        
        if record_user_id:
            if record_user_id != user_id:
                raise HTTPException(status_code=403, detail="You do not have permission to delete this record")
        else:
            pet_res = supabase.table("pet_profiles").select("user_id").eq("id", record.get("pet_profile_id")).execute()
            if pet_res.data and pet_res.data[0].get("user_id") and pet_res.data[0].get("user_id") != user_id:
                raise HTTPException(status_code=403, detail="You do not have permission to delete this record")

        storage_path = record.get("storage_path")
        
        # 2) Delete from Storage if path exists
        if storage_path:
            try:
                MedicalRecordService.delete_file(storage_path)
            except Exception as st_err:
                print(f"[medical_records] Storage file delete notice: {st_err}")
        
        # 3) Delete from DB
        supabase.table("medical_records").delete().eq("id", record_id).execute()
        return {"message": "Record deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Delete record error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete record: {str(e)}")

@router.patch("/{record_id}/favorite")
async def toggle_favorite(
    record_id: str, 
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_user_supabase)
):
    """Toggle the is_favorite status of a medical record (ownership enforced)."""
    try:
        # 1) Get the record
        res = None
        try:
            res = supabase.table("medical_records").select("id, user_id, pet_profile_id, is_favorite").eq("id", record_id).execute()
        except Exception:
            res = supabase.table("medical_records").select("id, pet_profile_id, is_favorite").eq("id", record_id).execute()

        if not res or not res.data:
            raise HTTPException(status_code=404, detail="Record not found")
        
        record = res.data[0]
        record_user_id = record.get("user_id")
        
        if record_user_id:
            if record_user_id != user_id:
                raise HTTPException(status_code=403, detail="You do not have permission to modify this record")
        else:
            pet_res = supabase.table("pet_profiles").select("user_id").eq("id", record.get("pet_profile_id")).execute()
            if pet_res.data and pet_res.data[0].get("user_id") and pet_res.data[0].get("user_id") != user_id:
                raise HTTPException(status_code=403, detail="You do not have permission to modify this record")
                
        # 2) Toggle the is_favorite boolean
        current_fav = record.get("is_favorite", False)
        new_fav = not current_fav
        
        update_res = supabase.table("medical_records").update({"is_favorite": new_fav}).eq("id", record_id).execute()
        
        if not update_res.data:
            raise HTTPException(status_code=500, detail="Failed to update favorite status")
            
        return {"message": "Favorite status updated", "is_favorite": new_fav, "record": update_res.data[0]}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Toggle favorite error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to toggle favorite: {str(e)}")

