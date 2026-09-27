import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import User, Scheme, Application, ApplicationStatusHistory
from ..schemas import ApplicationIn, StatusUpdateIn
from ..deps import get_current_user

router = APIRouter(prefix="/api/applications", tags=["Applications"])

def out(a):
    return {"id": a.id, "user_id": a.user_id, "scheme_id": a.scheme_id, "scheme_name": a.scheme_name, "application_reference": a.application_reference, "status": a.status, "application_data": a.application_data or {}, "notes": a.notes, "submitted_at": a.submitted_at, "reviewed_at": a.reviewed_at, "status_history": [{"status": h.status, "timestamp": h.timestamp} for h in a.status_history]}

@router.get("/{user_id}")
def get_apps(user_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    rows = db.query(Application).options(joinedload(Application.status_history)).filter(Application.user_id == user_id).order_by(Application.created_at.desc()).all()
    return [out(a) for a in rows]

@router.post("")
def create_app(data: ApplicationIn, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    user_id = data.user_id or current.id
    scheme = db.get(Scheme, data.scheme_id)
    if not scheme: raise HTTPException(404, "Scheme not found")
    ref = "MSME-" + uuid.uuid4().hex[:10].upper()
    a = Application(user_id=user_id, scheme_id=scheme.id, scheme_name=scheme.name, application_reference=ref, status="submitted", application_data=data.application_data)
    db.add(a); db.flush(); db.add(ApplicationStatusHistory(application_id=a.id, status="submitted")); db.commit(); db.refresh(a)
    return out(a)

@router.delete("/{application_id}")
def delete_app(application_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    a = db.get(Application, application_id)
    if not a: raise HTTPException(404,"Application not found")
    if a.status not in ("draft", "submitted"): raise HTTPException(400,"Application cannot be withdrawn at this stage")
    db.delete(a); db.commit(); return {"message":"Application withdrawn"}

@router.patch("/{application_id}/status")
def update_status(application_id: str, data: StatusUpdateIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
    a = db.get(Application, application_id)
    if not a: raise HTTPException(404,"Application not found")
    a.status=data.status; a.notes=data.notes; db.add(ApplicationStatusHistory(application_id=a.id,status=data.status)); db.commit(); db.refresh(a); return out(a)
