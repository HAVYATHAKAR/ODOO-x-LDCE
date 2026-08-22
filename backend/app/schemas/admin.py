"""Admin analytics schemas."""
from __future__ import annotations

from pydantic import BaseModel, Field

from app.schemas.activity import ActivityOut
from app.schemas.city import CityOut


class PopularCity(BaseModel):
    city: CityOut
    usage_count: int


class PopularActivity(BaseModel):
    activity: ActivityOut
    usage_count: int


class AdminOverview(BaseModel):
    user_count: int
    trip_count: int
    public_trip_count: int
    city_count: int
    activity_count: int
    post_count: int
    popular_cities: list[PopularCity] = Field(default_factory=list)
    popular_activities: list[PopularActivity] = Field(default_factory=list)
