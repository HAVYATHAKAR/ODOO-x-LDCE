"""Authentication orchestration: registration, login, token rotation, and the
password-reset / change flows. Keeps routers thin and free of security details.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import jwt

from sqlalchemy.orm import Session

from app.core import security
from app.core.config import settings
from app.core.exceptions import AuthError, ConflictError
from app.crud import crud_user
from app.models.user import User
from app.schemas.auth import RegisterRequest, TokenPair


def register(db: Session, data: RegisterRequest) -> User:
    if crud_user.get_by_username(db, data.username):
        raise ConflictError("That username is already taken")
    if crud_user.get_by_email(db, data.email):
        raise ConflictError("An account with that email already exists")
    return crud_user.create(
        db,
        username=data.username,
        email=data.email,
        password_hash=security.hash_password(data.password),
        first_name=data.first_name,
        last_name=data.last_name,
    )


def authenticate(db: Session, *, identifier: str, password: str) -> User:
    user = crud_user.get_by_identifier(db, identifier)
    if user is None:
        # Run a throwaway verify so response timing doesn't reveal missing users.
        security.pwd_context.dummy_verify()
        raise AuthError("Invalid credentials")
    if not security.verify_password(password, user.password_hash):
        raise AuthError("Invalid credentials")
    if user.deleted_at is not None:
        raise AuthError("This account is no longer active")
    return user


def issue_tokens(user: User) -> TokenPair:
    return TokenPair(
        access_token=security.create_access_token(user.id),
        refresh_token=security.create_refresh_token(user.id),
    )


def rotate_refresh(db: Session, refresh_token: str) -> TokenPair:
    try:
        payload = security.decode_token(refresh_token, expected_type=security.TOKEN_TYPE_REFRESH)
    except jwt.PyJWTError as exc:  # invalid/expired/wrong-type
        raise AuthError("Invalid or expired refresh token") from exc
    user = crud_user.get_active(db, int(payload["sub"]))
    if user is None:
        raise AuthError("Account not found")
    return issue_tokens(user)


def forgot_password(db: Session, email: str) -> str | None:
    """Create a single-use reset token. Returns the raw token, or ``None`` if the
    email is unknown (callers must not reveal which)."""
    user = crud_user.get_by_email(db, email)
    if user is None or user.deleted_at is not None:
        return None
    raw, token_hash = security.generate_reset_token()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.RESET_TOKEN_MINUTES)
    crud_user.create_reset_token(db, user=user, token_hash=token_hash, expires_at=expires_at)
    return raw


def reset_password(db: Session, *, token: str, new_password: str) -> None:
    token_hash = security.hash_reset_token(token)
    record = crud_user.get_valid_reset_token(db, token_hash)
    if record is None:
        raise AuthError("Invalid or expired reset token")
    user = crud_user.get(db, record.user_id)
    if user is None:
        raise AuthError("Account not found")
    crud_user.set_password(db, user, security.hash_password(new_password))
    crud_user.mark_reset_token_used(db, record)


def change_password(db: Session, *, user: User, current_password: str, new_password: str) -> None:
    if not security.verify_password(current_password, user.password_hash):
        raise AuthError("Current password is incorrect")
    crud_user.set_password(db, user, security.hash_password(new_password))
