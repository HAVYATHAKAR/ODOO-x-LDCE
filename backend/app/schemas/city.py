"""City catalog schemas."""
from __future__ import annotations

from decimal import Decimal

from pydantic import Field

from app.schemas.common import ORMModel


class CityBase(ORMModel):
    name: str = Field(max_length=120)
    country: str = Field(max_length=120)
    region: str | None = Field(default=None, max_length=120)
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    cost_index: Decimal = Field(default=Decimal("100"), ge=0)
    popularity_score: int = Field(default=0, ge=0)
    image_url: str | None = Field(default=None, max_length=500)
    description: str | None = None


class CityCreate(CityBase):
    pass


class CityUpdate(ORMModel):
    name: str | None = Field(default=None, max_length=120)
    country: str | None = Field(default=None, max_length=120)
    region: str | None = Field(default=None, max_length=120)
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    cost_index: Decimal | None = Field(default=None, ge=0)
    popularity_score: int | None = Field(default=None, ge=0)
    image_url: str | None = Field(default=None, max_length=500)
    description: str | None = None


class CityOut(CityBase):
    id: int


class CitySummary(ORMModel):
    """Lightweight city reference embedded in trip/section responses."""

    id: int
    name: str
    country: str
    image_url: str | None = None
