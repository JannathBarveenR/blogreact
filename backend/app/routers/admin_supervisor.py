"""
Supervisor / Admin Router (/api/supervisor)

Provides administrative capabilities strictly restricted to users with the 'supervisor' role:
- User RBAC role assignment & revocation.
- Verification and approval of Doctor / Vet profiles.
- Platform activity monitoring and user audits.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.utils.rbac import require_role
from app.supabase_client import supabase
from app.schemas.vet_maternity import UserRoleAssignRequest, VetProfileResponse

router = APIRouter(prefix="/api/supervisor", tags=["Supervisor Administration"])


@router.post("/assign-role")
async def assign_user_role(
    data: UserRoleAssignRequest,
    current_user: dict = Depends(require_role(["supervisor"]))
):
    """
    Assign or update a user's RBAC role ('pet_owner', 'vet', 'supervisor', 'staff').
    Supervisor role ONLY.
    """
    if data.role not in ['pet_owner', 'vet', 'supervisor', 'staff']:
        raise HTTPException(status_code=400, detail="Invalid role specified.")

    payload = {
        "user_id": data.user_id,
        "role": data.role,
        "assigned_by": current_user["id"]
    }

    res = supabase.table("user_roles").upsert(payload, on_conflict="user_id,role").execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to assign role.")

    return {"status": "success", "user_id": data.user_id, "assigned_role": data.role}


@router.get("/users")
async def list_users_with_roles(
    current_user: dict = Depends(require_role(["supervisor"]))
):
    """
    List registered platform users along with their assigned roles.
    Supervisor role ONLY.
    """
    res = supabase.table("user_roles").select("user_id, role, created_at").execute()
    return res.data or []


@router.post("/vets/{vet_id}/verify")
async def verify_vet_profile(
    vet_id: str,
    is_verified: bool = True,
    current_user: dict = Depends(require_role(["supervisor"]))
):
    """
    Approve/verify or unverify a veterinary doctor profile.
    Supervisor role ONLY.
    """
    res = supabase.table("vet_profiles").update({"is_verified": is_verified}).eq("id", vet_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Vet profile not found.")

    return {"status": "success", "vet_id": vet_id, "is_verified": is_verified}


@router.get("/audit-summary")
async def get_platform_audit_summary(
    current_user: dict = Depends(require_role(["supervisor"]))
):
    """
    Get administrative platform activity metrics.
    Supervisor role ONLY.
    """
    consultations_res = supabase.table("online_consultations").select("id", count="exact").execute()
    maternity_res = supabase.table("maternity_records").select("id", count="exact").execute()
    vets_res = supabase.table("vet_profiles").select("id", count="exact").execute()
    roles_res = supabase.table("user_roles").select("id", count="exact").execute()

    return {
        "total_online_consultations": consultations_res.count or 0,
        "total_maternity_records": maternity_res.count or 0,
        "total_registered_vets": vets_res.count or 0,
        "total_assigned_user_roles": roles_res.count or 0,
    }
