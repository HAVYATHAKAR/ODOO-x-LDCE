"""User & password-reset-token persistence."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.user import PasswordResetToken, User
from app.schemas.user import UserUpdate


def get(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def get_active(db: Session, user_id: int) -> User | None:
    user = db.get(User, user_id)
    if user is None or user.deleted_at is not None:
        return None
    return user


def get_by_username(db: Session, username: str) -> User | None:
    return db.scalar(select(User).where(func.lower(User.username) == username.strip().lower()))


def get_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(func.lower(User.email) == email.strip().lower()))


def get_by_identifier(db: Session, identifier: str) -> User | None:
    """Look up by username OR email (case-insensitive)."""
    ident = identifier.strip().lower()
    return db.scalar(
        select(User).where(
            or_(func.lower(User.username) == ident, func.lower(User.email) == ident)
        )
    )


def create(
    db: Session,
    *,
    username: str,
    email: str,
    password_hash: str,
    first_name: str | None = None,
    last_name: str | None = None,
    is_admin: bool = False,
) -> User:
    user = User(
        username=username.strip().lower(),
        email=email.strip().lower(),
        password_hash=password_hash,
        first_name=first_name,
        last_name=last_name,
        is_admin=is_admin,
    )
    db.add(user)
    db.flush()
    return user


def update_profile(db: Session, user: User, data: UserUpdate) -> User:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.flush()
    return user


def set_password(db: Session, user: User, password_hash: str) -> User:
    user.password_hash = password_hash
    db.flush()
    return user


def soft_delete(db: Session, user: User) -> None:
    user.deleted_at = datetime.now(timezone.utc)
    db.flush()


def count(db: Session) -> int:
    return db.scalar(select(func.count()).select_from(User).where(User.deleted_at.is_(None))) or 0


# ── Password reset tokens ────────────────────────────────────
def create_reset_token(
    db: Session, *, user: User, token_hash: str, expires_at: datetime
) -> PasswordResetToken:
    token = PasswordResetToken(user_id=user.id, token_hash=token_hash, expires_at=expires_at)
    db.add(token)
    db.flush()
    return token


def get_valid_reset_token(db: Session, token_hash: str) -> PasswordResetToken | None:
    now = datetime.now(timezone.utc)
    token = db.scalar(
        select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash)
    )
    if token is None or token.used_at is not None:
        return None
    expires_at = token.expires_at
    # Normalize to aware for a correct comparison (SQLite may return naive datetimes).
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < now:
        return None
    return token


def mark_reset_token_used(db: Session, token: PasswordResetToken) -> None:
    token.used_at = datetime.now(timezone.utc)
    db.flush()
