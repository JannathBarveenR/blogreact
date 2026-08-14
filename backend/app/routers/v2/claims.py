# backend/app/routers/v2/claims.py
from fastapi import APIRouter, Depends, HTTPException
from app.utils.auth import get_current_user
from app.services.patient_service import PatientService

router = APIRouter(prefix="/api/v2/claims", tags=["v2-claims"])

@router.get("/{token}")
async def get_claim_preview(token: str):
    """Validate claim token and return preview data (Public endpoint, no auth required)."""
    preview = PatientService.get_claim_preview(token)
    if not preview:
        raise HTTPException(status_code=404, detail="Invalid or expired claim link")
    return preview

@router.post("/{token}/accept")
async def accept_claim(token: str, user=Depends(get_current_user)):
    """Link the claimed pet to the logged-in pet parent's account."""
    try:
        result = PatientService.accept_claim(token, user["id"])
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
