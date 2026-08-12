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
    country_code: Optional[str] = "+91"   # NEW — separate country code
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
            "id, full_name, phone, email, city, state, pincode, address, avatar_url, auth_provider, country_code"
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
                "country_code": "+91",
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

        # ── FIX 1: Separate country code from raw phone ──────────────
        raw_phone = update_data.get("phone", "") or ""
        country_code = update_data.get("country_code", "+91") or "+91"

        if raw_phone:
            # Strip any country code the frontend may have already prepended
            cleaned = raw_phone.strip()
            for prefix in [country_code, "+91", "91"]:
                if cleaned.startswith(prefix):
                    cleaned = cleaned[len(prefix):]
                    break
            cleaned = cleaned.strip()
            # Keep only digits, max 10
            cleaned = re.sub(r"\D", "", cleaned)[-10:]
            full_phone = f"{country_code}{cleaned}" if cleaned else None
        else:
            full_phone = None

        # Store full phone + country code
        if full_phone:
            update_data["phone"] = full_phone
        update_data["country_code"] = country_code

        # Remove raw phone key if it was empty
        if not full_phone and "phone" in update_data:
            update_data.pop("phone", None)

        update_data["id"] = user_id

        # ── Determine auth provider ───────────────────────────────────
        try:
            auth_user = supabase_admin.auth.admin.get_user_by_id(user_id)
            if auth_user:
                provider = auth_user.app_metadata.get("provider") or \
                           auth_user.app_metadata.get("providers", ["phone"])[0]
                update_data["auth_provider"] = provider
        except Exception as auth_provider_err:
            print(f"Failed to fetch auth user provider: {auth_provider_err}")

        # ── Phone uniqueness check ────────────────────────────────────
        if full_phone:
            phone_conflict = supabase_admin.table("user_profiles") \
                .select("id") \
                .eq("phone", full_phone) \
                .neq("id", user_id) \
                .execute()
            if phone_conflict.data:
                print(f"[UserProfile] Phone conflict — not updating phone for {user_id}")
                update_data.pop("phone", None)

        # ── Insert or update user_profiles ────────────────────────────
        existing = supabase_admin.table("user_profiles").select("id").eq("id", user_id).execute()

        if not existing.data:
            response = supabase_admin.table("user_profiles").insert(update_data).execute()
        else:
            response = supabase_admin.table("user_profiles").update(update_data).eq("id", user_id).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Profile update failed — no data returned")

        # ── FIX 2: Sync phone + email + name to auth.users (source of truth) ──
        try:
            meta_update = {}
            if update_data.get("full_name"):
                meta_update["full_name"] = update_data["full_name"]
            if full_phone:
                meta_update["phone"] = full_phone
            if update_data.get("email"):
                meta_update["email"] = update_data["email"]

            if meta_update:
                supabase_admin.auth.admin.update_user_by_id(
                    user_id,
                    {"user_metadata": meta_update}
                )
                print(f"[UserProfile] Synced to auth.users: {list(meta_update.keys())}")
        except Exception as auth_sync_err:
            print(f"[UserProfile] Warning — auth.users sync failed (non-fatal): {auth_sync_err}")

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