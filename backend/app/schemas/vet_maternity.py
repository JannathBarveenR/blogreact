"""
Pydantic Schemas for Vet Platform (Online Consultation, Maternity Tracking, RBAC)
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime, date


# ============================================================================
# RBAC & USER ROLE SCHEMAS
# ============================================================================

class UserRoleAssignRequest(BaseModel):
    user_id: str
    role: str = Field(..., description="Role type: 'pet_owner', 'vet', 'supervisor', 'staff'")


class UserRoleResponse(BaseModel):
    user_id: str
    roles: List[str]


# ============================================================================
# VET PROFILE SCHEMAS
# ============================================================================

class VetProfileCreate(BaseModel):
    doctor_name: str
    specialization: Optional[str] = "General Veterinary Medicine"
    license_number: Optional[str] = None
    bio: Optional[str] = None
    clinic_name: Optional[str] = None
    city: Optional[str] = None
    calendly_url: Optional[str] = None
    consultation_fee: Optional[float] = 0.00


class VetProfileResponse(VetProfileCreate):
    id: str
    user_id: Optional[str] = None
    is_verified: bool
    is_active: bool
    created_at: datetime


# ============================================================================
# ONLINE CONSULTATION SCHEMAS (In-person removed completely)
# ============================================================================

class OnlineConsultationBookingRequest(BaseModel):
    pet_id: str
    vet_id: str
    reason_for_consultation: str
    scheduled_start_time: Optional[datetime] = None


class OnlineConsultationBookingResponse(BaseModel):
    consultation_id: str
    pet_id: str
    vet_id: str
    consultation_type: str = "online_video"
    booking_url: str
    status: str


class OnlineConsultationNotesUpdate(BaseModel):
    clinical_notes: Optional[str] = None
    prescription_summary: Optional[str] = None
    status: Optional[str] = None # 'scheduled', 'completed', 'cancelled'


class OnlineConsultationResponse(BaseModel):
    id: str
    pet_id: str
    user_id: str
    vet_id: str
    consultation_type: str = "online_video"
    calendly_event_id: Optional[str] = None
    meeting_link: Optional[str] = None
    status: str
    scheduled_start_time: datetime
    scheduled_end_time: Optional[datetime] = None
    reason_for_consultation: str
    clinical_notes: Optional[str] = None
    prescription_summary: Optional[str] = None
    created_at: datetime


# ============================================================================
# MATERNITY SCHEMAS
# ============================================================================

class MaternityRecordCreate(BaseModel):
    pet_id: str
    stage: str = Field("gestation", description="'mating', 'gestation', 'whelping', 'postpartum', 'lactation'")
    mating_date: Optional[date] = None
    expected_delivery_date: Optional[date] = None
    litter_size_expected: Optional[int] = 0
    health_notes: Optional[str] = None
    attending_vet_id: Optional[str] = None


class MaternityRecordUpdate(BaseModel):
    stage: Optional[str] = None
    actual_delivery_date: Optional[date] = None
    litter_size_actual: Optional[int] = None
    health_notes: Optional[str] = None
    ultrasound_findings: Optional[str] = None
    status: Optional[str] = None


class MaternityMilestoneCreate(BaseModel):
    milestone_date: date
    title: str
    milestone_type: str = Field(..., description="'ultrasound', 'blood_test', 'weight_check', 'deworming', 'whelping_prep', 'custom'")
    notes: Optional[str] = None
    vitals: Optional[Dict[str, Any]] = {}


class MaternityMilestoneResponse(MaternityMilestoneCreate):
    id: str
    maternity_record_id: str
    completed: bool
    created_at: datetime
