"""Section & section-activity persistence, including safe reordering.

Sections carry a UNIQUE ``(trip_id, sequence_order)`` constraint. SQLite cannot
defer constraint checks, so reordering is done as a two-phase write: first shift
every row by a large offset (keeping values distinct and far from the target
range), then assign the final compact 0..n-1 order.
"""
from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import BadRequestError, NotFoundError
from app.models.section import SectionActivity, TripSection
from app.schemas.section import (
    SectionActivityCreate,
    SectionActivityUpdate,
    TripSectionCreate,
    TripSectionUpdate,
)

_REORDER_OFFSET = 1_000_000


# ── Sections ─────────────────────────────────────────────────
def get(db: Session, section_id: int) -> TripSection | None:
    return db.scalar(
        select(TripSection)
        .where(TripSection.id == section_id)
        .options(
            selectinload(TripSection.activities).selectinload(SectionActivity.activity),
            selectinload(TripSection.city),
        )
    )


def list_for_trip(db: Session, trip_id: int) -> list[TripSection]:
    return list(
        db.scalars(
            select(TripSection)
            .where(TripSection.trip_id == trip_id)
            .order_by(TripSection.sequence_order)
        )
    )


def _next_order(db: Session, trip_id: int) -> int:
    current_max = db.scalar(
        select(func.max(TripSection.sequence_order)).where(TripSection.trip_id == trip_id)
    )
    return 0 if current_max is None else current_max + 1


def create(db: Session, *, trip_id: int, data: TripSectionCreate) -> TripSection:
    section = TripSection(
        trip_id=trip_id,
        sequence_order=_next_order(db, trip_id),
        **data.model_dump(),
    )
    db.add(section)
    db.flush()
    return section


def update(db: Session, section: TripSection, data: TripSectionUpdate) -> TripSection:
    payload = data.model_dump(exclude_unset=True)
    new_start = payload.get("start_date", section.start_date)
    new_end = payload.get("end_date", section.end_date)
    if new_end < new_start:
        raise BadRequestError("end_date must be on or after start_date")
    for field, value in payload.items():
        setattr(section, field, value)
    db.flush()
    return section


def delete(db: Session, section: TripSection) -> None:
    trip_id = section.trip_id
    db.delete(section)
    db.flush()
    _compact_section_orders(db, trip_id)


def _compact_section_orders(db: Session, trip_id: int) -> None:
    """Close gaps left by a deletion so orders stay 0..n-1."""
    sections = list_for_trip(db, trip_id)
    _apply_offsets(db, sections)
    for index, section in enumerate(sections):
        section.sequence_order = index
    db.flush()


def _apply_offsets(db: Session, sections: list[TripSection]) -> None:
    for section in sections:
        section.sequence_order = section.sequence_order + _REORDER_OFFSET
    db.flush()


def reorder(db: Session, *, trip_id: int, ordered_ids: list[int]) -> list[TripSection]:
    sections = list_for_trip(db, trip_id)
    existing_ids = {s.id for s in sections}
    if set(ordered_ids) != existing_ids:
        raise BadRequestError("ordered_ids must be exactly the section ids of this trip")

    by_id = {s.id: s for s in sections}
    # Phase 1: shift everything out of the target range.
    _apply_offsets(db, sections)
    # Phase 2: assign the requested compact order.
    for index, section_id in enumerate(ordered_ids):
        by_id[section_id].sequence_order = index
    db.flush()
    return [by_id[i] for i in ordered_ids]


# ── Section activities ───────────────────────────────────────
def get_activity(db: Session, activity_row_id: int) -> SectionActivity | None:
    return db.scalar(
        select(SectionActivity)
        .where(SectionActivity.id == activity_row_id)
        .options(selectinload(SectionActivity.activity))
    )


def _next_activity_order(db: Session, section_id: int) -> int:
    current_max = db.scalar(
        select(func.max(SectionActivity.sequence_order)).where(
            SectionActivity.trip_section_id == section_id
        )
    )
    return 0 if current_max is None else current_max + 1


def create_activity(
    db: Session, *, section_id: int, data: SectionActivityCreate
) -> SectionActivity:
    row = SectionActivity(
        trip_section_id=section_id,
        sequence_order=_next_activity_order(db, section_id),
        **data.model_dump(),
    )
    db.add(row)
    db.flush()
    return row


def update_activity(
    db: Session, row: SectionActivity, data: SectionActivityUpdate
) -> SectionActivity:
    payload = data.model_dump(exclude_unset=True)
    new_activity_id = payload.get("activity_id", row.activity_id)
    new_custom = payload.get("custom_name", row.custom_name)
    if new_activity_id is None and not (new_custom and new_custom.strip()):
        raise BadRequestError("either activity_id or custom_name is required")
    for field, value in payload.items():
        setattr(row, field, value)
    db.flush()
    return row


def delete_activity(db: Session, row: SectionActivity) -> None:
    db.delete(row)
    db.flush()


def reorder_activities(
    db: Session, *, section_id: int, ordered_ids: list[int]
) -> list[SectionActivity]:
    rows = list(
        db.scalars(
            select(SectionActivity)
            .where(SectionActivity.trip_section_id == section_id)
            .order_by(SectionActivity.sequence_order)
        )
    )
    if set(ordered_ids) != {r.id for r in rows}:
        raise BadRequestError("ordered_ids must be exactly the activity ids of this section")
    by_id = {r.id: r for r in rows}
    # No UNIQUE constraint on activity order, so a direct assignment is safe.
    for index, row_id in enumerate(ordered_ids):
        by_id[row_id].sequence_order = index
    db.flush()
    return [by_id[i] for i in ordered_ids]


def get_or_404(db: Session, section_id: int) -> TripSection:
    section = get(db, section_id)
    if section is None:
        raise NotFoundError("Section not found")
    return section
