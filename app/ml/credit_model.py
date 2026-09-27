import os
import numpy as np
import pandas as pd
import lightgbm as lgb
from .feature_engineering import FEATURE_NAMES

MODEL = None

def generate_demo_dataset(n_samples=1000, random_seed=42):
    np.random.seed(random_seed)
    
    annual_turnover = np.random.uniform(200000, 50000000, n_samples)
    annual_income = annual_turnover * np.random.uniform(0.15, 0.40, n_samples)
    existing_emis = (annual_income / 12.0) * np.random.uniform(0.0, 0.6, n_samples)
    outstanding_loans = annual_turnover * np.random.uniform(0.0, 0.8, n_samples)
    loan_count = np.random.randint(0, 5, n_samples)
    business_age = np.random.randint(1, 20, n_samples)
    employee_count = np.random.randint(1, 50, n_samples)
    gst_registered = np.random.choice([0, 1], size=n_samples, p=[0.2, 0.8])
    itr_filed = np.random.choice([0, 1], size=n_samples, p=[0.25, 0.75])
    credit_score = np.random.randint(350, 850, n_samples)
    
    debt_to_income = (existing_emis * 12.0) / (annual_income + 1.0)
    loan_to_turnover = outstanding_loans / (annual_turnover + 1.0)
    
    # Synthetic target calculation (Demonstration Risk Model)
    base_score = 600.0 + (credit_score - 600) * 0.4
    base_score += (gst_registered * 30) + (itr_filed * 35) + min(business_age * 4, 40)
    base_score -= (debt_to_income * 60) + (loan_to_turnover * 40) + (loan_count * 10)
    
    target_score = np.clip(base_score, 300.0, 900.0)
    
    df = pd.DataFrame({
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
        "loan_to_turnover": loan_to_turnover,
        "target_score": target_score
    })
    return df

def get_or_train_model():
    global MODEL
    if MODEL is not None:
        return MODEL
        
    demo_df = generate_demo_dataset()
    X = demo_df[FEATURE_NAMES]
    y = demo_df["target_score"]
    
    model = lgb.LGBMRegressor(
        n_estimators=100,
        learning_rate=0.05,
        max_depth=5,
        random_state=42,
        verbosity=-1
    )
    model.fit(X, y)
    MODEL = model
    return MODEL

def predict_credit_risk(features_df: pd.DataFrame):
    model = get_or_train_model()
    pred_score = float(model.predict(features_df[FEATURE_NAMES])[0])
    pred_score = round(max(300.0, min(900.0, pred_score)), 2)
    
    if pred_score >= 740:
        risk_category = "Low Risk"
        confidence = 0.94
    elif pred_score >= 650:
        risk_category = "Moderate Risk"
        confidence = 0.88
    else:
        risk_category = "High Risk"
        confidence = 0.82
        
    return pred_score, risk_category, confidence
