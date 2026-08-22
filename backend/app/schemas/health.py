"""Trip Health response schemas (see PRD §11.3).

Health is a 0–100 score plus actionable insights. Some insights carry an
``action`` code the frontend can turn into a one-click fix (e.g. the
``move_it_for_me`` overpacked-day rebalancer).
"""
from __future__ import annotations

from datetime import date

from pydantic import BaseModel, Field

# Insight actions the client can execute automatically.
ACTION_MOVE_IT_FOR_ME = "move_it_for_me"


class HealthInsight(BaseModel):
    code: str
    severity: str  # "info" | "warning" | "critical"
    message: str
    action: str | None = None
    section_id: int | None = None
    day: date | None = None
    meta: dict = Field(default_factory=dict)


class TripHealth(BaseModel):
    trip_id: int
    overall_score: int = Field(ge=0, le=100)
    rating: str  # "excellent" | "good" | "fair" | "needs work"
    insights: list[HealthInsight] = Field(default_factory=list)
