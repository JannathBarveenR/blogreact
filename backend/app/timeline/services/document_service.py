# backend/app/timeline/services/document_service.py
from app.supabase_client import supabase_admin as supabase
from app.services.medical_record_service import MedicalRecordService

class DocumentService:
    @staticmethod
    def upload_document(pet_id: str, file_bytes: bytes, filename: str,
                        content_type: str, label: str, event_id: str | None = None):
        url, path = MedicalRecordService.upload_file(file_bytes, filename, content_type)
        row = {
            "pet_id": pet_id,
            "event_id": event_id,
            "file_url": url,
            "file_type": content_type,
            "label": label,
            "storage_path": path
        }
        try:
            res = supabase.table("medical_documents").insert(row).execute()
            if res.data:
                return res.data[0]
        except Exception as e:
            print(f"[DocumentService] medical_documents insert failed: {e}, falling back to medical_records")

        rec_row = {
            "pet_profile_id": pet_id,
            "title": label or filename,
            "category": "Prescription",
            "file_url": url,
            "file_type": content_type,
            "storage_path": path
        }
        res_rec = supabase.table("medical_records").insert(rec_row).execute()
        return res_rec.data[0] if res_rec.data else {}

    @staticmethod
    def list_documents(pet_id: str, event_id: str | None = None):
        try:
            q = supabase.table("medical_documents").select("*").eq("pet_id", pet_id)
            if event_id:
                q = q.eq("event_id", event_id)
            res = q.order("uploaded_at", desc=True).execute()
            if res.data is not None:
                return res.data
        except Exception as e:
            print(f"[DocumentService] medical_documents list failed: {e}, falling back to medical_records")

        try:
            q = supabase.table("medical_records").select("*").eq("pet_profile_id", pet_id)
            recs = (q.order("created_at", desc=True).execute().data) or []
            return [{
                "id": r.get("id"),
                "pet_id": r.get("pet_profile_id"),
                "event_id": r.get("event_id"),
                "file_url": r.get("file_url"),
                "file_type": r.get("file_type"),
                "label": r.get("title") or r.get("file_name"),
                "storage_path": r.get("storage_path"),
                "uploaded_at": r.get("created_at"),
            } for r in recs]
        except Exception as e2:
            print(f"[DocumentService] medical_records list fallback failed: {e2}")
            return []

    @staticmethod
    def delete_document(pet_id: str, doc_id: str):
        try:
            rows = (supabase.table("medical_documents").select("storage_path")
                    .eq("id", doc_id).eq("pet_id", pet_id).execute().data)
            if rows:
                MedicalRecordService.delete_file(rows[0]["storage_path"])
                supabase.table("medical_documents").delete().eq("id", doc_id).execute()
                return True
        except Exception:
            pass
        try:
            rows = (supabase.table("medical_records").select("storage_path")
                    .eq("id", doc_id).eq("pet_profile_id", pet_id).execute().data)
            if rows:
                MedicalRecordService.delete_file(rows[0]["storage_path"])
                supabase.table("medical_records").delete().eq("id", doc_id).execute()
                return True
        except Exception:
            pass
        return False
