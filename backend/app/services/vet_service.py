# backend/app/services/vet_service.py
import uuid
from typing import Optional
from app.supabase_client import supabase_admin as supabase

class VetService:
    @staticmethod
    def get_or_create_vet_profile(user_id: str, user_email: Optional[str] = None) -> dict:
        """Fetch the vet profile or create a default active profile for the authenticated vet."""
        res = supabase.table("vet_profiles").select("*, clinic_database(*)").eq("user_id", user_id).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]
        
        # Check user profile for name/phone
        user_prof = supabase.table("user_profiles").select("*").eq("id", user_id).execute()
        full_name = "Dr. Veterinarian"
        phone = ""
        if user_prof.data and len(user_prof.data) > 0:
            full_name = user_prof.data[0].get("full_name") or full_name
            phone = user_prof.data[0].get("phone") or ""

        # Create vet profile
        new_profile = {
            "user_id": user_id,
            "doctor_name": full_name if full_name.startswith("Dr.") else f"Dr. {full_name}",
            "qualification": "BVSc & AH",
            "registration_number": "",
            "phone": phone,
            "is_active": True,
        }
        inserted = supabase.table("vet_profiles").insert(new_profile).execute()
        return inserted.data[0] if inserted.data else new_profile

    @staticmethod
    def update_vet_profile(user_id: str, patch: dict) -> Optional[dict]:
        allowed = {"doctor_name", "qualification", "registration_number", "phone", "primary_clinic_id", "photo_url"}
        clean_patch = {k: v for k, v in patch.items() if k in allowed and v is not None}
        if not clean_patch:
            return VetService.get_or_create_vet_profile(user_id)
        
        res = supabase.table("vet_profiles").update(clean_patch).eq("user_id", user_id).execute()
        return res.data[0] if res.data else None

    @staticmethod
    def get_medicine_stock(vet_id: str) -> dict:
        """Get all standard medicines, vaccines, shampoos along with the vet's active toggles."""
        meds = supabase.table("medicine_database").select("*").execute().data or []
        vaxes = supabase.table("vaccine_database").select("*").execute().data or []
        shampoos = supabase.table("shampoo_database").select("*").execute().data or []
        
        stock_toggles = supabase.table("vet_medicine_stock").select("*").eq("vet_id", vet_id).execute().data or []
        inactive_map = {f"{r['item_type']}:{r['item_id']}": r['is_active'] for r in stock_toggles}

        for m in meds:
            key = f"medicine:{m['id']}"
            m["is_active"] = inactive_map.get(key, True)
        for v in vaxes:
            key = f"vaccine:{v['id']}"
            v["is_active"] = inactive_map.get(key, True)
        for s in shampoos:
            key = f"shampoo:{s['id']}"
            s["is_active"] = inactive_map.get(key, True)

        return {
            "medicines": meds,
            "vaccines": vaxes,
            "shampoos": shampoos,
        }

    @staticmethod
    def toggle_stock_item(vet_id: str, item_type: str, item_id: str, is_active: bool) -> dict:
        row = {
            "vet_id": vet_id,
            "item_type": item_type,
            "item_id": item_id,
            "is_active": is_active,
        }
        res = supabase.table("vet_medicine_stock").upsert(row, on_conflict="vet_id,item_type,item_id").execute()
        return res.data[0] if res.data else row
