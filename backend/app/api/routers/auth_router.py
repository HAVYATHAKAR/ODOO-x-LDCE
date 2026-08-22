"""Authentication & session routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenPair,
)
from app.schemas.common import Message
from app.schemas.user import UserProfile
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = auth_service.register(db, payload)
    db.commit()
    db.refresh(user)
    return AuthResponse(user=UserProfile.model_validate(user), tokens=auth_service.issue_tokens(user))


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = auth_service.authenticate(db, identifier=payload.identifier, password=payload.password)
    return AuthResponse(user=UserProfile.model_validate(user), tokens=auth_service.issue_tokens(user))


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)) -> TokenPair:
    return auth_service.rotate_refresh(db, payload.refresh_token)


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(
    payload: ForgotPasswordRequest, db: Session = Depends(get_db)
) -> ForgotPasswordResponse:
    raw_token = auth_service.forgot_password(db, payload.email)
    db.commit()
    # Same message regardless of whether the email exists (no account enumeration).
    detail = "If that email is registered, a reset link has been sent."
    expose = raw_token if settings.ENVIRONMENT != "production" else None
    return ForgotPasswordResponse(detail=detail, reset_token=expose)


@router.post("/reset-password", response_model=Message)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)) -> Message:
    auth_service.reset_password(db, token=payload.token, new_password=payload.new_password)
    db.commit()
    return Message(detail="Your password has been reset. You can now log in.")


@router.get("/me", response_model=UserProfile)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.post("/change-password", response_model=Message)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Message:
    auth_service.change_password(
        db,
        user=current_user,
        current_password=payload.current_password,
        new_password=payload.new_password,
    )
    db.commit()
    return Message(detail="Password updated.")


@router.post("/logout", response_model=Message)
def logout(current_user: User = Depends(get_current_user)) -> Message:
    # Tokens are stateless; the client discards them. Endpoint exists for symmetry.
    return Message(detail="Logged out.")
