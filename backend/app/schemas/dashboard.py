"""Dashboard aggregation schemas."""
from __future__ import annotations

from pydantic import BaseModel, Field

from app.schemas.city import CityOut
from app.schemas.trip import TripListItem


class TripCounts(BaseModel):
    total: int = 0
    upcoming: int = 0
    ongoing: int = 0
    completed: int = 0


class DashboardResponse(BaseModel):
    counts: TripCounts
    upcoming_trips: list[TripListItem] = Field(default_factory=list)
    recent_trips: list[TripListItem] = Field(default_factory=list)
    popular_cities: list[CityOut] = Field(default_factory=list)
