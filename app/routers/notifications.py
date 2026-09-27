from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Notification, User
from ..schemas import NotificationIn
from ..deps import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

def parse_date(v):
    if not v: return None
    try: return datetime.fromisoformat(v).replace(tzinfo=timezone.utc)
    except ValueError: raise HTTPException(400,"reminder_date must be YYYY-MM-DD or ISO date")

def out(n):
    return {"id":n.id,"user_id":n.user_id,"type":n.type,"title":n.title,"message":n.message,"is_read":n.is_read,"reminder_date":n.reminder_date,"created_at":n.created_at}

@router.get("/{user_id}")
def get_notifications(user_id: str, db: Session=Depends(get_db), _=Depends(get_current_user)):
    return [out(n) for n in db.query(Notification).filter(Notification.user_id==user_id).order_by(Notification.created_at.desc()).all()]

@router.post("")
def create_notification(data: NotificationIn, db: Session=Depends(get_db), current: User=Depends(get_current_user)):
    user_id=data.user_id or current.id
    n=Notification(user_id=user_id,type=data.type,title=data.title,message=data.message,reminder_date=parse_date(data.reminder_date))
    db.add(n); db.commit(); db.refresh(n); return out(n)

@router.patch("/{notification_id}/read")
def mark_read(notification_id: str, db: Session=Depends(get_db), _=Depends(get_current_user)):
    n=db.get(Notification,notification_id)
    if not n: raise HTTPException(404,"Notification not found")
    n.is_read=True; db.commit(); return out(n)

@router.patch("/user/{user_id}/read-all")
def mark_all(user_id: str, db: Session=Depends(get_db), _=Depends(get_current_user)):
    db.query(Notification).filter(Notification.user_id==user_id, Notification.is_read==False).update({Notification.is_read:True})
    db.commit(); return {"message":"All notifications marked as read"}

@router.delete("/{notification_id}")
def delete_notification(notification_id: str, db: Session=Depends(get_db), _=Depends(get_current_user)):
    n=db.get(Notification,notification_id)
    if not n: raise HTTPException(404,"Notification not found")
    db.delete(n); db.commit(); return {"message":"Notification deleted"}
