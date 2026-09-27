import shap
import pandas as pd
from .credit_model import get_or_train_model
from .feature_engineering import FEATURE_NAMES

EXPLAINER = None

FEATURE_LABELS = {
    "credit_score": "Bureau Credit Score",
    "annual_turnover": "Annual Business Turnover",
    "annual_income": "Annual Owner Income",
    "gst_registered": "GST Compliance",
    "itr_filed": "Income Tax Filing Status",
    "debt_to_income": "Debt-to-Income Ratio",
    "outstanding_loans": "Total Outstanding Loans",
    "business_age": "Business Operational History",
    "employee_count": "Workforce Scale",
    "existing_emis": "Current Monthly EMIs",
    "loan_count": "Active Loan Count",
    "loan_to_turnover": "Loan-to-Turnover Ratio"
}

def get_explainer():
    global EXPLAINER
    if EXPLAINER is not None:
        return EXPLAINER
    model = get_or_train_model()
    EXPLAINER = shap.TreeExplainer(model)
    return EXPLAINER

def explain_prediction(features_df: pd.DataFrame) -> list[dict]:
    explainer = get_explainer()
    X = features_df[FEATURE_NAMES]
    
    shap_vals = explainer.shap_values(X)
    if isinstance(shap_vals, list):
        shap_vals = shap_vals[0]
        
    vals = shap_vals[0]
    
    factors = []
    for idx, feature in enumerate(FEATURE_NAMES):
        val = vals[idx]
        feature_val = X.iloc[0][feature]
        
        if feature in ["gst_registered", "itr_filed"]:
            formatted_val = "Yes" if feature_val == 1 else "No"
        elif feature in ["annual_turnover", "annual_income", "outstanding_loans", "existing_emis"]:
            formatted_val = f"₹{feature_val:,.0f}"
        elif feature == "debt_to_income":
            formatted_val = f"{feature_val:.2%}"
        else:
            formatted_val = str(feature_val)
            
        impact = "positive" if val > 0.5 else ("negative" if val < -0.5 else "neutral")
        
        label = FEATURE_LABELS.get(feature, feature.replace("_", " ").title())
        
        if impact == "positive":
            desc = f"{label} of {formatted_val} positively boosts credit assessment."
        elif impact == "negative":
            desc = f"{label} of {formatted_val} increases financial risk weight."
        else:
            desc = f"{label} of {formatted_val} maintains baseline risk expectation."
            
        factors.append({
            "feature_name": label,
            "feature_value": formatted_val,
            "shap_value": round(float(val), 4),
            "impact": impact,
            "description": desc
        })
        
    # Sort factors by magnitude of SHAP impact
    factors.sort(key=lambda x: abs(x["shap_value"]), reverse=True)
    return factors[:6]
