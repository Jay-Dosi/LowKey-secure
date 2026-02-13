# Lowkey Secure - Privacy-First Event Access System

**Consent-First Identity Fabric** for campus events with strict RBAC, event approval workflows, and anonymous attendance tracking.

## Overview

Lowkey Secure enables students to prove eligibility for campus activities without revealing sensitive PII. The system implements a three-tier workflow:
- **Leads** create events and request specific attributes
- **Admins** review and approve/reject events based on privacy risk
- **Students** consent to approved events and access them anonymously

### Key Features
- **Event Approval Pipeline**: Admin review queue with mandatory comments for HIGH risk events
- **Privacy Guardian Engine**: Automatic risk analysis (HIGH/LOW) based on requested attributes
- **Verifiable Credentials**: Cryptographically signed student credentials (RSA-256)
- **Anonymous Access Logging**: Students tracked by anonymized tokens, not PII
- **Year-Based Filtering**: Events shown only to eligible student years


## New Capabilities

### Dynamic Custom Data Requests
Leads can now request additional structured data from students during event creation.
- **Supported Types**: Short Text, Long Text, Number, Dropdown, Checkbox, Date, URL.
- **Risk Classification**: The system automatically analyzes custom field labels to detect potential privacy risks.
    - **High Risk**: National IDs, Phone numbers, Biometrics, etc.
    - **Medium Risk**: Name, Email, Social Media handles.
    - **Low Risk**: T-shirt size, Preferences, etc.
- **Consent-First**: Students see exactly what data is requested and its associated risk before consenting.

### Privacy Risk Engine
A centralized engine (`backend/privacy_engine.py`) now handles all risk analysis.
- Automatically flags sensitive keywords.
- Calculates aggregate event risk based on pre-defined attributes and custom fields.
- Enforces "High Risk" warnings in the UI.

## Tech Stack

- **Backend**: Python, FastAPI, SQLite, SQLAlchemy, Python-Jose (Crypto)
- **Frontend**: React (Vite), Tailwind CSS, Lucide-React

## Prerequisites
- Python 3.8+
- Node.js & npm

## 🚀 Setup & Run Instructions

### 1. Backend Setup

```bash
cd lowkey-secure\backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate  # Windows PowerShell
# source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Run database migration (if existing DB)
python migrate_db.py

# Start server
uvicorn main:app --reload
```

Backend API: `http://localhost:8000`

### 2. Frontend Setup

```bash
cd lowkey-secure\frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend: `http://localhost:5173`

## 🧪 Testing the Complete Workflow

### Step 1: Register Users
Go to `http://localhost:5173/register` and create:
- **Admin** (Role: University Admin)
- **Lead** (Role: Club Lead)
- **Student** (Role: Student)

### Step 2: Issue Credential (Admin)
1. Login as **Admin**
2. Go to Admin Dashboard
3. Issue credential to student with:
   - Name, Major, **Year** (e.g., "1", "2", "3", "4")
   - Student ID, University

### Step 3: Create Event (Lead)
1. Login as **Lead**
2. Create new event:
   - Event name: "Hackathon Check-in"
   - Select **Allowed Years**: e.g., Year 1, Year 2
   - Select **Attributes**: Try selecting "email" or "name" to trigger HIGH RISK
3. Submit for approval (status: PENDING)

### Step 4: Approve Event (Admin)
1. Login as **Admin**
2. View **Approval Queue**
3. Review event:
   - **LOW RISK**: Approve (optional comment)
   - **HIGH RISK**: Approve with **mandatory justification comment**
   - **REJECT**: Requires comment
4. Event status changes to APPROVED

### Step 5: Student Consent & Access
1. Login as **Student** (with matching year)
2. View **Available Events** (filtered by year)
3. Click event → Review risk badge and attributes
4. Click **"I Consent"**
5. See **"Access Granted"** success animation

### Step 6: Verify Attendance (Lead)
1. Return to **Lead Dashboard**
2. Click on approved event
3. View **Live Attendance Feed**:
   - Identity: "Anonymous Student"
   - Timestamp: IST
   - Token: Anonymized hash (not user ID)

## 🔒 Privacy & Security Features

### RBAC Enforcement
- **Admin**: Issue credentials, approve/reject events, view audit logs
- **Lead**: Create/edit/delete own events, view anonymized attendance
- **Student**: Self-register, view approved events for their year, consent anonymously

### Risk Analysis
- **HIGH RISK PII**: name, email, phone, student_id, photo, ssn, address
- **LOW RISK**: major, year, dorm
- HIGH risk events require Admin override with justification

### Anonymization
- `AccessLog` stores `anonymized_token` (SHA-256 hash) instead of `user_id`
- Leads see only: "Anonymous Student" + timestamp + token
- Admin can view raw mappings via audit API (not exposed in UI)

### Audit Trail
- All Admin approvals/rejections logged in `ApprovalAudit` table
- Includes: admin_id, event_id, action, comment, timestamp

## 📋 Manual QA Checklist

- [ ] Admin can approve LOW risk event without comment
- [ ] Admin **cannot** approve HIGH risk event without comment
- [ ] Admin **cannot** reject any event without comment
- [ ] Lead can create event with year restrictions
- [ ] Lead can edit event (status resets to PENDING)
- [ ] Lead can delete own events
- [ ] Lead **cannot** edit/delete other leads' events
- [ ] Student sees only APPROVED events
- [ ] Student sees only events matching their year
- [ ] Student **cannot** access PENDING/REJECTED events
- [ ] Consent logs anonymized token (not user_id)
- [ ] Attendance feed shows "Anonymous Student"

## 🗂️ Project Structure

```
lowkey-secure/
├── backend/
│   ├── main.py           # FastAPI routes
│   ├── models.py         # SQLAlchemy models
│   ├── schemas.py        # Pydantic schemas
│   ├── auth.py           # JWT authentication
│   ├── utils.py          # Risk analysis, crypto
│   ├── migrate_db.py     # Database migration script
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── AdminDashboard.jsx    # Approval Queue
│       │   ├── ClubDashboard.jsx     # Event Builder
│       │   └── StudentDashboard.jsx  # Event Feed
│       └── api.js
└── README.md
```

## 🔧 API Endpoints

### Admin
- `POST /admin/issue-credential` - Issue credential to student
- `GET /admin/events?status=PENDING` - Get approval queue
- `POST /admin/events/{id}/review` - Approve/Reject event

### Lead (Club)
- `POST /club/events` - Create event
- `PUT /club/events/{id}` - Edit event
- `DELETE /club/events/{id}` - Delete event
- `GET /club/events` - Get my events
- `GET /club/events/{id}/logs` - Get anonymized attendance

### Student
- `GET /student/credentials` - Get my credentials
- `GET /student/events` - Get approved events (filtered by year)
- `POST /student/events/{id}/consent` - Consent to event

## 📝 Notes

- Database: SQLite (`lowkey.db`)
- RSA keys: Auto-generated and persisted (`private_key.pem`, `public_key.pem`)
- Notifications: Simulated via console logs
- Timezone: IST (Asia/Kolkata)
