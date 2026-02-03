from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    password: str
    role: str # 'admin', 'club', 'student'

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int

class CredentialIssue(BaseModel):
    student_username: str
    attributes: Dict[str, Any]

class CredentialOut(BaseModel):
    id: int
    data: Dict[str, Any]
    signature: str
    issuer_id: int
    class Config:
        orm_mode = True

class RequestCreate(BaseModel):
    event_name: str
    requested_attributes: List[str]

class RequestOut(BaseModel):
    id: int
    club_id: int
    event_name: str
    requested_attributes: List[str]
    risk_level: str
    risk_message: str
    created_at: datetime
    class Config:
        orm_mode = True

class AccessLogOut(BaseModel):
    id: int
    timestamp: datetime
    user_id: int # Used to verify uniqueness, frontend will mask
    class Config:
        orm_mode = True
