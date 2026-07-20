# backend/app/timeline/services/document_service.py
from app.supabase_client import supabase
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
        return supabase.table("medical_documents").insert(row).execute().data[0]

    @staticmethod
    def list_documents(pet_id: str, event_id: str | None = None):
        q = supabase.table("medical_documents").select("*").eq("pet_id", pet_id)
        if event_id:
            q = q.eq("event_id", event_id)
        return (q.order("uploaded_at", desc=True).execute().data) or []

    @staticmethod
    def delete_document(pet_id: str, doc_id: str):
        rows = (supabase.table("medical_documents").select("storage_path")
                .eq("id", doc_id).eq("pet_id", pet_id).execute().data)
        if not rows: return False
        MedicalRecordService.delete_file(rows[0]["storage_path"])
        supabase.table("medical_documents").delete().eq("id", doc_id).execute()
        return True
