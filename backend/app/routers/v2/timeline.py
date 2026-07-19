# backend/app/routers/v2/timeline.py
from fastapi import APIRouter, Depends, HTTPException
from app.utils.auth import get_current_user
from app.services.pet_service import PetService
from app.timeline.services.category_engine import CategoryEngine

router = APIRouter(prefix="/api/v2/pets", tags=["v2-timeline"])

def _guard(pet_id, user):
    if not PetService.verify_ownership(pet_id, user["id"]):
        raise HTTPException(404, "Pet not found")

@router.get("/{pet_id}/timeline")
async def timeline(pet_id: str, view: str = "category", user=Depends(get_current_user)):
    _guard(pet_id, user)
    if view == "chronological":
        return CategoryEngine.get_chronological(pet_id)
    return CategoryEngine.get_category_grouped(pet_id)

@router.get("/{pet_id}/timeline/visit/{visit_group_id}")
async def visit(pet_id: str, visit_group_id: str, user=Depends(get_current_user)):
    _guard(pet_id, user)
    return CategoryEngine.get_visit_group(pet_id, visit_group_id)
