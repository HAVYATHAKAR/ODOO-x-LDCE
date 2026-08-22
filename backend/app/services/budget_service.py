"""Budget engine.

Aggregates a trip's *planned* spend (section budgets) and *actual* spend
(scheduled-activity expenses), broken down by section type, and compares the
plan against the trip's target budget. See PRD §11.3.
"""
from __future__ import annotations

from decimal import Decimal

from app.models.trip import Trip
from app.schemas.budget import BudgetSummary, CategoryBreakdown

_CENTS = Decimal("0.01")


def _q(value: Decimal) -> Decimal:
    return value.quantize(_CENTS)


def compute(trip: Trip) -> BudgetSummary:
    """Compute a budget summary from an already-loaded trip (with sections+activities)."""
    breakdown: dict[str, CategoryBreakdown] = {}
    total_planned = Decimal("0")
    total_actual = Decimal("0")

    for section in trip.sections:
        category = section.section_type
        entry = breakdown.setdefault(category, CategoryBreakdown())
        planned = Decimal(section.budget or 0)
        entry.planned += planned
        total_planned += planned

        for act in section.activities:
            expense = Decimal(act.expense or 0)
            entry.actual += expense
            total_actual += expense

    for entry in breakdown.values():
        entry.planned = _q(entry.planned)
        entry.actual = _q(entry.actual)

    target = Decimal(trip.total_budget) if trip.total_budget is not None else None
    variance = _q(target - total_planned) if target is not None else None

    num_days = trip.num_days or 1
    per_day = _q(total_planned / num_days) if num_days else None

    return BudgetSummary(
        trip_id=trip.id,
        currency=trip.currency,
        target_budget=_q(target) if target is not None else None,
        total_planned=_q(total_planned),
        total_actual=_q(total_actual),
        variance=variance,
        per_day=per_day,
        breakdown=breakdown,
    )
