from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime



class UserCreate(BaseModel):
    username: Optional[str] = None
    password: str
    role: str # 'admin', 'club', 'student'
    # PII fields (optional for admin, required for student/club in frontend)
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    year: Optional[str] = None
    branch: Optional[str] = None


class UserUpdate(BaseModel):
    """Admin can update any field"""
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    year: Optional[str] = None
    branch: Optional[str] = None
    role: Optional[str] = None # Admin can change roles? Maybe safer to restrict.
    # We won't allow updating username or password here for now unless requested.

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int
    username: str

class CredentialIssue(BaseModel):
    student_username: str
    attributes: Dict[str, Any]

class CredentialOut(BaseModel):
    id: int
    data: Dict[str, Any]
    signature: str
    issuer_id: int
    created_at: datetime
    class Config:
        from_attributes = True



class CustomFieldCreate(BaseModel):
    label: str
    field_type: str # text, number, dropdown, etc.
    required: bool = False
    options: Optional[List[str]] = None # For dropdowns
    placeholder: Optional[str] = None

class CustomFieldOut(CustomFieldCreate):
    id: int
    event_id: int
    risk_level: str
    class Config:
        from_attributes = True

class RequestCreate(BaseModel):
    event_name: str
    event_description: Optional[str] = None
    requested_attributes: List[str]
    allowed_years: List[str] = []
    expiry_date: datetime
    custom_fields: List[CustomFieldCreate] = [] # NEW

class RequestUpdate(BaseModel):
    event_name: Optional[str] = None
    event_description: Optional[str] = None
    requested_attributes: Optional[List[str]] = None
    allowed_years: Optional[List[str]] = None
    expiry_date: Optional[datetime] = None
    custom_fields: Optional[List[CustomFieldCreate]] = None # Allow updating custom fields

class ApprovalAction(BaseModel):
    action: str # 'APPROVE', 'REJECT'
    comment: Optional[str] = None

class RequestOut(BaseModel):
    id: int
    club_id: int
    club_name: Optional[str] = None
    event_name: str
    event_description: Optional[str]
    requested_attributes: List[str]
    risk_level: str
    risk_message: str
    status: str
    allowed_years: List[str]
    admin_comment: Optional[str]
    created_at: datetime
    expiry_date: Optional[datetime] = None
    custom_fields: List[CustomFieldOut] = [] # NEW
    class Config:
        from_attributes = True


class CustomFieldResponseCreate(BaseModel):
    field_id: int
    response_value: str

class CustomFieldResponseOut(BaseModel):
    field_id: int
    field_label: str
    response_value: str
    class Config:
        from_attributes = True


class UserProfile(BaseModel):
    id: int
    username: str
    role: str
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    year: Optional[str] = None
    branch: Optional[str] = None
    created_at: Optional[datetime] = None # Added for Admin view
    
    class Config:
        from_attributes = True


class ConsentRequest(BaseModel):
    custom_responses: List[CustomFieldResponseCreate] = []

class AccessLogOut(BaseModel):
    id: int
    timestamp: datetime
    anonymized_token: Optional[str]
    consented_attrs: Optional[List[str]] = [] # NEW: Show PII if consented
    user: Optional[UserProfile] = None # Helper for frontend to show user details if authorized
    custom_responses: List[CustomFieldResponseOut] = [] # NEW
    
    class Config:
        from_attributes = True


# ── Privacy Report Schemas ─────────────────────────────────────────────

class PrivacyMetricsOut(BaseModel):
    """Aggregated monthly privacy metrics for a student."""
    month: str
    total_events: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    unique_org_count: int
    repeated_high_attr_count: int
    cumulative_risk_score: int
    exposure_entropy_score: float
    risk_velocity: float

    class Config:
        from_attributes = True


class RuleAnalysis(BaseModel):
    """Rule-based risk advisory output."""
    risk_band: str  # "Low", "Moderate", or "High"
    flags: List[str]
    recommendations: List[str]


class PrivacyReportOut(BaseModel):
    """Full privacy report returned to the student."""
    metrics: PrivacyMetricsOut
    rule_analysis: RuleAnalysis
    ai_summary: str
