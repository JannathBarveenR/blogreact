# backend/app/timeline/services/category_engine.py
from app.supabase_client import supabase

CATEGORIES = ["diagnosis","medication","vaccination","deworming",
              "anti_tick_flea","grooming","other"]

def _rows(pet_id):
    return (supabase.table("medical_events").select("*")
            .eq("pet_id", pet_id).eq("is_deleted", False)
            .order("event_date", desc=True).execute().data) or []

def _summary(entry, ev):
    """Compact card payload per form type."""
    cf = entry.get("category_fields", {}) or {}
    ft = entry.get("form_type")
    base = {"entry_id": entry.get("entry_id"), "category": entry.get("category"),
            "item_name": entry.get("item_name"), "status": entry.get("status"),
            "date_logged": entry.get("date_logged"),
            "next_due_date": entry.get("next_due_date"),
            "event_id": ev["id"], "visit_group_id": ev["visit_group_id"]}
    if ft == "consultation_vitals":
        base["vitals"] = {"weight": cf.get("weight"), "weight_unit": cf.get("weight_unit"),
                          "temperature": cf.get("temperature")}
    elif ft == "treatment_medication":
        base["treatment"] = {"dose": cf.get("dose"), "dose_unit": cf.get("dose_unit"),
                             "route": cf.get("route"),
                             "frequency": cf.get("frequency"),
                             "duration": cf.get("duration"),
                             "duration_unit": cf.get("duration_unit")}
    elif ft == "procedure_diagnostics":
        base["procedure"] = {"procedure_type": cf.get("procedure_type")}
    return base

class CategoryEngine:
    @staticmethod
    def get_category_grouped(pet_id):
        buckets = {c: [] for c in CATEGORIES}
        for ev in _rows(pet_id):
            for entry in ev.get("category_entries", []):
                cat = entry.get("category")
                if cat in buckets:
                    buckets[cat].append(_summary(entry, ev))
        return {"view": "category", "buckets": buckets}

    @staticmethod
    def get_chronological(pet_id):
        feed = []
        for ev in _rows(pet_id):   # already event_date DESC
            for entry in ev.get("category_entries", []):
                feed.append(_summary(entry, ev))
        return {"view": "chronological", "events": feed}

    @staticmethod
    def get_visit_group(pet_id, visit_group_id):
        rows = (supabase.table("medical_events").select("*")
                .eq("pet_id", pet_id).eq("visit_group_id", visit_group_id)
                .eq("is_deleted", False).execute().data) or []
        return {"visit_group_id": visit_group_id, "events": rows}
