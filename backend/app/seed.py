from sqlalchemy.orm import Session
from .models import Scheme

SCHEMES = [
    {
        "name": "Pradhan Mantri MUDRA Yojana (PMMY)",
        "description": "Collateral-free business credit support up to Rs 10 Lakhs for eligible micro enterprises under Shishu, Kishor, and Tarun categories.",
        "category": "Business Loan",
        "ministry": "Ministry of Finance",
        "benefits": "Collateral-free loan up to ₹10 Lakhs with low interest rates and flexible repayment options.",
        "min_credit_score": 600,
        "max_loan_amount": 1000000,
        "interest_rate": 8.5,
        "subsidy_percentage": 0,
        "eligibility": "Non-corporate, non-farm small/micro enterprises engaged in manufacturing, trading, or service sectors.",
        "eligibility_criteria": [
            "Indian Citizen running non-farm business",
            "Credit requirement up to ₹10 Lakhs",
            "Valid identity & address proof"
        ],
        "required_documents": ["Aadhaar Card", "PAN Card", "Bank Statement", "Business Registration"],
        "application_url": "https://www.mudra.org.in"
    },
    {
        "name": "Prime Minister's Employment Generation Programme (PMEGP)",
        "description": "Credit-linked capital subsidy scheme for setting up new micro-enterprises in manufacturing and service sectors.",
        "category": "Credit Linked Subsidy",
        "ministry": "Ministry of MSME",
        "benefits": "Capital subsidy up to 35% of total project cost for rural and special category entrepreneurs.",
        "min_credit_score": 600,
        "max_loan_amount": 2500000,
        "interest_rate": 9.0,
        "subsidy_percentage": 35,
        "eligibility": "Individuals above 18 years, SHGs, Institutions registered under Societies Registration Act.",
        "eligibility_criteria": [
            "Individual above 18 years of age",
            "At least VIII standard pass for projects above ₹10 Lakhs in manufacturing",
            "Only new projects are eligible"
        ],
        "required_documents": ["Aadhaar Card", "PAN Card", "Project Report", "Bank Statement", "Educational Certificate"],
        "application_url": "https://www.kviconline.gov.in/pmegpeportal"
    },
    {
        "name": "CGTMSE Credit Guarantee Scheme",
        "description": "Credit guarantee coverage for collateral-free loans up to Rs 5 Crore granted to micro and small enterprises by lender banks.",
        "category": "Credit Guarantee",
        "ministry": "Ministry of MSME",
        "benefits": "Collateral-free credit facility up to ₹5 Crore with up to 85% credit guarantee cover.",
        "min_credit_score": 650,
        "max_loan_amount": 50000000,
        "interest_rate": 9.5,
        "subsidy_percentage": 0,
        "eligibility": "New and existing Micro and Small Enterprises seeking bank credit without collateral.",
        "eligibility_criteria": [
            "Registered Micro or Small Enterprise (Udyam registered)",
            "Good repayment track record",
            "Viable business expansion proposal"
        ],
        "required_documents": ["Udyam Registration", "PAN Card", "Bank Statement", "Financial Statements", "Project Report"],
        "application_url": "https://www.cgtmse.in"
    },
    {
        "name": "PM Formalisation of Micro Food Processing Enterprises (PMFME)",
        "description": "Financial, technical, and business support for micro food processing units under One District One Product (ODOP) framework.",
        "category": "Food Processing",
        "ministry": "Ministry of Food Processing Industries",
        "benefits": "35% credit-linked capital subsidy with max limit of ₹10 Lakhs per unit.",
        "min_credit_score": 600,
        "max_loan_amount": 1000000,
        "interest_rate": 8.75,
        "subsidy_percentage": 35,
        "eligibility": "Existing micro food processing units, Farmer Producer Organizations (FPOs), SHGs, Producer Co-operatives.",
        "eligibility_criteria": [
            "Existing micro food unit with ownership right",
            "Applicant must be above 18 years of age",
            "ODOP product priority"
        ],
        "required_documents": ["Aadhaar Card", "Project Report", "Bank Statement", "Business Registration", "Food License (FSSAI)"],
        "application_url": "https://pmfme.mofpi.gov.in"
    },
    {
        "name": "Stand-Up India Scheme",
        "description": "Bank loans between Rs 10 Lakhs and Rs 1 Crore to at least one SC or ST borrower and at least one woman borrower per bank branch for greenfield enterprise.",
        "category": "Entrepreneurship",
        "ministry": "Ministry of Finance",
        "benefits": "Composite loan (inclusive of term loan and working capital) between ₹10 Lakhs and ₹1 Crore for greenfield projects.",
        "min_credit_score": 650,
        "max_loan_amount": 10000000,
        "interest_rate": 8.0,
        "subsidy_percentage": 0,
        "eligibility": "SC/ST and/or woman entrepreneurs above 18 years setting up greenfield (first-time) ventures.",
        "eligibility_criteria": [
            "Applicant must be SC/ST or Woman entrepreneur",
            "Greenfield project in manufacturing, services, trading",
            "Borrower should not be in default to any bank/financial institution"
        ],
        "required_documents": ["Aadhaar Card", "PAN Card", "Caste Certificate (if applicable)", "Project Report", "Bank Statement"],
        "application_url": "https://www.standupmitra.in"
    }
]

def seed_schemes(db: Session):
    for item in SCHEMES:
        existing = db.query(Scheme).filter(Scheme.name == item["name"]).first()
        if not existing:
            db.add(Scheme(**item))
        else:
            for k, v in item.items():
                setattr(existing, k, v)
    db.commit()
