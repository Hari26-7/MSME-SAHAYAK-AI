from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, BusinessProfile
from ..schemas import ProfileIn
from ..deps import get_current_user

router = APIRouter(prefix="/api/profile", tags=["Profile"])

def serialize(p: BusinessProfile, u: User):
    return {"id": p.id, "user_id": u.id, "email": u.email, "full_name": p.full_name or u.full_name, "phone": p.phone or u.phone, "business_name": p.business_name, "business_type": p.business_type, "sector": p.sector, "sub_sector": p.sub_sector, "investment_amount": float(p.investment_amount or 0), "annual_turnover": float(p.annual_turnover or 0), "employee_count": p.employee_count, "state": p.state, "city": p.city, "pincode": p.pincode, "language": u.language}

@router.get("/{user_id}")
def get_profile(user_id: str, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    p = db.query(BusinessProfile).filter(BusinessProfile.user_id == user_id).first()
    if not p:
        p = BusinessProfile(user_id=user_id, full_name=current.full_name, phone=current.phone); db.add(p); db.commit(); db.refresh(p)
    return serialize(p, db.get(User, user_id) or current)

@router.put("/{user_id}")
def update_profile(user_id: str, data: ProfileIn, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    p = db.query(BusinessProfile).filter(BusinessProfile.user_id == user_id).first()
    if not p:
        p = BusinessProfile(user_id=user_id); db.add(p)
    values = data.model_dump()
    for k,v in values.items(): setattr(p,k,v)
    u = db.get(User, user_id) or current
    u.full_name = data.full_name
    u.phone = data.phone
    db.commit(); db.refresh(p)
    return serialize(p,u)
