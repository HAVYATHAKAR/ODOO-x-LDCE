"""Budget engine response schemas (see PRD §11.3)."""
from __future__ import annotations

from decimal import Decimal

from pydantic import BaseModel, Field


class CategoryBreakdown(BaseModel):
    planned: Decimal = Decimal("0")
    actual: Decimal = Decimal("0")


class BudgetSummary(BaseModel):
    trip_id: int
    currency: str
    target_budget: Decimal | None = None
    total_planned: Decimal = Decimal("0")
    total_actual: Decimal = Decimal("0")
    # variance = target_budget - total_planned; positive means budget to spare.
    variance: Decimal | None = None
    per_day: Decimal | None = None
    breakdown: dict[str, CategoryBreakdown] = Field(default_factory=dict)
