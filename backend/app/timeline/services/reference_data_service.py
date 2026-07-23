# backend/app/timeline/services/reference_data_service.py
from app.supabase_client import supabase

DIAGNOSIS_TAXONOMY = {
    "respiratory": ["Kennel Cough", "Pneumonia"],
    "gastrointestinal": ["Gastritis", "Vomiting"],
    "dermatological": ["Pyoderma"],
    "musculoskeletal": ["Arthritis"],
    "neurological": ["Epilepsy"],
    "general": ["Fever"],
}
INJECTION_SITES = {
    "iv": ["Cephalic Vein", "Saphenous Vein", "Jugular Vein"],
    "im": ["Epaxial Muscles", "Quadriceps", "Hamstrings", "Triceps"],
    "sc": ["Scruff", "Flank", "Lateral Thorax"],
}

class ReferenceDataService:
    @staticmethod
    def search_medicines(query: str = "", type_filter: str | None = None, limit: int = 20):
        q = supabase.table("medicine_database").select("*")
        if type_filter:
            q = q.eq("medicine_type", type_filter)
        if query:
            q = q.ilike("brand_name", f"%{query}%")
        return (q.limit(limit).execute().data) or []

    @staticmethod
    def get_vaccines(animal_type: str | None = None):
        # animal_type is optional. Omit it to return all vaccines (the form can
        # show the full list and let the user pick; no pet species is required).
        q = supabase.table("vaccine_database").select("*")
        if animal_type:
            q = q.eq("animal_type", animal_type)
        return (q.execute().data) or []

    @staticmethod
    def search_shampoos(category: str | None = None):
        q = supabase.table("shampoo_database").select("*")
        if category:
            q = q.eq("category", category)
        return (q.execute().data) or []

    @staticmethod
    def search_clinics(query: str = "", limit: int = 20):
        q = supabase.table("clinic_database").select("*")
        if query:
            q = q.ilike("name", f"%{query}%")
        return (q.limit(limit).execute().data) or []

    @staticmethod
    def create_clinic(name: str, address=None, phone=None, created_by=None):
        row = {"name": name, "address": address, "phone": phone, "created_by": created_by}
        return supabase.table("clinic_database").insert(row).execute().data[0]

    @staticmethod
    def get_diagnoses(category: str | None = None):
        if category:
            return DIAGNOSIS_TAXONOMY.get(category, [])
        return DIAGNOSIS_TAXONOMY

    @staticmethod
    def get_injection_sites(route: str | None = None):
        if route:
            return INJECTION_SITES.get(route, [])
        return INJECTION_SITES
