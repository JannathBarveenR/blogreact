# backend/app/routers/v2/visits.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from app.utils.auth import require_role
from app.services.vet_service import VetService
from app.services.visit_service import VisitService
from app.services.patient_service import PatientService

router = APIRouter(prefix="/api/v2/visits", tags=["v2-visits"])

class RecordVisitRequest(BaseModel):
    pet_id: str
    vitals: Dict[str, Any] = Field(default_factory=dict)
    diagnoses: List[Dict[str, Any]] = Field(default_factory=list)
    medications: List[Dict[str, Any]] = Field(default_factory=list)
    injections: List[Dict[str, Any]] = Field(default_factory=list)
    shampoos: List[Dict[str, Any]] = Field(default_factory=list)
    vaccines: List[Dict[str, Any]] = Field(default_factory=list)
    follow_up_days: Optional[int] = None
    follow_up_date: Optional[str] = None
    follow_up_notes: Optional[str] = None
    event_date: Optional[str] = None

@router.post("")
async def record_consultation(body: RecordVisitRequest, user=Depends(require_role("vet"))):
    """
    Submits consultation from the 4-step wizard:
    1. Vitals
    2. Diagnoses
    3. Rx (Meds, Injections, Shampoo, Vaccines, Follow-up)
    4. Sign
    Writes canonical category_entries to medical_events and schedules reminders.
    """
    vet_profile = VetService.get_or_create_vet_profile(user["id"])
    clinic_id = vet_profile.get("primary_clinic_id")
    clinic_name = (vet_profile.get("clinic_database") or {}).get("name") if vet_profile.get("clinic_database") else "Veterinary Clinic"

    # Ensure patient exists
    pet = PatientService.get_patient_detail(body.pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Patient not found")

    result = VisitService.record_visit(
        vet_id=vet_profile["id"],
        pet_id=body.pet_id,
        vet_name=vet_profile.get("doctor_name", "Dr. Veterinarian"),
        clinic_id=clinic_id,
        clinic_name=clinic_name,
        vitals=body.vitals,
        diagnoses=body.diagnoses,
        medications=body.medications,
        injections=body.injections,
        shampoos=body.shampoos,
        vaccines=body.vaccines,
        follow_up_days=body.follow_up_days,
        follow_up_date=body.follow_up_date,
        follow_up_notes=body.follow_up_notes,
        event_date=body.event_date,
    )
    return result
