# Lowkey Secure MVP

Verified Identity & Privacy-Preserving Access System for Hackathons.

## Overview

Lowkey Secure is a "Consent-First Identity Fabric" that allows students to prove eligibility for campus activities (e.g., "I am a CS Major") without revealing sensitive PII like real names or email addresses unless explicitly necessary.

### Key Features
- **Privacy Guardian Engine**: Automatically flags requests asking for High-Risk PII.
- **Verifiable Credentials (Simulated)**: Cryptographically signed student credentials.
- **Anonymous Access**: Club leads see valid proofs, not names.

## Tech Stack
- **Backend**: Python, FastAPI, SQLite, SQLAlchemy, Python-Jose (Crypto).
- **Frontend**: React (Vite), Tailwind CSS, Lucide-React.

## Prerequisites
- Python 3.8+
- Node.js & npm

## 🚀 Setup & Run Instructions

### 1. Backend Setup

1.  Navigate to the backend folder:
    ```bash
    cd lowkey-secure\backend
    ```

2.  **Create a Virtual Environment** (Recommended):
    ```bash
    python -m venv venv
    ```

3.  **Activate the Virtual Environment**:
    - **Windows (PowerShell)**:
        ```bash
        .\venv\Scripts\Activate
        ```
    - **Mac/Linux**:
        ```bash
        source venv/bin/activate
        ```

4.  Install Dependencies:
    ```bash
    pip install -r requirements.txt
    ```

5.  Run the Server:
    ```bash
    uvicorn main:app --reload
    ```
    The Backend API will be running at `http://localhost:8000`.

### 2. Frontend Setup

1.  Open a new terminal and navigate to the frontend folder:
    ```bash
    cd lowkey-secure\frontend
    ```

2.  Install Dependencies:
    ```bash
    npm install
    ```

3.  Run the Development Server:
    ```bash
    npm run dev
    ```
    The Frontend will be running at `http://localhost:5173`.

## 🧪 How to Test the Flow

1.  **Register Users**:
    - Go to `http://localhost:5173/register`.
    - Create a **University Admin** (Role: University Admin).
    - Create a **Club Lead** (Role: Club Lead).
    - Create a **Student** (Role: Student).

2.  **Issue Credential (Admin)**:
    - Login as **Admin**.
    - Issue a credential to the Student username you created.

3.  **Create Event (Club Lead)**:
    - Login as **Club Lead**.
    - Create a new Event.
    - Select attributes (Try selecting 'Email' to see the High Risk warning).

4.  **Consent & Access (Student)**:
    - Login as **Student**.
    - You will see your credentials in the Wallet.
    - Simulate scanning a QR code by entering the **Request ID** (seen on Club Dashboard) into the input field.
    - Review the **Risk Score** on the consent screen.
    - Click **"Slide to Consent"**.

5.  **Verify (Club Lead)**:
    - Go back to **Club Dashboard**.
    - Watch the **Live Feed** update with an "Anonymous Student" entry.
