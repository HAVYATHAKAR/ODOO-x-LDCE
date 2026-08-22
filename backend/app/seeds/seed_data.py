"""Idempotent database seeder.

Populates the reference catalog (cities + activities from ``static_data.json``)
and a small set of demo content (two users and two trips) so the API and UI are
never empty during a demo. Safe to run repeatedly: every insert is guarded by an
existence check, so re-running only fills in what is missing.

Run from the ``backend/`` directory::

    python -m app.seeds.seed_data
"""
from __future__ import annotations

import json
from datetime import date, time, timedelta
from decimal import Decimal
from pathlib import Path

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal, engine
from app.core.security import hash_password
from app.models.base import Base
from app.models.city import Activity, City
from app.models.section import SectionActivity, TripSection
from app.models.trip import Trip
from app.models.user import User

DATA_FILE = Path(__file__).with_name("static_data.json")

# Demo credentials (development convenience only — never ship these to prod).
DEMO_USERNAME = "demo"
DEMO_EMAIL = "demo@globetrotter.app"
DEMO_PASSWORD = "demo1234"
ADMIN_USERNAME = "admin"
ADMIN_EMAIL = "admin@globetrotter.app"
ADMIN_PASSWORD = "admin1234"

PUBLIC_TRIP_SLUG = "demo-goa-share"


# ── Catalog ──────────────────────────────────────────────────
def load_catalog(db: Session) -> tuple[int, int]:
    """Upsert cities and activities from the JSON file. Returns (new_cities, new_activities)."""
    payload = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    new_cities = new_activities = 0

    city_index: dict[tuple[str, str], City] = {}
    for row in payload.get("cities", []):
        key = (row["name"].strip().lower(), row["country"].strip().lower())
        existing = _find_city(db, row["name"], row["country"])
        if existing is None:
            existing = City(
                name=row["name"],
                country=row["country"],
                region=row.get("region"),
                latitude=row.get("latitude"),
                longitude=row.get("longitude"),
                cost_index=row.get("cost_index", 100),
                popularity_score=row.get("popularity_score", 0),
                image_url=row.get("image_url"),
                description=row.get("description"),
            )
            db.add(existing)
            db.flush()
            new_cities += 1
        city_index[key] = existing

    for row in payload.get("activities", []):
        key = (row["city"].strip().lower(), row["country"].strip().lower())
        city = city_index.get(key) or _find_city(db, row["city"], row["country"])
        if city is None:
            # Skip activities whose city is not in the catalog.
            continue
        if _find_activity(db, city.id, row["name"]) is not None:
            continue
        db.add(
            Activity(
                city_id=city.id,
                name=row["name"],
                category=row["category"],
                description=row.get("description"),
                estimated_cost=row.get("estimated_cost", 0),
                duration_minutes=row.get("duration_minutes"),
                image_url=row.get("image_url"),
            )
        )
        new_activities += 1

    db.flush()
    return new_cities, new_activities


# ── Demo users & trips ───────────────────────────────────────
def create_demo_content(db: Session) -> list[str]:
    """Create demo/admin users and two sample trips. Returns a list of notes."""
    notes: list[str] = []

    demo = _get_or_create_user(
        db,
        username=DEMO_USERNAME,
        email=DEMO_EMAIL,
        password=DEMO_PASSWORD,
        first_name="Demo",
        last_name="Traveler",
        note_target=notes,
    )
    _get_or_create_user(
        db,
        username=ADMIN_USERNAME,
        email=ADMIN_EMAIL,
        password=ADMIN_PASSWORD,
        first_name="Site",
        last_name="Admin",
        is_admin=True,
        note_target=notes,
    )

    if _find_trip(db, demo.id, "Rajasthan Explorer") is None:
        _build_rajasthan_trip(db, demo)
        notes.append("created demo trip 'Rajasthan Explorer' (private)")
    if _find_trip(db, demo.id, "Goa Getaway") is None:
        _build_goa_public_trip(db, demo)
        notes.append(f"created public trip 'Goa Getaway' (slug '{PUBLIC_TRIP_SLUG}')")

    db.flush()
    return notes


def _build_rajasthan_trip(db: Session, owner: User) -> Trip:
    """A 5-day private trip that exercises the budget + health engines.

    Day 2 is deliberately packed with 5 activities to trigger the
    'overpacked day' health insight and its 'move_it_for_me' action.
    """
    start = date.today() + timedelta(days=30)
    trip = Trip(
        user_id=owner.id,
        name="Rajasthan Explorer",
        description="Forts, palaces, and lakes across Jaipur and Udaipur.",
        start_date=start,
        end_date=start + timedelta(days=4),
        currency="INR",
        total_budget=Decimal("40000"),
        cover_photo_url="https://images.unsplash.com/photo-1477587458883-47145ed94245",
    )
    db.add(trip)
    db.flush()

    jaipur = _find_city(db, "Jaipur", "India")
    udaipur = _find_city(db, "Udaipur", "India")

    # 0: transport
    s0 = _add_section(db, trip, "Flight to Jaipur", "transport", jaipur, start, start, 8000, 0)
    _add_custom_activity(db, s0, "Depart & arrive Jaipur", start, 0, 8000, time(9, 30))

    # 1: accommodation (spans days 1-3)
    _add_section(
        db, trip, "Stay: Jaipur Haveli", "accommodation", jaipur, start, start + timedelta(days=2),
        12000, 1,
    )

    # 2: sightseeing — five activities ALL on day 2 (overpacked)
    s2 = _add_section(
        db, trip, "Explore Jaipur", "sightseeing", jaipur, start, start + timedelta(days=2),
        5000, 2,
    )
    day2 = start + timedelta(days=1)
    for i, act_name in enumerate(
        [
            "Amber Fort tour",
            "Hawa Mahal visit",
            "City Palace & Jantar Mantar",
            "Rajasthani thali dinner",
            "Bapu Bazaar shopping",
        ]
    ):
        _add_catalog_activity(db, s2, jaipur, act_name, day2, i)

    # 3: transport to Udaipur
    _add_section(
        db, trip, "Drive to Udaipur", "transport", udaipur,
        start + timedelta(days=2), start + timedelta(days=2), 4000, 3,
    )

    # 4: sightseeing in Udaipur, spread across days 4-5
    s4 = _add_section(
        db, trip, "Explore Udaipur", "sightseeing", udaipur,
        start + timedelta(days=2), start + timedelta(days=4), 4000, 4,
    )
    _add_catalog_activity(db, s4, udaipur, "Lake Pichola boat ride", start + timedelta(days=3), 0)
    _add_catalog_activity(db, s4, udaipur, "City Palace complex", start + timedelta(days=4), 1)

    return trip


def _build_goa_public_trip(db: Session, owner: User) -> Trip:
    """A short, public trip with a fixed slug for demoing share + copy."""
    start = date.today() + timedelta(days=60)
    trip = Trip(
        user_id=owner.id,
        name="Goa Getaway",
        description="A relaxed long weekend of beaches and Goan food.",
        start_date=start,
        end_date=start + timedelta(days=2),
        currency="INR",
        total_budget=Decimal("18000"),
        is_public=True,
        show_public_budget=True,
        public_slug=PUBLIC_TRIP_SLUG,
        cover_photo_url="https://images.unsplash.com/photo-1512343879784-a960bf40e7f2",
    )
    db.add(trip)
    db.flush()

    goa = _find_city(db, "Goa", "India")
    _add_section(
        db, trip, "Beachfront stay", "accommodation", goa, start, start + timedelta(days=2), 9000, 0
    )
    s1 = _add_section(
        db, trip, "Beach & town", "activity", goa, start, start + timedelta(days=2), 6000, 1
    )
    _add_catalog_activity(db, s1, goa, "Baga Beach day", start, 0)
    _add_catalog_activity(db, s1, goa, "Sunset cruise on the Mandovi", start, 1)
    _add_catalog_activity(db, s1, goa, "Seafood shack dinner", start + timedelta(days=1), 0)
    _add_catalog_activity(db, s1, goa, "Old Goa church tour", start + timedelta(days=2), 0)
    return trip


# ── Small helpers ────────────────────────────────────────────
def _find_city(db: Session, name: str, country: str) -> City | None:
    from app.crud import crud_city

    return crud_city.get_by_name_country(db, name, country)


def _find_activity(db: Session, city_id: int, name: str) -> Activity | None:
    from app.crud import crud_activity

    return crud_activity.get_by_name_city(db, name, city_id)


def _find_trip(db: Session, user_id: int, name: str) -> Trip | None:
    from sqlalchemy import func, select

    return db.scalar(
        select(Trip).where(Trip.user_id == user_id, func.lower(Trip.name) == name.lower())
    )


def _get_or_create_user(
    db: Session,
    *,
    username: str,
    email: str,
    password: str,
    first_name: str,
    last_name: str,
    is_admin: bool = False,
    note_target: list[str],
) -> User:
    from app.crud import crud_user

    existing = crud_user.get_by_username(db, username)
    if existing is not None:
        return existing
    user = User(
        username=username,
        email=email,
        password_hash=hash_password(password),
        first_name=first_name,
        last_name=last_name,
        is_admin=is_admin,
    )
    db.add(user)
    db.flush()
    note_target.append(f"created user '{username}' (password '{password}')")
    return user


def _add_section(
    db: Session,
    trip: Trip,
    title: str,
    section_type: str,
    city: City | None,
    start: date,
    end: date,
    budget: float,
    order: int,
) -> TripSection:
    section = TripSection(
        trip_id=trip.id,
        title=title,
        section_type=section_type,
        city_id=city.id if city else None,
        start_date=start,
        end_date=end,
        budget=Decimal(str(budget)),
        sequence_order=order,
    )
    db.add(section)
    db.flush()
    return section


def _add_catalog_activity(
    db: Session,
    section: TripSection,
    city: City,
    activity_name: str,
    scheduled: date,
    order: int,
) -> SectionActivity:
    activity = _find_activity(db, city.id, activity_name)
    expense = activity.estimated_cost if activity else Decimal("0")
    item = SectionActivity(
        trip_section_id=section.id,
        activity_id=activity.id if activity else None,
        custom_name=None if activity else activity_name,
        scheduled_date=scheduled,
        sequence_order=order,
        expense=expense,
    )
    db.add(item)
    db.flush()
    return item


def _add_custom_activity(
    db: Session,
    section: TripSection,
    name: str,
    scheduled: date,
    order: int,
    expense: float,
    scheduled_time: time | None = None,
) -> SectionActivity:
    item = SectionActivity(
        trip_section_id=section.id,
        custom_name=name,
        scheduled_date=scheduled,
        scheduled_time=scheduled_time,
        sequence_order=order,
        expense=Decimal(str(expense)),
    )
    db.add(item)
    db.flush()
    return item


# ── Entry point ──────────────────────────────────────────────
def seed(db: Session) -> None:
    """Run the full seed within an existing session (caller commits)."""
    new_cities, new_activities = load_catalog(db)
    notes = create_demo_content(db)
    print(f"Catalog: +{new_cities} cities, +{new_activities} activities.")
    for note in notes:
        print(f"  - {note}")
    if not notes:
        print("  - demo content already present; nothing to add.")


def main() -> None:
    # SQLite: create tables directly (Postgres uses Alembic migrations instead).
    if settings.is_sqlite:
        Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        seed(db)
        db.commit()
        print("Seed complete.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
