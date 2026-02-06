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
    new_user = models.User(
        username=user.username, 
        hashed_password=hashed_password, 
        role=user.role,
        name=user.name,
        email=user.email,
        phone=user.phone,
        year=user.year,
        branch=user.branch
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    access_token = auth.create_access_token(data={"sub": new_user.username, "role": new_user.role, "id": new_user.id})
    return {"access_token": access_token, "token_type": "bearer", "role": new_user.role, "user_id": new_user.id}

@app.post("/auth/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found. Please register first.")
    if not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect password")
    access_token = auth.create_access_token(data={"sub": db_user.username, "role": db_user.role, "id": db_user.id})
    return {"access_token": access_token, "token_type": "bearer", "role": db_user.role, "user_id": db_user.id}


# Profile Endpoint
@app.get("/user/profile", response_model=schemas.UserProfile)
def get_user_profile(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Get the current user's profile information"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "role": current_user.role,
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
        "year": current_user.year,
        "branch": current_user.branch
    }


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

@app.get("/admin/events", response_model=List[schemas.RequestOut])
def get_admin_events(
    status: str = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    query = db.query(models.AccessRequest)
    if status:
        query = query.filter(models.AccessRequest.status == status)
    return query.order_by(models.AccessRequest.created_at.desc()).all()

@app.post("/admin/events/{request_id}/review")
def review_event(
    request_id: int,
    action_data: schemas.ApprovalAction,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    event = db.query(models.AccessRequest).filter(models.AccessRequest.id == request_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    if action_data.action not in ['APPROVE', 'REJECT']:
        raise HTTPException(status_code=400, detail="Invalid action")
        
    if action_data.action == 'REJECT' and not action_data.comment:
        raise HTTPException(status_code=400, detail="Comment required for rejection")

    if action_data.action == 'APPROVE' and event.risk_level == 'HIGH' and not action_data.comment:
        raise HTTPException(status_code=400, detail="Comment required for overriding HIGH risk")

    # Update Event
    event.status = 'APPROVED' if action_data.action == 'APPROVE' else 'REJECTED'
    event.admin_comment = action_data.comment
    
    # Create Audit Record
    audit = models.ApprovalAudit(
        request_id=event.id,
        admin_id=current_user.id,
        action=action_data.action,
        comment=action_data.comment
    )
    db.add(audit)
    
    # Simulate Notification (In a real app, this would be a separate service)
    if event.status == 'APPROVED':
        print(f"📢 NOTIFICATION: Event '{event.event_name}' Approved! Notifying students in years {event.allowed_years}")
    
    db.commit()
    return {"status": "success", "event_status": event.status}

@app.get("/admin/users")
def get_all_users(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    users = db.query(models.User).all()
    return [{
        "id": u.id,
        "username": u.username,
        "role": u.role,
        "name": u.name,
        "email": u.email,
        "phone": u.phone,
        "year": u.year,
        "branch": u.branch
    } for u in users]

@app.get("/admin/credentials")
def get_all_credentials(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    creds = db.query(models.Credential).all()
    return creds

# Club Endpoints
@app.post("/club/events", response_model=schemas.RequestOut)
def create_event(
    request: schemas.RequestCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != 'club':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    risk_level, risk_message = utils.analyze_privacy_risk(request.requested_attributes)
    
    new_event = models.AccessRequest(
        club_id=current_user.id,
        event_name=request.event_name,
        event_description=request.event_description,
        requested_attributes=request.requested_attributes,
        allowed_years=request.allowed_years,
        risk_level=risk_level,
        risk_message=risk_message,
        status="PENDING"
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    
    # Notify Admin
    print(f"🔔 NOTIFICATION: New Event '{request.event_name}' submitted by {current_user.username} for review.")
    
    return new_event


@app.put("/club/events/{request_id}", response_model=schemas.RequestOut)
def update_event(
    request_id: int,
    update_data: schemas.RequestUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != 'club':
        raise HTTPException(status_code=403, detail="Not authorized")
        
    event = db.query(models.AccessRequest).filter(models.AccessRequest.id == request_id).first()
    if not event or event.club_id != current_user.id:
        raise HTTPException(status_code=404, detail="Event not found")
        
    if update_data.event_name:
        event.event_name = update_data.event_name
    if update_data.allowed_years is not None:
        event.allowed_years = update_data.allowed_years
    if update_data.requested_attributes is not None:
        event.requested_attributes = update_data.requested_attributes
        # Re-analyze risk
        risk_level, risk_message = utils.analyze_privacy_risk(event.requested_attributes)
        event.risk_level = risk_level
        event.risk_message = risk_message
    
    # Any edit resets to PENDING
    event.status = "PENDING"
    
    db.commit()
    db.refresh(event)
    return event

@app.delete("/club/events/{request_id}")
def delete_event(
    request_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != 'club':
        raise HTTPException(status_code=403, detail="Not authorized")
        
    event = db.query(models.AccessRequest).filter(models.AccessRequest.id == request_id).first()
    if not event or event.club_id != current_user.id:
        raise HTTPException(status_code=404, detail="Event not found")
        
    db.delete(event)
    db.commit()
    return {"status": "success", "message": "Event deleted"}

@app.get("/club/events", response_model=List[schemas.RequestOut])
def get_my_events(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != 'club':
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(models.AccessRequest).filter(models.AccessRequest.club_id == current_user.id).order_by(models.AccessRequest.created_at.desc()).all()

@app.get("/club/events/{request_id}/logs", response_model=List[schemas.AccessLogOut])
def get_event_logs(
    request_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != 'club':
        raise HTTPException(status_code=403, detail="Not authorized")
        
    req = db.query(models.AccessRequest).filter(models.AccessRequest.id == request_id).first()
    if not req or req.club_id != current_user.id:
        raise HTTPException(status_code=404, detail="Event not found")
        
    return db.query(models.AccessLog).filter(models.AccessLog.request_id == request_id).order_by(models.AccessLog.timestamp.desc()).all()

@app.get("/club/calendar", response_model=List[schemas.RequestOut])
def get_all_events_calendar(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Calendar view - Club leads can see all events (read-only)"""
    if current_user.role != 'club':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Return all approved events for calendar view
    return db.query(models.AccessRequest).filter(
        models.AccessRequest.status == 'APPROVED'
    ).order_by(models.AccessRequest.created_at.desc()).all()

# Student Endpoints
@app.get("/student/credentials", response_model=List[schemas.CredentialOut])
def get_my_credentials(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != 'student':
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(models.Credential).filter(models.Credential.user_id == current_user.id).all()

@app.get("/student/events", response_model=List[schemas.RequestOut])
def get_student_events(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != 'student':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get student's year from their user profile
    student_year = current_user.year
    if not student_year:
        raise HTTPException(status_code=400, detail="Year not found in your profile. Please contact admin.")
    
    # Filter events: APPROVED status AND student's year in allowed_years
    events = db.query(models.AccessRequest).filter(
        models.AccessRequest.status == 'APPROVED'
    ).all()
    
    # Filter by allowed_years (server-side)
    filtered_events = []
    for event in events:
        # If allowed_years is empty or None, event is open to all years
        if not event.allowed_years or len(event.allowed_years) == 0 or student_year in event.allowed_years:
            filtered_events.append(event)
    
    return filtered_events

@app.get("/student/registered-events", response_model=List[schemas.RequestOut])
def get_registered_events(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Get events the student has already consented to (registered for)"""
    if current_user.role != 'student':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get all access logs for this student
    logs = db.query(models.AccessLog).filter(
        models.AccessLog.user_id == current_user.id
    ).all()
    
    # Get the unique event IDs
    event_ids = list(set([log.request_id for log in logs]))
    
    # Fetch the events
    if not event_ids:
        return []
    
    events = db.query(models.AccessRequest).filter(
        models.AccessRequest.id.in_(event_ids)
    ).all()
    
    return events

@app.get("/student/events/{request_id}", response_model=schemas.RequestOut)
def get_event_details(
    request_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != 'student':
        raise HTTPException(status_code=403, detail="Not authorized")
        
    event = db.query(models.AccessRequest).filter(models.AccessRequest.id == request_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Verify student can access this event
    if event.status != 'APPROVED':
        raise HTTPException(status_code=403, detail="Event not approved")
        
    # Check year eligibility using User.year
    student_year = current_user.year
    if student_year and event.allowed_years and len(event.allowed_years) > 0:
        if student_year not in event.allowed_years:
            raise HTTPException(status_code=403, detail="Not eligible for this event")
        
    return event

@app.post("/student/events/{request_id}/consent")
def consent_to_event(
    request_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != 'student':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if student has year in profile
    if not current_user.year:
        raise HTTPException(status_code=400, detail="Year not found in your profile. Please contact admin.")
    
    # Get the event
    event = db.query(models.AccessRequest).filter(models.AccessRequest.id == request_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if event is approved
    if event.status != 'APPROVED':
        raise HTTPException(status_code=400, detail="Event is not approved yet")
    
    # Check if student's year is allowed
    if event.allowed_years and len(event.allowed_years) > 0:
        if current_user.year not in event.allowed_years:
            raise HTTPException(status_code=403, detail="You are not eligible for this event")
    
    # **DEDUPLICATION CHECK** - Prevent multiple registrations
    existing_log = db.query(models.AccessLog).filter(
        models.AccessLog.request_id == request_id,
        models.AccessLog.user_id == current_user.id
    ).first()
    
    if existing_log:
        # Student already registered - return success without creating duplicate
        return {
            "status": "success", 
            "message": "Already registered", 
            "token": existing_log.anonymized_token
        }
    
    # Create anonymized token (hash of user_id + timestamp + event_id)
    import hashlib
    from datetime import datetime
    timestamp = datetime.utcnow().isoformat()
    token_string = f"{current_user.id}:{request_id}:{timestamp}"
    anonymized_token = hashlib.sha256(token_string.encode()).hexdigest()[:16]
    
    # Log anonymous access
    access_log = models.AccessLog(
        request_id=request_id,
        user_id=current_user.id,  # Keep for internal deduplication
        anonymized_token=anonymized_token,
        proof_signature="user_profile_verified"  # Since we're using User model, not credentials
    )
    db.add(access_log)
    db.commit()
    
    return {"status": "success", "message": "Access granted", "token": anonymized_token}
