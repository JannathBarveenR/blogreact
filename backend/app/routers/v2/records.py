# backend/app/routers/v2/records.py
"""
Unified Medical Records Router.

Two upload endpoints, both writing to the same `medical_records` table
with a `log` flag differentiating the two record types.

  POST  /api/v2/pets/{pet_id}/records
        Raw standalone upload — log=0
        (replaces old POST /api/medical-records/upload)

  POST  /api/v2/pets/{pet_id}/medical-events/{event_id}/records
        Timeline-linked upload — log=1
        Also appends the new record ID into medical_events.document_ids
        (replaces old POST /api/v2/pets/{pet_id}/documents)

Read / Management:
  GET    /api/v2/pets/{pet_id}/records                      — list records
  GET    /api/v2/pets/{pet_id}/records/{record_id}          — single record (fresh URL)
  DELETE /api/v2/pets/{pet_id}/records/{record_id}          — delete (S3 + DB + event cleanup)
  PATCH  /api/v2/pets/{pet_id}/records/{record_id}/favorite — toggle is_favorite (log=0 use)
"""

from typing import Optional, List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.services.medical_record_service import MedicalRecordService
from app.services.pet_service import PetService
from app.supabase_client import supabase_admin as db
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/v2/pets", tags=["v2-records"])

_MAX_BYTES = 10 * 1024 * 1024  # 10 MB


def _guard(pet_id: str, user: dict) -> None:
    """Verify the authenticated user owns the given pet."""
    if not PetService.verify_ownership(pet_id, user["id"]):
        raise HTTPException(status_code=404, detail="Pet not found")

async def _process_files(file: Optional[UploadFile], files: Optional[List[UploadFile]], base_name: str) -> tuple[bytes, str, str]:
    """Helper to process file(s) into final bytes, safe_name, and content_type."""
    if not files and not file:
        raise HTTPException(status_code=400, detail="No files provided")
    
    upload_list = files if files else [file]
    if len(upload_list) == 1:
        f = upload_list[0]
        data = await f.read()
        if len(data) > _MAX_BYTES:
            raise HTTPException(status_code=400, detail="File exceeds 10 MB limit")
        safe_name = (f.filename or "document").replace(" ", "_")
        return data, safe_name, f.content_type
    else:
        # Multiple files: Read all, check limit, convert to PDF
        total_size = 0
        image_bytes_list = []
        for f in upload_list:
            data = await f.read()
            total_size += len(data)
            if total_size > _MAX_BYTES:
                raise HTTPException(status_code=400, detail="Total size exceeds 10 MB limit")
            image_bytes_list.append(data)
            
        try:
            pdf_bytes = MedicalRecordService.convert_images_to_pdf(image_bytes_list)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to convert images to PDF: {str(e)}")
            
        final_name = base_name.strip() if base_name and base_name.strip() else "document"
        safe_name = f"{final_name.replace(' ', '_')}.pdf"
        return pdf_bytes, safe_name, "application/pdf"

# =============================================================================
# UPLOAD ENDPOINT 1 — Raw standalone record (log=0)
# =============================================================================
@router.post("/{pet_id}/records", status_code=201)
async def upload_raw_record(
    pet_id: str,
    title: str = Form(...),
    category: str = Form("Other"),
    notes: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    files: Optional[List[UploadFile]] = File(None),
    user=Depends(get_current_user),
):
    """
    Upload a standalone medical document (prescription, lab report, scan, etc.).
    Stored with log=0. No event link.

    Form fields:
      title     — record name (required)
      category  — one of: Prescription, Lab Reports, Vaccination, Deworming,
                           Deticking, Anti-rabies, Treatment, Pet Diary, Other  (default: Other)
      notes     — optional free-text notes
      file      — single document (PDF / image, max 10 MB)
      files     — multiple images (compiled to PDF, max 10 MB combined)
    """
    _guard(pet_id, user)

    data, safe_name, content_type = await _process_files(file, files, base_name=title)

    record = MedicalRecordService.save_record(
        pet_id,
        user["id"],
        data,
        safe_name,
        content_type,
        title=title,
        category=category,
        notes=notes,
    )
    return {"record": record}


# =============================================================================
# UPLOAD ENDPOINT 2 — Timeline-linked record (log=1)
# =============================================================================
@router.post("/{pet_id}/medical-events/{event_id}/records", status_code=201)
async def upload_event_record(
    pet_id: str,
    event_id: str,
    label: str = Form(...),
    category: str = Form("Other"),
    file: Optional[UploadFile] = File(None),
    files: Optional[List[UploadFile]] = File(None),
    user=Depends(get_current_user),
):
    """
    Upload a document attached to a specific timeline log entry.
    Stored with log=1 and event_id set.
    Also appends the new medical_records.id to medical_events.document_ids.

    Form fields:
      label     — document label (e.g. "Vet Prescription / Report") (required)
      category  — optional category hint (default: Other)
      file      — the document (PDF / image, max 10 MB)
    """
    _guard(pet_id, user)

    # Verify the event exists and belongs to this pet
    ev_res = (
        db.table("medical_events")
        .select("id, document_ids")
        .eq("id", event_id)
        .eq("pet_id", pet_id)
        .execute()
    )
    if not ev_res.data:
        raise HTTPException(
            status_code=404, detail="Medical event not found for this pet"
        )
    event_data = ev_res.data[0]

    data, safe_name, content_type = await _process_files(file, files, base_name=label)

    record = MedicalRecordService.save_record(
        pet_id,
        user["id"],
        data,
        safe_name,
        content_type,
        event_id=event_id,
        label=label,
        category=category,
    )

    # Append new record ID to medical_events.document_ids
    existing_ids: list = ev_res.data[0].get("document_ids") or []
    existing_ids.append(record["id"])
    db.table("medical_events").update({"document_ids": existing_ids}).eq(
        "id", event_id
    ).execute()

    return {"record": record}


# =============================================================================
# LIST RECORDS
# =============================================================================
@router.get("/{pet_id}/records")
async def list_records(
    pet_id: str,
    log: Optional[int] = None,
    event_id: Optional[str] = None,
    user=Depends(get_current_user),
):
    """
    List medical records for a pet.

    Query params:
      log       — 0 (raw only) · 1 (timeline-linked only) · omit for all
      event_id  — filter by a specific event
    """
    _guard(pet_id, user)

    q = db.table("medical_records").select("*").eq("pet_profile_id", pet_id)
    if log is not None:
        q = q.eq("log", log)
    if event_id:
        q = q.eq("event_id", event_id)

    rows = (q.order("created_at", desc=True).execute().data) or []
    return [MedicalRecordService.refresh_url_in_record(r) for r in rows]


# =============================================================================
# SINGLE RECORD (with fresh presigned URL)
# =============================================================================
@router.get("/{pet_id}/records/{record_id}")
async def get_record(
    pet_id: str,
    record_id: str,
    user=Depends(get_current_user),
):
    """Fetch a single record with a freshly generated presigned URL."""
    _guard(pet_id, user)

    rows = (
        db.table("medical_records")
        .select("*")
        .eq("id", record_id)
        .eq("pet_profile_id", pet_id)
        .execute()
        .data
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Record not found")

    return MedicalRecordService.refresh_url_in_record(rows[0])


# =============================================================================
# DELETE RECORD
# =============================================================================
@router.delete("/{pet_id}/records/{record_id}")
async def delete_record(
    pet_id: str,
    record_id: str,
    user=Depends(get_current_user),
):
    """
    Delete a record:
      1. Removes the S3 object.
      2. If log=1, removes the record ID from medical_events.document_ids.
      3. Deletes the DB row.
    """
    _guard(pet_id, user)

    rows = (
        db.table("medical_records")
        .select("id, storage_path, log, event_id")
        .eq("id", record_id)
        .eq("pet_profile_id", pet_id)
        .execute()
        .data
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Record not found")

    rec = rows[0]

    # If this was a timeline-linked record, clean up event's document_ids
    if rec.get("log") == 1 and rec.get("event_id"):
        ev = (
            db.table("medical_events")
            .select("document_ids")
            .eq("id", rec["event_id"])
            .execute()
            .data
        )
        if ev:
            cleaned = [
                rid
                for rid in (ev[0].get("document_ids") or [])
                if rid != record_id
            ]
            db.table("medical_events").update({"document_ids": cleaned}).eq(
                "id", rec["event_id"]
            ).execute()

    # Delete from S3
    MedicalRecordService.delete_file(rec["storage_path"])

    # Delete DB row
    db.table("medical_records").delete().eq("id", record_id).execute()

    return {"deleted": True}


# =============================================================================
# TOGGLE FAVORITE (primarily for log=0 raw records)
# =============================================================================
@router.patch("/{pet_id}/records/{record_id}/favorite")
async def toggle_favorite(
    pet_id: str,
    record_id: str,
    user=Depends(get_current_user),
):
    """Toggle the is_favorite flag on a record."""
    _guard(pet_id, user)

    rows = (
        db.table("medical_records")
        .select("id, is_favorite")
        .eq("id", record_id)
        .eq("pet_profile_id", pet_id)
        .execute()
        .data
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Record not found")

    new_fav = not rows[0].get("is_favorite", False)
    updated = (
        db.table("medical_records")
        .update({"is_favorite": new_fav})
        .eq("id", record_id)
        .execute()
        .data
    )
    return {"is_favorite": new_fav, "record": updated[0] if updated else None}
