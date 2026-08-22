"""Trip persistence: ownership-scoped queries, eager-loaded detail, public lookup."""
from __future__ import annotations

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.section import SectionActivity, TripSection
from app.models.trip import Trip
from app.schemas.trip import TripCreate, TripUpdate, derive_status


def _detail_options():
    return (
        selectinload(Trip.sections).selectinload(TripSection.activities).selectinload(
            SectionActivity.activity
        ),
        selectinload(Trip.sections).selectinload(TripSection.city),
        selectinload(Trip.owner),
    )


def get(db: Session, trip_id: int) -> Trip | None:
    return db.get(Trip, trip_id)


def get_detail(db: Session, trip_id: int) -> Trip | None:
    return db.scalar(select(Trip).where(Trip.id == trip_id).options(*_detail_options()))


def get_by_slug(db: Session, slug: str) -> Trip | None:
    return db.scalar(
        select(Trip)
        .where(Trip.public_slug == slug, Trip.is_public.is_(True))
        .options(*_detail_options())
    )


def list_for_user(
    db: Session,
    user_id: int,
    *,
    status: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[Trip], int]:
    stmt = select(Trip).where(Trip.user_id == user_id)
    today = date.today()
    if status == "upcoming":
        stmt = stmt.where(Trip.start_date > today)
    elif status == "ongoing":
        stmt = stmt.where(Trip.start_date <= today, Trip.end_date >= today)
    elif status == "completed":
        stmt = stmt.where(Trip.end_date < today)

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    items = list(
        db.scalars(stmt.order_by(Trip.start_date.desc()).limit(limit).offset(offset))
    )
    return items, total


def count_for_user(db: Session, user_id: int) -> int:
    return db.scalar(select(func.count()).select_from(Trip).where(Trip.user_id == user_id)) or 0


def status_counts(db: Session, user_id: int) -> dict[str, int]:
    """Return {total, upcoming, ongoing, completed} for a user's trips."""
    rows = db.execute(
        select(Trip.start_date, Trip.end_date).where(Trip.user_id == user_id)
    ).all()
    counts = {"total": 0, "upcoming": 0, "ongoing": 0, "completed": 0}
    for start, end in rows:
        counts["total"] += 1
        counts[derive_status(start, end)] += 1
    return counts


def create(db: Session, *, user_id: int, data: TripCreate) -> Trip:
    trip = Trip(user_id=user_id, **data.model_dump())
    db.add(trip)
    db.flush()
    return trip


def update(db: Session, trip: Trip, data: TripUpdate) -> Trip:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(trip, field, value)
    db.flush()
    return trip


def delete(db: Session, trip: Trip) -> None:
    db.delete(trip)
    db.flush()


def slug_exists(db: Session, slug: str) -> bool:
    return (
        db.scalar(select(func.count()).select_from(Trip).where(Trip.public_slug == slug)) or 0
    ) > 0


def count_all(db: Session) -> int:
    return db.scalar(select(func.count()).select_from(Trip)) or 0


def count_public(db: Session) -> int:
    return (
        db.scalar(select(func.count()).select_from(Trip).where(Trip.is_public.is_(True))) or 0
    )
