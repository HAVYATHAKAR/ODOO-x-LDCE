"""Activity catalog persistence and search."""
from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.city import Activity
from app.schemas.activity import ActivityCreate, ActivityUpdate


def get(db: Session, activity_id: int) -> Activity | None:
    return db.get(Activity, activity_id)


def search(
    db: Session,
    *,
    city_id: int | None = None,
    category: str | None = None,
    q: str | None = None,
    max_cost: float | None = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[Activity], int]:
    stmt = select(Activity)
    if city_id is not None:
        stmt = stmt.where(Activity.city_id == city_id)
    if category:
        stmt = stmt.where(func.lower(Activity.category) == category.strip().lower())
    if q:
        stmt = stmt.where(func.lower(Activity.name).like(f"%{q.strip().lower()}%"))
    if max_cost is not None:
        stmt = stmt.where(Activity.estimated_cost <= max_cost)

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    items = list(
        db.scalars(stmt.order_by(Activity.name.asc()).limit(limit).offset(offset))
    )
    return items, total


def count(db: Session) -> int:
    return db.scalar(select(func.count()).select_from(Activity)) or 0


def create(db: Session, data: ActivityCreate) -> Activity:
    activity = Activity(**data.model_dump())
    db.add(activity)
    db.flush()
    return activity


def update(db: Session, activity: Activity, data: ActivityUpdate) -> Activity:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(activity, field, value)
    db.flush()
    return activity


def delete(db: Session, activity: Activity) -> None:
    db.delete(activity)
    db.flush()


def get_by_name_city(db: Session, name: str, city_id: int) -> Activity | None:
    return db.scalar(
        select(Activity).where(
            func.lower(Activity.name) == name.strip().lower(),
            Activity.city_id == city_id,
        )
    )
