from jose import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
import datetime

# Generate keys on fresh start for the MVP University Issuer
private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
)
public_key = private_key.public_key()

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
HIGH_RISK_PII = ['name', 'email', 'phone', 'student_id', 'photo', 'ssn', 'address']

def analyze_privacy_risk(requested_attributes: list):
    risk_level = "LOW"
    message = "✅ Safe. Anonymous eligibility check only."
    
    for attr in requested_attributes:
        if attr.lower() in HIGH_RISK_PII:
            risk_level = "HIGH"
            message = "⚠️ This request exposes your real identity."
            return risk_level, message
            
    return risk_level, message
