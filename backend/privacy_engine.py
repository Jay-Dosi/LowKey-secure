from typing import List, Tuple

# Risk Constants
RISK_HIGH = "HIGH"
RISK_MEDIUM = "MEDIUM"
RISK_LOW = "LOW"

# Risk Keywords Mapping
# Normalized (lowercase) keywords to detect
HIGH_RISK_KEYWORDS = [
    "aadhaar", "national id", "passport", "driver", "license", "dl",
    "upi", "bank", "account number", "ifsc", "credit card", "debit card",
    "home address", "permanent address", "residential address",
    "phone", "mobile", "contact number", "whatsapp",
    "biometric", "fingerprint", "face id",
    "student id", "roll number", "registration number", "ssn","student_id",
    "salary", "income", "ctc", "tax", "pan card",
    "health", "medical", "disease", "disability", "blood group",
    "password", "pin", "secret", "cvv"
]

MEDIUM_RISK_KEYWORDS = [
    "name", "full name", "first name", "last name",
    "email", "personal email", "gmail", "outlook",
    "social media", "linkedin", "twitter", "x.com", "instagram", "facebook", "discord", "telegram",
    "github", "gitlab", "portfolio", "website", "blog",
    "workplace", "company", "internship", "job",
    "dob", "date of birth", "birth date", "age",
    "gender", "sex", "caste", "religion",
    "t-shirt", "size", "diet", "food", "preferences"
]

def classify_field_risk(label: str) -> str:
    """
    Classify a single custom field label into a risk category.
    """
    normalized = label.lower().strip()
    
    # Check High Risk
    for keyword in HIGH_RISK_KEYWORDS:
        if keyword in normalized:
            return RISK_HIGH
            
    # Check Medium Risk
    for keyword in MEDIUM_RISK_KEYWORDS:
        if keyword in normalized:
            return RISK_MEDIUM
            
    # Default Low Risk
    return RISK_LOW

def calculate_aggregate_risk(attributes: List[str], custom_fields: List[dict] = []) -> Tuple[str, str]:
    """
    Calculate the overall risk level for an event based on requested attributes
    and custom fields.
    
    Args:
        attributes: List of predefined attribute keys (e.g. ['name', 'email'])
        custom_fields: List of dicts with 'label' key
        
    Returns:
        (risk_level, risk_message)
    """
    risk_level = RISK_LOW
    message = "🛡️ Safe. Anonymous eligibility check only."
    
    has_high = False
    has_medium = False
    
    # 1. Analyze Predefined Attributes
    # Mapping predefined attributes to risk (assuming standard names)
    for attr in attributes:
        r = classify_field_risk(attr)
        if r == RISK_HIGH:
            has_high = True
        elif r == RISK_MEDIUM:
            has_medium = True
            
    # 2. Analyze Custom Fields
    for field in custom_fields:
        label = field.get('label', '')
        r = classify_field_risk(label)
        if r == RISK_HIGH:
            has_high = True
        elif r == RISK_MEDIUM:
            has_medium = True
            
    # 3. Determine Overall Risk
    if has_high:
        risk_level = RISK_HIGH
        message = "❗ This request exposes CRITICAL sensitive personal data (e.g. ID, Phone, Address)."
    elif has_medium:
        risk_level = RISK_MEDIUM
        message = "⚠️ This request exposes personally identifiable information (Name, Email, etc)."
        
    return risk_level, message
