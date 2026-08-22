"""Security primitives: password hashing, JWT access/refresh tokens, and
single-use password-reset token helpers.
"""
from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

TOKEN_TYPE_ACCESS = "access"
TOKEN_TYPE_REFRESH = "refresh"


# ── Passwords ────────────────────────────────────────────────
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    try:
        return pwd_context.verify(plain_password, password_hash)
    except ValueError:
        return False


# ── JWTs ─────────────────────────────────────────────────────
def _create_token(subject: Any, token_type: str, expires_delta: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(subject),
        "type": token_type,
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_access_token(user_id: int) -> str:
    return _create_token(user_id, TOKEN_TYPE_ACCESS, timedelta(minutes=settings.JWT_ACCESS_MINUTES))


def create_refresh_token(user_id: int) -> str:
    return _create_token(user_id, TOKEN_TYPE_REFRESH, timedelta(days=settings.JWT_REFRESH_DAYS))


def decode_token(token: str, expected_type: str | None = None) -> dict:
    """Decode/verify a JWT. Raises ``jwt.PyJWTError`` on any problem."""
    payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    if expected_type is not None and payload.get("type") != expected_type:
        raise jwt.InvalidTokenError("unexpected token type")
    return payload


# ── Password-reset tokens (store only the hash) ──────────────
def generate_reset_token() -> tuple[str, str]:
    """Return ``(raw_token, token_hash)``. Only the hash is persisted."""
    raw = secrets.token_urlsafe(32)
    return raw, hash_reset_token(raw)


def hash_reset_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
