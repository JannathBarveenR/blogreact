"""
Pet Profile routes — secure, user-scoped endpoints.

POST /api/pet-profile          — Create pet profile with photo upload
GET  /api/pet-profile          — Fetch all pets for the authenticated user
GET  /api/pet-profile/{id}     — Fetch by UUID (ownership enforced)
PATCH /api/pet-profile/{id}    — Update pet profile (ownership enforced)
POST /api/pet-profile/{id}/photo — Update pet photo (ownership enforced)
GET  /api/pet-profile/by-petolife-id/{petolife_id} — QR redirect (public)
GET  /api/pet-profile/public/{petolife_id} — Public pet data (public)
"""

import json
import time
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from app.config import FRONTEND_URL

class PetProfileUpdate(BaseModel):
    pet_name: Optional[str] = None
    breed: Optional[str] = None
    gender: Optional[str] = None
    birth_date: Optional[str] = None
    weight: Optional[float] = None
    blood_group: Optional[str] = None

from app.supabase_client import supabase as global_supabase
from app.routers.pet_health_id import generate_pet_health_id, store_pet_health_id
from app.utils.auth import get_current_user_id, get_user_supabase
from supabase import Client

router = APIRouter()


@router.post("/")
async def create_pet_profile(
    pet_type: str = Form(...),
    pet_name: str = Form(...),
    user_id: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    breed: Optional[str] = Form(None),
    gender: Optional[str] = Form(None),
    birth_date: Optional[str] = Form(None),
    weight: Optional[str] = Form(None),
    blood_group: Optional[str] = Form(None),
    identification_marks: Optional[str] = Form(None),
    pet_ids: Optional[str] = Form(None),  # JSON string: [{"idName":"...", "idNumber":"..."}]
    pet_photo: Optional[UploadFile] = File(None),
    auth_user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_user_supabase)
):
    """Create a new pet profile with photo upload + PetOLife ID generation."""
    print("--- POST /api/pet-profile ---")
    print(f"pet_type={pet_type}, pet_name={pet_name}, city={city}")

    effective_user_id = auth_user_id

    if not pet_type or not pet_name:
        raise HTTPException(status_code=400, detail="pet_type and pet_name are required")

    # Parse pet_ids from the form — now stored as JSON directly on pet_profiles,
    # not a separate pet_ids table (that table was dropped).
    parsed_ids: list[dict] = []
    if pet_ids:
        try:
            parsed_ids = json.loads(pet_ids)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid pet_ids format")

    valid_ids = [
        {"id_name": item["idName"], "id_number": item["idNumber"]}
        for item in parsed_ids
        if item.get("idName", "").strip() and item.get("idNumber", "").strip()
    ]

    petolife_id = generate_pet_health_id(city or "Unknown", pet_type)
    print(f"Generated PetOLife ID: {petolife_id}")

    pet_photo_url = None
    if pet_photo and pet_photo.filename:
        file_name = f"{int(time.time() * 1000)}-{pet_photo.filename.replace(' ', '-')}"
        file_bytes = await pet_photo.read()
        print(f"Uploading photo: {file_name}")

        try:
            supabase.storage.from_("pet-photos").upload(
                file_name,
                file_bytes,
                {"content-type": pet_photo.content_type or "image/jpeg"},
            )
        except Exception as upload_err:
            print(f"Photo upload error: {upload_err}")
            raise HTTPException(
                status_code=500,
                detail=f"Photo upload failed: {str(upload_err)}",
            )

        url_data = supabase.storage.from_("pet-photos").get_public_url(file_name)
        pet_photo_url = url_data
        print(f"Photo URL: {pet_photo_url}")

    print("Inserting pet profile into database...")
    insert_data = {
        "petolife_id": petolife_id,
        "user_id": effective_user_id,
        "pet_type": pet_type,
        "pet_name": pet_name,
        "breed": breed or None,
        "gender": gender or None,
        "birth_date": birth_date or None,
        "weight": float(weight) if weight else None,
        "blood_group": blood_group or None,
        "identification_marks": identification_marks or None,
        "pet_photo_url": pet_photo_url,
        "pet_health_id": petolife_id,
        "identification_ids": valid_ids,
    }

    result = supabase.table("pet_profiles").insert(insert_data).execute()

    if not result.data:
        print(f"Profile insert error: {result}")
        raise HTTPException(status_code=500, detail="Failed to create pet profile")

    profile = result.data[0]
    print(f"Profile created: {profile['id']}")

    store_pet_health_id(petolife_id, profile["id"])

    print("--- Profile created successfully ---")
    return {
        "message": "Pet profile created successfully",
        "pet_profile_id": profile["id"],
        "petolife_id": profile["petolife_id"],
        "data": profile,
    }


@router.get("/")
async def get_my_profiles(
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_user_supabase)
):
    """Fetch all pet profiles belonging to the authenticated user."""
    try:
        result = (
            supabase.table("pet_profiles")
            .select("id, petolife_id, pet_name, pet_type, breed, gender, birth_date, weight, pet_photo_url, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data or []
    except Exception as e:
        print(f"Fetch profiles error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch profiles: {str(e)}")


@router.get("/by-user/{user_id}")
async def get_pets_by_user(
    user_id: str,
    auth_user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_user_supabase)
):
    """Fetch all pet profiles for a specific user (only if it's the authenticated user)."""
    if user_id != auth_user_id:
        raise HTTPException(status_code=403, detail="You can only view your own pet profiles")
    try:
        result = (
            supabase.table("pet_profiles")
            .select("id, petolife_id, pet_name, pet_type, breed, gender, birth_date, weight, pet_photo_url, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data or []
    except Exception as e:
        print(f"Fetch user pets error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch user pets: {str(e)}")


@router.get("/by-petolife-id/{petolife_id:path}")
async def get_by_petolife_id_redirect(petolife_id: str):
    """QR scan endpoint — redirects browser to the frontend pet profile UI. (Public)"""
    frontend_base = FRONTEND_URL or "http://localhost:5173"
    redirect_url = f"{frontend_base}/pet/{petolife_id.lower()}"
    return RedirectResponse(url=redirect_url, status_code=302)


@router.get("/public/{petolife_id:path}")
async def get_public_pet_data(petolife_id: str):
    """JSON data endpoint — called by the frontend pet profile UI page. (Public)"""
    from fastapi.responses import JSONResponse

    result = (
        global_supabase.table("pet_profiles")
        .select("id, user_id, petolife_id, pet_type, pet_name, breed, gender, birth_date, weight, blood_group, identification_marks, pet_photo_url, created_at, identification_ids, pet_attributes")
        .ilike("petolife_id", petolife_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Pet not found")

    profile = result.data[0]

    owner_info = None
    owner_user_id = profile.get("user_id")
    if owner_user_id:
        owner_result = (
            global_supabase.table("user_profiles")
            .select("full_name, phone, email")
            .eq("id", owner_user_id)
            .execute()
        )
        if owner_result.data:
            owner_info = owner_result.data[0]

    return JSONResponse(
        content={
            **profile,
            "pet_ids": profile.get("identification_ids", []),
            "owner_info": owner_info,
        },
        headers={
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        }
    )


@router.get("/{profile_id}")
async def get_pet_profile(
    profile_id: str,
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_user_supabase)
):
    """Fetch pet profile by UUID (ownership enforced)."""
    result = supabase.table("pet_profiles").select("id, user_id, petolife_id, pet_type, pet_name, breed, gender, birth_date, weight, blood_group, identification_marks, pet_photo_url, created_at, identification_ids, pet_attributes").eq("id", profile_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Pet profile not found")

    profile = result.data[0]

    if profile.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="You do not have permission to access this pet profile")

    return {**profile, "pet_ids": profile.get("identification_ids", [])}


@router.patch("/{profile_id}")
async def update_pet_profile(
    profile_id: str,
    updates: PetProfileUpdate,
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_user_supabase)
):
    """Update pet profile details in-place (ownership enforced)."""
    try:
        update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
        if not update_data:
            return {"message": "No updates provided"}

        result = supabase.table("pet_profiles").update(update_data).eq("id", profile_id).eq("user_id", user_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Pet profile not found or update failed (unauthorized)")

        return {"message": "Pet profile updated successfully", "data": result.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Update profile error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")


@router.post("/{profile_id}/photo")
async def update_pet_photo(
    profile_id: str,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_user_supabase)
):
    """Upload and update pet photo (ownership enforced)."""
    try:
        res = supabase.table("pet_profiles").select("user_id").eq("id", profile_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Pet profile not found")
        if res.data[0]["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        file_name = f"{profile_id}-{int(time.time() * 1000)}-{file.filename.replace(' ', '-')}"
        file_bytes = await file.read()

        supabase.storage.from_("pet-photos").upload(
            file_name,
            file_bytes,
            {"content-type": file.content_type or "image/jpeg"}
        )

        photo_url = supabase.storage.from_("pet-photos").get_public_url(file_name)

        supabase.table("pet_profiles").update({"pet_photo_url": photo_url}).eq("id", profile_id).execute()

        return {"message": "Photo uploaded successfully", "pet_photo_url": photo_url}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Photo upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload photo: {str(e)}")


@router.delete("/{profile_id}")
async def delete_pet_profile(
    profile_id: str,
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_user_supabase)
):
    """Delete pet profile (ownership enforced)."""
    try:
        result = supabase.table("pet_profiles").select("user_id, pet_photo_url").eq("id", profile_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Pet profile not found")
        if result.data[0]["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        if result.data:
            photo_url = result.data[0].get("pet_photo_url")
            if photo_url:
                filename = photo_url.split("/")[-1]
                if filename:
                    try:
                        supabase.storage.from_("pet-photos").remove([filename])
                    except Exception as e:
                        print(f"Error deleting photo from bucket: {e}")

        delete_result = supabase.table("pet_profiles").delete().eq("id", profile_id).execute()

        return {"message": "Pet profile deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Delete profile error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete profile: {str(e)}")