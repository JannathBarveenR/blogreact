# backend/app/services/patient_service.py
import uuid
import secrets
from datetime import datetime, timezone
from typing import Optional, List
from app.supabase_client import supabase_admin as supabase

class PatientService:
    @staticmethod
    def generate_petolife_id(pet_type: str = "dog", city_code: str = "CBE") -> str:
        """Generate formatted PetOlife ID e.g. PET-CBE-DOG-000123"""
        p_type = pet_type.upper() if pet_type else "PET"
        rand_num = secrets.randbelow(900000) + 100000
        return f"PET-{city_code}-{p_type}-{rand_num}"

    @staticmethod
    def search_patients(query: str, limit: int = 30) -> List[dict]:
        """Search patients by PetOlife ID, phone, pet name, or owner name."""
        q = (query or "").strip().lower()
        if not q:
            # Return recent pets
            res = supabase.table("pet_profiles").select("*, user_profiles(*)").order("created_at", desc=True).limit(limit).execute()
            pets = res.data or []
        else:
            # Query by petolife_id, pet_name, or claim_phone
            res = supabase.table("pet_profiles").select("*, user_profiles(*)").or_(
                f"petolife_id.ilike.%{q}%,pet_name.ilike.%{q}%,claim_phone.ilike.%{q}%"
            ).limit(limit).execute()
            pets = res.data or []

            # Also search if owner phone matches in user_profiles
            owner_res = supabase.table("user_profiles").select("id, full_name, phone").ilike("phone", f"%{q}%").limit(10).execute()
            owner_ids = [o["id"] for o in (owner_res.data or [])]
            if owner_ids:
                owner_pets = supabase.table("pet_profiles").select("*, user_profiles(*)").in_("user_id", owner_ids).limit(limit).execute()
                existing_ids = {p["id"] for p in pets}
                for op in (owner_pets.data or []):
                    if op["id"] not in existing_ids:
                        pets.append(op)

        # Normalize owner details
        for p in pets:
            owner_data = p.get("user_profiles") or {}
            p["owner_name"] = owner_data.get("full_name") or p.get("claim_phone") or "Walk-in Pet Parent"
            p["owner_phone"] = owner_data.get("phone") or p.get("claim_phone") or ""
            p["is_claimed"] = p.get("claim_status") != "pending_claim" and bool(p.get("user_id"))
        return pets

    @staticmethod
    def create_walkin_patient(
        vet_id: str,
        pet_name: str,
        pet_type: str = "dog",
        breed: Optional[str] = None,
        gender: Optional[str] = "Male",
        approx_age: Optional[str] = None,
        weight: Optional[float] = None,
        blood_group: Optional[str] = None,
        owner_name: Optional[str] = None,
        owner_phone: Optional[str] = None,
    ) -> dict:
        """Create a walk-in patient with a claim token for the pet parent."""
        petolife_id = PatientService.generate_petolife_id(pet_type)
        claim_token = secrets.token_urlsafe(16)
        
        pet_payload = {
            "id": str(uuid.uuid4()),
            "user_id": None,
            "petolife_id": petolife_id,
            "pet_type": pet_type.lower(),
            "pet_name": pet_name.strip(),
            "breed": breed.strip() if breed else "Unknown",
            "gender": gender,
            "approx_age": approx_age,
            "weight": weight,
            "blood_group": blood_group,
            "created_by_vet_id": vet_id,
            "claim_status": "pending_claim",
            "claim_phone": owner_phone.strip() if owner_phone else None,
            "claim_token": claim_token,
            "claim_invited_at": datetime.now(timezone.utc).isoformat(),
        }
        res = supabase.table("pet_profiles").insert(pet_payload).execute()
        created_pet = res.data[0] if res.data else pet_payload
        created_pet["owner_name"] = owner_name or "Walk-in Pet Parent"
        created_pet["owner_phone"] = owner_phone or ""
        created_pet["is_claimed"] = False
        return created_pet

    @staticmethod
    def get_patient_detail(pet_id: str) -> Optional[dict]:
        """Fetch patient record and historical medical events for vet review."""
        res = supabase.table("pet_profiles").select("*, user_profiles(*)").eq("id", pet_id).execute()
        if not res.data:
            return None
        pet = res.data[0]
        owner = pet.get("user_profiles") or {}
        pet["owner_name"] = owner.get("full_name") or pet.get("claim_phone") or "Walk-in Pet Parent"
        pet["owner_phone"] = owner.get("phone") or pet.get("claim_phone") or ""
        pet["is_claimed"] = pet.get("claim_status") != "pending_claim" and bool(pet.get("user_id"))

        # Fetch recent medical events
        events_res = supabase.table("medical_events").select("*").eq("pet_id", pet_id).eq("is_deleted", False).order("event_date", desc=True).limit(20).execute()
        pet["medical_events"] = events_res.data or []
        return pet

    @staticmethod
    def get_claim_preview(token: str) -> Optional[dict]:
        """Validate a claim token and return preview data without requiring login."""
        res = supabase.table("pet_profiles").select("id, pet_name, pet_type, breed, approx_age, petolife_id, claim_status, claim_phone").eq("claim_token", token).execute()
        if not res.data:
            return None
        return res.data[0]

    @staticmethod
    def accept_claim(token: str, user_id: str) -> dict:
        """Assign pet to the logged-in user and mark claimed."""
        preview = PatientService.get_claim_preview(token)
        if not preview:
            raise ValueError("Invalid or expired claim link.")
        if preview.get("claim_status") == "claimed":
            return {"message": "Pet is already claimed.", "pet_id": preview["id"]}

        update_payload = {
            "user_id": user_id,
            "claim_status": "claimed",
            "claim_token": None,  # invalidate token after claim
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        res = supabase.table("pet_profiles").update(update_payload).eq("id", preview["id"]).execute()
        return {"message": "Pet successfully claimed and linked to your profile!", "pet": res.data[0] if res.data else None}
