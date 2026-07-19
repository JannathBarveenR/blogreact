# backend/app/timeline/schemas/reminder.py
from __future__ import annotations
from typing import Optional, Literal
from datetime import date, time
from pydantic import BaseModel, Field

ReminderType = Literal[
    "vaccination","deworming","anti_tick","medication_end","follow_up",
    "medication","vet_visit","grooming","weight_check","custom",
    "monitoring","conditional",
]

class ReminderCreate(BaseModel):
    title: str = Field(..., max_length=100)
    type: ReminderType
    description: Optional[str] = Field(None, max_length=300)
    due_date: date
    due_time: Optional[time] = None
    priority: Literal["high","medium","low"] = "medium"
    repeat_type: Literal["none","daily","weekly","bi_weekly","monthly",
                         "quarterly","bi_annually","annually","custom"] = "none"
    custom_repeat_interval: Optional[int] = None
    custom_repeat_unit: Optional[Literal["days","weeks","months"]] = None
    end_repeat_type: Literal["never","after_count","on_date"] = "never"
    end_repeat_date: Optional[date] = None
    end_repeat_count: Optional[int] = None
    linked_event_id: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=300)

class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[ReminderType] = None
    description: Optional[str] = None
    due_date: Optional[date] = None
    due_time: Optional[time] = None
    priority: Optional[Literal["high","medium","low"]] = None
    repeat_type: Optional[str] = None
    custom_repeat_interval: Optional[int] = None
    custom_repeat_unit: Optional[str] = None
    end_repeat_type: Optional[str] = None
    end_repeat_date: Optional[date] = None
    end_repeat_count: Optional[int] = None
    linked_event_id: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None
