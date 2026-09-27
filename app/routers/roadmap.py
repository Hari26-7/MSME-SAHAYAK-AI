from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import RoadmapStep, User
from ..schemas import RoadmapStatusIn
from ..deps import get_current_user

router=APIRouter(prefix="/api/roadmap", tags=["Eligibility Roadmap"])
DEFAULTS=[
("Complete Business Profile","Add your personal and business details."),
("Verify Identity","Complete identity and face verification."),
("Upload Documents","Upload required business and financial documents."),
("Build Credit Profile","Add credit score and financial information."),
("Check Scheme Eligibility","Review schemes that match your profile."),
("Submit Application","Apply to the selected MSME scheme."),
]

def out(s): return {"id":s.id,"user_id":s.user_id,"step_number":s.step_number,"title":s.title,"description":s.description,"status":s.status,"completed_at":s.completed_at,"created_at":s.created_at}

def create_steps(user_id,db):
    for i,(title,desc) in enumerate(DEFAULTS,1): db.add(RoadmapStep(user_id=user_id,step_number=i,title=title,description=desc,status="pending"))
    db.commit()
    return db.query(RoadmapStep).filter(RoadmapStep.user_id==user_id).order_by(RoadmapStep.step_number).all()

@router.get("/{user_id}")
def get_roadmap(user_id:str,db:Session=Depends(get_db),_=Depends(get_current_user)):
    return [out(s) for s in db.query(RoadmapStep).filter(RoadmapStep.user_id==user_id).order_by(RoadmapStep.step_number).all()]

@router.post("/{user_id}/default")
def default_roadmap(user_id:str,db:Session=Depends(get_db),_=Depends(get_current_user)):
    rows=db.query(RoadmapStep).filter(RoadmapStep.user_id==user_id).order_by(RoadmapStep.step_number).all()
    if not rows: rows=create_steps(user_id,db)
    return [out(s) for s in rows]

@router.patch("/step/{step_id}")
def update_step(step_id:str,data:RoadmapStatusIn,db:Session=Depends(get_db),_=Depends(get_current_user)):
    if data.status not in {"pending","in_progress","completed"}: raise HTTPException(400,"Invalid status")
    s=db.get(RoadmapStep,step_id)
    if not s: raise HTTPException(404,"Roadmap step not found")
    s.status=data.status; s.completed_at=datetime.now(timezone.utc) if data.status=="completed" else None
    db.commit(); db.refresh(s); return out(s)
