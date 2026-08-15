"""
Maternity Platform Router (/api/maternity)

Provides APIs for managing pet pregnancy, mating logs, gestation tracking,
whelping, postpartum care, and maternity milestones.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.utils.auth import get_current_user
from app.utils.rbac import require_role, get_current_user_with_roles
from app.supabase_client import supabase
from app.schemas.vet_maternity import (
    MaternityRecordCreate,
    MaternityRecordUpdate,
    MaternityMilestoneCreate,
    MaternityMilestoneResponse,
)

router = APIRouter(prefix="/api/maternity", tags=["Maternity Platform"])


@router.post("/records")
async def create_maternity_record(
    data: MaternityRecordCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new maternity / pregnancy tracking record for a pet.
    """
    # Verify pet ownership
    pet_res = supabase.table("pet_profiles").select("id").eq("id", data.pet_id).eq("user_id", current_user["id"]).execute()
    if not pet_res.data:
        raise HTTPException(status_code=404, detail="Pet profile not found or access denied.")

    record_payload = {
        "pet_id": data.pet_id,
        "user_id": current_user["id"],
        "stage": data.stage,
        "mating_date": str(data.mating_date) if data.mating_date else None,
        "expected_delivery_date": str(data.expected_delivery_date) if data.expected_delivery_date else None,
        "litter_size_expected": data.litter_size_expected or 0,
        "health_notes": data.health_notes,
        "attending_vet_id": data.attending_vet_id,
        "status": "active"
    }

    res = supabase.table("maternity_records").insert(record_payload).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create maternity record.")

    return res.data[0]


@router.get("/records")
async def list_maternity_records(
    pet_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user_with_roles)
):
    """
    List maternity records for logged-in pet owner (or assigned vet / supervisor).
    """
    roles = current_user.get("roles", [])
    user_id = current_user["id"]

    query = supabase.table("maternity_records").select("*")

    if "supervisor" in roles:
        if pet_id:
            query = query.eq("pet_id", pet_id)
    elif "vet" in roles:
        vet_res = supabase.table("vet_profiles").select("id").eq("user_id", user_id).execute()
        if vet_res.data:
            vet_id = vet_res.data[0]["id"]
            query = query.eq("attending_vet_id", vet_id)
        else:
            return []
    else:
        query = query.eq("user_id", user_id)
        if pet_id:
            query = query.eq("pet_id", pet_id)

    res = query.order("created_at", desc=True).execute()
    return res.data or []


@router.get("/records/{record_id}")
async def get_maternity_record(
    record_id: str,
    current_user: dict = Depends(get_current_user_with_roles)
):
    """
    Get detailed maternity record including associated milestones.
    """
    res = supabase.table("maternity_records").select("*").eq("id", record_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Maternity record not found.")

    record = res.data[0]
    
    # Milestones
    milestones_res = supabase.table("maternity_milestones").select("*").eq("maternity_record_id", record_id).order("milestone_date", desc=False).execute()
    record["milestones"] = milestones_res.data or []

    return record


@router.patch("/records/{record_id}")
async def update_maternity_record(
    record_id: str,
    data: MaternityRecordUpdate,
    current_user: dict = Depends(get_current_user_with_roles)
):
    """
    Update stage, actual delivery date, litter size, ultrasound findings, or health notes.
    """
    update_data = {}
    for k, v in data.model_dump().items():
        if v is not None:
            if isinstance(v, (date, datetime)):
                update_data[k] = str(v)
            else:
                update_data[k] = v

    if not update_data:
        raise HTTPException(status_code=400, detail="No valid update fields supplied.")

    res = supabase.table("maternity_records").update(update_data).eq("id", record_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Maternity record not found or update failed.")

    return res.data[0]


@router.post("/records/{record_id}/milestones", response_model=MaternityMilestoneResponse)
async def add_maternity_milestone(
    record_id: str,
    data: MaternityMilestoneCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Add a milestone (ultrasound, weight check, deworming, whelping prep) to a maternity record.
    """
    payload = {
        "maternity_record_id": record_id,
        "milestone_date": str(data.milestone_date),
        "title": data.title,
        "milestone_type": data.milestone_type,
        "notes": data.notes,
        "vitals": data.vitals or {},
        "completed": False
    }

    res = supabase.table("maternity_milestones").insert(payload).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create milestone.")

    return res.data[0]


@router.patch("/milestones/{milestone_id}")
async def toggle_milestone_completion(
    milestone_id: str,
    completed: bool,
    current_user: dict = Depends(get_current_user)
):
    """
    Mark a maternity milestone as completed or pending.
    """
    res = supabase.table("maternity_milestones").update({"completed": completed}).eq("id", milestone_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Milestone not found.")

    return res.data[0]
