# backend/app/timeline/services/dedupe_service.py
import hashlib
from app.supabase_client import supabase

def _primary_field(entry: dict) -> str:
    cat = entry.get("category")
    cf = entry.get("category_fields", {}) or {}
    if cat == "vaccination":
        return (cf.get("vaccine_details", {}) or {}).get("vaccine_name") or entry.get("item_name","")
    return entry.get("item_name", "")

def compute_entry_hash(pet_id: str, entry: dict, event_date: str) -> str:
    raw = f"{pet_id}|{entry.get('category')}|{event_date}|{_primary_field(entry)}"
    return hashlib.sha256(raw.encode()).hexdigest()

class DedupeService:
    @staticmethod
    def find_same_day_duplicates(pet_id: str, entries: list, event_date: str):
        """Returns list of {entry_index, hash, candidate_event_id} for likely dupes."""
        hits = []
        existing = (supabase.table("medical_events")
                    .select("id,event_hash,event_date,category_entries")
                    .eq("pet_id", pet_id).eq("event_date", event_date)
                    .eq("is_deleted", False).execute().data) or []
        existing_hashes = {e["event_hash"]: e["id"] for e in existing if e.get("event_hash")}
        for i, entry in enumerate(entries):
            h = compute_entry_hash(pet_id, entry, event_date)
            if h in existing_hashes:
                hits.append({"entry_index": i, "hash": h,
                             "candidate_event_id": existing_hashes[h]})
        return hits
