# Lowkey Secure - System Workflow Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [User Roles & Flows](#user-roles--flows)
4. [Technical Workflow](#technical-workflow)
5. [API Endpoints](#api-endpoints)
6. [Data Flow](#data-flow)
7. [Security Features](#security-features)
8. [Setup & Deployment](#setup--deployment)

---

## System Overview

**Lowkey Secure** is a privacy-preserving identity verification system for campus activities. It enables students to prove eligibility (e.g., "I am a CS Major") without revealing sensitive PII (Personally Identifiable Information) like real names or email addresses.

### Key Features
- **Privacy Guardian Engine**: Automatically flags requests asking for High-Risk PII
- **Verifiable Credentials**: Cryptographically signed student credentials using RSA-2048
- **Anonymous Access**: Club leads see valid proofs, not names
- **Consent-First Architecture**: Students review risk before consenting

---

## Architecture

### Tech Stack

**Backend:**
- Python 3.8+
- FastAPI (REST API framework)
- SQLAlchemy (ORM)
- SQLite (Database)
- Python-Jose (JWT & RSA signing)
- Passlib/Bcrypt (Password hashing)

**Frontend:**
- React 19 (UI framework)
- Vite (Build tool)
- Tailwind CSS (Styling)
- React Router DOM (Routing)
- Axios (HTTP client)
- Lucide React (Icons)

### Project Structure
```
lowkeysecure/
├── backend/
│   ├── main.py          # FastAPI app & routes
│   ├── models.py        # SQLAlchemy models
│   ├── schemas.py       # Pydantic schemas
│   ├── auth.py          # JWT & password auth
│   ├── utils.py         # Credential signing & privacy analysis
│   ├── database.py      # DB connection
│   └── requirements.txt # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx      # Main router
│   │   ├── api.js       # Axios instance
│   │   ├── pages/       # Page components
│   │   └── components/  # Reusable components
│   └── package.json     # Node dependencies
└── README.md
```

---

## User Roles & Flows

### 1. University Admin (Issuer)
**Role:** Issue verifiable credentials to students

**Flow:**
1. Register/Login as `admin`
2. Navigate to Admin Dashboard (`/admin`)
3. Enter student username and attributes (name, major, year, etc.)
4. System cryptographically signs credentials using RSA-2048
5. Credential stored in database with signature

**Key Actions:**
- Issue credentials to students
- Credentials contain: name, major, year, student_id, role, university

---

### 2. Club Lead (Verifier)
**Role:** Create event access requests and verify attendees

**Flow:**
1. Register/Login as `club`
2. Navigate to Club Dashboard (`/club`)
3. Create new event with:
   - Event name
   - Required attributes (major, year, email, phone, dorm, etc.)
4. System analyzes privacy risk:
   - **HIGH RISK**: If requesting PII (name, email, phone, student_id, photo, ssn, address)
   - **LOW RISK**: If only requesting non-PII (major, year, dorm)
5. View live attendance feed:
   - See anonymous student entries
   - Verify proof signatures
   - Monitor real-time check-ins

**Key Actions:**
- Create access requests
- View live attendance logs
- See risk analysis for each request

---

### 3. Student (Credential Holder)
**Role:** Hold credentials and consent to access requests

**Flow:**
1. Register/Login as `student`
2. View credentials in Wallet (`/student`)
3. Scan/Enter Request ID to view access request
4. Review consent screen:
   - See requested attributes
   - View risk level (HIGH/LOW)
   - Read risk message
5. Approve request:
   - System verifies credential signature
   - Generates anonymous proof
   - Logs access (without revealing identity)
6. Club sees "Anonymous Student" entry

**Key Actions:**
- View issued credentials
- Scan QR/Enter Request ID
- Review and consent to access requests
- Maintain privacy while proving eligibility

---

## Technical Workflow

### Authentication Flow

```
1. User Registration/Login
   ├── POST /auth/register
   │   ├── Hash password (bcrypt)
   │   ├── Create user in DB
   │   └── Return JWT token
   │
   └── POST /auth/login
       ├── Verify password
       ├── Generate JWT (24hr expiry)
       └── Return token + role + user_id
```

**JWT Token Structure:**
```json
{
  "sub": "username",
  "role": "admin|club|student",
  "id": 1,
  "exp": <timestamp>
}
```

---

### Credential Issuance Flow

```
Admin → POST /admin/issue-credential
  ├── Verify admin role
  ├── Find student by username
  ├── Sign credential data (RSA-2048)
  │   └── utils.sign_credential(attributes)
  │       ├── Generate RSA key pair (if first time)
  │       ├── Sign payload with private key
  │       └── Return JWT token (RS256)
  ├── Store credential in DB
  │   ├── user_id
  │   ├── data (JSON attributes)
  │   ├── signature (JWT token)
  │   └── issuer_id
  └── Return credential
```

**Credential Data Structure:**
```json
{
  "name": "John Doe",
  "major": "Computer Science",
  "year": "Senior",
  "student_id": "john_doe",
  "role": "student",
  "university": "Tech University"
}
```

---

### Access Request Flow

```
Club Lead → POST /club/requests
  ├── Verify club role
  ├── Analyze privacy risk
  │   └── utils.analyze_privacy_risk(requested_attributes)
  │       ├── Check against HIGH_RISK_PII list
  │       ├── Return risk_level: "HIGH" | "LOW"
  │       └── Return risk_message
  ├── Create AccessRequest
  │   ├── club_id
  │   ├── event_name
  │   ├── requested_attributes (JSON array)
  │   ├── risk_level
  │   └── risk_message
  └── Return request with ID

Student → GET /student/requests/{id}
  ├── Fetch request details
  └── Display consent screen

Student → POST /student/requests/{id}/approve
  ├── Verify student role
  ├── Verify credential signature
  │   └── utils.verify_credential(signature)
  │       ├── Decode JWT with public key
  │       └── Return payload if valid
  ├── Check for duplicate submission
  ├── Create AccessLog
  │   ├── request_id
  │   ├── user_id (for uniqueness, not displayed)
  │   ├── proof_signature
  │   └── timestamp
  └── Return success

Club Lead → GET /club/requests/{id}/logs
  ├── Verify club owns request
  ├── Fetch AccessLog entries
  └── Return logs (user_id masked as "Anonymous Student")
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | None | Register new user |
| POST | `/auth/login` | None | Login and get JWT token |

### Admin Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/admin/issue-credential` | Admin | Issue credential to student |

### Club Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/club/requests` | Club | Create access request |
| GET | `/club/requests` | Club | List all club requests |
| GET | `/club/requests/{id}/logs` | Club | Get attendance logs |

### Student Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/student/credentials` | Student | Get my credentials |
| GET | `/student/requests/{id}` | None | Get request details |
| POST | `/student/requests/{id}/approve` | Student | Approve access request |

---

## Data Flow

### Database Schema

**Users Table:**
```sql
- id (PK)
- username (unique)
- hashed_password
- role ('admin', 'club', 'student')
```

**Credentials Table:**
```sql
- id (PK)
- user_id (FK → users.id)
- data (JSON) - credential attributes
- signature (String) - RSA-signed JWT
- issuer_id (FK → users.id)
- created_at
```

**AccessRequests Table:**
```sql
- id (PK)
- club_id (FK → users.id)
- event_name
- requested_attributes (JSON array)
- risk_level ('HIGH' | 'LOW')
- risk_message
- created_at
```

**AccessLogs Table:**
```sql
- id (PK)
- request_id (FK → access_requests.id)
- user_id (FK → users.id) - masked in UI
- proof_signature
- timestamp
```

### Data Flow Diagram

```
┌─────────────┐
│   Admin     │
└──────┬──────┘
       │ Issue Credential
       ▼
┌─────────────────┐
│  Credentials DB  │
└──────┬───────────┘
       │
       │ Student views credentials
       ▼
┌─────────────┐
│   Student   │
└──────┬──────┘
       │
       │ Club creates request
       ▼
┌─────────────┐     ┌──────────────────┐
│  Club Lead  │────▶│ AccessRequests DB│
└─────────────┘     └────────┬─────────┘
                             │
                             │ Student scans/enters Request ID
                             ▼
                    ┌──────────────────┐
                    │  Consent Screen  │
                    │  (Risk Analysis) │
                    └────────┬─────────┘
                             │
                             │ Student approves
                             ▼
                    ┌──────────────────┐
                    │   AccessLogs DB  │
                    └────────┬─────────┘
                             │
                             │ Club views logs
                             ▼
                    ┌──────────────────┐
                    │  Live Feed (UI)  │
                    │ "Anonymous Student"│
                    └──────────────────┘
```

---

## Security Features

### 1. Password Security
- **Bcrypt hashing** with Passlib
- Passwords never stored in plaintext
- Salt rounds: 12 (default)

### 2. JWT Authentication
- **HS256** for user authentication tokens
- **RS256** for credential signatures
- Token expiry: 24 hours (auth), no expiry (credentials)
- Secret key stored in code (should be env var in production)

### 3. Credential Signing
- **RSA-2048** key pair generated on server start
- Private key: Signs credentials (never exposed)
- Public key: Verifies credentials
- Algorithm: RS256 (RSA + SHA-256)

### 4. Privacy Guardian
- **Automatic risk analysis** on access requests
- High-risk PII detection: name, email, phone, student_id, photo, ssn, address
- Visual warnings for HIGH risk requests
- Consent required before disclosure

### 5. Anonymous Verification
- User IDs stored but masked in UI
- Club sees "Anonymous Student" entries
- Proof signatures verify eligibility without revealing identity

### 6. Authorization
- Role-based access control (RBAC)
- Endpoints protected by role checks
- Users can only access their own data

---

## Setup & Deployment

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\Activate
pip install -r requirements.txt
uvicorn main:app --reload
# API runs on http://localhost:8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

### Database
- SQLite database (`lowkey.db`) created automatically
- Tables created via `models.Base.metadata.create_all()`
- No migration system (MVP)

---

## Testing Workflow

### Complete End-to-End Test

1. **Register Users:**
   - Admin: username=`admin1`, role=`admin`
   - Club: username=`club1`, role=`club`
   - Student: username=`student1`, role=`student`

2. **Issue Credential:**
   - Login as admin
   - Issue credential to `student1`
   - Attributes: name, major, year, student_id

3. **Create Event:**
   - Login as club
   - Create event: "Hackathon Check-in"
   - Select attributes: major, year (LOW RISK)
   - Or select: email (HIGH RISK) to see warning

4. **Student Consent:**
   - Login as student
   - View credentials in wallet
   - Enter Request ID (from club dashboard)
   - Review risk level
   - Approve request

5. **Verify Access:**
   - Return to club dashboard
   - Click on event
   - See "Anonymous Student" in live feed
   - Verify timestamp and proof signature

---

## Frontend Component Structure

### Pages
- **Login.jsx**: Authentication form
- **Register.jsx**: User registration with role selection
- **AdminDashboard.jsx**: Credential issuance interface
- **ClubDashboard.jsx**: Event creation & live feed
- **StudentDashboard.jsx**: Credential wallet & QR scanner
- **RequestDetails.jsx**: Consent screen with risk analysis

### Components
- **RiskBadge.jsx**: Visual risk indicator (HIGH/LOW)

### Routing
- `/login` - Login page
- `/register` - Registration page
- `/admin` - Admin dashboard (protected)
- `/club` - Club dashboard (protected)
- `/student` - Student dashboard (protected)
- `/student/request/:id` - Request details (protected)

---

## Future Enhancements

1. **Zero-Knowledge Proofs**: Implement actual ZK proofs instead of simulation
2. **QR Code Generation**: Generate QR codes for access requests
3. **Credential Revocation**: Allow admins to revoke credentials
4. **Multi-Issuer Support**: Support multiple credential issuers
5. **Credential Expiry**: Add expiration dates to credentials
6. **Audit Logging**: Enhanced logging for compliance
7. **Environment Variables**: Move secrets to .env files
8. **Database Migrations**: Add Alembic for schema management
9. **API Documentation**: Add Swagger/OpenAPI docs
10. **Unit Tests**: Add comprehensive test coverage

---

## Notes

- This is an MVP (Minimum Viable Product) for hackathon demonstration
- Credential signing uses in-memory keys (regenerated on restart)
- In production, keys should be persisted securely
- User IDs are stored but masked in UI (not true anonymity)
- Real ZK proofs would require additional cryptographic libraries
- CORS is open (`allow_origins=["*"]`) - restrict in production

---

**Last Updated:** 2024
**Version:** MVP 1.0
