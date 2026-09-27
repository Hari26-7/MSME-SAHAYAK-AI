from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import FaceVerification, User
from ..schemas import VerificationIn
from ..deps import get_current_user

router=APIRouter(prefix="/api/face-verification", tags=["Face Verification"])

def out(v):
    return {"id":v.id,"user_id":v.user_id,"status":v.status,"confidence_score":float(v.confidence_score),"liveness_check":v.liveness_check,"image_preview":v.image_preview,"created_at":v.created_at}

@router.get("/{user_id}")
def get_verifications(user_id:str, db:Session=Depends(get_db), _=Depends(get_current_user)):
    return [out(v) for v in db.query(FaceVerification).filter(FaceVerification.user_id==user_id).order_by(FaceVerification.created_at.desc()).all()]

@router.post("")
def create_verification(data:VerificationIn, db:Session=Depends(get_db), current:User=Depends(get_current_user)):
    v=FaceVerification(user_id=data.user_id or current.id,status=data.status,confidence_score=data.confidence_score,liveness_check=data.liveness_check,image_preview=data.image_preview[:100])
    db.add(v); db.commit(); db.refresh(v); return out(v)
