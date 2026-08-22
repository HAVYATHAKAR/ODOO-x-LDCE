"""Section & section-activity routes, nested under an owned trip.

All routes depend on ``get_owned_trip`` (via the ``trip_id`` path param), so
ownership is enforced before any section is touched. Literal ``/reorder`` routes
are declared before their ``/{id}`` siblings so the router matches them first.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_owned_trip
from app.core.exceptions import NotFoundError
from app.crud import crud_section
from app.models.section import SectionActivity, TripSection
from app.models.trip import Trip
from app.schemas.section import (
    ReorderRequest,
    SectionActivityCreate,
    SectionActivityOut,
    SectionActivityUpdate,
    TripSectionCreate,
    TripSectionOut,
    TripSectionUpdate,
)

router = APIRouter(prefix="/trips/{trip_id}/sections", tags=["sections"])


def _section_in_trip(db: Session, trip: Trip, section_id: int) -> TripSection:
    section = crud_section.get(db, section_id)
    if section is None or section.trip_id != trip.id:
        raise NotFoundError("Section not found")
    return section


def _item_in_section(db: Session, section: TripSection, item_id: int) -> SectionActivity:
    row = crud_section.get_activity(db, item_id)
    if row is None or row.trip_section_id != section.id:
        raise NotFoundError("Activity not found")
    return row


# ── Sections ─────────────────────────────────────────────────
@router.post("", response_model=TripSectionOut, status_code=status.HTTP_201_CREATED)
def create_section(
    payload: TripSectionCreate,
    db: Session = Depends(get_db),
    trip: Trip = Depends(get_owned_trip),
) -> TripSectionOut:
    section = crud_section.create(db, trip_id=trip.id, data=payload)
    db.commit()
    return TripSectionOut.model_validate(crud_section.get(db, section.id))


@router.get("", response_model=list[TripSectionOut])
def list_sections(
    db: Session = Depends(get_db),
    trip: Trip = Depends(get_owned_trip),
) -> list[TripSectionOut]:
    sections = crud_section.list_for_trip(db, trip.id)
    return [TripSectionOut.model_validate(s) for s in sections]


@router.put("/reorder", response_model=list[TripSectionOut])
def reorder_sections(
    payload: ReorderRequest,
    db: Session = Depends(get_db),
    trip: Trip = Depends(get_owned_trip),
) -> list[TripSectionOut]:
    ordered = crud_section.reorder(db, trip_id=trip.id, ordered_ids=payload.ordered_ids)
    db.commit()
    return [TripSectionOut.model_validate(s) for s in ordered]


@router.get("/{section_id}", response_model=TripSectionOut)
def get_section(
    section_id: int,
    db: Session = Depends(get_db),
    trip: Trip = Depends(get_owned_trip),
) -> TripSectionOut:
    return TripSectionOut.model_validate(_section_in_trip(db, trip, section_id))


@router.put("/{section_id}", response_model=TripSectionOut)
def update_section(
    section_id: int,
    payload: TripSectionUpdate,
    db: Session = Depends(get_db),
    trip: Trip = Depends(get_owned_trip),
) -> TripSectionOut:
    section = _section_in_trip(db, trip, section_id)
    crud_section.update(db, section, payload)
    db.commit()
    return TripSectionOut.model_validate(crud_section.get(db, section.id))


@router.delete("/{section_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_section(
    section_id: int,
    db: Session = Depends(get_db),
    trip: Trip = Depends(get_owned_trip),
) -> None:
    section = _section_in_trip(db, trip, section_id)
    crud_section.delete(db, section)
    db.commit()


# ── Section activities ───────────────────────────────────────
@router.post(
    "/{section_id}/activities",
    response_model=SectionActivityOut,
    status_code=status.HTTP_201_CREATED,
)
def add_activity(
    section_id: int,
    payload: SectionActivityCreate,
    db: Session = Depends(get_db),
    trip: Trip = Depends(get_owned_trip),
) -> SectionActivityOut:
    section = _section_in_trip(db, trip, section_id)
    row = crud_section.create_activity(db, section_id=section.id, data=payload)
    db.commit()
    return SectionActivityOut.model_validate(crud_section.get_activity(db, row.id))


@router.put("/{section_id}/activities/reorder", response_model=list[SectionActivityOut])
def reorder_activities(
    section_id: int,
    payload: ReorderRequest,
    db: Session = Depends(get_db),
    trip: Trip = Depends(get_owned_trip),
) -> list[SectionActivityOut]:
    section = _section_in_trip(db, trip, section_id)
    rows = crud_section.reorder_activities(
        db, section_id=section.id, ordered_ids=payload.ordered_ids
    )
    db.commit()
    return [SectionActivityOut.model_validate(r) for r in rows]


@router.put("/{section_id}/activities/{item_id}", response_model=SectionActivityOut)
def update_activity(
    section_id: int,
    item_id: int,
    payload: SectionActivityUpdate,
    db: Session = Depends(get_db),
    trip: Trip = Depends(get_owned_trip),
) -> SectionActivityOut:
    section = _section_in_trip(db, trip, section_id)
    row = _item_in_section(db, section, item_id)
    crud_section.update_activity(db, row, payload)
    db.commit()
    return SectionActivityOut.model_validate(crud_section.get_activity(db, row.id))


@router.delete(
    "/{section_id}/activities/{item_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_activity(
    section_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    trip: Trip = Depends(get_owned_trip),
) -> None:
    section = _section_in_trip(db, trip, section_id)
    row = _item_in_section(db, section, item_id)
    crud_section.delete_activity(db, row)
    db.commit()
