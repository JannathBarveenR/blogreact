from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date
from app.supabase_client import supabase as global_supabase
from app.utils.auth import get_current_user_id, get_user_supabase
from supabase import Client

router = APIRouter()

class TaskLogRequest(BaseModel):
    task_id: int
    task_title: str = ""
    completed: bool
    date: str # YYYY-MM-DD

@router.get("/{pet_id}")
async def get_checklist(
    pet_id: str, 
    date: str,
    auth_user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_user_supabase)
):
    """Fetch all task logs for a pet on a specific date."""
    try:
        # 1. Check Ownership using the user-scoped client or global (user-scoped is safer for RLS)
        pet = supabase.table("pet_profiles").select("user_id").eq("id", pet_id).execute()
        if not pet.data or pet.data[0].get("user_id") != auth_user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        res = supabase.table("daily_task_logs").select("*").eq("pet_id", pet_id).eq("date", date).execute()
        return res.data
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching checklist: {e}")
        return [] # Return empty list if table missing or error

@router.post("/{pet_id}")
async def update_checklist(
    pet_id: str, 
    body: TaskLogRequest,
    auth_user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_user_supabase)
):
    """Update a task log and update streaks."""
    try:
        # 1. Check Ownership
        pet = supabase.table("pet_profiles").select("user_id").eq("id", pet_id).execute()
        if not pet.data or pet.data[0].get("user_id") != auth_user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        # Upsert the daily task log
        log_data = {
            "pet_id": pet_id,
            "task_id": body.task_id,
            "task_title": body.task_title,
            "completed": body.completed,
            "date": body.date,
            "updated_at": datetime.now().isoformat()
        }
        # Check if exists to determine if we update or insert
        existing = supabase.table("daily_task_logs").select("*").eq("pet_id", pet_id).eq("task_id", body.task_id).eq("date", body.date).execute()
        if existing.data:
            supabase.table("daily_task_logs").update({"completed": body.completed, "task_title": body.task_title, "updated_at": datetime.now().isoformat()}).eq("id", existing.data[0]["id"]).execute()
        else:
            supabase.table("daily_task_logs").insert(log_data).execute()
        
        # Streak logic placeholder
        try:
             # Basic streak fetch
             streak = supabase.table("pet_streaks").select("*").eq("pet_id", pet_id).execute()
             # If we wanted to update it, we'd do it here. 
        except Exception:
             pass

        return {"message": "Checklist updated"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating checklist: {e}")
        raise HTTPException(status_code=400, detail=str(e))
