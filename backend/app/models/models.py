import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base

def uid() -> str:
    return str(uuid.uuid4())

def utcnow():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(150), default="")
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    language: Mapped[str] = mapped_column(String(10), default="en")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    
    profile: Mapped["BusinessProfile | None"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")

class BusinessProfile(Base):
    __tablename__ = "business_profiles"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(150), default="")
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    business_name: Mapped[str] = mapped_column(String(200), default="")
    business_type: Mapped[str] = mapped_column(String(80), default="")
    sector: Mapped[str] = mapped_column(String(100), default="")
    sub_sector: Mapped[str] = mapped_column(String(150), default="")
    investment_amount: Mapped[float] = mapped_column(Numeric(15,2), default=0)
    annual_turnover: Mapped[float] = mapped_column(Numeric(15,2), default=0)
    employee_count: Mapped[int] = mapped_column(Integer, default=0)
    state: Mapped[str] = mapped_column(String(100), default="")
    city: Mapped[str] = mapped_column(String(100), default="")
    pincode: Mapped[str] = mapped_column(String(10), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    
    user: Mapped[User] = relationship(back_populates="profile")

class CreditProfile(Base):
    __tablename__ = "credit_profiles"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)
    credit_score: Mapped[int] = mapped_column(Integer, default=0)
    credit_rating: Mapped[str] = mapped_column(String(30), default="Not Rated")
    outstanding_loans: Mapped[float] = mapped_column(Numeric(15,2), default=0)
    loan_count: Mapped[int] = mapped_column(Integer, default=0)
    annual_income: Mapped[float] = mapped_column(Numeric(15,2), default=0)
    existing_emis: Mapped[float] = mapped_column(Numeric(15,2), default=0)
    banking_partner: Mapped[str] = mapped_column(String(150), default="")
    gst_registered: Mapped[bool] = mapped_column(Boolean, default=False)
    itr_filed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

class Scheme(Base):
    __tablename__ = "schemes"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    name: Mapped[str] = mapped_column(String(200), unique=True)
    description: Mapped[str] = mapped_column(Text, default="")
    category: Mapped[str] = mapped_column(String(100), default="MSME")
    ministry: Mapped[str] = mapped_column(String(200), default="Ministry of MSME")
    benefits: Mapped[str] = mapped_column(Text, default="")
    min_credit_score: Mapped[int] = mapped_column(Integer, default=0)
    max_loan_amount: Mapped[float] = mapped_column(Numeric(15,2), default=0)
    interest_rate: Mapped[float] = mapped_column(Numeric(6,2), default=0)
    subsidy_percentage: Mapped[float] = mapped_column(Numeric(6,2), default=0)
    eligibility: Mapped[str] = mapped_column(Text, default="")
    eligibility_criteria: Mapped[list] = mapped_column(JSON, default=list)
    required_documents: Mapped[list] = mapped_column(JSON, default=list)
    application_url: Mapped[str] = mapped_column(Text, default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

class Application(Base):
    __tablename__ = "applications"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    scheme_id: Mapped[str] = mapped_column(ForeignKey("schemes.id", ondelete="RESTRICT"), index=True)
    scheme_name: Mapped[str] = mapped_column(String(200))
    application_reference: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    status: Mapped[str] = mapped_column(String(30), default="submitted")
    application_data: Mapped[dict] = mapped_column(JSON, default=dict)
    notes: Mapped[str] = mapped_column(Text, default="")
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    status_history: Mapped[list["ApplicationStatusHistory"]] = relationship(cascade="all, delete-orphan", order_by="ApplicationStatusHistory.timestamp")

class ApplicationStatusHistory(Base):
    __tablename__ = "application_status_history"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    application_id: Mapped[str] = mapped_column(ForeignKey("applications.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(30))
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

class Document(Base):
    __tablename__ = "documents"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    application_id: Mapped[str | None] = mapped_column(ForeignKey("applications.id", ondelete="SET NULL"), nullable=True, index=True)
    document_type: Mapped[str] = mapped_column(String(100))
    document_name: Mapped[str] = mapped_column(String(255))
    file_path: Mapped[str] = mapped_column(Text)
    mime_type: Mapped[str | None] = mapped_column(String(120), nullable=True)
    file_size: Mapped[int] = mapped_column(Integer, default=0)
    verification_status: Mapped[str] = mapped_column(String(30), default="pending")
    reviewer_notes: Mapped[str] = mapped_column(Text, default="")
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

class FaceVerification(Base):
    __tablename__ = "face_verifications"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(20))
    confidence_score: Mapped[float] = mapped_column(Numeric(5,2))
    liveness_check: Mapped[bool] = mapped_column(Boolean)
    image_preview: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

class RoadmapStep(Base):
    __tablename__ = "roadmap_steps"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    step_number: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(30), default="pending")
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    type: Mapped[str] = mapped_column(String(30), default="info")
    title: Mapped[str] = mapped_column(String(200))
    message: Mapped[str] = mapped_column(Text, default="")
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    reminder_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

class PredictionRecord(Base):
    __tablename__ = "prediction_records"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    predicted_score: Mapped[float] = mapped_column(Numeric(6,2))
    risk_category: Mapped[str] = mapped_column(String(40))
    confidence: Mapped[float] = mapped_column(Numeric(5,4))
    is_demo_data: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    
    explanations: Mapped[list["PredictionExplanation"]] = relationship(cascade="all, delete-orphan", back_populates="prediction")

class PredictionExplanation(Base):
    __tablename__ = "prediction_explanations"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    prediction_id: Mapped[str] = mapped_column(ForeignKey("prediction_records.id", ondelete="CASCADE"), index=True)
    feature_name: Mapped[str] = mapped_column(String(100))
    feature_value: Mapped[str] = mapped_column(String(100))
    shap_value: Mapped[float] = mapped_column(Numeric(10,4))
    impact: Mapped[str] = mapped_column(String(20))
    description: Mapped[str] = mapped_column(Text)
    
    prediction: Mapped["PredictionRecord"] = relationship(back_populates="explanations")

class SchemeRecommendationRecord(Base):
    __tablename__ = "scheme_recommendations"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    scheme_id: Mapped[str] = mapped_column(ForeignKey("schemes.id", ondelete="RESTRICT"), index=True)
    scheme_name: Mapped[str] = mapped_column(String(200))
    eligibility_status: Mapped[str] = mapped_column(String(40))
    match_score: Mapped[float] = mapped_column(Numeric(5,2))
    reasons: Mapped[list] = mapped_column(JSON, default=list)
    missing_requirements: Mapped[list] = mapped_column(JSON, default=list)
    credit_fit_notes: Mapped[str] = mapped_column(Text, default="")
    is_demo_data: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
