"""
Pet Profile routes — secure, user-scoped endpoints.

POST /api/pet-profile          — Create pet profile with photo upload
GET  /api/pet-profile          — Fetch all pets for the authenticated user
GET  /api/pet-profile/by-user/{user_id} — Fetch all pets for user (self only)
GET  /api/pet-profile/{id}     — Fetch by UUID (ownership enforced)
PATCH /api/pet-profile/{id}    — Update pet profile (ownership enforced)
POST /api/pet-profile/{id}/photo — Update pet photo (ownership enforced)
GET  /api/pet-profile/by-petolife-id/{petolife_id} — QR redirect (public)
GET  /api/pet-profile/public/{petolife_id} — Public pet data (public)
"""

import json
import re
import time
from datetime import datetime, date
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Response
from fastapi.responses import RedirectResponse, JSONResponse
from pydantic import BaseModel
from supabase import Client
from app.s3_client import upload_public_file, delete_file, AWS_PET_PHOTOS_BUCKET

from app.config import FRONTEND_URL
from app.supabase_client import supabase as global_supabase, supabase_admin
from app.routers.pet_health_id import generate_pet_health_id
from app.utils.auth import get_current_user_id, get_user_supabase

router = APIRouter()


class PetProfileUpdate(BaseModel):
    pet_name: Optional[str] = None
    pet_type: Optional[str] = None
    breed: Optional[str] = None
    gender: Optional[str] = None
    birth_date: Optional[str] = None
    approx_age: Optional[str] = None
    weight: Optional[str] = None
    blood_group: Optional[str] = None
    identification_marks: Optional[str] = None
    identification_ids: Optional[str] = None


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to be S3/Supabase storage compatible (removes colons, spaces, special chars)."""
    if not filename:
        return "photo"
    sanitized = re.sub(r'[^a-zA-Z0-9_.-]', '_', filename)
    sanitized = re.sub(r'_+', '_', sanitized)
    return sanitized.strip('_')


def calculate_dob_from_approx_age(approx_age_str: Optional[str]) -> Optional[str]:
    """Calculates approximate YYYY-MM-DD birth_date from an age string like '2y 3m', '2 Years', '6 Months'."""
    if not approx_age_str or not str(approx_age_str).strip():
        return None
    today = date.today()
    s = str(approx_age_str).lower().strip()
    y_match = re.search(r'(\d+)\s*y', s)
    m_match = re.search(r'(\d+)\s*m', s)
    years = int(y_match.group(1)) if y_match else 0
    months = int(m_match.group(1)) if m_match else 0
    if not y_match and not m_match:
        nums = re.findall(r'\d+', s)
        if not nums:
            return None
        val = int(nums[0])
        if 'month' in s or 'mo' in s:
            months = val
        else:
            years = val
    total_months = years * 12 + months
    if total_months <= 0:
        return None
    year_sub = total_months // 12
    month_sub = total_months % 12
    calc_year = today.year - year_sub
    calc_month = today.month - month_sub
    if calc_month <= 0:
        calc_month += 12
        calc_year -= 1
    return date(calc_year, calc_month, min(today.day, 28)).isoformat()


def calculate_approx_age_from_dob(dob_str: Optional[str]) -> Optional[str]:
    """Calculates human-readable age string like '2 Years' or '6 Months' from YYYY-MM-DD."""
    if not dob_str or not str(dob_str).strip():
        return None
    try:
        raw_dob = str(dob_str).split('T')[0].strip()
        dob = datetime.strptime(raw_dob, '%Y-%m-%d').date()
        today = date.today()
        if dob > today:
            return '0 Months'
        years = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        if years >= 1:
            unit = 'Years' if years > 1 else 'Year'
            return f'{years} {unit}'
        months = (today.year - dob.year) * 12 + today.month - dob.month
        if today.day < dob.day:
            months -= 1
        m_val = max(1, months)
        unit = 'Months' if m_val > 1 else 'Month'
        return f'{m_val} {unit}'
    except Exception:
        return None


def get_user_owner_info(user_id: str) -> dict:
    """Fetch user's full name and phone from user_profiles table, or auth.users fallback."""
    name = None
    phone = ""

    # 1. Try public.user_profiles table
    try:
        res = global_supabase.table("user_profiles").select("full_name, phone, email").eq("id", user_id).execute()
        if res.data and len(res.data) > 0:
            row = res.data[0]
            if row.get("full_name") and str(row.get("full_name")).strip():
                name = str(row["full_name"]).strip()
            phone = row.get("phone", "") or ""
            if not name and row.get("email"):
                name = str(row["email"]).split("@")[0].replace(".", " ").replace("_", " ").title()
    except Exception as e:
        print(f"[get_user_owner_info] Error querying user_profiles: {e}")

    if name:
        return {"owner_name": name, "owner_phone": phone}

    # 2. Fallback: Check auth.users user_metadata via Supabase Admin API
    try:
        if supabase_admin:
            user_resp = supabase_admin.auth.admin.get_user_by_id(user_id)
            user_obj = getattr(user_resp, "user", user_resp) if user_resp else None
            if user_obj:
                meta = getattr(user_obj, "user_metadata", {}) or {}
                if isinstance(meta, dict):
                    name = meta.get("full_name") or meta.get("name") or meta.get("display_name")
                    if not name and meta.get("first_name"):
                        name = f"{meta.get('first_name', '')} {meta.get('last_name', '')}".strip()

                if not phone:
                    phone = getattr(user_obj, "phone", "") or (meta.get("phone", "") if isinstance(meta, dict) else "") or ""

                if not name and getattr(user_obj, "email", None):
                    name = str(user_obj.email).split("@")[0].replace(".", " ").replace("_", " ").title()
    except Exception as e:
        print(f"[get_user_owner_info] Error fetching auth user by id: {e}")

    return {
        "owner_name": name or "Pet Parent",
        "owner_phone": phone or ""
    }


def enrich_pet_profile(profile: dict, owner_info: Optional[dict] = None) -> dict:
    """Ensure pet profile has bidirectional birth_date/approx_age and owner_name populated."""
    p = dict(profile)
    b_date = p.get("birth_date")
    a_age = p.get("approx_age")

    if b_date and not a_age:
        p["approx_age"] = calculate_approx_age_from_dob(b_date)
    elif a_age and not b_date:
        p["birth_date"] = calculate_dob_from_approx_age(a_age)
    elif b_date and a_age:
        p["approx_age"] = calculate_approx_age_from_dob(b_date) or a_age

    p["age"] = p.get("approx_age") or "Not specified"

    if owner_info:
        p["owner_name"] = owner_info.get("owner_name") or "Pet Parent"
        p["pet_parent"] = owner_info.get("owner_name") or "Pet Parent"
        p["owner_phone"] = owner_info.get("owner_phone") or ""
    return p


class PetProfileUpdate(BaseModel):
    pet_name: Optional[str] = None
    breed: Optional[str] = None
    gender: Optional[str] = None
    birth_date: Optional[str] = None
    approx_age: Optional[str] = None
    weight: Optional[str] = None
    blood_group: Optional[str] = None

class PetLifestyleUpdate(BaseModel):
    answers: dict


from app.supabase_client import supabase as global_supabase, supabase_admin
from app.routers.pet_health_id import generate_pet_health_id, store_pet_health_id
from app.utils.auth import get_current_user_id, get_user_supabase
from supabase import Client
# pet-photos bucket now on AWS S3


def parse_float(val: Optional[str]) -> Optional[float]:
    if not val:
        return None
    try:
        return float(val.strip())
    except (ValueError, TypeError):
        return None


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
    approx_age: Optional[str] = Form(None),
    identification_marks: Optional[str] = Form(None),
    pet_ids: Optional[str] = Form(None),
    pet_photo: Optional[UploadFile] = File(None),
    auth_user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_user_supabase)
):
    """Create a new pet profile with photo upload + PetOLife ID generation."""
    effective_user_id = auth_user_id

    if not pet_type or not pet_name:
        raise HTTPException(status_code=400, detail="pet_type and pet_name are required")

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

    pet_photo_url = None
    if pet_photo and pet_photo.filename:
        try:
            clean_filename = sanitize_filename(pet_photo.filename)
            file_name = f"{int(time.time() * 1000)}-{clean_filename}"
            file_bytes = await pet_photo.read()

            pet_photo_url = upload_public_file(
                file_bytes=file_bytes,
                bucket=AWS_PET_PHOTOS_BUCKET,
                filename=file_name,
                content_type=pet_photo.content_type or "image/jpeg"
            )
        except Exception as photo_err:
            print(f"Non-fatal photo upload warning: {photo_err}")

    calc_birth_date = birth_date or None
    calc_approx_age = approx_age or None

    if calc_birth_date and not calc_approx_age:
        calc_approx_age = calculate_approx_age_from_dob(calc_birth_date)
    elif calc_approx_age and not calc_birth_date:
        calc_birth_date = calculate_dob_from_approx_age(calc_approx_age)
    elif calc_birth_date and calc_approx_age:
        calc_approx_age = calculate_approx_age_from_dob(calc_birth_date) or calc_approx_age

    insert_data = {
        "petolife_id": petolife_id,
        "user_id": effective_user_id,
        "pet_type": pet_type,
        "pet_name": pet_name,
        "breed": breed or None,
        "gender": gender or None,
        "birth_date": calc_birth_date,
        "approx_age": calc_approx_age,
        "weight": parse_float(weight),
        "blood_group": blood_group or None,
        "identification_marks": identification_marks or None,
        "pet_photo_url": pet_photo_url,
        "identification_ids": valid_ids,
    }

    try:
        result = supabase.table("pet_profiles").insert(insert_data).execute()
    except Exception as insert_err:
        print(f"Profile insert via user client failed, retrying admin: {insert_err}")
        try:
            result = supabase_admin.table("pet_profiles").insert(insert_data).execute()
        except Exception as admin_err:
            print(f"Profile insert via admin ALSO failed: {admin_err}")
            raise HTTPException(status_code=500, detail=f"Database error creating profile: {str(admin_err)}")

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create pet profile")

    profile = result.data[0]

    owner_info = get_user_owner_info(effective_user_id)
    enriched_data = enrich_pet_profile(profile, owner_info)

    return {
        "message": "Pet profile created successfully",
        "pet_profile_id": profile["id"],
        "petolife_id": profile["petolife_id"],
        "data": enriched_data,
    }


@router.get("/")
async def get_my_profiles(
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_user_supabase)
):
    """Fetch all pet profiles belonging to the authenticated user."""
    try:
        owner_info = get_user_owner_info(user_id)
        result = (
            supabase.table("pet_profiles")
            .select("id, user_id, petolife_id, pet_name, pet_type, breed, gender, birth_date, approx_age, weight, blood_group, identification_marks, pet_photo_url, created_at, identification_ids")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        raw_list = result.data or []
        return [enrich_pet_profile(p, owner_info) for p in raw_list]
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
    return await get_my_profiles(auth_user_id, supabase)


@router.get("/by-petolife-id/{petolife_id:path}")
async def get_by_petolife_id_redirect(petolife_id: str):
    """QR scan endpoint — redirects browser to the frontend pet profile UI. (Public)"""
    frontend_base = FRONTEND_URL or "https://www.petolife.com"
    redirect_url = f"{frontend_base}/pet/{petolife_id.lower()}"
    return RedirectResponse(url=redirect_url, status_code=302)


@router.get("/public/{petolife_id:path}")
async def get_public_pet_data(petolife_id: str):
    """JSON data endpoint — called by the frontend pet profile UI page. (Public)"""
    result = (
        global_supabase.table("pet_profiles")
        .select("id, user_id, petolife_id, pet_type, pet_name, breed, gender, birth_date, approx_age, weight, blood_group, identification_marks, pet_photo_url, created_at, identification_ids, pet_attributes")
        .ilike("petolife_id", petolife_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Pet not found")

    profile = result.data[0]
    owner_info = None
    owner_user_id = profile.get("user_id")
    if owner_user_id:
        owner_info = get_user_owner_info(owner_user_id)

    enriched = enrich_pet_profile(profile, owner_info)

    return JSONResponse(
        content={
            **enriched,
            "pet_ids": enriched.get("identification_ids", []),
            "owner_info": owner_info,
        },
        headers={
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        }
    )


@router.get("/proxy-image")
async def proxy_image(url: str):
    """Proxy image request to bypass browser S3 CORS limitations on HTML5 Canvas export."""
    if not url or not (url.startswith("http://") or url.startswith("https://")):
        raise HTTPException(status_code=400, detail="Invalid image URL")
    try:
        import urllib.request
        req = urllib.request.Request(url, headers={'User-Agent': 'PetOLife-Proxy/1.0'})
        with urllib.request.urlopen(req, timeout=10.0) as resp:
            content = resp.read()
            content_type = resp.headers.get("content-type", "image/jpeg")
            return Response(
                content=content,
                media_type=content_type,
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Cache-Control": "public, max-age=86400"
                }
            )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Proxy image error: {e}")
        raise HTTPException(status_code=500, detail=f"Image proxy error: {str(e)}")


@router.get("/{profile_id}")
async def get_pet_profile(
    profile_id: str,
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_user_supabase)
):
    """Fetch pet profile by UUID (ownership enforced)."""
    result = supabase.table("pet_profiles").select("id, user_id, petolife_id, pet_type, pet_name, breed, gender, birth_date, approx_age, weight, blood_group, identification_marks, pet_photo_url, created_at, identification_ids, pet_attributes").eq("id", profile_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Pet profile not found")

    profile = result.data[0]

    if profile.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="You do not have permission to access this pet profile")

    owner_info = get_user_owner_info(user_id)
    enriched = enrich_pet_profile(profile, owner_info)

    return {**enriched, "pet_ids": enriched.get("identification_ids", [])}


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

        clean_name = sanitize_filename(file.filename or "photo")
        file_name = f"{profile_id}-{int(time.time() * 1000)}-{clean_name}"
        file_bytes = await file.read()

        photo_url = upload_public_file(
            file_bytes=file_bytes,
            bucket=AWS_PET_PHOTOS_BUCKET,
            filename=file_name,
            content_type=file.content_type or "image/jpeg"
        )

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
                        delete_file(AWS_PET_PHOTOS_BUCKET, filename)
                    except Exception as e:
                        print(f"Error deleting photo from AWS S3: {e}")

        supabase.table("pet_profiles").delete().eq("id", profile_id).execute()

        return {"message": "Pet profile deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Delete profile error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete profile: {str(e)}")


@router.get("/{profile_id}/lifestyle")
async def get_pet_lifestyle(
    profile_id: str,
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_user_supabase)
):
    """Fetch pet lifestyle data."""
    try:
        # Check ownership
        pet_check = supabase.table("pet_profiles").select("user_id").eq("id", profile_id).execute()
        if not pet_check.data or pet_check.data[0]["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        result = supabase.table("pet_lifestyle").select("*").eq("pet_id", profile_id).execute()
        if not result.data:
            return {"answers": {}}
        return {"answers": result.data[0].get("answers", {})}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Fetch lifestyle error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch lifestyle: {str(e)}")


@router.post("/{profile_id}/lifestyle")
async def update_pet_lifestyle(
    profile_id: str,
    payload: PetLifestyleUpdate,
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_user_supabase)
):
    """Create or update pet lifestyle data (Upsert)."""
    try:
        # Check ownership
        pet_check = supabase.table("pet_profiles").select("user_id").eq("id", profile_id).execute()
        if not pet_check.data or pet_check.data[0]["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        # Check if exists
        existing = supabase.table("pet_lifestyle").select("id").eq("pet_id", profile_id).execute()
        
        if existing.data:
            res = supabase.table("pet_lifestyle").update(
                {"answers": payload.answers, "updated_at": "now()"}
            ).eq("pet_id", profile_id).execute()
        else:
            res = supabase.table("pet_lifestyle").insert({
                "pet_id": profile_id,
                "answers": payload.answers
            }).execute()

        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to save lifestyle data")
            
        return {"message": "Lifestyle updated successfully", "data": res.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Update lifestyle error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update lifestyle: {str(e)}")

