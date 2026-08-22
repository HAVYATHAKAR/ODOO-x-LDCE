"""Trip Health engine.

Scores a trip 0–100 and emits actionable insights. The signature diagnostic is
the *overpacked day*: any day with more than ``MAX_ACTIVITIES_PER_DAY`` items
earns a ``move_it_for_me`` insight, which the client can execute to have the
backend automatically rebalance the schedule. See PRD §11.3.
"""
from __future__ import annotations

from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.section import SectionActivity
from app.models.trip import Trip
from app.schemas.health import ACTION_MOVE_IT_FOR_ME, HealthInsight, TripHealth

MAX_ACTIVITIES_PER_DAY = 4
_OVERPACKED_PENALTY = 5
_EMPTY_TRIP_PENALTY = 20
_MAX_BUDGET_PENALTY = 30


def _activities_by_day(trip: Trip) -> dict[date, list[SectionActivity]]:
    by_day: dict[date, list[SectionActivity]] = defaultdict(list)
    for section in trip.sections:
        for act in section.activities:
            by_day[act.scheduled_date].append(act)
    return by_day


def _rating(score: int) -> str:
    if score >= 85:
        return "excellent"
    if score >= 70:
        return "good"
    if score >= 50:
        return "fair"
    return "needs work"


def evaluate(trip: Trip) -> TripHealth:
    score = 100
    insights: list[HealthInsight] = []

    # 1. Empty trip.
    if not trip.sections:
        score -= _EMPTY_TRIP_PENALTY
        insights.append(
            HealthInsight(
                code="empty_trip",
                severity="critical",
                message="This trip has no sections yet. Add your first stop to get started.",
            )
        )

    # 2. Budget overage.
    if trip.total_budget is not None:
        target = Decimal(trip.total_budget)
        planned = sum((Decimal(s.budget or 0) for s in trip.sections), Decimal("0"))
        if target > 0 and planned > target:
            over_ratio = float((planned - target) / target)
            penalty = min(_MAX_BUDGET_PENALTY, max(1, round(over_ratio * 100)))
            score -= penalty
            insights.append(
                HealthInsight(
                    code="over_budget",
                    severity="critical" if over_ratio >= 0.2 else "warning",
                    message=(
                        f"Planned spend ({planned:.0f} {trip.currency}) exceeds your "
                        f"budget ({target:.0f} {trip.currency})."
                    ),
                    meta={"planned": str(planned), "target": str(target)},
                )
            )
    else:
        insights.append(
            HealthInsight(
                code="no_budget_set",
                severity="info",
                message="No target budget set — add one to track spending.",
            )
        )

    # 3. Overpacked days.
    by_day = _activities_by_day(trip)
    overpacked = sorted(d for d, acts in by_day.items() if len(acts) > MAX_ACTIVITIES_PER_DAY)
    for day in overpacked:
        score -= _OVERPACKED_PENALTY
        insights.append(
            HealthInsight(
                code="overpacked_day",
                severity="warning",
                message=(
                    f"{day.isoformat()} has {len(by_day[day])} activities "
                    f"(max recommended {MAX_ACTIVITIES_PER_DAY}). Spread them out?"
                ),
                action=ACTION_MOVE_IT_FOR_ME,
                day=day,
                meta={"count": str(len(by_day[day]))},
            )
        )

    # 4. Positive note when nothing is wrong.
    if not insights or all(i.severity == "info" for i in insights):
        insights.insert(
            0,
            HealthInsight(
                code="looks_good",
                severity="info",
                message="Your itinerary looks well balanced. Have a great trip!",
            ),
        )

    score = max(0, min(100, score))
    return TripHealth(
        trip_id=trip.id,
        overall_score=score,
        rating=_rating(score),
        insights=insights,
    )


def apply_move_it_for_me(db: Session, trip: Trip) -> dict:
    """Rebalance the schedule so no day exceeds ``MAX_ACTIVITIES_PER_DAY``.

    Activities are walked in their current (date, section-order, item-order) order
    and packed left-to-right from the trip start, opening new days (extending past
    the trip end only if necessary) whenever a day fills up. Only rows whose date
    actually changes are written.
    """
    activities: list[SectionActivity] = []
    section_order = {s.id: s.sequence_order for s in trip.sections}
    for section in trip.sections:
        for act in section.activities:
            activities.append(act)

    activities.sort(
        key=lambda a: (
            a.scheduled_date,
            section_order.get(a.trip_section_id, 0),
            a.sequence_order,
        )
    )

    moves = 0
    current_day = trip.start_date
    placed_today = 0
    for act in activities:
        if placed_today >= MAX_ACTIVITIES_PER_DAY:
            current_day = current_day + timedelta(days=1)
            placed_today = 0
        if act.scheduled_date != current_day:
            act.scheduled_date = current_day
            moves += 1
        placed_today += 1

    db.flush()
    return {"moves": moves, "last_day": current_day.isoformat()}
