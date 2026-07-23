# backend/app/services/pet_service.py
"""Shared pet data access. Used by V1 routers/pet_profile.py AND V2.
Reuses the existing pet_profiles table. Maps V2 field names onto the
existing V1 columns so a pet's DOB/breed are never stored twice."""

from app.supabase_client import supabase


class PetService:
    TABLE = "pet_profiles"

    @staticmethod
    def get_all_user_pets(user_id: str):
        res = (supabase.table(PetService.TABLE)
               .select("*").eq("user_id", user_id)
               .order("created_at", desc=True).execute())
        return res.data or []

    @staticmethod
    def get_pet_by_id(pet_id: str):
        res = supabase.table(PetService.TABLE).select("*").eq("id", pet_id).execute()
        return res.data[0] if res.data else None

    @staticmethod
    def verify_ownership(pet_id: str, user_id: str) -> bool:
        pet = PetService.get_pet_by_id(pet_id)
        return bool(pet) and str(pet.get("user_id")) == str(user_id)

    @staticmethod
    def update_v2_fields(pet_id: str, *, pet_type=None, breed=None,
                         date_of_birth=None, health_conditions=None):
        """V2 profile edits. Maps date_of_birth->birth_date, breed->breed,
        pet_type->pet_type (all existing V1 columns). Only health_conditions
        is a new column. There is NO species field."""
        payload = {}
        if pet_type is not None:           payload["pet_type"] = pet_type
        if breed is not None:              payload["breed"] = breed
        if date_of_birth is not None:      payload["birth_date"] = date_of_birth
        if health_conditions is not None:  payload["health_conditions"] = health_conditions
        if not payload:
            return PetService.get_pet_by_id(pet_id)
        res = (supabase.table(PetService.TABLE)
               .update(payload).eq("id", pet_id).execute())
        return res.data[0] if res.data else None
