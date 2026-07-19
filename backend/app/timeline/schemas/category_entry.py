# backend/app/timeline/schemas/category_entry.py
from __future__ import annotations
from typing import Literal, Optional, List, Dict, Any
from datetime import date
from pydantic import BaseModel, Field

Category = Literal[
    "diagnosis","medication","vaccination","deworming",
    "anti_tick_flea","grooming","other",
]
FormType = Literal["consultation_vitals","treatment_medication","procedure_diagnostics"]

CATEGORY_TO_FORM_TYPE: Dict[str, str] = {
    "diagnosis":      "consultation_vitals",
    "medication":     "treatment_medication",
    "vaccination":    "treatment_medication",
    "deworming":      "treatment_medication",
    "anti_tick_flea": "treatment_medication",
    "grooming":       "procedure_diagnostics",
    "other":          "procedure_diagnostics",
}

class DiagnosisSubEntry(BaseModel):
    diagnosis_category: Optional[str] = None
    diagnosis_name: str
    status: Literal["suspected","confirmed","rule_out"] = "suspected"
    clinical_notes: Optional[str] = Field(None, max_length=500)
    attachment: Optional[str] = None

class ConsultationVitalsFields(BaseModel):
    weight: Optional[float] = None
    weight_unit: Optional[Literal["kg","lbs"]] = "kg"
    temperature: Optional[float] = None
    temperature_unit: Optional[Literal["celsius","fahrenheit"]] = "celsius"
    body_condition_score: Optional[int] = Field(None, ge=1, le=9)
    heart_rate: Optional[int] = None
    respiration_rate: Optional[int] = None
    hydration: Optional[Literal["normal","abnormal"]] = None
    behaviour: Optional[Literal["normal","abnormal"]] = None
    mucous_membrane: Optional[Literal["normal","abnormal"]] = None
    diagnoses: List[DiagnosisSubEntry] = []

class InjectionDetails(BaseModel):
    route_type: Optional[Literal["iv","im","sc"]] = None
    site: Optional[str] = None

class EyeDropDetails(BaseModel):
    drops_count: Optional[int] = None
    eye: Optional[Literal["left","right","both"]] = None

class ShampooDetails(BaseModel):
    shampoo_category: Optional[str] = None
    frequency: Optional[str] = None
    duration_weeks: Optional[int] = None
    instructions: List[str] = []

class VaccineDetails(BaseModel):
    vaccine_name: Optional[str] = None
    batch_number: Optional[str] = None
    site: Optional[str] = None
    animal_type: Optional[Literal["dog","cat"]] = None   # optional; disambiguates same-named vaccines only
    auto_next_due_days: Optional[int] = None

class TreatmentMedicationFields(BaseModel):
    medicine_type: Optional[str] = None            # tablet|syrup|injection|eye_drop|ointment|shampoo|vaccine|dewormer|anti_tick
    dose: Optional[str] = None
    dose_unit: Optional[str] = None
    frequency: Optional[List[str]] = None
    food_relation: Optional[Literal["before_food","with_food","after_food"]] = None
    duration: Optional[int] = None
    duration_unit: Optional[Literal["days","weeks","months","ongoing"]] = None
    route: Optional[str] = None
    composition: Optional[str] = None
    strength: Optional[str] = None
    injection_details: Optional[InjectionDetails] = None
    eye_drop_details: Optional[EyeDropDetails] = None
    shampoo_details: Optional[ShampooDetails] = None
    vaccine_details: Optional[VaccineDetails] = None

class ProcedureDiagnosticsFields(BaseModel):
    procedure_type: Optional[str] = None
    detailed_findings: Optional[str] = None

class CategoryEntryBase(BaseModel):
    entry_id: Optional[str] = None                 # server-generated if absent
    category: Category
    form_type: Optional[FormType] = None           # auto-derived if absent
    item_name: str
    date_logged: date
    status: Optional[str] = None
    next_due_date: Optional[date] = None
    notes: Optional[str] = Field(None, max_length=1000)
    attachments: List[str] = []
    category_fields: Dict[str, Any] = {}           # validated per form_type in service
