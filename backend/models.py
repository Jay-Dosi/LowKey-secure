from sqlalchemy import Column, Integer, String, Boolean, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import time
from zoneinfo import ZoneInfo

def get_ist_now():
    utc_timestamp = time.time()
    utc_dt = datetime.fromtimestamp(utc_timestamp, tz=ZoneInfo("UTC"))
    return utc_dt.astimezone(ZoneInfo("Asia/Kolkata"))

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String) # 'admin', 'club', 'student'
    
    credentials = relationship("Credential", back_populates="owner", foreign_keys="[Credential.user_id]")
    requests_created = relationship("AccessRequest", back_populates="creator")
    access_logs = relationship("AccessLog", back_populates="user")

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
    requested_attributes = Column(JSON) # List of strings
    risk_level = Column(String) # 'HIGH', 'LOW'
    risk_message = Column(String)
    created_at = Column(DateTime, default=get_ist_now)

    creator = relationship("User", back_populates="requests_created")
    logs = relationship("AccessLog", back_populates="request")

class AccessLog(Base):
    __tablename__ = "access_logs"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("access_requests.id"))
    user_id = Column(Integer, ForeignKey("users.id")) # In a real anon system, this might be hashed/blinded
    proof_signature = Column(String)
    timestamp = Column(DateTime, default=get_ist_now)

    request = relationship("AccessRequest", back_populates="logs")
    user = relationship("User", back_populates="access_logs")
