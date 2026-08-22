"""Activity catalog schemas."""
from __future__ import annotations

from decimal import Decimal

from pydantic import Field

from app.schemas.common import ORMModel


class ActivityBase(ORMModel):
    name: str = Field(max_length=160)
    category: str = Field(max_length=40)
    description: str | None = None
    estimated_cost: Decimal = Field(default=Decimal("0"), ge=0)
    duration_minutes: int | None = Field(default=None, ge=0)
    image_url: str | None = Field(default=None, max_length=500)


class ActivityCreate(ActivityBase):
    city_id: int


class ActivityUpdate(ORMModel):
    name: str | None = Field(default=None, max_length=160)
    category: str | None = Field(default=None, max_length=40)
    description: str | None = None
    estimated_cost: Decimal | None = Field(default=None, ge=0)
    duration_minutes: int | None = Field(default=None, ge=0)
    image_url: str | None = Field(default=None, max_length=500)


class ActivityOut(ActivityBase):
    id: int
    city_id: int
