# backend/app/routers/v2/patients.py
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from app.utils.auth import require_role
from app.services.vet_service import VetService
from app.services.patient_service import PatientService

router = APIRouter(prefix="/api/v2/patients", tags=["v2-patients"])

class CreatePatientRequest(BaseModel):
    pet_name: str
    pet_type: str = "dog"
    breed: Optional[str] = None
    gender: Optional[str] = "Male"
    approx_age: Optional[str] = None
    weight: Optional[float] = None
    blood_group: Optional[str] = None
    owner_name: Optional[str] = None
    owner_phone: Optional[str] = None

@router.get("/search")
async def search_patients(q: str = Query("", description="Search term for PetOlife ID, phone, or name"), user=Depends(require_role("vet"))):
    """Search patients by phone, PetOlife ID, or pet name."""
    results = PatientService.search_patients(q)
    return {"patients": results}

@router.post("")
async def create_patient(body: CreatePatientRequest, user=Depends(require_role("vet"))):
    """Create a walk-in patient with a claim token and owner contact."""
    vet_profile = VetService.get_or_create_vet_profile(user["id"])
    created = PatientService.create_walkin_patient(
        vet_id=vet_profile["id"],
        pet_name=body.pet_name,
        pet_type=body.pet_type,
        breed=body.breed,
        gender=body.gender,
        approx_age=body.approx_age,
        weight=body.weight,
        blood_group=body.blood_group,
        owner_name=body.owner_name,
        owner_phone=body.owner_phone,
    )
    return created

@router.get("/{pet_id}")
async def get_patient_detail(pet_id: str, user=Depends(require_role("vet"))):
    """Get full patient profile and medical timeline history for the vet."""
    patient = PatientService.get_patient_detail(pet_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.post("/{pet_id}/invite")
async def send_claim_invite(pet_id: str, user=Depends(require_role("vet"))):
    """Trigger SMS/WhatsApp invite containing the claim link."""
    patient = PatientService.get_patient_detail(pet_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    phone = patient.get("owner_phone") or patient.get("claim_phone")
    if not phone:
        raise HTTPException(status_code=400, detail="Owner phone number is not on file.")
    
    claim_token = patient.get("claim_token")
    return {
        "message": f"Claim link ready for {phone}",
        "claim_url": f"/claim/{claim_token}" if claim_token else None,
        "phone": phone,
    }
