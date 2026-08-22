"""Share & copy service: publishing trips, building the privacy-aware public
view, and deep-copying a public itinerary into a new user's account.
"""
from __future__ import annotations

import secrets
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError
from app.crud import crud_trip
from app.models.section import SectionActivity, TripSection
from app.models.trip import Trip
from app.schemas.section import TripSectionOut
from app.schemas.trip import PublicTripOut
from app.schemas.user import UserPublic

_SLUG_BYTES = 8
_SLUG_MAX_LEN = 16


def _generate_slug(db: Session) -> str:
    for _ in range(12):
        slug = secrets.token_urlsafe(_SLUG_BYTES)[:_SLUG_MAX_LEN]
        if not crud_trip.slug_exists(db, slug):
            return slug
    raise ConflictError("Could not generate a unique share link, please retry")


def publish(db: Session, trip: Trip) -> Trip:
    if not trip.public_slug:
        trip.public_slug = _generate_slug(db)
    trip.is_public = True
    db.flush()
    return trip


def unpublish(db: Session, trip: Trip) -> Trip:
    trip.is_public = False
    db.flush()
    return trip


def build_public_view(trip: Trip) -> PublicTripOut:
    """Serialize a trip for anonymous viewing, honoring the owner's budget opt-in."""
    show_budget = bool(trip.show_public_budget)
    sections_out = [TripSectionOut.model_validate(section) for section in trip.sections]

    if not show_budget:
        for section_out in sections_out:
            section_out.budget = Decimal("0")
            for act in section_out.activities:
                act.expense = Decimal("0")

    return PublicTripOut(
        id=trip.id,
        name=trip.name,
        description=trip.description,
        start_date=trip.start_date,
        end_date=trip.end_date,
        cover_photo_url=trip.cover_photo_url,
        currency=trip.currency,
        public_slug=trip.public_slug,
        owner=UserPublic.model_validate(trip.owner),
        show_budget=show_budget,
        total_budget=Decimal(trip.total_budget) if (show_budget and trip.total_budget is not None) else None,
        sections=sections_out,
    )


def copy_public_trip(db: Session, *, source: Trip, new_owner_id: int) -> Trip:
    """Deep-copy a public trip (sections + scheduled activities) to a new owner.

    The copy is private, records its provenance via ``copied_from_trip_id``, and
    preserves expense snapshots so the itinerary stays faithful to the original.
    """
    new_trip = Trip(
        user_id=new_owner_id,
        name=f"Copy of {source.name}"[:160],
        description=source.description,
        start_date=source.start_date,
        end_date=source.end_date,
        cover_photo_url=source.cover_photo_url,
        total_budget=source.total_budget,
        currency=source.currency,
        is_public=False,
        show_public_budget=False,
        copied_from_trip_id=source.id,
    )
    db.add(new_trip)
    db.flush()

    for section in source.sections:
        new_section = TripSection(
            trip_id=new_trip.id,
            title=section.title,
            description=section.description,
            section_type=section.section_type,
            city_id=section.city_id,
            start_date=section.start_date,
            end_date=section.end_date,
            budget=section.budget,
            sequence_order=section.sequence_order,
            notes=section.notes,
        )
        db.add(new_section)
        db.flush()
        for act in section.activities:
            db.add(
                SectionActivity(
                    trip_section_id=new_section.id,
                    activity_id=act.activity_id,
                    custom_name=act.custom_name,
                    scheduled_date=act.scheduled_date,
                    scheduled_time=act.scheduled_time,
                    sequence_order=act.sequence_order,
                    expense=act.expense,
                    notes=act.notes,
                )
            )
        db.flush()

    return new_trip
