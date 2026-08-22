"""Trip Health scoring and the 'move it for me' rebalancer (PRD §11.3 / action_plan §4.2)."""
from __future__ import annotations

from datetime import date
from decimal import Decimal

from app.models.section import SectionActivity, TripSection
from app.models.trip import Trip
from app.models.user import User
from app.services import health_service


def _user(db) -> User:
    user = User(username="health", email="h@example.com", password_hash="x")
    db.add(user)
    db.flush()
    return user


def test_empty_trip_is_penalized(db):
    trip = Trip(
        user_id=_user(db).id, name="Empty", start_date=date(2030, 1, 1),
        end_date=date(2030, 1, 3), currency="INR", total_budget=Decimal("1000"),
    )
    db.add(trip)
    db.commit()

    health = health_service.evaluate(trip)
    assert health.overall_score == 80  # 100 - 20
    codes = {i.code for i in health.insights}
    assert "empty_trip" in codes


def _packed_trip(db, activity_count: int = 6) -> Trip:
    trip = Trip(
        user_id=_user(db).id, name="Packed", start_date=date(2030, 1, 1),
        end_date=date(2030, 1, 3), currency="INR",
    )
    db.add(trip)
    db.flush()
    section = TripSection(
        trip_id=trip.id, title="Day one blitz", section_type="activity",
        start_date=date(2030, 1, 1), end_date=date(2030, 1, 3),
        budget=Decimal("0"), sequence_order=0,
    )
    db.add(section)
    db.flush()
    for i in range(activity_count):
        db.add(
            SectionActivity(
                trip_section_id=section.id, custom_name=f"Stop {i}",
                scheduled_date=date(2030, 1, 1), sequence_order=i, expense=Decimal("0"),
            )
        )
    db.commit()
    return trip


def test_overpacked_day_emits_move_it_action(db):
    trip = _packed_trip(db, activity_count=6)
    health = health_service.evaluate(trip)

    assert health.overall_score == 95  # 100 - 5 for one overpacked day
    overpacked = [i for i in health.insights if i.code == "overpacked_day"]
    assert len(overpacked) == 1
    assert overpacked[0].action == "move_it_for_me"
    assert overpacked[0].day == date(2030, 1, 1)


def test_move_it_for_me_rebalances_below_limit(db):
    trip = _packed_trip(db, activity_count=6)

    result = health_service.apply_move_it_for_me(db, trip)
    db.commit()
    assert result["moves"] >= 1

    # No day should now exceed the per-day cap.
    by_day = health_service._activities_by_day(trip)
    assert all(len(v) <= health_service.MAX_ACTIVITIES_PER_DAY for v in by_day.values())

    after = health_service.evaluate(trip)
    assert not any(i.code == "overpacked_day" for i in after.insights)
    assert after.overall_score == 100


def test_over_budget_is_penalized(db):
    trip = Trip(
        user_id=_user(db).id, name="Spendy", start_date=date(2030, 1, 1),
        end_date=date(2030, 1, 2), currency="INR", total_budget=Decimal("1000"),
    )
    db.add(trip)
    db.flush()
    db.add(
        TripSection(
            trip_id=trip.id, title="Pricey hotel", section_type="accommodation",
            start_date=date(2030, 1, 1), end_date=date(2030, 1, 2),
            budget=Decimal("2000"), sequence_order=0,  # double the budget
        )
    )
    db.commit()

    health = health_service.evaluate(trip)
    assert health.overall_score < 100
    assert any(i.code == "over_budget" for i in health.insights)
