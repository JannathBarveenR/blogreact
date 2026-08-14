# backend/app/services/visit_service.py
import uuid
from datetime import datetime, date, timedelta, timezone
from typing import Optional, List, Dict, Any
from app.supabase_client import supabase_admin as supabase
from app.timeline.services.dedupe_service import compute_entry_hash
from app.timeline.services import reminder_engine

class VisitService:
    @staticmethod
    def record_visit(
        vet_id: str,
        pet_id: str,
        vet_name: str,
        clinic_id: Optional[str],
        clinic_name: Optional[str],
        vitals: dict,
        diagnoses: List[dict],
        medications: List[dict],
        injections: List[dict],
        shampoos: List[dict],
        vaccines: List[dict],
        follow_up_days: Optional[int] = None,
        follow_up_date: Optional[str] = None,
        follow_up_notes: Optional[str] = None,
        event_date: Optional[str] = None,
    ) -> dict:
        """
        Transforms the 4-step wizard submission into canonical category_entries
        and inserts into public.medical_events so it appears seamlessly on the Timeline.
        """
        visit_date = event_date or date.today().isoformat()
        category_entries = []

        # 1. Consultation & Vitals + Diagnoses entry
        diag_sub_entries = []
        for d in diagnoses:
            diag_sub_entries.append({
                "diagnosis_category": d.get("category"),
                "diagnosis_name": d.get("name") or "General Examination",
                "status": (d.get("status") or "suspected").lower().replace(" ", "_"),
                "clinical_notes": d.get("notes") or "",
                "attachment": d.get("attachment"),
            })

        parsed_weight = None
        if vitals.get("weight"):
            try:
                parsed_weight = float(str(vitals["weight"]).replace("kg", "").strip())
            except ValueError:
                pass

        parsed_temp = None
        if vitals.get("temp"):
            try:
                parsed_temp = float(str(vitals["temp"]).replace("°F", "").replace("F", "").strip())
            except ValueError:
                pass

        vitals_entry = {
            "entry_id": str(uuid.uuid4()),
            "category": "diagnosis",
            "form_type": "consultation_vitals",
            "item_name": diagnoses[0]["name"] if diagnoses else "Vet Consultation",
            "date": visit_date,
            "weight": parsed_weight,
            "weight_unit": "kg",
            "temperature": parsed_temp,
            "temperature_unit": "fahrenheit",
            "heart_rate": int(vitals["heartRate"]) if vitals.get("heartRate") and str(vitals["heartRate"]).isdigit() else None,
            "respiration_rate": int(vitals["respRate"]) if vitals.get("respRate") and str(vitals["respRate"]).isdigit() else None,
            "behaviour": (vitals.get("behavior") or "normal").lower(),
            "diagnoses": diag_sub_entries,
        }
        category_entries.append(vitals_entry)

        # 2. Medications
        for m in medications:
            if not m.get("name"):
                continue
            med_entry = {
                "entry_id": str(uuid.uuid4()),
                "category": "medication",
                "form_type": "treatment_medication",
                "item_name": m.get("name"),
                "brand_name": m.get("brand"),
                "composition": m.get("composition"),
                "dose": m.get("dosage"),
                "date": visit_date,
                "medication_status": "active",
            }
            category_entries.append(med_entry)

        # 3. Injections
        for inj in injections:
            if not inj.get("name"):
                continue
            inj_entry = {
                "entry_id": str(uuid.uuid4()),
                "category": "medication",
                "form_type": "treatment_medication",
                "item_name": f"Inj. {inj.get('name')}",
                "dose": inj.get("dose"),
                "date": visit_date,
                "injection_details": {
                    "route_type": "sc",
                },
                "medication_status": "completed",
            }
            category_entries.append(inj_entry)

        # 4. Shampoo
        for sh in shampoos:
            if not sh.get("name"):
                continue
            sh_entry = {
                "entry_id": str(uuid.uuid4()),
                "category": "anti_tick_flea" if "tick" in sh.get("name", "").lower() else "other",
                "form_type": "treatment_medication",
                "item_name": sh.get("name"),
                "date": visit_date,
                "shampoo_details": {
                    "shampoo_category": sh.get("category") or "general",
                },
            }
            category_entries.append(sh_entry)

        # 5. Vaccines
        for vx in vaccines:
            if not vx.get("name"):
                continue
            vx_entry = {
                "entry_id": str(uuid.uuid4()),
                "category": "vaccination",
                "form_type": "treatment_medication",
                "item_name": vx.get("name"),
                "brand_name": vx.get("brand"),
                "date": visit_date,
                "vaccine_details": {
                    "vaccine_name": vx.get("name"),
                },
            }
            category_entries.append(vx_entry)

        # Calculate follow up date
        final_follow_up_date = follow_up_date
        if not final_follow_up_date and follow_up_days:
            final_follow_up_date = (date.today() + timedelta(days=int(follow_up_days))).isoformat()

        # Update weight in pet_profiles if provided
        if parsed_weight:
            supabase.table("pet_profiles").update({
                "weight": parsed_weight,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }).eq("id", pet_id).execute()

        # Insert Medical Event
        event_payload = {
            "pet_id": pet_id,
            "visit_group_id": str(uuid.uuid4()),
            "event_date": visit_date,
            "clinic_id": clinic_id,
            "clinic_name": clinic_name or "Veterinary Clinic",
            "vet_name": vet_name,
            "reason_for_visit": (diagnoses[0]["name"] if diagnoses else "Vet Visit Consultation"),
            "overall_notes": diagnoses[0].get("notes") if diagnoses else "",
            "follow_up_date": final_follow_up_date,
            "follow_up_notes": follow_up_notes or ("Scheduled follow-up" if final_follow_up_date else None),
            "category_entries": category_entries,
            "event_hash": compute_entry_hash(pet_id, category_entries[0], visit_date) if category_entries else None,
            "source": "vet_portal",
            "verification_status": "verified",
            "created_by_vet_id": vet_id,
            "signed_at": datetime.now(timezone.utc).isoformat(),
        }

        inserted = supabase.table("medical_events").insert(event_payload).execute()
        event_record = inserted.data[0] if inserted.data else event_payload

        # Auto-generate Reminders via engine
        reminders = reminder_engine.generate_for_event(event_record)

        return {
            "success": True,
            "event": event_record,
            "reminders": reminders,
        }
