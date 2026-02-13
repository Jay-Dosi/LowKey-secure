from sqlalchemy import Column, Integer, String, Boolean, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timedelta, timezone

# IST offset: UTC+5:30
IST = timezone(timedelta(hours=5, minutes=30))

def get_ist_now():
    """Get current IST timestamp (Asia/Kolkata, UTC+5:30)"""
    return datetime.now(IST).replace(tzinfo=None)  # Store as naive IST



class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String) # 'admin', 'club', 'student'
    
    # PII fields for students and leads
    name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    year = Column(String, nullable=True)  # For students: "1", "2", "3", "4"
    branch = Column(String, nullable=True)  # Major/Department

    credentials = relationship("Credential", back_populates="owner", foreign_keys="[Credential.user_id]", cascade="all, delete-orphan")
    requests_created = relationship("AccessRequest", back_populates="creator", cascade="all, delete-orphan")
    access_logs = relationship("AccessLog", back_populates="user", cascade="all, delete-orphan")
    audits = relationship("ApprovalAudit", back_populates="admin", cascade="all, delete-orphan")


class Credential(Base):
    __tablename__ = "credentials"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    data = Column(JSON) # The signed payload
    signature = Column(String)
    issuer_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=get_ist_now)

    owner = relationship("User", back_populates="credentials", foreign_keys=[user_id])

class AccessRequest(Base):
    __tablename__ = "access_requests"

    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("users.id"))
    event_name = Column(String)
    event_description = Column(String, nullable=True)  # Event description
    requested_attributes = Column(JSON) # List of strings
    risk_level = Column(String) # 'HIGH', 'LOW'
    risk_message = Column(String)
    
    # New fields
    status = Column(String, default="PENDING") # PENDING, APPROVED, REJECTED
    allowed_years = Column(JSON, default=list) # List of allowed years ["1", "2"]
    admin_comment = Column(String, nullable=True)
    created_at = Column(DateTime, default=get_ist_now)
    expiry_date = Column(DateTime, nullable=True)  # Event expiry date

    custom_fields = relationship("EventCustomField", back_populates="event", cascade="all, delete-orphan")

    creator = relationship("User", back_populates="requests_created")
    logs = relationship("AccessLog", back_populates="request")
    audits = relationship("ApprovalAudit", back_populates="request")


class ApprovalAudit(Base):
    __tablename__ = "approval_audits"
    
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("access_requests.id"))
    admin_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String) # APPROVE, REJECT
    comment = Column(String, nullable=True)
    timestamp = Column(DateTime, default=get_ist_now)
    
    request = relationship("AccessRequest", back_populates="audits")
    admin = relationship("User", back_populates="audits")

class AccessLog(Base):
    __tablename__ = "access_logs"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("access_requests.id"))
    # In a real anon system, we don't store user_id. We store a signature or blinded token.
    # For this MVP, we will make user_id nullable and store a proof_signature.
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) 
    anonymized_token = Column(String, index=True)
    proof_signature = Column(String)
    timestamp = Column(DateTime, default=get_ist_now)
    consented_attrs = Column(JSON, default=dict) # NEW: Stores agreed attributes for this specific access
    
    request = relationship("AccessRequest", back_populates="logs")
    user = relationship("User", back_populates="access_logs")

class UserAudit(Base):
    __tablename__ = "user_audits"
    
    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"))
    target_user_id = Column(Integer, ForeignKey("users.id"))
    old_username = Column(String)
    new_username = Column(String)
    timestamp = Column(DateTime, default=get_ist_now)


class EventCustomField(Base):
    __tablename__ = "event_custom_fields"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("access_requests.id"))
    label = Column(String)
    normalized_label = Column(String) # For risk analysis comparison (lowercase)
    field_type = Column(String) # short_text, long_text, number, dropdown, checkbox, date, url
    required = Column(Boolean, default=False)
    options = Column(JSON, nullable=True) # For dropdown/checkbox
    risk_level = Column(String) # HIGH, MEDIUM, LOW
    
    event = relationship("AccessRequest", back_populates="custom_fields")
    responses = relationship("StudentCustomFieldResponse", back_populates="field", cascade="all, delete-orphan")


class StudentCustomFieldResponse(Base):
    __tablename__ = "student_custom_field_responses"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("access_requests.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    field_id = Column(Integer, ForeignKey("event_custom_fields.id"))
    response_value = Column(String) # JSON string if needed for multiple values
    timestamp = Column(DateTime, default=get_ist_now)

    field = relationship("EventCustomField", back_populates="responses")
    student = relationship("User")
