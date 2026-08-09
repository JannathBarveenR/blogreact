import uuid
import json
from fastapi import APIRouter, HTTPException, Depends, Form, File, UploadFile, Request
from pydantic import BaseModel
from typing import List, Optional, Union
from datetime import datetime, timezone, timedelta
from supabase import Client
from app.utils.auth import get_current_user_id, get_user_supabase
from app.s3_client import (
    upload_public_file,
    get_feedback_bucket,
    process_upload_image_bytes,
    resolve_feedback_image_urls,
)

router = APIRouter()

# Indian Standard Time (IST) offset UTC+5:30
IST = timezone(timedelta(hours=5, minutes=30))

class FeedbackCreateRequest(BaseModel):
    content: str
    image_urls: Optional[dict] = {}

class FeedbackUpdateRequest(BaseModel):
    content: str
    image_urls: Optional[dict] = {}

@router.get("")
async def get_all_feedbacks(
    auth_user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_user_supabase)
):
    """Fetch all feedbacks submitted by the logged-in user, ordered by creation date (newest first)."""
    try:
        res = (
            supabase.table("feedbacks")
            .select("*")
            .eq("user_id", auth_user_id)
            .order("created_at", desc=True)
            .execute()
        )
        res_data = res.data or []
        for item in res_data:
            item["image_urls"] = resolve_feedback_image_urls(item.get("image_urls"))
        return res_data
    except Exception as e:
        print(f"Error fetching feedbacks: {e}")
        return []

@router.post("")
async def create_feedback(
    request: Request,
    auth_user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_user_supabase)
):
    """
    Create a new feedback entry. Accepts both multipart/form-data (with image files)
    and standard JSON.
    """
    content = ""
    uploaded_image_dict = {}

    content_type = request.headers.get("content-type", "")
    if "multipart/form-data" in content_type:
        form = await request.form()
        content = str(form.get("content", "")).strip()
        files = form.getlist("images")
        
        # If files are present, upload to S3 feedbacks bucket
        if files:
            bucket_name = get_feedback_bucket()
            img_index = 1
            for file_item in files:
                fname = getattr(file_item, "filename", None)
                if fname:
                    file_bytes = await file_item.read()
                    if file_bytes:
                        raw_ct = getattr(file_item, "content_type", None) or ""
                        proc_bytes, proc_filename, proc_ct = process_upload_image_bytes(file_bytes, fname, raw_ct)
                        
                        ext = proc_filename.rsplit(".", 1)[-1] if "." in proc_filename else "jpg"
                        s3_filename = f"feedback_{uuid.uuid4().hex[:12]}.{ext}"
                        
                        s3_url = upload_public_file(proc_bytes, bucket_name, s3_filename, proc_ct)
                        print(f"[Feedback Upload] Uploaded image {img_index} to S3 bucket '{bucket_name}': {s3_url}")
                        uploaded_image_dict[f"image{img_index}"] = s3_url
                        img_index += 1
    else:
        # Standard JSON body
        body = await request.json()
        content = str(body.get("content", "")).strip()
        uploaded_image_dict = body.get("image_urls", {})

    if not content:
        raise HTTPException(status_code=400, detail="Feedback content cannot be empty")

    try:
        now_ist = datetime.now(IST).isoformat()
        feedback_data = {
            "user_id": auth_user_id,
            "content": content,
            "image_urls": uploaded_image_dict,
            "created_at": now_ist,
            "updated_at": now_ist
        }
        res = supabase.table("feedbacks").insert(feedback_data).execute()
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to create feedback")
        
        created_item = res.data[0]
        created_item["image_urls"] = resolve_feedback_image_urls(created_item.get("image_urls"))
        return created_item
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{feedback_id}")
async def get_feedback_detail(
    feedback_id: str,
    auth_user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_user_supabase)
):
    """Fetch details of a single feedback entry owned by the user."""
    try:
        res = (
            supabase.table("feedbacks")
            .select("*")
            .eq("id", feedback_id)
            .eq("user_id", auth_user_id)
            .execute()
        )
        if not res.data:
            raise HTTPException(status_code=404, detail="Feedback not found")
        
        detail_item = res.data[0]
        detail_item["image_urls"] = resolve_feedback_image_urls(detail_item.get("image_urls"))
        return detail_item
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching feedback detail: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{feedback_id}")
async def update_feedback(
    feedback_id: str,
    request: Request,
    auth_user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_user_supabase)
):
    """Update feedback content and optional screenshot images."""
    existing = (
        supabase.table("feedbacks")
        .select("*")
        .eq("id", feedback_id)
        .eq("user_id", auth_user_id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Feedback not found or access denied")

    content = ""
    image_dict = {}

    content_type = request.headers.get("content-type", "")
    if "multipart/form-data" in content_type:
        form = await request.form()
        content = str(form.get("content", "")).strip()
        
        # Existing images passed as JSON string
        existing_json_str = form.get("existing_image_urls")
        if existing_json_str:
            try:
                image_dict = json.loads(existing_json_str) if isinstance(existing_json_str, str) else existing_json_str
            except Exception:
                image_dict = {}

        new_files = form.getlist("images")
        if new_files:
            bucket_name = get_feedback_bucket()
            img_index = len(image_dict) + 1
            for file_item in new_files:
                fname = getattr(file_item, "filename", None)
                if fname:
                    file_bytes = await file_item.read()
                    if file_bytes:
                        raw_ct = getattr(file_item, "content_type", None) or ""
                        proc_bytes, proc_filename, proc_ct = process_upload_image_bytes(file_bytes, fname, raw_ct)
                        
                        ext = proc_filename.rsplit(".", 1)[-1] if "." in proc_filename else "jpg"
                        s3_filename = f"feedback_{uuid.uuid4().hex[:12]}.{ext}"
                        
                        s3_url = upload_public_file(proc_bytes, bucket_name, s3_filename, proc_ct)
                        print(f"[Feedback Update] Uploaded image {img_index} to S3 bucket '{bucket_name}': {s3_url}")
                        image_dict[f"image{img_index}"] = s3_url
                        img_index += 1
    else:
        body = await request.json()
        content = str(body.get("content", "")).strip()
        image_dict = body.get("image_urls", existing.data[0].get("image_urls", {}))

    if not content:
        raise HTTPException(status_code=400, detail="Feedback content cannot be empty")

    try:
        now_ist = datetime.now(IST).isoformat()
        update_payload = {
            "content": content,
            "image_urls": image_dict,
            "updated_at": now_ist
        }
        res = (
            supabase.table("feedbacks")
            .update(update_payload)
            .eq("id", feedback_id)
            .eq("user_id", auth_user_id)
            .execute()
        )
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to update feedback")
        
        updated_item = res.data[0]
        updated_item["image_urls"] = resolve_feedback_image_urls(updated_item.get("image_urls"))
        return updated_item
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{feedback_id}")
async def delete_feedback(
    feedback_id: str,
    auth_user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_user_supabase)
):
    """Delete a feedback entry owned by the user."""
    try:
        res = (
            supabase.table("feedbacks")
            .delete()
            .eq("id", feedback_id)
            .eq("user_id", auth_user_id)
            .execute()
        )
        return {"status": "success", "message": "Feedback deleted successfully"}
    except Exception as e:
        print(f"Error deleting feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))
