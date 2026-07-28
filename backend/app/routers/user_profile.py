"""
User Profile routes — secure, user-scoped endpoints.

GET  /api/user-profile/{user_id}        — Get user profile (ownership enforced)
PUT  /api/user-profile/{user_id}        — Update user profile (ownership enforced)
POST /api/user-profile/{user_id}/avatar — Upload avatar (ownership enforced)
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from pydantic import BaseModel
from typing import Optional
from app.supabase_client import supabase as global_supabase, supabase_admin
from app.utils.auth import get_current_user_id, get_user_supabase
from app.s3_client import upload_public_file, AWS_AVATARS_BUCKET
from supabase import Client
import time
import re

router = APIRouter()

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    address: Optional[str] = None

# Avatars bucket now on AWS S3

@router.get("/{user_id}")
async def get_user_profile(
    user_id: str, 
    auth_user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_user_supabase)
):
    """Get user profile (ownership enforced)."""
    # SECURITY: Users can only view their own profile
    if user_id != auth_user_id:
        raise HTTPException(status_code=403, detail="You can only view your own profile")
    try:
        response = supabase.table("user_profiles").select("id, full_name, phone, email, city, state, pincode, address, avatar_url, auth_provider").eq("id", user_id).execute()
        if not response.data:
            # Google OAuth users may not have a row in user_profiles yet.
            # Return an empty shell so the frontend can render the completion form.
            return {
                "id": user_id,
                "full_name": None,
                "phone": None,
                "email": None,
                "city": None,
                "state": None,
                "pincode": None,
                "address": None,
                "avatar_url": None,
                "auth_provider": None,
            }
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{user_id}")
async def update_user_profile(
    user_id: str, 
    profile: UserProfileUpdate, 
    auth_user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_user_supabase)
):
    """Update user profile (ownership enforced)."""
    # SECURITY: Users can only update their own profile
    if user_id != auth_user_id:
        raise HTTPException(status_code=403, detail="You can only update your own profile")
    try:
        update_data = {k: v for k, v in profile.model_dump().items() if v is not None}
        if not update_data:
            return {"message": "No data to update"}
        
        update_data["id"] = user_id

        # Determine auth provider from auth.users and save to public.user_profiles
        try:
            auth_user = supabase_admin.auth.admin.get_user_by_id(user_id)
            if auth_user:
                provider = auth_user.app_metadata.get("provider") or auth_user.app_metadata.get("providers", ["phone"])[0]
                update_data["auth_provider"] = provider
        except Exception as auth_provider_err:
            print(f"Failed to fetch auth user provider: {auth_provider_err}")

        # If phone is being set, check it isn't already owned by a DIFFERENT user row.
        # This prevents the user_profiles_phone_key unique constraint from firing.
        if "phone" in update_data and update_data["phone"]:
            phone_conflict = supabase_admin.table("user_profiles") \
                .select("id") \
                .eq("phone", update_data["phone"]) \
                .neq("id", user_id) \
                .execute()
            if phone_conflict.data:
                # Another row already has this phone — skip updating the phone field.
                update_data.pop("phone", None)

        # Check if a row already exists for this user
        existing = supabase_admin.table("user_profiles").select("id").eq("id", user_id).execute()

        if not existing.data:
            # No row exists yet (Google OAuth user first-time profile completion).
            # Use admin client to INSERT, bypassing RLS that blocks inserts from user tokens.
            response = supabase_admin.table("user_profiles").insert(update_data).execute()
        else:
            # Row exists — UPDATE only (no risk of touching phone UNIQUE on another row).
            response = supabase_admin.table("user_profiles").update(update_data).eq("id", user_id).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Profile update failed — no data returned")

        # Optionally sync full_name to auth.users metadata (best-effort, non-blocking)
        if "full_name" in update_data:
            try:
                supabase_admin.auth.admin.update_user_by_id(
                    user_id,
                    {"user_metadata": {"full_name": update_data["full_name"]}}
                )
            except Exception as auth_sync_err:
                print(f"Failed to sync user_metadata to auth.users: {auth_sync_err}")

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{user_id}/avatar")
async def upload_avatar(
    user_id: str, 
    file: UploadFile = File(...), 
    auth_user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_user_supabase)
):
    """Upload user avatar (ownership enforced)."""
    # SECURITY: Users can only change their own avatar
    if user_id != auth_user_id:
        raise HTTPException(status_code=403, detail="You can only update your own avatar")
    try:
        timestamp = int(time.time() * 1000)
        raw_filename = file.filename if file.filename else "avatar"
        safe_filename = re.sub(r'[^a-zA-Z0-9_.-]', '_', raw_filename)
        storage_path = f"{user_id}/{timestamp}-{safe_filename}"
        
        file_bytes = await file.read()
        if len(file_bytes) > 5 * 1024 * 1024:
             raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")

        public_url = upload_public_file(
            file_bytes=file_bytes,
            bucket=AWS_AVATARS_BUCKET,
            filename=storage_path,
            content_type=file.content_type or "image/jpeg"
        )
        
        # Update user_profiles with new avatar_url
        supabase.table("user_profiles").update({"avatar_url": public_url}).eq("id", user_id).execute()
        
        return {"avatar_url": public_url}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
