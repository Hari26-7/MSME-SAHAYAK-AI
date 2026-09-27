from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, BusinessProfile
from ..schemas import RegisterIn, LoginIn, TokenOut, UserOut
from ..security import hash_password, verify_password, create_access_token
from ..deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/register", response_model=TokenOut)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(400, "Email already registered")
    user = User(email=data.email, password_hash=hash_password(data.password), full_name=data.full_name, phone=data.phone, language=data.language)
    db.add(user); db.flush()
    db.add(BusinessProfile(user_id=user.id, full_name=data.full_name, phone=data.phone))
    db.commit(); db.refresh(user)
    return {"access_token": create_access_token(user.id), "user": user}

@router.post("/login", response_model=TokenOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")
    return {"access_token": create_access_token(user.id), "user": user}

@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
