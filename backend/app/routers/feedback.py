from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from supabase import Client
from app.utils.auth import get_current_user_id, get_user_supabase

router = APIRouter()

# Indian Standard Time (IST) offset UTC+5:30
IST = timezone(timedelta(hours=5, minutes=30))

class FeedbackCreateRequest(BaseModel):
    content: str

class FeedbackUpdateRequest(BaseModel):
    content: str

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
        return res.data
    except Exception as e:
        print(f"Error fetching feedbacks: {e}")
        return []

@router.post("")
async def create_feedback(
    body: FeedbackCreateRequest,
    auth_user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_user_supabase)
):
    """Create a new feedback entry with Indian Standard Time (IST)."""
    content = body.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Feedback content cannot be empty")

    try:
        now_ist = datetime.now(IST).isoformat()
        feedback_data = {
            "user_id": auth_user_id,
            "content": content,
            "created_at": now_ist,
            "updated_at": now_ist
        }
        res = supabase.table("feedbacks").insert(feedback_data).execute()
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to create feedback")
        return res.data[0]
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
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching feedback detail: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{feedback_id}")
async def update_feedback(
    feedback_id: str,
    body: FeedbackUpdateRequest,
    auth_user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_user_supabase)
):
    """Update feedback content with IST timestamp."""
    content = body.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Feedback content cannot be empty")

    try:
        existing = (
            supabase.table("feedbacks")
            .select("id")
            .eq("id", feedback_id)
            .eq("user_id", auth_user_id)
            .execute()
        )
        if not existing.data:
            raise HTTPException(status_code=404, detail="Feedback not found or access denied")

        now_ist = datetime.now(IST).isoformat()
        update_payload = {
            "content": content,
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
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))
