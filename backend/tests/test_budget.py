"""Budget engine math (PRD §11.3 / action_plan §4.1)."""
from __future__ import annotations

from datetime import date
from decimal import Decimal

from app.models.section import SectionActivity, TripSection
from app.models.trip import Trip
from app.models.user import User
from app.services import budget_service


def _make_trip_with_budget(db) -> Trip:
    user = User(username="budgeter", email="b@example.com", password_hash="x")
    db.add(user)
    db.flush()

    trip = Trip(
        user_id=user.id,
        name="Budget Trip",
        start_date=date(2030, 1, 1),
        end_date=date(2030, 1, 2),  # 2 days
        currency="INR",
        total_budget=Decimal("12000"),
    )
    db.add(trip)
    db.flush()

    transport = TripSection(
        trip_id=trip.id, title="Flights", section_type="transport",
        start_date=date(2030, 1, 1), end_date=date(2030, 1, 1),
        budget=Decimal("8000"), sequence_order=0,
    )
    food = TripSection(
        trip_id=trip.id, title="Meals", section_type="food",
        start_date=date(2030, 1, 1), end_date=date(2030, 1, 2),
        budget=Decimal("2000"), sequence_order=1,
    )
    db.add_all([transport, food])
    db.flush()

    db.add_all([
        SectionActivity(
            trip_section_id=transport.id, custom_name="Airfare",
            scheduled_date=date(2030, 1, 1), sequence_order=0, expense=Decimal("5000"),
        ),
        SectionActivity(
            trip_section_id=food.id, custom_name="Lunch",
            scheduled_date=date(2030, 1, 1), sequence_order=0, expense=Decimal("500"),
        ),
        SectionActivity(
            trip_section_id=food.id, custom_name="Dinner",
            scheduled_date=date(2030, 1, 2), sequence_order=1, expense=Decimal("700"),
        ),
    ])
    db.commit()
    return trip


def test_budget_totals_and_variance(db):
    trip = _make_trip_with_budget(db)
    summary = budget_service.compute(trip)

    assert summary.total_planned == Decimal("10000.00")
    assert summary.total_actual == Decimal("6200.00")
    # variance = target - planned
    assert summary.variance == Decimal("2000.00")
    # per_day = planned / num_days (2 days)
    assert summary.per_day == Decimal("5000.00")
    assert summary.currency == "INR"


def test_budget_breakdown_by_category(db):
    trip = _make_trip_with_budget(db)
    summary = budget_service.compute(trip)

    assert summary.breakdown["transport"].planned == Decimal("8000.00")
    assert summary.breakdown["transport"].actual == Decimal("5000.00")
    assert summary.breakdown["food"].planned == Decimal("2000.00")
    assert summary.breakdown["food"].actual == Decimal("1200.00")


def test_budget_without_target_has_no_variance(db):
    user = User(username="nobudget", email="nb@example.com", password_hash="x")
    db.add(user)
    db.flush()
    trip = Trip(
        user_id=user.id, name="No Budget", start_date=date(2030, 5, 1),
        end_date=date(2030, 5, 1), currency="INR", total_budget=None,
    )
    db.add(trip)
    db.commit()

    summary = budget_service.compute(trip)
    assert summary.target_budget is None
    assert summary.variance is None
    assert summary.total_planned == Decimal("0.00")
