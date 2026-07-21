from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from supabase import create_client
from app.database import get_db
from app.models import User
import os
from jose import jwt
import requests

bearer_scheme = HTTPBearer()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_ANON_KEY"),
)
supabase_admin = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
)

JWKS_URL = f"{os.getenv('SUPABASE_URL')}/auth/v1/.well-known/jwks.json"
_jwks_cache = None

def get_jwks():
    # Fetch and cache the signing keys lazily on first use. Doing this at import
    # time means one transient network blip on startup crashes the whole app;
    # fetching on demand keeps the service up and degrades a single request instead.
    global _jwks_cache
    if _jwks_cache is None:
        _jwks_cache = requests.get(JWKS_URL, timeout=10).json()
    return _jwks_cache

def find_signing_key(token: str):
    token_header = jwt.get_unverified_header(token)
    for key in get_jwks()["keys"]:
        if key["kid"] == token_header["kid"]:
            return key
    return None

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials

    try:
        signing_key = find_signing_key(token)
    except requests.RequestException:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth key service temporarily unavailable",
        )
    if not signing_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    try:
        payload = jwt.decode(token, signing_key, algorithms=["ES256"], audience="authenticated")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.query(User).filter(User.email == payload["email"]).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return user

