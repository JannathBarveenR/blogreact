# backend/app/timeline/schemas/medical_event.py
from __future__ import annotations
from typing import List, Optional
from datetime import date, time
from pydantic import BaseModel, Field
from .category_entry import CategoryEntryBase

class MedicalEventCreate(BaseModel):
    event_date: date
    event_time: Optional[time] = None
    clinic_id: Optional[str] = None
    clinic_name: Optional[str] = None
    vet_name: Optional[str] = None
    visit_type: List[str] = []
    reason_for_visit: Optional[str] = Field(None, max_length=500)
    overall_notes: Optional[str] = Field(None, max_length=1000)
    follow_up_date: Optional[date] = None
    follow_up_notes: Optional[str] = Field(None, max_length=300)
    attachments: List[str] = []
    category_entries: List[CategoryEntryBase]
    force: bool = False                            # bypass dedupe "save anyway"

class MedicalEventUpdate(BaseModel):
    event_date: Optional[date] = None
    event_time: Optional[time] = None
    clinic_id: Optional[str] = None
    clinic_name: Optional[str] = None
    vet_name: Optional[str] = None
    visit_type: Optional[List[str]] = None
    reason_for_visit: Optional[str] = None
    overall_notes: Optional[str] = None
    follow_up_date: Optional[date] = None
    follow_up_notes: Optional[str] = None
    category_entries: Optional[List[CategoryEntryBase]] = None
    verification_status: Optional[str] = None      # used by Phase 2 verify; harmless in P1
