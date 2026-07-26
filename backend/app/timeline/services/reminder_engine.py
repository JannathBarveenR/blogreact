# backend/app/timeline/services/reminder_engine.py
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta   # pip install python-dateutil
from app.supabase_client import supabase_admin as supabase

DEWORMING_DAYS = 90
ANTI_TICK_DAYS = 30

FALLBACK_VACCINE_INTERVALS = {
    "Rabies":365, "DHPP":365, "Leptospirosis":365,
    "Bordetella":180, "Canine Influenza":365,
    "FVRCP":365, "FeLV":365,
}

def get_vaccine_interval(vaccine_name, animal_type=None):
    """Look up the booster interval. animal_type is OPTIONAL and only used to
    disambiguate a same-named vaccine across animals. When omitted, we match on
    vaccine_name alone (first row wins) and fall back to a name-keyed constant,
    then to 365. The pet is never required to declare a species."""
    try:
        q = (supabase.table("vaccine_database").select("default_interval_days")
             .eq("vaccine_name", vaccine_name))
        if animal_type:
            q = q.eq("animal_type", animal_type)
        rows = q.limit(1).execute().data
        if rows:
            return rows[0]["default_interval_days"]
    except Exception:
        pass
    return FALLBACK_VACCINE_INTERVALS.get(vaccine_name, 365)

def _d(s):
    return s if isinstance(s, date) else date.fromisoformat(str(s))

def suggest_next_due(entry, event_date):
    """Pure suggestion used to pre-fill the form (editable client-side)."""
    cat = entry.get("category"); cf = entry.get("category_fields", {}) or {}
    base = _d(entry.get("date_logged") or event_date)
    if cat == "vaccination":
        vd = cf.get("vaccine_details", {}) or {}
        days = vd.get("auto_next_due_days") or get_vaccine_interval(
            vd.get("vaccine_name") or entry.get("item_name"),
            vd.get("animal_type"))   # animal_type may be None — that's fine
        return str(base + timedelta(days=days))
    if cat == "deworming":
        return str(base + timedelta(days=DEWORMING_DAYS))
    if cat == "anti_tick_flea":
        return str(base + timedelta(days=ANTI_TICK_DAYS))
    if cat == "medication":
        dur = cf.get("duration"); unit = cf.get("duration_unit")
        if dur and unit == "days":   return str(base + timedelta(days=int(dur)))
        if dur and unit == "weeks":  return str(base + timedelta(weeks=int(dur)))
        if dur and unit == "months": return str(base + relativedelta(months=int(dur)))
    return None

def _insert(reminder: dict):
    return supabase.table("reminders").insert(reminder).execute().data[0]

def _priority_for(rtype, due):
    if rtype in ("vaccination","follow_up","medication_end"):
        return "high" if _d(due) <= date.today() else "medium"
    if rtype in ("deworming","anti_tick"):
        return "medium"
    return "low"

def generate_for_event(event: dict):
    """Auto-generated reminders from a saved visit (RULE_ENGINE_OWNS)."""
    created = []
    pet_id = event["pet_id"]; eid = event["id"]; edate = event["event_date"]
    for entry in event.get("category_entries", []):
        cat = entry.get("category"); cf = entry.get("category_fields", {}) or {}
        due = entry.get("next_due_date") or suggest_next_due(entry, edate)
        rtype = None
        if cat == "vaccination":     rtype = "vaccination"
        elif cat == "deworming":     rtype = "deworming"
        elif cat == "anti_tick_flea":rtype = "anti_tick"
        elif cat == "medication":    rtype = "medication_end"
        if rtype and due:
            created.append(_insert({
                "pet_id": pet_id, "source_event_id": eid,
                "type": rtype, "title": f"{entry.get('item_name')} due",
                "due_date": due, "priority": _priority_for(rtype, due),
                "status": "pending", "is_ai_generated": False,
            }))
    # visit-level follow-up
    if event.get("follow_up_date"):
        created.append(_insert({
            "pet_id": pet_id, "source_event_id": eid, "type": "follow_up",
            "title": "Follow-up visit", "description": event.get("follow_up_notes"),
            "due_date": event["follow_up_date"],
            "priority": _priority_for("follow_up", event["follow_up_date"]),
            "status": "pending", "is_ai_generated": False,
        }))
    return created

def recompute_for_event(event: dict):
    """On edit: wipe this event's auto reminders and regenerate. Manual reminders untouched."""
    supabase.table("reminders").delete()\
        .eq("source_event_id", event["id"]).eq("pet_id", event["pet_id"])\
        .eq("is_ai_generated", False).execute()
    return generate_for_event(event)

# ---- manual + recurring CRUD -------------------------------------------------

def create_manual_reminder(pet_id: str, body: dict):
    # Always bind to the caller's pet_id (never trust a pet_id in the body).
    row = {**body, "pet_id": pet_id, "status": "pending", "is_ai_generated": False}
    row.pop("id", None)  # never let a client set the primary key
    # If linking to an event, that event must belong to THIS pet.
    if row.get("linked_event_id"):
        owns = (supabase.table("medical_events").select("id")
                .eq("id", row["linked_event_id"]).eq("pet_id", pet_id)
                .eq("is_deleted", False).execute().data)
        if not owns:
            raise ValueError("linked_event_id does not belong to this pet")
    created = _insert(row)
    # For recurring reminders, seed the chain id to this row's own id so all
    # future occurrences (per pet) share one stable, pet-scoped identifier.
    if created.get("repeat_type", "none") != "none" and not created.get("recurrence_group_id"):
        supabase.table("reminders").update({"recurrence_group_id": created["id"]}) \
            .eq("id", created["id"]).eq("pet_id", pet_id).execute()
        created["recurrence_group_id"] = created["id"]
    return created

def update_reminder(pet_id: str, rid: str, patch: dict):
    patch = {k: v for k, v in patch.items() if v is not None}
    res = (supabase.table("reminders").update(patch)
           .eq("id", rid).eq("pet_id", pet_id).execute().data)
    return res[0] if res else None

def delete_reminder(pet_id: str, rid: str):
    supabase.table("reminders").delete().eq("id", rid).eq("pet_id", pet_id).execute()
    return True

def _next_occurrence_date(rem):
    d = _d(rem["due_date"]); rt = rem.get("repeat_type")
    if rt == "daily":       return d + timedelta(days=1)
    if rt == "weekly":      return d + timedelta(weeks=1)
    if rt == "bi_weekly":   return d + timedelta(weeks=2)
    if rt == "monthly":     return d + relativedelta(months=1)
    if rt == "quarterly":   return d + relativedelta(months=3)
    if rt == "bi_annually": return d + relativedelta(months=6)
    if rt == "annually":    return d + relativedelta(years=1)
    if rt == "custom":
        n = rem.get("custom_repeat_interval") or 1; u = rem.get("custom_repeat_unit")
        if u == "days":   return d + timedelta(days=n)
        if u == "weeks":  return d + timedelta(weeks=n)
        if u == "months": return d + relativedelta(months=n)
    return None

def complete_reminder(pet_id: str, rid: str):
    rows = (supabase.table("reminders").select("*")
            .eq("id", rid).eq("pet_id", pet_id).execute().data)
    if not rows:
        return None
    rem = rows[0]
    # Scope EVERY write by pet_id, not just id — defense in depth even though
    # the router already verified ownership of pet_id.
    supabase.table("reminders").update({"status": "completed"}) \
        .eq("id", rid).eq("pet_id", pet_id).execute()
    next_occ = None
    if rem.get("repeat_type", "none") != "none":
        nd = _next_occurrence_date(rem)
        stop = False
        if rem.get("end_repeat_type") == "on_date" and rem.get("end_repeat_date"):
            stop = nd and nd > _d(rem["end_repeat_date"])
        if rem.get("end_repeat_type") == "after_count" and rem.get("end_repeat_count"):
            # Count completed occurrences of THIS recurring chain. A recurring
            # chain is identified by recurrence_group_id (set on first create),
            # scoped to the same pet — never by title (two pets could share one).
            chain = rem.get("recurrence_group_id") or rem["id"]
            done = (supabase.table("reminders").select("id", count="exact")
                    .eq("pet_id", pet_id).eq("recurrence_group_id", chain)
                    .eq("status", "completed").execute().count or 0)
            stop = done >= rem["end_repeat_count"]
        if nd and not stop:
            clone = {k: rem[k] for k in (
                "pet_id","type","title","description","priority","repeat_type",
                "custom_repeat_interval","custom_repeat_unit","end_repeat_type",
                "end_repeat_date","end_repeat_count","notes","linked_event_id",
                "recurrence_group_id")}
            clone["recurrence_group_id"] = rem.get("recurrence_group_id") or rem["id"]
            clone.update({"due_date": str(nd), "status": "pending", "is_ai_generated": False})
            next_occ = _insert(clone)
    return {"completed": rem["id"], "next_occurrence": next_occ}

def snooze_reminder(pet_id: str, rid: str, new_date: str):
    return update_reminder(pet_id, rid, {"due_date": new_date, "status": "snoozed"})

def list_reminders(pet_id: str, type=None, status=None):
    q = supabase.table("reminders").select("*").eq("pet_id", pet_id)
    if type:   q = q.eq("type", type)
    if status: q = q.eq("status", status)
    return (q.order("due_date").execute().data) or []
