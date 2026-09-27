import os, uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Document, User
from ..config import settings
from ..deps import get_current_user

router = APIRouter(prefix="/api/documents", tags=["Documents"])
ALLOWED = {"application/pdf", "image/jpeg", "image/png", "image/webp"}

def out(d):
    return {"id": d.id, "user_id": d.user_id, "application_id": d.application_id, "document_type": d.document_type, "document_name": d.document_name, "file_path": d.file_path, "mime_type": d.mime_type, "file_size": d.file_size, "verification_status": d.verification_status, "reviewer_notes": d.reviewer_notes, "uploaded_at": d.uploaded_at, "verified_at": d.verified_at}

@router.get("/{user_id}")
def get_docs(user_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return [out(d) for d in db.query(Document).filter(Document.user_id==user_id).order_by(Document.uploaded_at.desc()).all()]

@router.post("/upload")
def upload_document(user_id: str = Form(...), document_type: str = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db), _=Depends(get_current_user)):
    if file.content_type not in ALLOWED: raise HTTPException(400,"Only PDF, JPG, PNG and WEBP files are allowed")
    data = file.file.read()
    if len(data) > settings.max_upload_mb * 1024 * 1024: raise HTTPException(413,"File is too large")
    folder = os.path.join(settings.upload_dir, user_id); os.makedirs(folder, exist_ok=True)
    ext = os.path.splitext(file.filename or "file")[1].lower() or ".bin"
    name = f"{uuid.uuid4().hex}{ext}"; path = os.path.join(folder,name)
    with open(path,"wb") as f: f.write(data)
    d = Document(user_id=user_id, document_type=document_type, document_name=file.filename or name, file_path=path, mime_type=file.content_type, file_size=len(data), verification_status="pending")
    db.add(d); db.commit(); db.refresh(d); return out(d)

@router.delete("/{document_id}")
def delete_document(document_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    d=db.get(Document,document_id)
    if not d: raise HTTPException(404,"Document not found")
    try:
        if os.path.exists(d.file_path): os.remove(d.file_path)
    except OSError: pass
    db.delete(d); db.commit(); return {"message":"Document deleted"}

@router.patch("/{document_id}/verification")
def update_verification(document_id: str, status: str = Form(...), reviewer_notes: str = Form(""), db: Session = Depends(get_db), _=Depends(get_current_user)):
    if status not in {"pending","verified","rejected"}: raise HTTPException(400,"Invalid verification status")
    d=db.get(Document,document_id)
    if not d: raise HTTPException(404,"Document not found")
    d.verification_status=status; d.reviewer_notes=reviewer_notes; d.verified_at=datetime.now(timezone.utc) if status=="verified" else None
    db.commit(); db.refresh(d); return out(d)
