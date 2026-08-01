# backend/app/services/medical_record_service.py
"""
Unified Medical Record Service.
Single entry point for all file operations (upload, delete, presigned-URL refresh).
Used by both upload paths:
  - log=0  (raw standalone upload via POST /api/v2/pets/{pet_id}/records)
  - log=1  (timeline-linked upload via POST /api/v2/pets/{pet_id}/medical-events/{event_id}/records)
"""

import uuid
import mimetypes
from app.supabase_client import supabase_admin as db
from app.s3_client import (
    upload_private_file,
    get_presigned_url,
    delete_file as s3_delete_file,
    AWS_MEDICAL_DOCS_BUCKET,
)


class MedicalRecordService:

    # ── S3 Helpers ────────────────────────────────────────────────

    @staticmethod
    def upload_file(
        file_bytes: bytes, filename: str, content_type: str | None = None
    ) -> tuple[str, str]:
        """
        Upload bytes to the private S3 bucket.
        Returns (presigned_url, storage_path).
        The presigned URL is valid for 1 hour; use fresh_url() to regenerate it on read.
        """
        ext = filename.rsplit(".", 1)[-1] if "." in filename else "bin"
        path = f"{uuid.uuid4().hex}.{ext}"
        content_type = (
            content_type
            or mimetypes.guess_type(filename)[0]
            or "application/octet-stream"
        )
        storage_path = upload_private_file(
            file_bytes, AWS_MEDICAL_DOCS_BUCKET, path, content_type
        )
        presigned_url = get_presigned_url(AWS_MEDICAL_DOCS_BUCKET, storage_path)
        return presigned_url, storage_path

    @staticmethod
    def fresh_url(storage_path: str) -> str:
        """Generate a fresh 1-hour presigned URL for an existing S3 object."""
        return get_presigned_url(AWS_MEDICAL_DOCS_BUCKET, storage_path)

    @staticmethod
    def delete_file(storage_path: str) -> None:
        """Delete a file from S3. Logs but does not raise on failure."""
        try:
            s3_delete_file(AWS_MEDICAL_DOCS_BUCKET, storage_path)
        except Exception as e:
            print(f"[MedicalRecordService] S3 delete failed for {storage_path}: {e}")

    # ── DB Helpers ────────────────────────────────────────────────

    @staticmethod
    def refresh_url_in_record(record: dict) -> dict:
        """Return a copy of the record dict with a freshly signed file_url."""
        r = dict(record)
        if r.get("storage_path"):
            r["file_url"] = MedicalRecordService.fresh_url(r["storage_path"])
        return r

    # ── Unified Save ──────────────────────────────────────────────

    @staticmethod
    def save_record(
        pet_id: str,
        user_id: str | None,
        file_bytes: bytes,
        filename: str,
        content_type: str | None,
        *,
        # Raw upload fields (log=0)
        title: str | None = None,
        category: str = "Other",
        notes: str | None = None,
        # Timeline-linked fields (log=1)
        event_id: str | None = None,
        label: str | None = None,
    ) -> dict:
        """
        Upload file to S3 and insert a row into medical_records.

        log is automatically derived:
          event_id=None  →  log=0  (raw standalone upload)
          event_id set   →  log=1  (attached to a medical_events row)

        File metadata (filename, size, MIME type) is stored by S3 natively on
        the object itself and is NOT duplicated in the database.

        Returns the inserted DB row.
        """
        presigned_url, storage_path = MedicalRecordService.upload_file(
            file_bytes, filename, content_type
        )

        log = 1 if event_id else 0
        resolved_title = title or label or filename or "Medical Record"

        row: dict = {
            "pet_profile_id": pet_id,
            "log": log,
            "title": resolved_title,
            "category": category or "Other",
            "file_url": presigned_url,
            "storage_path": storage_path,
        }
        if user_id:
            row["user_id"] = user_id
        if notes:
            row["notes"] = notes
        if event_id:
            row["event_id"] = event_id
        if label:
            row["label"] = label

        result = db.table("medical_records").insert(row).execute()
        return result.data[0]
