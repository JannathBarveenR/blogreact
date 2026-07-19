# backend/app/services/medical_record_service.py
"""Shared Supabase Storage upload/retrieval used by V1 medical_records.py
and V2 documents.py. Keeps bucket logic in ONE place."""

import uuid, mimetypes
from app.supabase_client import supabase

MEDICAL_BUCKET = "medical-docs"   # matches your existing V1 bucket name


class MedicalRecordService:
    @staticmethod
    def ensure_bucket():
        try:
            buckets = [b.name for b in supabase.storage.list_buckets()]
            if MEDICAL_BUCKET not in buckets:
                supabase.storage.create_bucket(MEDICAL_BUCKET, options={"public": True})
        except Exception:
            pass  # bucket already exists / race — safe to ignore

    @staticmethod
    def upload_file(file_bytes: bytes, filename: str, content_type: str | None = None):
        """Returns (public_url, storage_path). Random path avoids cache collisions."""
        MedicalRecordService.ensure_bucket()
        ext = (filename.rsplit(".", 1)[-1] if "." in filename else "bin")
        path = f"{uuid.uuid4().hex}.{ext}"
        content_type = content_type or mimetypes.guess_type(filename)[0] or "application/octet-stream"
        supabase.storage.from_(MEDICAL_BUCKET).upload(
            path, file_bytes, {"content-type": content_type, "upsert": "false"})
        public_url = supabase.storage.from_(MEDICAL_BUCKET).get_public_url(path)
        return public_url, path

    @staticmethod
    def delete_file(storage_path: str):
        try:
            supabase.storage.from_(MEDICAL_BUCKET).remove([storage_path])
        except Exception:
            pass
