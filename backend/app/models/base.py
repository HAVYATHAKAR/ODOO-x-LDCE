"""Declarative base, shared column types, and a timestamp mixin.

``BigIntPK`` renders as BIGINT on PostgreSQL and INTEGER (autoincrementing) on
SQLite, so ``bigint`` primary keys per the canonical schema work in production
while the SQLite dev/test path still autoincrements correctly.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Integer, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Declarative base shared by every ORM model."""


# BIGINT (Postgres) / INTEGER autoincrement (SQLite)
BigIntPK = BigInteger().with_variant(Integer, "sqlite")


class TimestampMixin:
    """Adds ``created_at`` / ``updated_at`` managed by the database clock."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
