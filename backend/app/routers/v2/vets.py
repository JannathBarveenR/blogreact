# backend/app/routers/v2/vets.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.utils.auth import get_current_user, require_role
from app.services.vet_service import VetService

router = APIRouter(prefix="/api/v2/vets", tags=["v2-vets"])

class VetProfileUpdate(BaseModel):
    doctor_name: Optional[str] = None
    qualification: Optional[str] = None
    registration_number: Optional[str] = None
    phone: Optional[str] = None
    primary_clinic_id: Optional[str] = None
    photo_url: Optional[str] = None

class ToggleStockRequest(BaseModel):
    item_type: str
    item_id: str
    is_active: bool

@router.get("/me")
async def get_my_vet_profile(user=Depends(require_role("vet"))):
    """Retrieve the authenticated doctor's profile and attached clinic."""
    profile = VetService.get_or_create_vet_profile(user["id"], user.get("email"))
    return profile

@router.put("/me")
async def update_my_vet_profile(body: VetProfileUpdate, user=Depends(require_role("vet"))):
    """Update doctor qualifications, registration number, or clinic."""
    updated = VetService.update_vet_profile(user["id"], body.model_dump(exclude_unset=True))
    return updated

@router.get("/me/stock")
async def get_my_stock(user=Depends(require_role("vet"))):
    """Retrieve medicines, vaccines, shampoos with active stock toggle status."""
    profile = VetService.get_or_create_vet_profile(user["id"], user.get("email"))
    stock = VetService.get_medicine_stock(profile["id"])
    return stock

@router.put("/me/stock")
async def toggle_my_stock_item(body: ToggleStockRequest, user=Depends(require_role("vet"))):
    """Toggle whether a medicine/vaccine/shampoo is active in the doctor's quick Rx picker."""
    profile = VetService.get_or_create_vet_profile(user["id"], user.get("email"))
    updated = VetService.toggle_stock_item(profile["id"], body.item_type, body.item_id, body.is_active)
    return updated
