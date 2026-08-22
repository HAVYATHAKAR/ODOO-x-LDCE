"""User profile schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import EmailStr, Field

from app.schemas.common import ORMModel


class UserPublic(ORMModel):
    """Minimal identity shown to other users (e.g. as a post author)."""

    id: int
    username: str
    first_name: str | None = None
    last_name: str | None = None
    avatar_url: str | None = None


class UserProfile(ORMModel):
    """The authenticated user's own profile."""

    id: int
    username: str
    email: EmailStr
    first_name: str | None = None
    last_name: str | None = None
    phone_number: str | None = None
    city: str | None = None
    country: str | None = None
    additional_info: str | None = None
    avatar_url: str | None = None
    language_pref: str
    is_admin: bool
    created_at: datetime


class UserUpdate(ORMModel):
    """Editable profile fields. All optional — only provided fields change."""

    first_name: str | None = Field(default=None, max_length=120)
    last_name: str | None = Field(default=None, max_length=120)
    phone_number: str | None = Field(default=None, max_length=40)
    city: str | None = Field(default=None, max_length=120)
    country: str | None = Field(default=None, max_length=120)
    additional_info: str | None = None
    avatar_url: str | None = Field(default=None, max_length=500)
    language_pref: str | None = Field(default=None, max_length=10)
