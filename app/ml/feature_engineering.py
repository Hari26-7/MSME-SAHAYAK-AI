import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from ..models import User, BusinessProfile, CreditProfile

FEATURE_NAMES = [
    "annual_turnover",
    "annual_income",
    "existing_emis",
    "outstanding_loans",
    "loan_count",
    "business_age",
    "employee_count",
    "gst_registered",
    "itr_filed",
    "credit_score",
    "debt_to_income",
    "loan_to_turnover"
]

def extract_user_features(user_id: str, db: Session, override_data: dict | None = None) -> pd.DataFrame:
    override_data = override_data or {}
    
    b_profile = db.query(BusinessProfile).filter(BusinessProfile.user_id == user_id).first()
    c_profile = db.query(CreditProfile).filter(CreditProfile.user_id == user_id).first()
    
    annual_turnover = float(override_data.get("annual_turnover") if override_data.get("annual_turnover") is not None else (b_profile.annual_turnover if b_profile else 0))
    annual_income = float(override_data.get("annual_income") if override_data.get("annual_income") is not None else (c_profile.annual_income if c_profile else annual_turnover * 0.25))
    existing_emis = float(override_data.get("existing_emis") if override_data.get("existing_emis") is not None else (c_profile.existing_emis if c_profile else 0))
    outstanding_loans = float(override_data.get("outstanding_loans") if override_data.get("outstanding_loans") is not None else (c_profile.outstanding_loans if c_profile else 0))
    loan_count = int(override_data.get("loan_count") if override_data.get("loan_count") is not None else (c_profile.loan_count if c_profile else 0))
    business_age = int(override_data.get("business_age") if override_data.get("business_age") is not None else 3)
    employee_count = int(override_data.get("employee_count") if override_data.get("employee_count") is not None else (b_profile.employee_count if b_profile else 1))
    
    gst_val = override_data.get("gst_registered")
    if gst_val is None:
        gst_registered = 1 if (c_profile and c_profile.gst_registered) else 0
    else:
        gst_registered = 1 if gst_val else 0
        
    itr_val = override_data.get("itr_filed")
    if itr_val is None:
        itr_filed = 1 if (c_profile and c_profile.itr_filed) else 0
    else:
        itr_filed = 1 if itr_val else 0
        
    credit_score = int(override_data.get("credit_score") if override_data.get("credit_score") is not None else (c_profile.credit_score if (c_profile and c_profile.credit_score > 0) else 680))
    
    debt_to_income = (existing_emis * 12.0) / (annual_income + 1.0)
    loan_to_turnover = outstanding_loans / (annual_turnover + 1.0)
    
    features = {
        "annual_turnover": annual_turnover,
        "annual_income": annual_income,
        "existing_emis": existing_emis,
        "outstanding_loans": outstanding_loans,
        "loan_count": loan_count,
        "business_age": business_age,
        "employee_count": employee_count,
        "gst_registered": gst_registered,
        "itr_filed": itr_filed,
        "credit_score": credit_score,
        "debt_to_income": debt_to_income,
        "loan_to_turnover": loan_to_turnover
    }
    
    return pd.DataFrame([features])[FEATURE_NAMES]
