"""User accounts and password-reset tokens."""
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, BigIntPK, TimestampMixin

if TYPE_CHECKING:  # pragma: no cover
    from app.models.community import CommunityComment, CommunityLike, CommunityPost, SavedDestination
    from app.models.trip import Trip


class User(Base, TimestampMixin):
    """Login by username+password; full profile from registration. Soft-deleted.

    ``username``/``email`` are stored lowercased at the application layer so a
    plain unique index gives case-insensitive uniqueness on SQLite; the Postgres
    migration promotes them to ``citext`` for true case-insensitive collation.
    """

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigIntPK, primary_key=True)
    username: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    first_name: Mapped[str | None] = mapped_column(String(80))
    last_name: Mapped[str | None] = mapped_column(String(80))
    phone_number: Mapped[str | None] = mapped_column(String(20))
    city: Mapped[str | None] = mapped_column(String(120))
    country: Mapped[str | None] = mapped_column(String(120))
    additional_info: Mapped[str | None] = mapped_column(Text)
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    language_pref: Mapped[str] = mapped_column(String(10), nullable=False, default="en")
    is_admin: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Relationships (user → trips is RESTRICT: we soft-delete, never cascade)
    trips: Mapped[list["Trip"]] = relationship("Trip", back_populates="owner")
    saved_destinations: Mapped[list["SavedDestination"]] = relationship(
        "SavedDestination", back_populates="user", cascade="all, delete-orphan", passive_deletes=True
    )
    posts: Mapped[list["CommunityPost"]] = relationship(
        "CommunityPost", back_populates="author", cascade="all, delete-orphan", passive_deletes=True
    )
    comments: Mapped[list["CommunityComment"]] = relationship(
        "CommunityComment", back_populates="author", cascade="all, delete-orphan", passive_deletes=True
    )
    likes: Mapped[list["CommunityLike"]] = relationship(
        "CommunityLike", back_populates="user", cascade="all, delete-orphan", passive_deletes=True
    )
    reset_tokens: Mapped[list["PasswordResetToken"]] = relationship(
        "PasswordResetToken", back_populates="user", cascade="all, delete-orphan", passive_deletes=True
    )

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None

    @property
    def full_name(self) -> str:
        return f"{self.first_name or ''} {self.last_name or ''}".strip()


class PasswordResetToken(Base):
    """Single-use, expiring, hashed password-reset token."""

    __tablename__ = "password_reset_tokens"

    id: Mapped[int] = mapped_column(BigIntPK, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="reset_tokens")
