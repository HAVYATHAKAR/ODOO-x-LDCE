"""Saved destinations (city bookmarks) schemas."""
from __future__ import annotations

from datetime import datetime

from app.schemas.city import CityOut
from app.schemas.common import ORMModel


class SavedCreate(ORMModel):
    city_id: int


class SavedOut(ORMModel):
    id: int
    created_at: datetime
    city: CityOut
