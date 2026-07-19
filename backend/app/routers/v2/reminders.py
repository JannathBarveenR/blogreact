# backend/app/routers/v2/reminders.py
from fastapi import APIRouter, Depends, HTTPException, Body
from app.utils.auth import get_current_user
from app.services.pet_service import PetService
from app.timeline.schemas.reminder import ReminderCreate, ReminderUpdate
from app.timeline.services import reminder_engine as RE

router = APIRouter(prefix="/api/v2/pets", tags=["v2-reminders"])
def _guard(pet_id, user):
    if not PetService.verify_ownership(pet_id, user["id"]):
        raise HTTPException(404, "Pet not found")

@router.get("/{pet_id}/reminders")
async def list_r(pet_id: str, type: str | None = None, status: str | None = None,
                 user=Depends(get_current_user)):
    _guard(pet_id, user)
    return {"reminders": RE.list_reminders(pet_id, type, status)}

@router.post("/{pet_id}/reminders", status_code=201)
async def create_r(pet_id: str, body: ReminderCreate, user=Depends(get_current_user)):
    _guard(pet_id, user)
    try:
        return RE.create_manual_reminder(pet_id, body.model_dump(mode="json"))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{pet_id}/reminders/{rid}")
async def update_r(pet_id: str, rid: str, body: ReminderUpdate, user=Depends(get_current_user)):
    _guard(pet_id, user)
    r = RE.update_reminder(pet_id, rid, body.model_dump(mode="json", exclude_unset=True))
    if not r: raise HTTPException(404, "Reminder not found")
    return r

@router.put("/{pet_id}/reminders/{rid}/complete")
async def complete_r(pet_id: str, rid: str, user=Depends(get_current_user)):
    _guard(pet_id, user)
    r = RE.complete_reminder(pet_id, rid)
    if not r: raise HTTPException(404, "Reminder not found")
    return r

@router.put("/{pet_id}/reminders/{rid}/snooze")
async def snooze_r(pet_id: str, rid: str, new_date: str = Body(..., embed=True),
                   user=Depends(get_current_user)):
    _guard(pet_id, user)
    return RE.snooze_reminder(pet_id, rid, new_date)

@router.delete("/{pet_id}/reminders/{rid}")
async def delete_r(pet_id: str, rid: str, user=Depends(get_current_user)):
    _guard(pet_id, user)
    RE.delete_reminder(pet_id, rid)
    return {"deleted": True}
