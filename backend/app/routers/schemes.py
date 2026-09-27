from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Scheme
from ..deps import get_current_user

router = APIRouter(prefix="/api/schemes", tags=["Schemes"])

def out(s: Scheme):
    return {
        "id": s.id,
        "name": s.name,
        "description": s.description,
        "category": s.category,
        "ministry": s.ministry or "Ministry of MSME",
        "benefits": s.benefits or "",
        "min_credit_score": s.min_credit_score,
        "max_loan_amount": float(s.max_loan_amount or 0),
        "interest_rate": float(s.interest_rate or 0),
        "subsidy_percentage": float(s.subsidy_percentage or 0),
        "eligibility": s.eligibility,
        "eligibility_criteria": s.eligibility_criteria or [],
        "required_documents": s.required_documents or [],
        "documents_required": s.required_documents or [],
        "application_url": s.application_url or "",
        "is_active": s.is_active
    }

@router.get("")
def get_schemes(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return [out(s) for s in db.query(Scheme).filter(Scheme.is_active == True).order_by(Scheme.name).all()]

@router.get("/{scheme_id}")
def get_scheme(scheme_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    s = db.get(Scheme, scheme_id)
    if not s:
        raise HTTPException(404, "Scheme not found")
    return out(s)
