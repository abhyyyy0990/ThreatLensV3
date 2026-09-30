"""Authentication service — JWT creation, verification, and password checking."""
from __future__ import annotations

import os
import hashlib
import base64
import logging
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

logger = logging.getLogger(__name__)

_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "changeme-insecure-default-key")
_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "24"))
_ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
_ADMIN_PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH", "")


def _verify_password(plain: str, stored_hash: str) -> bool:
    """Verify a plain password against a PBKDF2-SHA256 stored hash (salt:b64hash)."""
    try:
        salt, b64hash = stored_hash.split(":", 1)
        candidate = hashlib.pbkdf2_hmac("sha256", plain.encode(), salt.encode(), 260000)
        return base64.b64encode(candidate).decode() == b64hash
    except Exception:
        return False


def authenticate_user(username: str, password: str) -> bool:
    """Return True if credentials match the configured admin account."""
    if username.strip().lower() != _ADMIN_USERNAME.strip().lower():
        return False
    return _verify_password(password, _ADMIN_PASSWORD_HASH)


def create_access_token(username: str) -> str:
    """Create a signed JWT access token valid for JWT_EXPIRE_HOURS hours."""
    expire = datetime.now(timezone.utc) + timedelta(hours=_EXPIRE_HOURS)
    payload = {
        "sub": username,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, _SECRET_KEY, algorithm=_ALGORITHM)


def decode_token(token: str) -> str | None:
    """
    Decode and validate a JWT. Returns the username (sub) on success, None on failure.
    """
    try:
        payload = jwt.decode(token, _SECRET_KEY, algorithms=[_ALGORITHM])
        return payload.get("sub")
    except JWTError as e:
        logger.debug("JWT decode failed: %s", e)
        return None
