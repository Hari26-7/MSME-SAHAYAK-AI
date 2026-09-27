from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, CreditProfile
from ..schemas import CreditIn
from ..deps import get_current_user

router = APIRouter(prefix="/api/credit", tags=["Credit"])

def rating(score: int):
    if score >= 750: return "Excellent"
    if score >= 700: return "Good"
    if score >= 650: return "Fair"
    if score >= 600: return "Needs Improvement"
    return "Poor"

def out(p):
    return {"id": p.id, "user_id": p.user_id, "credit_score": p.credit_score, "credit_rating": p.credit_rating, "outstanding_loans": float(p.outstanding_loans or 0), "loan_count": p.loan_count, "annual_income": float(p.annual_income or 0), "existing_emis": float(p.existing_emis or 0), "banking_partner": p.banking_partner, "gst_registered": p.gst_registered, "itr_filed": p.itr_filed, "created_at": p.created_at, "updated_at": p.updated_at}

@router.get("/{user_id}")
def get_credit(user_id: str, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    p = db.query(CreditProfile).filter(CreditProfile.user_id == user_id).first()
    return out(p) if p else None

@router.post("")
def save_credit(data: CreditIn, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    user_id = data.user_id or current.id
    p = db.query(CreditProfile).filter(CreditProfile.user_id == user_id).first()
    if not p:
        p = CreditProfile(user_id=user_id); db.add(p)
    values = data.model_dump(exclude={"user_id","credit_rating"})
    for k,v in values.items(): setattr(p,k,v)
    p.credit_rating = data.credit_rating or rating(data.credit_score)
    db.commit(); db.refresh(p)
    return out(p)
