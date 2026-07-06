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
from supabase import Client
import time

router = APIRouter()

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None

def ensure_avatars_bucket_exists():
    try:
        buckets = supabase_admin.storage.list_buckets()
        bucket_names = [b.name for b in buckets] if buckets else []
        if "avatars" not in bucket_names:
            supabase_admin.storage.create_bucket("avatars", options={"public": True})
            print("[Storage] Created public bucket 'avatars'")
    except Exception as e:
        print(f"[Storage] Note during bucket check: {e}")

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
        response = supabase.table("user_profiles").select("id, full_name, phone, email, city, state, pincode, avatar_url").eq("id", user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="User profile not found")
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
        update_data = {k: v for k, v in profile.dict().items() if v is not None}
        if not update_data:
            return {"message": "No data to update"}
            
        # Sync email/phone and metadata changes to Supabase Auth (auth.users) so they can login with them and metadata matches
        auth_updates = {}
        user_metadata = {}
        
        if "email" in update_data and update_data["email"].strip():
            auth_updates["email"] = update_data["email"].strip()
            auth_updates["email_confirm"] = True
        if "phone" in update_data and update_data["phone"].strip():
            auth_updates["phone"] = update_data["phone"].strip()
            auth_updates["phone_confirm"] = True
            
        if "full_name" in update_data:
            user_metadata["full_name"] = update_data["full_name"]
        if "city" in update_data:
            user_metadata["city"] = update_data["city"]
        if "state" in update_data:
            user_metadata["state"] = update_data["state"]
        if "pincode" in update_data:
            user_metadata["pincode"] = update_data["pincode"]
            
        if user_metadata:
            auth_updates["user_metadata"] = user_metadata
            
        if auth_updates:
            try:
                supabase_admin.auth.admin.update_user_by_id(user_id, auth_updates)
            except Exception as auth_err:
                print(f"Failed to update auth.users credentials: {auth_err}")
                raise HTTPException(
                    status_code=400, 
                    detail="Failed to update login credentials. This email or phone may already be taken."
                )
            
        response = supabase.table("user_profiles").update(update_data).eq("id", user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="User profile not found or update failed")
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
        ensure_avatars_bucket_exists()
        
        timestamp = int(time.time() * 1000)
        safe_filename = file.filename.replace(" ", "_") if file.filename else "avatar"
        storage_path = f"{user_id}/{timestamp}-{safe_filename}"
        
        file_bytes = await file.read()
        if len(file_bytes) > 5 * 1024 * 1024:
             raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")

        supabase.storage.from_("avatars").upload(
            storage_path,
            file_bytes,
            {"content-type": file.content_type}
        )

        public_url = supabase.storage.from_("avatars").get_public_url(storage_path)
        
        # Update user_profiles with new avatar_url
        supabase.table("user_profiles").update({"avatar_url": public_url}).eq("id", user_id).execute()
        
        return {"avatar_url": public_url}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
