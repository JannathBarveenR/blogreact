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
from app.supabase_client import supabase
from app.utils.auth import get_current_user_id

router = APIRouter()

def ensure_bucket_exists():
    try:
        buckets = supabase.storage.list_buckets()
        bucket_names = [b.name for b in buckets] if buckets else []
        if "medical-docs" not in bucket_names:
            supabase.storage.create_bucket("medical-docs", options={"public": True})
            print("[Storage] Created public bucket 'medical-docs'")
    except Exception as e:
        print(f"[Storage] Note during bucket check: {e}")

@router.post("/upload")
async def upload_medical_record(
    pet_profile_id: str = Form(...),
    title: str = Form(...),
    category: str = Form(...),
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
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

        ensure_bucket_exists()

        # 1) Upload to Storage Bucket 'medical-docs'
        timestamp = int(time.time() * 1000)
        safe_filename = file.filename.replace(" ", "_") if file.filename else "document"
        
        # Clean path: {category}/{pet_profile_id}/{timestamp}-{filename}
        safe_category = category.strip().replace(" ", "_")
        storage_path = f"{safe_category}/{pet_profile_id}/{timestamp}-{safe_filename}"
        
        file_bytes = await file.read()
        file_size = len(file_bytes)
        
        if file_size > 10 * 1024 * 1024: # 10MB limit
             raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")

        res = supabase.storage.from_("medical-docs").upload(
            storage_path,
            file_bytes,
            {"content-type": file.content_type}
        )

        # Get the public URL for the file
        public_url = supabase.storage.from_("medical-docs").get_public_url(storage_path)

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
            try:
                supabase.storage.from_("medical-docs").remove([storage_path])
            except:
                pass
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
async def get_medical_records(pet_profile_id: str, user_id: str = Depends(get_current_user_id)):
    """Fetch all medical records for a specific pet (ownership enforced)."""
    try:
        # One query — only return records owned by this user AND matching this pet
        res = (
            supabase.table("medical_records")
            .select("id, title, file_name, file_url, file_type, file_size, category, is_favorite, created_at, pet_profile_id")
            .eq("pet_profile_id", pet_profile_id)
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return res.data or []
    except HTTPException:
        raise
    except Exception as e:
        print(f"Fetch records error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch records: {str(e)}")

@router.delete("/{record_id}")
async def delete_medical_record(record_id: str, user_id: str = Depends(get_current_user_id)):
    """Delete a medical record from both DB and Storage (ownership enforced)."""
    try:
        # 1) Get the record and verify ownership
        # Using select with required columns
        res = supabase.table("medical_records").select("id, user_id, pet_profile_id, storage_path").eq("id", record_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Record not found")
        
        record = res.data[0]
        
        # SECURITY: Fast check via record's user_id if it exists, else fallback to pet profile
        record_user_id = record.get("user_id")
        
        if record_user_id:
            if record_user_id != user_id:
                raise HTTPException(status_code=403, detail="You do not have permission to delete this record")
        else:
            pet_res = supabase.table("pet_profiles").select("user_id").eq("id", record.get("pet_profile_id")).execute()
            if pet_res.data and pet_res.data[0].get("user_id") != user_id:
                raise HTTPException(status_code=403, detail="You do not have permission to delete this record")

        storage_path = record["storage_path"]
        
        # 2) Delete from Storage
        try:
             supabase.storage.from_("medical-docs").remove([storage_path])
        except Exception as storage_err:
             print(f"Warning: Failed to delete file from storage: {storage_err}")
             # Continue to delete from DB even if storage delete fails
        
        # 3) Delete from DB
        db_res = supabase.table("medical_records").delete().eq("id", record_id).execute()
        
        return {"message": "Record deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Delete record error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete record: {str(e)}")

@router.patch("/{record_id}/favorite")
async def toggle_favorite(record_id: str, user_id: str = Depends(get_current_user_id)):
    """Toggle the is_favorite status of a medical record (ownership enforced)."""
    try:
        # 1) Get the record and verify ownership
        res = supabase.table("medical_records").select("id, user_id, pet_profile_id, is_favorite").eq("id", record_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Record not found")
        
        record = res.data[0]
        
        # Fast check via record's user_id if it exists, else fallback to pet profile
        record_user_id = record.get("user_id")
        
        if record_user_id:
            if record_user_id != user_id:
                raise HTTPException(status_code=403, detail="You do not have permission to modify this record")
        else:
            pet_res = supabase.table("pet_profiles").select("user_id").eq("id", record.get("pet_profile_id")).execute()
            if pet_res.data and pet_res.data[0].get("user_id") != user_id:
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

