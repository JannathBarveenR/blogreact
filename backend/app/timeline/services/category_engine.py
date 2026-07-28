# backend/app/timeline/services/category_engine.py
from app.supabase_client import supabase

CATEGORIES = ["diagnosis","medication","vaccination","deworming",
              "anti_tick_flea","grooming","other"]

def _rows(pet_id):
    events = []
    try:
        events = (supabase.table("medical_events").select("*")
                .eq("pet_id", pet_id).eq("is_deleted", False)
                .order("event_date", desc=True).execute().data) or []
    except Exception as e:
        print(f"[CategoryEngine] Warning: Could not query medical_events: {e}")
        events = []

    if not events:
        return []

    docs = []
    try:
        docs = (supabase.table("medical_documents").select("*")
                .eq("pet_id", pet_id).execute().data) or []
    except Exception as e:
        print(f"[CategoryEngine] Warning: Could not query medical_documents: {e}")
        try:
            records = (supabase.table("medical_records").select("*")
                       .eq("pet_profile_id", pet_id).execute().data) or []
            for r in records:
                docs.append({
                    "id": r.get("id"),
                    "pet_id": r.get("pet_profile_id"),
                    "event_id": r.get("event_id"),
                    "file_url": r.get("file_url"),
                    "file_type": r.get("file_type"),
                    "label": r.get("title") or r.get("file_name"),
                    "storage_path": r.get("storage_path"),
                    "uploaded_at": r.get("created_at"),
                })
        except Exception as e2:
            print(f"[CategoryEngine] Warning: Could not query medical_records fallback: {e2}")
            docs = []

    docs_by_event = {}
    for d in docs:
        eid = d.get("event_id")
        if eid:
            if eid not in docs_by_event: docs_by_event[eid] = []
            docs_by_event[eid].append(d)
    for ev in events:
        ev["documents"] = docs_by_event.get(ev["id"], [])
    return events

def _summary(entry, ev):
    """Compact card payload per form type."""
    cf = entry.get("category_fields", {}) or {}
    ft = entry.get("form_type")
    base = {
        "entry_id": entry.get("entry_id"),
        "category": entry.get("category"),
        "item_name": entry.get("item_name"),
        "status": entry.get("status"),
        "date_logged": entry.get("date_logged"),
        "next_due_date": entry.get("next_due_date"),
        "notes": entry.get("notes") or ev.get("overall_notes"),
        "event_id": ev["id"],
        "visit_group_id": ev["visit_group_id"],
        "clinic_name": ev.get("clinic_name"),
        "vet_name": ev.get("vet_name"),
        "reason_for_visit": ev.get("reason_for_visit"),
        "documents": ev.get("documents", []),
    }
    if ft == "consultation_vitals":
        base["vitals"] = {
            "weight": cf.get("weight"),
            "weight_unit": cf.get("weight_unit"),
            "temperature": cf.get("temperature"),
        }
    elif ft == "treatment_medication":
        base["treatment"] = {
            "dose": cf.get("dose"),
            "dose_unit": cf.get("dose_unit"),
            "route": cf.get("route"),
            "frequency": cf.get("frequency"),
            "duration": cf.get("duration"),
            "duration_unit": cf.get("duration_unit"),
        }
    elif ft == "procedure_diagnostics":
        base["procedure"] = {"procedure_type": cf.get("procedure_type")}
    return base

class CategoryEngine:
    @staticmethod
    def get_category_grouped(pet_id):
        buckets = {c: [] for c in CATEGORIES}
        for ev in _rows(pet_id):
            for entry in (ev.get("category_entries") or []):
                cat = entry.get("category")
                if cat in buckets:
                    buckets[cat].append(_summary(entry, ev))
        return {"view": "category", "buckets": buckets}

    @staticmethod
    def get_chronological(pet_id):
        feed = []
        for ev in _rows(pet_id):   # already event_date DESC
            for entry in (ev.get("category_entries") or []):
                feed.append(_summary(entry, ev))
        return {"view": "chronological", "events": feed}

    @staticmethod
    def get_visit_group(pet_id, visit_group_id):
        rows = (supabase.table("medical_events").select("*")
                .eq("pet_id", pet_id).eq("visit_group_id", visit_group_id)
                .eq("is_deleted", False).execute().data) or []
        return {"visit_group_id": visit_group_id, "events": rows}
