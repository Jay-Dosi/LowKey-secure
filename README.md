# LowKey Secure — Privacy-First Event Access System

> **Consent-First Identity Fabric** for campus events with strict RBAC, event approval workflows, consent-based PII reveal, and anonymous attendance tracking.

![Tech Stack](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=flat&logo=react&logoColor=black)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat&logo=sqlite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

---

## 📖 Overview

LowKey Secure enables students to prove eligibility for campus events **without exposing sensitive PII unless they explicitly consent**. The platform implements a three-tier workflow:

| Role          | Capabilities                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Club Lead** | Create events, request specific attributes & custom data fields, set expiry dates, view consent-based attendance   |
| **Admin**     | Review & approve/reject events based on privacy risk, manage users (edit/delete), view event history & audit trail |
| **Student**   | View approved events filtered by year, review risk levels, give consent, dismiss unwanted events                   |

---

## ✨ Key Features

### 🔒 Privacy & Consent Engine
- **Three-Tier Risk Classification** — Events auto-classified as `HIGH`, `MEDIUM`, or `LOW` risk based on requested attributes and custom fields
- **Consent-Based PII Reveal** — Club leads only see student data the student explicitly consented to share (name, email, branch, etc.)
- **Anonymized Attendance** — Students tracked by SHA-256 hashed tokens, not user IDs
- **Centralized Privacy Engine** (`privacy_engine.py`) — Keyword-based risk analysis covering 40+ sensitive data patterns

### 📋 Event Lifecycle
- **Event Approval Pipeline** — Admin review queue with mandatory comments for HIGH risk and rejections
- **Mandatory Expiry Dates** — Every event requires an expiry date; expired events are auto-cleaned on startup and admin fetch
- **Event History Tab** — Admin can view all approved/rejected events with timestamps and comments
- **Edit Resets to Pending** — Any club lead edit automatically resets event status for re-review

### 🎛️ Dynamic Custom Data Fields
- **Supported Types**: Short Text, Long Text, Number, Dropdown, Checkbox, Date, URL
- **Auto Risk Classification** — Custom field labels are analyzed against HIGH/MEDIUM/LOW risk keyword lists
- **Required Field Validation** — Club leads can mark fields as required; backend enforces before consent

### 👥 User Management
- **Auto-Generated Usernames** — Random role-based username generation for students and club leads
- **Profile Dialog** — View your profile info from the navbar
- **Admin User Management** — Edit user details, delete users with full cascade cleanup (events, logs, audits, credentials)
- **Delete Confirmation Dialog** — Safe deletion with confirmation modal

### 🛡️ Authentication & Security
- **JWT Authentication** — 24-hour token expiry with HS256 signing
- **Bcrypt Password Hashing** — Industry-standard password security
- **RSA-256 Credential Signing** — Cryptographically signed verifiable credentials
- **Role-Based Access Control** — Strict endpoint-level RBAC for admin, club, and student roles

---

## 🛠️ Tech Stack

| Layer             | Technology                                                                               |
| ----------------- | ---------------------------------------------------------------------------------------- |
| **Backend**       | Python 3.8+, FastAPI, SQLAlchemy, SQLite                                                 |
| **Auth/Crypto**   | python-jose (JWT), passlib + bcrypt, RSA key pairs                                       |
| **Frontend**      | React 19 (Vite 7), Tailwind CSS 3, Radix UI primitives                                   |
| **UI Components** | Custom shadcn/ui (Badge, Button, Card, Dialog, Input, Select, Checkbox, Textarea, Label) |
| **Icons**         | Lucide React                                                                             |
| **HTTP Client**   | Axios with interceptors (auto token injection, 401 redirect)                             |

---

## 🚀 Setup & Run

### Prerequisites
- Python 3.8+
- Node.js 18+ & npm

### 1. Backend

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate        # macOS/Linux
# .\venv\Scripts\Activate       # Windows PowerShell

# Install dependencies
pip install -r requirements.txt

# Run database migration (if upgrading existing DB)
python migrate_db.py

# Start server
uvicorn main:app --reload
```

Backend API: `http://localhost:8000`
Swagger Docs: `http://localhost:8000/docs`

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend: `http://localhost:5173`

---

## 🧪 Workflow Guide

### Step 1: Register Users
Navigate to `/register` and create accounts for each role:
- **Admin** — Must provide a custom username
- **Club Lead** — Provide name, email, phone, year, club/org name
- **Student** — Provide name, email, phone, year, branch

> Usernames can be auto-generated or manually chosen for students and club leads.

### Step 2: Create Event (Club Lead)
1. Login as **Club Lead**
2. Fill in event name, description, and **expiry date** (required)
3. Select **allowed years** (or leave empty for all years)
4. Choose **predefined attributes** (branch, year, email, phone, name, student_id)
5. Add optional **custom data fields** (text, dropdown, etc.)
6. Review the real-time **risk preview** before submitting

### Step 3: Approve/Reject Event (Admin)
1. Login as **Admin** → **Approvals** tab
2. Review each event's risk level, requested attributes, and expiry date
3. Actions:
   - ✅ **LOW/MEDIUM risk** → Approve with optional comment
   - ✅ **HIGH risk** → Approve with **mandatory justification**
   - ❌ **Reject** → Requires comment explaining reason

### Step 4: Student Consent
1. Login as **Student** → View **Available Events** (filtered by year eligibility)
2. Review risk badge, risk message, requested attributes, and expiry date
3. Click **"Give Consent"** → Review details in consent modal
4. Fill in any **required custom fields**
5. Confirm → **"Access Granted!"** animation

### Step 5: View Attendance (Club Lead)
1. Go to **My Events** → Click the attendance icon on an approved event
2. View **Live Attendance Feed** showing:
   - ✅ Consented PII (only what the student agreed to share)
   - 🕐 Timestamp (IST)
   - 🔑 Anonymized token
   - 📝 Custom field responses

---

## 🗂️ Project Structure

```
LowKey-secure/
├── backend/
│   ├── main.py              # FastAPI routes & endpoints
│   ├── models.py            # SQLAlchemy ORM models (8 tables)
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── auth.py              # JWT auth, bcrypt, token creation
│   ├── utils.py             # RSA signing, phone/email validation
│   ├── privacy_engine.py    # Centralized risk classification engine
│   ├── privacy_analytics.py # Digital Hygiene metrics logic
│   ├── ai_advisor.py        # AI summary generation (Zero PII)
│   ├── username_gen.py      # Random username generator
│   ├── database.py          # SQLite engine & session
│   ├── migrate_db.py        # Database migration script
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   └── log.png          # App logo
│   ├── src/
│   │   ├── App.jsx          # Router, navbar, auth guards
│   │   ├── api.js           # Axios instance with interceptors
│   │   ├── main.jsx         # React entry point
│   │   ├── index.css        # Global styles (dark theme)
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # JWT decode, login/logout state
│   │   ├── components/
│   │   │   ├── ProfileDialog.jsx # User profile modal
│   │   │   ├── RiskBadge.jsx     # Risk level badge component
│   │   │   └── ui/              # shadcn/ui primitives
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── AdminDashboard.jsx    # Approvals, Users, History tabs
│   │   │   ├── ClubDashboard.jsx     # Event builder & attendance
│   │   │   ├── StudentDashboard.jsx  # Event feed & consent
│   │   │   └── RequestDetails.jsx
│   │   └── lib/
│   │       └── utils.js     # cn() utility for Tailwind
│   └── package.json
├── README.md
└── .gitignore
```

---

## 🔧 API Endpoints

### Auth
| Method | Endpoint                  | Description              |
| ------ | ------------------------- | ------------------------ |
| `GET`  | `/auth/generate-username` | Generate random username |
| `POST` | `/auth/register`          | Register new user        |
| `POST` | `/auth/login`             | Login & get JWT token    |
| `GET`  | `/user/profile`           | Get current user profile |

### Admin
| Method   | Endpoint                    | Description                            |
| -------- | --------------------------- | -------------------------------------- |
| `POST`   | `/admin/issue-credential`   | Issue credential to student            |
| `GET`    | `/admin/events?status=`     | Get events (PENDING/APPROVED/REJECTED) |
| `POST`   | `/admin/events/{id}/review` | Approve or reject event                |
| `GET`    | `/admin/users`              | List all users                         |
| `PUT`    | `/admin/users/{id}`         | Update user details                    |
| `DELETE` | `/admin/users/{id}`         | Delete user (full cascade)             |
| `GET`    | `/admin/credentials`        | List all credentials                   |

### Club Lead
| Method   | Endpoint                 | Description                                    |
| -------- | ------------------------ | ---------------------------------------------- |
| `POST`   | `/club/events`           | Create event with attributes & custom fields   |
| `PUT`    | `/club/events/{id}`      | Edit event (resets to PENDING)                 |
| `DELETE` | `/club/events/{id}`      | Delete own event                               |
| `GET`    | `/club/events`           | List own events                                |
| `GET`    | `/club/events/{id}/logs` | Consent-based attendance with custom responses |
| `GET`    | `/club/calendar`         | View all approved events (read-only)           |

### Student
| Method | Endpoint                       | Description                              |
| ------ | ------------------------------ | ---------------------------------------- |
| `GET`  | `/student/credentials`         | Get own credentials                      |
| `GET`  | `/student/events`              | Approved events (year-filtered)          |
| `GET`  | `/student/events/{id}`         | Event details (eligibility checked)      |
| `GET`  | `/student/registered-events`   | Events already consented to              |
| `POST` | `/student/events/{id}/consent` | Give consent with custom field responses |

---

## 🗃️ Database Schema

| Table                            | Purpose                                            |
| -------------------------------- | -------------------------------------------------- |
| `users`                          | All users (admin, club, student) with PII fields   |
| `credentials`                    | RSA-signed verifiable credentials                  |
| `access_requests`                | Events with attributes, risk level, status, expiry |
| `approval_audits`                | Admin approve/reject actions with comments         |
| `access_logs`                    | Anonymized attendance with consented attributes    |
| `user_audits`                    | User modification tracking                         |
| `event_custom_fields`            | Dynamic form fields per event                      |
| `student_custom_field_responses` | Student answers to custom fields                   |
| `student_privacy_metrics`        | **New: Aggregated monthly exposure stats**         |

---

## 🔒 Privacy & Security Design

### Risk Classification
| Level      | Triggers                                                       | Admin Requirement               |
| ---------- | -------------------------------------------------------------- | ------------------------------- |
| **HIGH**   | phone, student_id, aadhaar, passport, bank details, biometrics | Mandatory justification comment |
| **MEDIUM** | name, email, social media, DOB, gender                         | Optional comment                |
| **LOW**    | branch, year, t-shirt size, preferences                        | Optional comment                |

### Consent-Based PII Reveal
- When a student consents to an event, the system stores which attributes they agreed to share (`consented_attrs`)
- Club leads viewing attendance logs only see the data fields the student consented to — no more, no less
- Attribute mapping ensures frontend names resolve to correct database columns (`student_id` → `username`, etc.)

### Anonymization
- Access logs use SHA-256 hashed tokens (`user_id + event_id + timestamp`)
- Deduplication check prevents multiple registrations per student per event
- Expired events are automatically purged on server startup

---

## 📊 Digital Hygiene Dashboard

A dedicated privacy dashboard for students to monitor their data exposure footprint. This feature shifts the focus from "access" to "behavioral privacy."

### Key Metrics
1.  **Exposure Score**: A cumulative weighted score calculated from all attended events.
    *   Formula: `(High_Risk_Count * 6) + (Medium_Risk_Count * 3) + (Low_Risk_Count * 1)`
2.  **Entropy Score**: Measures how widely your data is spread across different organisations. High entropy means your data is fragmented across many clubs (higher breach risk).
3.  **Risk Velocity**: Tracks the *rate of change* in your risk exposure compared to the previous month. A spike (e.g., +15 points) triggers an alert.

### 🤖 AI Privacy Advisor
The dashboard includes an AI-generated summary that provides actionable advice (e.g., *"Your risk exposure doubled this month due to 3 high-risk hackathons. Consider using a burner email."*).

> **Privacy Guarantee**: The AI model (Llama-3 via Groq) receives **ONLY aggregated integers** (e.g., "High Risk Count: 5"). **No raw PII, names, or event titles are ever sent to the AI.**

---

## 📝 Notes

- **Database**: SQLite (`backend/lowkey.db`) — auto-created on first run
- **RSA Keys**: Auto-generated and persisted (`private_key.pem`, `public_key.pem`)
- **Timezone**: IST (Asia/Kolkata, UTC+5:30) — timestamps stored as naive IST
- **Notifications**: Simulated via server console logs
- **Token Expiry**: JWT tokens valid for 24 hours
