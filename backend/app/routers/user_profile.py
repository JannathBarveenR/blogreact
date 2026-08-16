"""
User Profile routes — secure, user-scoped endpoints.

GET    /api/user-profile/{user_id}        — Get user profile (ownership enforced)
PUT    /api/user-profile/{user_id}        — Update user profile (ownership enforced)
POST   /api/user-profile/{user_id}/avatar — Upload avatar (ownership enforced)
DELETE /api/user-profile/{user_id}        — Soft-delete (deactivate) account (ownership enforced)
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


class DeleteAccountRequest(BaseModel):
    reason: Optional[str] = None


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
            "id, full_name, city, state, pincode, address, avatar_url, auth_provider, country_code"
        ).eq("id", user_id).execute()

        # Fetch email and phone from auth.users
        auth_user = supabase_admin.auth.admin.get_user_by_id(user_id)
        email = auth_user.user.email if auth_user and auth_user.user else None
        phone = auth_user.user.phone if auth_user and auth_user.user else None

        if not response.data:
            return {
                "id": user_id,
                "full_name": None,
                "phone": phone,
                "email": email,
                "city": None,
                "state": None,
                "pincode": None,
                "address": None,
                "avatar_url": None,
                "auth_provider": None,
                "country_code": "+91",
            }
        
        profile = response.data[0]
        profile["email"] = email
        profile["phone"] = phone
        return profile
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
            # Check auth.users instead of user_profiles for phone conflict? 
            # Or just rely on Supabase returning an error when updating auth.users.
            pass

        # Pop phone and email so they don't get sent to user_profiles
        if "phone" in update_data:
            update_data.pop("phone", None)
        if "email" in update_data:
            update_data.pop("email", None)

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
            auth_update_data = {}
            if full_phone:
                auth_update_data["phone"] = full_phone
            if profile.email:
                auth_update_data["email"] = profile.email

            meta_update = {}
            if update_data.get("full_name"):
                meta_update["full_name"] = update_data["full_name"]
            
            if meta_update:
                auth_update_data["user_metadata"] = meta_update

            if auth_update_data:
                supabase_admin.auth.admin.update_user_by_id(
                    user_id,
                    auth_update_data
                )
                print(f"[UserProfile] Synced to auth.users: {list(auth_update_data.keys())}")
        except Exception as auth_sync_err:
            print(f"[UserProfile] Warning — auth.users sync failed (non-fatal): {auth_sync_err}")

        # Return the merged data including phone and email
        res_data = response.data[0]
        res_data["phone"] = full_phone
        res_data["email"] = profile.email
        return res_data

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


@router.delete("/{user_id}")
async def delete_account(
    user_id: str,
    body: DeleteAccountRequest,
    auth_user_id: str = Depends(get_current_user_id),
):
    """
    Deactivate (soft-delete) the account — ownership enforced.

    We never hard-delete the auth.users row or the user's records:
      - user_profiles.is_active is set to False (+ timestamp + optional reason)
      - the auth user is banned so they can no longer log in
      - pets, medical events, reminders etc. are left completely intact

    This means account "deletion" is reversible by support/admin, and no
    pet medical history is ever lost because a user changed their mind
    or deleted their account by accident.
    """
    if user_id != auth_user_id:
        raise HTTPException(status_code=403, detail="You can only delete your own account")

    try:
        from datetime import datetime, timezone

        # 1. Mark the profile inactive and record why, without touching
        #    any other data (pets/medical records/reminders are untouched).
        supabase_admin.table("user_profiles").update({
            "is_active": False,
            "deactivated_at": datetime.now(timezone.utc).isoformat(),
            "deactivation_reason": (body.reason or None),
        }).eq("id", user_id).execute()

        # 2. Prevent further logins by banning the auth user (does NOT
        #    delete the auth.users row, so nothing referencing it — like
        #    pet_profiles.user_id — is affected).
        try:
            supabase_admin.auth.admin.update_user_by_id(
                user_id, {"ban_duration": "876000h"}  # ~100 years
            )
        except Exception as ban_err:
            # Don't fail the whole request if banning fails — the
            # is_active flag alone already blocks the app from treating
            # this as a live account.
            print(f"[delete_account] Warning: could not ban auth user {user_id}: {ban_err}")

        return {"message": "Account deactivated successfully."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
