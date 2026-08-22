"""Saved-destinations (city bookmarks) persistence."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.community import SavedDestination


def add(db: Session, *, user_id: int, city_id: int) -> SavedDestination:
    """Idempotent: bookmarking an already-saved city returns the existing row."""
    existing = db.scalar(
        select(SavedDestination).where(
            SavedDestination.user_id == user_id, SavedDestination.city_id == city_id
        )
    )
    if existing is not None:
        return existing
    saved = SavedDestination(user_id=user_id, city_id=city_id)
    db.add(saved)
    db.flush()
    return saved


def get(db: Session, *, user_id: int, city_id: int) -> SavedDestination | None:
    return db.scalar(
        select(SavedDestination).where(
            SavedDestination.user_id == user_id, SavedDestination.city_id == city_id
        )
    )


def remove(db: Session, *, user_id: int, city_id: int) -> bool:
    saved = get(db, user_id=user_id, city_id=city_id)
    if saved is None:
        return False
    db.delete(saved)
    db.flush()
    return True


def list_for_user(db: Session, user_id: int) -> list[SavedDestination]:
    return list(
        db.scalars(
            select(SavedDestination)
            .where(SavedDestination.user_id == user_id)
            .options(selectinload(SavedDestination.city))
            .order_by(SavedDestination.created_at.desc())
        )
    )
