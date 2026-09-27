from sqlalchemy.orm import Session
from ..models import User, BusinessProfile, CreditProfile, Scheme, Document, PredictionRecord, SchemeRecommendationRecord

def evaluate_scheme_recommendations(user_id: str, db: Session) -> dict:
    b_profile = db.query(BusinessProfile).filter(BusinessProfile.user_id == user_id).first()
    c_profile = db.query(CreditProfile).filter(CreditProfile.user_id == user_id).first()
    user_docs = [d.document_type for d in db.query(Document).filter(Document.user_id == user_id).all()]
    latest_pred = db.query(PredictionRecord).filter(PredictionRecord.user_id == user_id).order_by(PredictionRecord.created_at.desc()).first()
    
    credit_score = c_profile.credit_score if (c_profile and c_profile.credit_score > 0) else (float(latest_pred.predicted_score) if latest_pred else 680)
    risk_cat = latest_pred.risk_category if latest_pred else ("Low Risk" if credit_score >= 740 else ("Moderate Risk" if credit_score >= 650 else "High Risk"))
    
    schemes = db.query(Scheme).filter(Scheme.is_active == True).all()
    
    recommendations = []
    
    for s in schemes:
        reasons = []
        missing = []
        score = 60
        
        # Credit Score match
        if credit_score >= s.min_credit_score:
            score += 20
            reasons.append(f"Credit score ({int(credit_score)}) meets scheme requirement (min {s.min_credit_score})")
        else:
            score -= 20
            missing.append(f"Credit score ({int(credit_score)}) is below scheme threshold ({s.min_credit_score})")
            
        # Sector / Business Type match
        if b_profile:
            if b_profile.sector:
                score += 10
                reasons.append(f"Business sector ({b_profile.sector}) matches scheme focus")
            if b_profile.business_type:
                score += 10
                reasons.append(f"Business scale ({b_profile.business_type}) is eligible")
                
        # Compliance check
        if c_profile:
            if c_profile.gst_registered:
                reasons.append("GST Compliance verified")
            elif "GST Certificate" in (s.required_documents or []):
                missing.append("GST Registration Certificate required")
                
            if c_profile.itr_filed:
                reasons.append("ITR Filing record verified")
            elif "ITR Document" in (s.required_documents or []):
                missing.append("ITR Tax Filing Document required")
                
        # Documents match check
        req_docs = s.required_documents or []
        for rd in req_docs:
            if rd not in user_docs:
                missing.append(f"Document missing: {rd}")
            else:
                reasons.append(f"Document verified: {rd}")
                
        match_score = max(10.0, min(98.0, float(score)))
        
        if match_score >= 75.0:
            status = "Eligible"
        elif match_score >= 45.0:
            status = "Almost Eligible"
        else:
            status = "Ineligible"
            
        fit_notes = f"Risk Profile: {risk_cat}. Predicted Score: {int(credit_score)}. "
        if status == "Eligible":
            fit_notes += "Strong financial profile for application submission."
        elif status == "Almost Eligible":
            fit_notes += "Fulfil remaining missing requirements to optimize approval odds."
        else:
            fit_notes += "Profile requires credit and documentation enhancement."
            
        rec_obj = SchemeRecommendation(
            scheme_id=s.id,
            scheme_name=s.name,
            category=s.category,
            eligibility_status=status,
            match_score=match_score,
            reasons=reasons,
            missing_requirements=missing,
            credit_fit_notes=fit_notes
        )
        recommendations.append(rec_obj)
        
        # Persist to database
        db.add(SchemeRecommendationRecord(
            user_id=user_id,
            scheme_id=s.id,
            scheme_name=s.name,
            eligibility_status=status,
            match_score=match_score,
            reasons=reasons,
            missing_requirements=missing,
            credit_fit_notes=fit_notes,
            is_demo_data=True
        ))
        
    db.commit()
    
    # Sort recommendations by match_score descending
    recommendations.sort(key=lambda x: x.match_score, reverse=True)
    
    return {
        "user_id": user_id,
        "risk_category": risk_cat,
        "predicted_credit_score": float(credit_score),
        "recommended_schemes": recommendations,
        "is_demo_data": True
    }

class SchemeRecommendation:
    def __init__(self, scheme_id, scheme_name, category, eligibility_status, match_score, reasons, missing_requirements, credit_fit_notes):
        self.scheme_id = scheme_id
        self.scheme_name = scheme_name
        self.category = category
        self.eligibility_status = eligibility_status
        self.match_score = match_score
        self.reasons = reasons
        self.missing_requirements = missing_requirements
        self.credit_fit_notes = credit_fit_notes
