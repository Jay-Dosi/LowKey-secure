from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database, auth, utils

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Lowkey Secure API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth Endpoints
@app.post("/auth/register", response_model=schemas.Token)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(username=user.username, hashed_password=hashed_password, role=user.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    access_token = auth.create_access_token(data={"sub": new_user.username, "role": new_user.role, "id": new_user.id})
    return {"access_token": access_token, "token_type": "bearer", "role": new_user.role, "user_id": new_user.id}

@app.post("/auth/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    if not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = auth.create_access_token(data={"sub": db_user.username, "role": db_user.role, "id": db_user.id})
    return {"access_token": access_token, "token_type": "bearer", "role": db_user.role, "user_id": db_user.id}

# Admin Endpoints
@app.post("/admin/issue-credential", response_model=schemas.CredentialOut)
def issue_credential(
    cred: schemas.CredentialIssue,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    student = db.query(models.User).filter(models.User.username == cred.student_username).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Sign data
    signed_token = utils.sign_credential(cred.attributes)
    
    new_cred = models.Credential(
        user_id=student.id,
        data=cred.attributes,
        signature=signed_token,
        issuer_id=current_user.id
    )
    db.add(new_cred)
    db.commit()
    db.refresh(new_cred)
    return new_cred

# Club Endpoints
@app.post("/club/requests", response_model=schemas.RequestOut)
def create_request(
    request: schemas.RequestCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != 'club':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    risk_level, risk_message = utils.analyze_privacy_risk(request.requested_attributes)
    
    new_request = models.AccessRequest(
        club_id=current_user.id,
        event_name=request.event_name,
        requested_attributes=request.requested_attributes,
        risk_level=risk_level,
        risk_message=risk_message
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request

@app.get("/club/requests", response_model=List[schemas.RequestOut])
def get_club_requests(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != 'club':
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(models.AccessRequest).filter(models.AccessRequest.club_id == current_user.id).order_by(models.AccessRequest.created_at.desc()).all()

@app.get("/club/requests/{request_id}/logs", response_model=List[schemas.AccessLogOut])
def get_request_logs(
    request_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != 'club':
        raise HTTPException(status_code=403, detail="Not authorized")
        
    req = db.query(models.AccessRequest).filter(models.AccessRequest.id == request_id).first()
    if not req or req.club_id != current_user.id:
        raise HTTPException(status_code=404, detail="Request not found")
        
    return db.query(models.AccessLog).filter(models.AccessLog.request_id == request_id).order_by(models.AccessLog.timestamp.desc()).all()

# Student Endpoints
@app.get("/student/credentials", response_model=List[schemas.CredentialOut])
def get_my_credentials(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != 'student':
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(models.Credential).filter(models.Credential.user_id == current_user.id).all()

@app.get("/student/requests/{request_id}", response_model=schemas.RequestOut)
def get_request_details(
    request_id: int,
    db: Session = Depends(database.get_db)
):
    req = db.query(models.AccessRequest).filter(models.AccessRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    return req

@app.post("/student/requests/{request_id}/approve")
def approve_request(
    request_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != 'student':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    req = db.query(models.AccessRequest).filter(models.AccessRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    creds = db.query(models.Credential).filter(models.Credential.user_id == current_user.id).all()
    if not creds:
        raise HTTPException(status_code=400, detail="No credentials found. You need a University credential.")
    
    verified = False
    for cred in creds:
        if utils.verify_credential(cred.signature):
            verified = True
            break
            
    if not verified:
        raise HTTPException(status_code=400, detail="Invalid or Tampered Credentials")
        
    # Check if user already submitted? (Optional, but good for MVP to prevent spam)
    existing_log = db.query(models.AccessLog).filter(
        models.AccessLog.request_id == request_id, 
        models.AccessLog.user_id == current_user.id
    ).first()
    
    if existing_log:
         return {"status": "success", "message": "Access Granted (Already Verified)"}

    new_log = models.AccessLog(
        request_id=request_id,
        user_id=current_user.id,
        proof_signature=f"valid_proof_{current_user.id}"
    )
    db.add(new_log)
    db.commit()
    
    return {"status": "success", "message": "Access Granted"}
