from datetime import datetime, timezone
from sqlalchemy.orm import Session
from ..models import User, PredictionRecord, PredictionExplanation
from .feature_engineering import extract_user_features
from .credit_model import predict_credit_risk
from .explainer import explain_prediction

def run_credit_prediction(user_id: str, db: Session, input_override: dict | None = None) -> dict:
    features_df = extract_user_features(user_id, db, input_override)
    
    pred_score, risk_category, confidence = predict_credit_risk(features_df)
    
    shap_factors = explain_prediction(features_df)
    
    # Save PredictionRecord to Database
    pred_record = PredictionRecord(
        user_id=user_id,
        predicted_score=pred_score,
        risk_category=risk_category,
        confidence=confidence,
        is_demo_data=True
    )
    db.add(pred_record)
    db.flush()
    
    # Save PredictionExplanations to Database
    for factor in shap_factors:
        db.add(PredictionExplanation(
            prediction_id=pred_record.id,
            feature_name=factor["feature_name"],
            feature_value=factor["feature_value"],
            shap_value=factor["shap_value"],
            impact=factor["impact"],
            description=factor["description"]
        ))
        
    db.commit()
    db.refresh(pred_record)
    
    return {
        "prediction_id": pred_record.id,
        "user_id": user_id,
        "predicted_score": pred_score,
        "risk_category": risk_category,
        "confidence": confidence,
        "is_demo_data": True,
        "important_factors": shap_factors,
        "created_at": pred_record.created_at
    }
