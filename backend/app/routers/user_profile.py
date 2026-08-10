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


@router.get("/{user_id}")
async def get_user_profile(
    user_id: str,
    auth_user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_user_supabase)
):
    """Get user profile (ownership enforced)."""
    if user_id != auth_user_id:
        raise HTTPException(status_code=403, detail="You can only view your own profile")
    try:
        response = supabase.table("user_profiles").select(
            "id, full_name, phone, email, city, state, pincode, address, avatar_url, auth_provider"
        ).eq("id", user_id).execute()

        if not response.data:
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
    if user_id != auth_user_id:
        raise HTTPException(status_code=403, detail="You can only update your own profile")
    try:
        update_data = {k: v for k, v in profile.model_dump().items() if v is not None}
        if not update_data:
            return {"message": "No data to update"}

        update_data["id"] = user_id

        # Determine auth provider from auth.users
        try:
            auth_user = supabase_admin.auth.admin.get_user_by_id(user_id)
            if auth_user:
                provider = auth_user.app_metadata.get("provider") or \
                           auth_user.app_metadata.get("providers", ["phone"])[0]
                update_data["auth_provider"] = provider
        except Exception as auth_provider_err:
            print(f"Failed to fetch auth user provider: {auth_provider_err}")

        # Phone uniqueness check — prevent conflict with another user's row
        if "phone" in update_data and update_data["phone"]:
            phone_conflict = supabase_admin.table("user_profiles") \
                .select("id") \
                .eq("phone", update_data["phone"]) \
                .neq("id", user_id) \
                .execute()
            if phone_conflict.data:
                update_data.pop("phone", None)

        # Insert or update
        existing = supabase_admin.table("user_profiles").select("id").eq("id", user_id).execute()

        if not existing.data:
            response = supabase_admin.table("user_profiles").insert(update_data).execute()
        else:
            response = supabase_admin.table("user_profiles").update(update_data).eq("id", user_id).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Profile update failed — no data returned")

        # FIXED: Sync full_name + phone + email all to auth.users metadata
        try:
            meta_update = {}
            if "full_name" in update_data and update_data["full_name"]:
                meta_update["full_name"] = update_data["full_name"]
            if "phone" in update_data and update_data["phone"]:
                meta_update["phone"] = update_data["phone"]
            if "email" in update_data and update_data["email"]:
                meta_update["email"] = update_data["email"]
            if meta_update:
                supabase_admin.auth.admin.update_user_by_id(
                    user_id,
                    {"user_metadata": meta_update}
                )
                print(f"[UserProfile] Synced to auth.users metadata: {list(meta_update.keys())}")
        except Exception as auth_sync_err:
            print(f"[UserProfile] Warning: Could not sync metadata to auth.users: {auth_sync_err}")

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

        supabase.table("user_profiles").update({"avatar_url": public_url}).eq("id", user_id).execute()

        return {"avatar_url": public_url}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))