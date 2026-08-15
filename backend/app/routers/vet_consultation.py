"""
Vet Online Consultation Router (/api/vet/consultations)

Features:
- Online Video Consultations ONLY (In-person consultations are completely removed).
- Integrated with Calendly Python Service for scheduling online video sessions.
- RBAC protected endpoints for doctors, supervisors, and pet parents.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from app.utils.auth import get_current_user
from app.utils.rbac import require_role, get_current_user_with_roles
from app.supabase_client import supabase
from app.services.calendly_service import CalendlyService
from app.schemas.vet_maternity import (
    OnlineConsultationBookingRequest,
    OnlineConsultationBookingResponse,
    OnlineConsultationNotesUpdate,
    OnlineConsultationResponse,
    VetProfileResponse,
    VetProfileCreate
)

router = APIRouter(prefix="/api/vet", tags=["Vet Online Consultations"])


@router.get("/doctors", response_model=List[VetProfileResponse])
async def list_verified_doctors():
    """
    List all verified veterinary doctors available for online video consultation.
    Accessible to all logged-in users.
    """
    try:
        res = supabase.table("vet_profiles").select("*").eq("is_verified", True).eq("is_active", True).execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch doctors: {str(e)}")


@router.post("/consultations/online/book-link", response_model=OnlineConsultationBookingResponse)
async def generate_online_consultation_link(
    data: OnlineConsultationBookingRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generates a personalized Calendly online video consultation link for a pet parent.
    Creates a pending online consultation record in the database.
    """
    # 1. Verify pet ownership
    pet_res = supabase.table("pet_profiles").select("*").eq("id", data.pet_id).eq("user_id", current_user["id"]).execute()
    if not pet_res.data:
        raise HTTPException(status_code=404, detail="Pet profile not found or does not belong to logged-in user.")

    pet_name = pet_res.data[0].get("pet_name", "Pet")

    # 2. Verify vet profile
    vet_res = supabase.table("vet_profiles").select("*").eq("id", data.vet_id).execute()
    if not vet_res.data:
        raise HTTPException(status_code=404, detail="Selected veterinarian not found.")

    vet_data = vet_res.data[0]
    calendly_url = vet_data.get("calendly_url") or "https://calendly.com/petolife-consultations/online-vet"

    # 3. Create database entry
    consultation_payload = {
        "pet_id": data.pet_id,
        "user_id": current_user["id"],
        "vet_id": data.vet_id,
        "consultation_type": "online_video",
        "status": "scheduled",
        "reason_for_consultation": data.reason_for_consultation,
        "scheduled_start_time": (data.scheduled_start_time or "now()"),
    }

    insert_res = supabase.table("online_consultations").insert(consultation_payload).execute()
    if not insert_res.data:
        raise HTTPException(status_code=500, detail="Failed to initialize online consultation record.")

    consultation_record = insert_res.data[0]
    consultation_id = consultation_record["id"]

    # 4. Generate Calendly Booking Link
    user_metadata = current_user.get("user_metadata", {})
    user_name = user_metadata.get("full_name") or current_user.get("email", "Pet Owner")
    user_email = current_user.get("email", "")

    booking_url = CalendlyService.generate_booking_url(
        calendly_base_url=calendly_url,
        user_name=user_name,
        user_email=user_email,
        pet_name=pet_name,
        consultation_id=consultation_id,
        reason=data.reason_for_consultation
    )

    return {
        "consultation_id": consultation_id,
        "pet_id": data.pet_id,
        "vet_id": data.vet_id,
        "consultation_type": "online_video",
        "booking_url": booking_url,
        "status": "scheduled"
    }


@router.get("/consultations", response_model=List[OnlineConsultationResponse])
async def list_online_consultations(
    pet_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user_with_roles)
):
    """
    List online video consultations.
    - Pet Owners view their own consultations.
    - Vets view consultations assigned to them.
    - Supervisors view all consultations.
    """
    roles = current_user.get("roles", [])
    user_id = current_user["id"]

    query = supabase.table("online_consultations").select("*")

    if "supervisor" in roles:
        if pet_id:
            query = query.eq("pet_id", pet_id)
    elif "vet" in roles:
        vet_res = supabase.table("vet_profiles").select("id").eq("user_id", user_id).execute()
        if vet_res.data:
            vet_profile_id = vet_res.data[0]["id"]
            query = query.eq("vet_id", vet_profile_id)
        else:
            return []
    else:
        query = query.eq("user_id", user_id)
        if pet_id:
            query = query.eq("pet_id", pet_id)

    res = query.order("scheduled_start_time", desc=True).execute()
    return res.data or []


@router.get("/consultations/{consultation_id}", response_model=OnlineConsultationResponse)
async def get_online_consultation_detail(
    consultation_id: str,
    current_user: dict = Depends(get_current_user_with_roles)
):
    """Get single online consultation record by ID."""
    res = supabase.table("online_consultations").select("*").eq("id", consultation_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Online consultation record not found.")
    
    consultation = res.data[0]
    roles = current_user.get("roles", [])
    
    # Ownership guard
    if "supervisor" not in roles and consultation["user_id"] != current_user["id"]:
        vet_res = supabase.table("vet_profiles").select("id").eq("user_id", current_user["id"]).execute()
        vet_id = vet_res.data[0]["id"] if vet_res.data else None
        if consultation["vet_id"] != vet_id:
            raise HTTPException(status_code=403, detail="Forbidden: You do not have access to this consultation.")
            
    return consultation


@router.patch("/consultations/{consultation_id}/notes", response_model=OnlineConsultationResponse)
async def update_consultation_clinical_notes(
    consultation_id: str,
    data: OnlineConsultationNotesUpdate,
    current_user: dict = Depends(require_role(["vet", "supervisor"]))
):
    """
    Update clinical notes & prescription for an online consultation.
    Restricted to Vet (Doctor) and Supervisor roles only.
    """
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update fields provided.")

    res = supabase.table("online_consultations").update(update_data).eq("id", consultation_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Online consultation not found or update failed.")

    return res.data[0]


@router.post("/consultations/calendly-webhook")
async def calendly_webhook_handler(request: Request):
    """
    Webhook receiver for Calendly events (invitee.created, invitee.canceled).
    Syncs scheduled meeting links and completion status automatically.
    """
    try:
        payload = await request.json()
        parsed = CalendlyService.parse_webhook_payload(payload)

        meeting_link = parsed.get("meeting_link")
        event_status = parsed.get("status")

        # Extract consultation_id from tracking or payload if present
        tracking = parsed.get("tracking", {})
        consultation_id = tracking.get("utm_content") or tracking.get("salesforce_uuid")

        if consultation_id and (meeting_link or event_status):
            update_payload = {}
            if meeting_link:
                update_payload["meeting_link"] = meeting_link
            if event_status:
                update_payload["status"] = event_status
            if parsed.get("start_time"):
                update_payload["scheduled_start_time"] = parsed["start_time"]
            if parsed.get("end_time"):
                update_payload["scheduled_end_time"] = parsed["end_time"]

            supabase.table("online_consultations").update(update_payload).eq("id", consultation_id).execute()

        return {"status": "success", "processed": True}
    except Exception as e:
        print(f"[Calendly Webhook Error] {e}")
        return {"status": "error", "message": str(e)}
