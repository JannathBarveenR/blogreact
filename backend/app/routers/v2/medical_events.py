# backend/app/routers/v2/medical_events.py
from fastapi import APIRouter, Depends, HTTPException
from app.utils.auth import get_current_user
from app.services.pet_service import PetService
from app.timeline.schemas.medical_event import MedicalEventCreate, MedicalEventUpdate
from app.timeline.schemas.category_entry import CategoryEntryBase
from app.timeline.services.event_service import EventService

router = APIRouter(prefix="/api/v2/pets", tags=["v2-medical-events"])

def _guard(pet_id, user):
    if not PetService.verify_ownership(pet_id, user["id"]):
        raise HTTPException(404, "Pet not found")

@router.post("/{pet_id}/medical-events", status_code=201)
async def create_event(pet_id: str, body: MedicalEventCreate,
                       user=Depends(get_current_user)):
    _guard(pet_id, user)
    result = EventService.create_event(pet_id, body.model_dump(mode="json"))
    if result.get("duplicate"):
        raise HTTPException(status_code=409, detail={
            "message": "Possible duplicate of an entry from today",
            "candidates": result["candidates"]})
    return result

@router.get("/{pet_id}/medical-events")
async def list_events(pet_id: str, category: str | None = None,
                      user=Depends(get_current_user)):
    _guard(pet_id, user)
    return {"events": EventService.list_events(pet_id, category)}

@router.get("/{pet_id}/medical-events/{event_id}")
async def get_event(pet_id: str, event_id: str, user=Depends(get_current_user)):
    _guard(pet_id, user)
    ev = EventService.get_event(pet_id, event_id)
    if not ev:
        raise HTTPException(404, "Event not found")
    return ev

@router.put("/{pet_id}/medical-events/{event_id}")
async def update_event(pet_id: str, event_id: str, body: MedicalEventUpdate,
                       user=Depends(get_current_user)):
    _guard(pet_id, user)
    updated = EventService.update_event(pet_id, event_id, body.model_dump(mode="json", exclude_unset=True))
    if not updated:
        raise HTTPException(404, "Event not found")
    return updated

@router.delete("/{pet_id}/medical-events/{event_id}")
async def delete_event(pet_id: str, event_id: str, user=Depends(get_current_user)):
    _guard(pet_id, user)
    EventService.delete_event(pet_id, event_id)
    return {"deleted": True}

@router.post("/{pet_id}/medical-events/{event_id}/entries")
async def add_entry(pet_id: str, event_id: str, entry: CategoryEntryBase,
                    user=Depends(get_current_user)):
    _guard(pet_id, user)
    updated = EventService.add_category_entry(pet_id, event_id, entry.model_dump(mode="json"))
    if not updated:
        raise HTTPException(404, "Event not found")
    return updated
@router.post("/{pet_id}/medical-events/{event_id}/link")
async def link_event(pet_id: str, event_id: str, body: dict,
                     user=Depends(get_current_user)):
    """
    Link this event to another event of the same pet (e.g. Change in Pet -> Vet Visit).
    Body: { "linked_event_id": "uuid", "link_type": "follow_up" }
    """
    _guard(pet_id, user)
    linked_event_id = body.get("linked_event_id")
    link_type = body.get("link_type", "related")
    if not linked_event_id:
        raise HTTPException(400, "linked_event_id is required")

    target = EventService.get_event(pet_id, linked_event_id)
    if not target:
        raise HTTPException(400, "Cannot link to an event that does not belong to this pet")

    updated = EventService.add_event_link(pet_id, event_id, linked_event_id, link_type)
    if not updated:
        raise HTTPException(404, "Event not found")
    return updated


@router.delete("/{pet_id}/medical-events/{event_id}/link/{linked_event_id}")
async def unlink_event(pet_id: str, event_id: str, linked_event_id: str,
                       user=Depends(get_current_user)):
    _guard(pet_id, user)
    updated = EventService.remove_event_link(pet_id, event_id, linked_event_id)
    if not updated:
        raise HTTPException(404, "Event not found")
    return updated
