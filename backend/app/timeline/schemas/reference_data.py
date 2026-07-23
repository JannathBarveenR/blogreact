# backend/app/timeline/schemas/reference_data.py
from typing import Optional
from pydantic import BaseModel

class ClinicCreate(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
