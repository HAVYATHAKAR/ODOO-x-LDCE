"""Trip section & section-activity schemas (the itinerary building blocks)."""
from __future__ import annotations

from datetime import date, time
from decimal import Decimal

from pydantic import Field, field_validator, model_validator

from app.models.section import SECTION_TYPES
from app.schemas.activity import ActivityOut
from app.schemas.city import CitySummary
from app.schemas.common import ORMModel


# ── Section activities ───────────────────────────────────────
class SectionActivityCreate(ORMModel):
    activity_id: int | None = None
    custom_name: str | None = Field(default=None, max_length=160)
    scheduled_date: date
    scheduled_time: time | None = None
    expense: Decimal = Field(default=Decimal("0"), ge=0)
    notes: str | None = None

    @model_validator(mode="after")
    def _require_identity(self) -> "SectionActivityCreate":
        if self.activity_id is None and not (self.custom_name and self.custom_name.strip()):
            raise ValueError("either activity_id or custom_name is required")
        return self


class SectionActivityUpdate(ORMModel):
    activity_id: int | None = None
    custom_name: str | None = Field(default=None, max_length=160)
    scheduled_date: date | None = None
    scheduled_time: time | None = None
    expense: Decimal | None = Field(default=None, ge=0)
    notes: str | None = None


class SectionActivityOut(ORMModel):
    id: int
    trip_section_id: int
    activity_id: int | None = None
    custom_name: str | None = None
    display_name: str
    scheduled_date: date
    scheduled_time: time | None = None
    sequence_order: int
    expense: Decimal
    notes: str | None = None
    activity: ActivityOut | None = None


# ── Sections ─────────────────────────────────────────────────
class TripSectionCreate(ORMModel):
    title: str = Field(max_length=160)
    description: str | None = None
    section_type: str = Field(max_length=20)
    city_id: int | None = None
    start_date: date
    end_date: date
    budget: Decimal = Field(default=Decimal("0"), ge=0)
    notes: str | None = None

    @field_validator("section_type")
    @classmethod
    def _valid_type(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in SECTION_TYPES:
            raise ValueError(f"section_type must be one of {', '.join(SECTION_TYPES)}")
        return v

    @model_validator(mode="after")
    def _date_order(self) -> "TripSectionCreate":
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class TripSectionUpdate(ORMModel):
    title: str | None = Field(default=None, max_length=160)
    description: str | None = None
    section_type: str | None = Field(default=None, max_length=20)
    city_id: int | None = None
    start_date: date | None = None
    end_date: date | None = None
    budget: Decimal | None = Field(default=None, ge=0)
    notes: str | None = None

    @field_validator("section_type")
    @classmethod
    def _valid_type(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip().lower()
        if v not in SECTION_TYPES:
            raise ValueError(f"section_type must be one of {', '.join(SECTION_TYPES)}")
        return v


class TripSectionOut(ORMModel):
    id: int
    trip_id: int
    title: str
    description: str | None = None
    section_type: str
    city_id: int | None = None
    start_date: date
    end_date: date
    budget: Decimal
    sequence_order: int
    notes: str | None = None
    city: CitySummary | None = None
    activities: list[SectionActivityOut] = Field(default_factory=list)


# ── Reordering ───────────────────────────────────────────────
class ReorderRequest(ORMModel):
    """A complete, gap-free permutation of the child ids to persist as the new order."""

    ordered_ids: list[int] = Field(min_length=1)

    @field_validator("ordered_ids")
    @classmethod
    def _unique(cls, v: list[int]) -> list[int]:
        if len(set(v)) != len(v):
            raise ValueError("ordered_ids must not contain duplicates")
        return v
