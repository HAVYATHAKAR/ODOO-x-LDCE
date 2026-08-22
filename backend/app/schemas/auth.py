"""Authentication request/response schemas."""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.schemas.user import UserProfile


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    first_name: str | None = Field(default=None, max_length=120)
    last_name: str | None = Field(default=None, max_length=120)

    @field_validator("username")
    @classmethod
    def _normalize_username(cls, v: str) -> str:
        v = v.strip()
        if not v.replace("_", "").replace("-", "").replace(".", "").isalnum():
            raise ValueError("username may only contain letters, numbers, '.', '-', '_'")
        return v.lower()


class LoginRequest(BaseModel):
    # ``identifier`` accepts either a username or an email.
    identifier: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=1, max_length=128)


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class AuthResponse(BaseModel):
    """Returned by register & login: the profile plus a fresh token pair."""

    user: UserProfile
    tokens: TokenPair


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    """Always returns the same detail to avoid leaking which emails exist.

    ``reset_token`` is included ONLY in non-production environments so the flow
    is testable without a real mailer.
    """

    detail: str
    reset_token: str | None = None


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class TokenPayload(BaseModel):
    model_config = ConfigDict(extra="ignore")

    sub: str
    type: str
    exp: int
    iat: int
