# backend/app/routers/v2/export.py
from fastapi import APIRouter, Depends, HTTPException, Response
from app.utils.auth import get_current_user
from app.services.pet_service import PetService
from app.timeline.services.export_service import ExportService

router = APIRouter(prefix="/api/v2/pets", tags=["v2-export"])
def _guard(pet_id, user):
    if not PetService.verify_ownership(pet_id, user["id"]):
        raise HTTPException(404, "Pet not found")

@router.get("/{pet_id}/export/csv")
async def export_csv(pet_id: str, user=Depends(get_current_user)):
    _guard(pet_id, user)
    content = ExportService.generate_csv(pet_id)
    return Response(content, media_type="text/csv", headers={
        "Content-Disposition": f"attachment; filename=pet_{pet_id}_history.csv"
    })

@router.get("/{pet_id}/export/pdf")
async def export_pdf(pet_id: str, user=Depends(get_current_user)):
    _guard(pet_id, user)
    content = ExportService.generate_pdf(pet_id)
    return Response(content, media_type="application/pdf", headers={
        "Content-Disposition": f"attachment; filename=pet_{pet_id}_history.pdf"
    })
