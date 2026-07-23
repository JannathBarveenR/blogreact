# backend/app/routers/v2/documents.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.utils.auth import get_current_user
from app.services.pet_service import PetService
from app.timeline.services.document_service import DocumentService

router = APIRouter(prefix="/api/v2/pets", tags=["v2-documents"])
def _guard(pet_id, user):
    if not PetService.verify_ownership(pet_id, user["id"]):
        raise HTTPException(404, "Pet not found")

@router.post("/{pet_id}/documents", status_code=201)
async def upload_doc(pet_id: str, label: str = Form(...), event_id: str | None = Form(None),
                     file: UploadFile = File(...), user=Depends(get_current_user)):
    _guard(pet_id, user)
    b = await file.read()
    return DocumentService.upload_document(pet_id, b, file.filename, file.content_type, label, event_id)

@router.get("/{pet_id}/documents")
async def list_docs(pet_id: str, event_id: str | None = None, user=Depends(get_current_user)):
    _guard(pet_id, user)
    return {"documents": DocumentService.list_documents(pet_id, event_id)}

@router.delete("/{pet_id}/documents/{doc_id}")
async def delete_doc(pet_id: str, doc_id: str, user=Depends(get_current_user)):
    _guard(pet_id, user)
    if not DocumentService.delete_document(pet_id, doc_id):
        raise HTTPException(404, "Document not found")
    return {"deleted": True}
