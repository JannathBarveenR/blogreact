# backend/app/timeline/services/event_service.py
import uuid
from datetime import date
from app.supabase_client import supabase
from app.timeline.schemas.category_entry import CATEGORY_TO_FORM_TYPE
from app.timeline.services.dedupe_service import DedupeService, compute_entry_hash
from app.timeline.services import reminder_engine

def _normalise_entry(entry: dict) -> dict:
    e = dict(entry)
    if not e.get("entry_id"):
        e["entry_id"] = str(uuid.uuid4())
    if not e.get("form_type"):
        e["form_type"] = CATEGORY_TO_FORM_TYPE.get(e["category"], "procedure_diagnostics")
    return e

class EventService:
    @staticmethod
    def create_event(pet_id: str, payload: dict):
        event_date = str(payload["event_date"])
        entries = [_normalise_entry(e) for e in payload.get("category_entries", [])]

        if not payload.get("force"):
            dupes = DedupeService.find_same_day_duplicates(pet_id, entries, event_date)
            if dupes:
                return {"duplicate": True, "candidates": dupes}

        # rule-engine suggested due dates (server-side, editable client-side)
        for e in entries:
            suggested = reminder_engine.suggest_next_due(e, event_date)
            if suggested and not e.get("next_due_date"):
                e["next_due_date"] = suggested

        row = {
            "pet_id": pet_id,
            "visit_group_id": str(uuid.uuid4()),
            "event_date": event_date,
            "event_time": str(payload["event_time"]) if payload.get("event_time") else None,
            "clinic_id": payload.get("clinic_id"),
            "clinic_name": payload.get("clinic_name"),
            "vet_name": payload.get("vet_name"),
            "visit_type": payload.get("visit_type", []),
            "reason_for_visit": payload.get("reason_for_visit"),
            "overall_notes": payload.get("overall_notes"),
            "follow_up_date": str(payload["follow_up_date"]) if payload.get("follow_up_date") else None,
            "follow_up_notes": payload.get("follow_up_notes"),
            "category_entries": entries,
            "event_hash": compute_entry_hash(pet_id, entries[0], event_date) if entries else None,
            "source": "manual",
            "verification_status": "verified",
        }
        created = supabase.table("medical_events").insert(row).execute().data[0]

        reminders = reminder_engine.generate_for_event(created)
        return {"duplicate": False, "event": created, "reminders": reminders}

    @staticmethod
    def get_event(pet_id: str, event_id: str):
        res = (supabase.table("medical_events").select("*")
               .eq("id", event_id).eq("pet_id", pet_id)
               .eq("is_deleted", False).execute().data)
        return res[0] if res else None

    @staticmethod
    def list_events(pet_id: str, category: str | None = None):
        rows = (supabase.table("medical_events").select("*")
                .eq("pet_id", pet_id).eq("is_deleted", False)
                .order("event_date", desc=True).execute().data) or []
        if category:
            rows = [r for r in rows
                    if any(e.get("category") == category for e in r.get("category_entries", []))]
        return rows

    @staticmethod
    def update_event(pet_id: str, event_id: str, patch: dict):
        current = EventService.get_event(pet_id, event_id)
        if not current:
            return None
        changed = {k: v for k, v in patch.items() if v is not None}
        if "category_entries" in changed:
            changed["category_entries"] = [_normalise_entry(e) for e in changed["category_entries"]]
        # audit
        supabase.table("edit_history").insert({
            "event_id": event_id, "pet_id": pet_id,
            "previous_value": current, "changed_fields": list(changed.keys()),
            "changed_by": "user",
        }).execute()
        updated = (supabase.table("medical_events").update(changed)
                   .eq("id", event_id).execute().data[0])
        # recompute reminders if a due-date-relevant field changed
        due_relevant = {"category_entries", "follow_up_date", "event_date"}
        if due_relevant & set(changed.keys()):
            reminder_engine.recompute_for_event(updated)
        return updated

    @staticmethod
    def delete_event(pet_id: str, event_id: str):
        # soft delete; cascade reminders & unlink documents — scope every write by pet_id
        supabase.table("medical_events").update({"is_deleted": True})\
            .eq("id", event_id).eq("pet_id", pet_id).execute()
        supabase.table("reminders").delete()\
            .eq("source_event_id", event_id).eq("pet_id", pet_id).execute()
        return True

    @staticmethod
    def add_category_entry(pet_id: str, event_id: str, entry: dict):
        current = EventService.get_event(pet_id, event_id)
        if not current:
            return None
        entries = current.get("category_entries", [])
        entries.append(_normalise_entry(entry))
        updated = (supabase.table("medical_events")
                   .update({"category_entries": entries}).eq("id", event_id).execute().data[0])
        reminder_engine.recompute_for_event(updated)
        return updated

    @staticmethod
    def add_event_link(pet_id: str, event_id: str, linked_event_id: str, link_type: str):
        current = EventService.get_event(pet_id, event_id)
        if not current:
            return None
        links = current.get("linked_events", []) or []
        # avoid duplicate links to the same target
        links = [l for l in links if l.get("linked_event_id") != linked_event_id]
        links.append({
            "linked_event_id": linked_event_id,
            "link_type": link_type,
            "created_at": str(date.today()),
        })
        updated = (supabase.table("medical_events")
                   .update({"linked_events": links}).eq("id", event_id).eq("pet_id", pet_id).execute().data[0])
        return updated

    @staticmethod
    def remove_event_link(pet_id: str, event_id: str, linked_event_id: str):
        current = EventService.get_event(pet_id, event_id)
        if not current:
            return None
        links = [l for l in current.get("linked_events", []) or []
                 if l.get("linked_event_id") != linked_event_id]
        updated = (supabase.table("medical_events")
                   .update({"linked_events": links}).eq("id", event_id).eq("pet_id", pet_id).execute().data[0])
        return updated