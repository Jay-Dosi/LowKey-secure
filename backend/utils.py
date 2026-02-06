from jose import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
import datetime
import os

# Persist keys to files so they survive server restarts
PRIVATE_KEY_FILE = "private_key.pem"
PUBLIC_KEY_FILE = "public_key.pem"

def load_or_generate_keys():
    """Load existing keys or generate new ones if they don't exist"""
    if os.path.exists(PRIVATE_KEY_FILE) and os.path.exists(PUBLIC_KEY_FILE):
        # Load existing keys
        with open(PRIVATE_KEY_FILE, "rb") as f:
            priv_key = serialization.load_pem_private_key(f.read(), password=None)
        with open(PUBLIC_KEY_FILE, "rb") as f:
            pub_key = serialization.load_pem_public_key(f.read())
        print("✅ Loaded existing RSA keys")
        return priv_key, pub_key
    else:
        # Generate new keys
        priv_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )
        pub_key = priv_key.public_key()
        
        # Save keys to files
        with open(PRIVATE_KEY_FILE, "wb") as f:
            f.write(priv_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            ))
        with open(PUBLIC_KEY_FILE, "wb") as f:
            f.write(pub_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            ))
        print("🔐 Generated and saved new RSA keys")
        return priv_key, pub_key

private_key, public_key = load_or_generate_keys()

def sign_credential(payload: dict):
    pem_private = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    # python-jose handles the PEM key
    token = jwt.encode(payload, pem_private, algorithm='RS256')
    return token

def verify_credential(token: str):
    pem_public = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    try:
        payload = jwt.decode(token, pem_public, algorithms=['RS256'])
        return payload
    except Exception as e:
        print(f"Verification failed: {e}")
        return None


# Privacy Guardian Logic
MEDIUM_RISK_PII = ['name', 'email']  # Moderate exposure - identifiable but not sensitive
HIGH_RISK_PII = ['phone', 'student_id', 'photo', 'ssn', 'address']  # High exposure - sensitive PII

def analyze_privacy_risk(requested_attributes: list):
    risk_level = "LOW"
    message = "✅ Safe. Anonymous eligibility check only."
    
    has_medium = False
    for attr in requested_attributes:
        attr_lower = attr.lower()
        if attr_lower in HIGH_RISK_PII:
            risk_level = "HIGH"
            message = "⚠️ This request exposes sensitive personal data."
            return risk_level, message
        if attr_lower in MEDIUM_RISK_PII:
            has_medium = True
    
    if has_medium:
        risk_level = "MEDIUM"
        message = "⚡ This request exposes your name/email identity."
            
    return risk_level, message

def get_ist_now():
    """Helper to get current IST timestamp"""
    import time
    from datetime import datetime
    from zoneinfo import ZoneInfo
    utc_timestamp = time.time()
    utc_dt = datetime.fromtimestamp(utc_timestamp, tz=ZoneInfo("UTC"))
    return utc_dt.astimezone(ZoneInfo("Asia/Kolkata"))
