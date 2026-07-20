# backend/app/routers/v2/reference_data.py
from fastapi import APIRouter, Depends
from app.utils.auth import get_current_user
from app.timeline.schemas.reference_data import ClinicCreate
from app.timeline.services.reference_data_service import ReferenceDataService as R

router = APIRouter(prefix="/api/v2/reference", tags=["v2-reference"])

@router.get("/medicines")
async def medicines(q: str = "", type: str | None = None, limit: int = 20,
                    user=Depends(get_current_user)):
    return {"medicines": R.search_medicines(q, type, limit)}

@router.get("/vaccines")
async def vaccines(animal_type: str | None = None, user=Depends(get_current_user)):
    return {"vaccines": R.get_vaccines(animal_type)}

@router.get("/shampoos")
async def shampoos(category: str | None = None, user=Depends(get_current_user)):
    return {"shampoos": R.search_shampoos(category)}

@router.get("/clinics")
async def clinics(q: str = "", limit: int = 20, user=Depends(get_current_user)):
    return {"clinics": R.search_clinics(q, limit)}

@router.post("/clinics", status_code=201)
async def add_clinic(body: ClinicCreate, user=Depends(get_current_user)):
    return R.create_clinic(body.name, body.address, body.phone, created_by=user["id"])

@router.get("/diagnoses")
async def diagnoses(category: str | None = None, user=Depends(get_current_user)):
    return {"diagnoses": R.get_diagnoses(category)}

@router.get("/injection-sites")
async def injection_sites(route: str | None = None, user=Depends(get_current_user)):
    return {"sites": R.get_injection_sites(route)}
