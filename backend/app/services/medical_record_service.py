# backend/app/services/medical_record_service.py
"""Shared Supabase Storage upload/retrieval used by V1 medical_records.py
and V2 documents.py. Keeps bucket logic in ONE place."""

import uuid, mimetypes
from app.s3_client import upload_private_file, get_presigned_url, delete_file as s3_delete_file, AWS_MEDICAL_DOCS_BUCKET


class MedicalRecordService:
    @staticmethod
    def ensure_bucket():
        # AWS bucket exists and is managed via infrastructure
        pass

    @staticmethod
    def upload_file(file_bytes: bytes, filename: str, content_type: str | None = None):
        """Returns (presigned_url, storage_path). Random path avoids cache collisions."""
        ext = (filename.rsplit(".", 1)[-1] if "." in filename else "bin")
        path = f"{uuid.uuid4().hex}.{ext}"
        content_type = content_type or mimetypes.guess_type(filename)[0] or "application/octet-stream"
        
        # Uploads to private bucket
        storage_path = upload_private_file(file_bytes, AWS_MEDICAL_DOCS_BUCKET, path, content_type)
        
        # Generate temporary presigned URL for immediate frontend use/return
        public_url = get_presigned_url(AWS_MEDICAL_DOCS_BUCKET, storage_path)
        return public_url, storage_path

    @staticmethod
    def delete_file(storage_path: str):
        try:
            s3_delete_file(AWS_MEDICAL_DOCS_BUCKET, storage_path)
        except Exception as e:
            print(f"Failed to delete {storage_path} from S3: {e}")
