from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    email: EmailStr
    full_name: str
    phone: str | None = None
    language: str

class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = ""
    phone: str | None = None
    language: str = "en"

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class ProfileIn(BaseModel):
    full_name: str = ""
    phone: str | None = None
    business_name: str = ""
    business_type: str = ""
    sector: str = ""
    sub_sector: str = ""
    investment_amount: float = 0
    annual_turnover: float = 0
    employee_count: int = 0
    state: str = ""
    city: str = ""
    pincode: str = ""

class CreditIn(BaseModel):
    user_id: str | None = None
    credit_score: int = Field(default=0, ge=0, le=900)
    outstanding_loans: float = 0
    loan_count: int = 0
    annual_income: float = 0
    existing_emis: float = 0
    banking_partner: str = ""
    gst_registered: bool = False
    itr_filed: bool = False
    credit_rating: str | None = None

class ApplicationIn(BaseModel):
    user_id: str | None = None
    scheme_id: str
    scheme_name: str
    application_data: dict = {}

class StatusUpdateIn(BaseModel):
    status: str
    notes: str = ""

class NotificationIn(BaseModel):
    user_id: str | None = None
    type: str = "info"
    title: str
    message: str = ""
    reminder_date: str | None = None

class VerificationIn(BaseModel):
    user_id: str | None = None
    status: str
    confidence_score: float
    liveness_check: bool
    image_preview: str = ""

class RoadmapStatusIn(BaseModel):
    status: str

# ML & Recommendation Schemas
class CreditPredictionRequest(BaseModel):
    user_id: str | None = None
    annual_turnover: float | None = None
    annual_income: float | None = None
    existing_emis: float | None = None
    outstanding_loans: float | None = None
    loan_count: int | None = None
    business_age: int | None = None
    employee_count: int | None = None
    gst_registered: bool | None = None
    itr_filed: bool | None = None
    credit_score: int | None = None

class SHAPFactor(BaseModel):
    feature_name: str
    feature_value: str
    shap_value: float
    impact: str  # "positive", "negative", "neutral"
    description: str

class CreditPredictionResponse(BaseModel):
    prediction_id: str
    user_id: str
    predicted_score: float
    risk_category: str
    confidence: float
    is_demo_data: bool = True
    important_factors: list[SHAPFactor]
    created_at: datetime

class SchemeRecommendation(BaseModel):
    scheme_id: str
    scheme_name: str
    category: str
    eligibility_status: str  # "Eligible", "Almost Eligible", "Ineligible"
    match_score: float
    reasons: list[str]
    missing_requirements: list[str]
    credit_fit_notes: str

class UserRecommendationsResponse(BaseModel):
    user_id: str
    risk_category: str
    predicted_credit_score: float
    recommended_schemes: list[SchemeRecommendation]
    is_demo_data: bool = True
    created_at: datetime
