"""Shared FastAPI dependencies: DB session, current user, admin gate, ownership."""
from __future__ import annotations

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import AuthError, NotFoundError, PermissionDeniedError
from app.core.security import TOKEN_TYPE_ACCESS, decode_token
from app.crud import crud_trip, crud_user
from app.models.trip import Trip
from app.models.user import User

# auto_error=False lets us return 401 (not FastAPI's default 403) for missing tokens.
_bearer = HTTPBearer(auto_error=False, description="JWT access token")


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise AuthError("Not authenticated")
    try:
        payload = decode_token(credentials.credentials, expected_type=TOKEN_TYPE_ACCESS)
    except jwt.PyJWTError as exc:
        raise AuthError("Could not validate credentials") from exc
    user = crud_user.get_active(db, int(payload["sub"]))
    if user is None:
        raise AuthError("Account not found")
    return user


def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User | None:
    """Like ``get_current_user`` but returns ``None`` instead of raising.

    Used by endpoints that are public yet personalize when a token is present
    (e.g. ``liked_by_me`` on community posts)."""
    if credentials is None:
        return None
    try:
        payload = decode_token(credentials.credentials, expected_type=TOKEN_TYPE_ACCESS)
    except jwt.PyJWTError:
        return None
    return crud_user.get_active(db, int(payload["sub"]))


def get_current_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise PermissionDeniedError("Administrator access required")
    return user


def get_owned_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Trip:
    trip = crud_trip.get(db, trip_id)
    if trip is None:
        raise NotFoundError("Trip not found")
    if trip.user_id != user.id:
        raise PermissionDeniedError("You don't have access to this trip")
    return trip


def get_owned_trip_detail(
    trip_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Trip:
    trip = crud_trip.get_detail(db, trip_id)
    if trip is None:
        raise NotFoundError("Trip not found")
    if trip.user_id != user.id:
        raise PermissionDeniedError("You don't have access to this trip")
    return trip
