"""Trip schemas, including derived status and the public (shared) view."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import Field, computed_field, model_validator

from app.schemas.common import ORMModel
from app.schemas.section import TripSectionOut
from app.schemas.user import UserPublic


def derive_status(start: date, end: date, today: date | None = None) -> str:
    """Trip status is a pure function of its dates — never stored."""
    today = today or date.today()
    if today < start:
        return "upcoming"
    if today > end:
        return "completed"
    return "ongoing"


class _TripDatesMixin(ORMModel):
    start_date: date
    end_date: date

    @computed_field  # type: ignore[prop-decorator]
    @property
    def num_days(self) -> int:
        return (self.end_date - self.start_date).days + 1

    @computed_field  # type: ignore[prop-decorator]
    @property
    def status(self) -> str:
        return derive_status(self.start_date, self.end_date)


class TripCreate(ORMModel):
    name: str = Field(max_length=160)
    description: str | None = None
    start_date: date
    end_date: date
    cover_photo_url: str | None = Field(default=None, max_length=500)
    total_budget: Decimal | None = Field(default=None, ge=0)
    currency: str = Field(default="INR", min_length=3, max_length=3)

    @model_validator(mode="after")
    def _date_order(self) -> "TripCreate":
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class TripUpdate(ORMModel):
    name: str | None = Field(default=None, max_length=160)
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    cover_photo_url: str | None = Field(default=None, max_length=500)
    total_budget: Decimal | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    is_public: bool | None = None
    show_public_budget: bool | None = None


class TripListItem(_TripDatesMixin):
    id: int
    name: str
    description: str | None = None
    cover_photo_url: str | None = None
    total_budget: Decimal | None = None
    currency: str
    is_public: bool
    created_at: datetime


class TripDetail(_TripDatesMixin):
    id: int
    user_id: int
    name: str
    description: str | None = None
    cover_photo_url: str | None = None
    total_budget: Decimal | None = None
    currency: str
    is_public: bool
    show_public_budget: bool
    public_slug: str | None = None
    copied_from_trip_id: int | None = None
    created_at: datetime
    updated_at: datetime
    owner: UserPublic
    sections: list[TripSectionOut] = Field(default_factory=list)


class PublicTripOut(_TripDatesMixin):
    """Read-only shared view. Budget fields appear only when the owner opted in."""

    id: int
    name: str
    description: str | None = None
    cover_photo_url: str | None = None
    currency: str
    public_slug: str
    owner: UserPublic
    show_budget: bool = False
    total_budget: Decimal | None = None
    sections: list[TripSectionOut] = Field(default_factory=list)


class ShareResponse(ORMModel):
    """Result of publishing/unpublishing a trip."""

    is_public: bool
    public_slug: str | None = None
    public_path: str | None = None
