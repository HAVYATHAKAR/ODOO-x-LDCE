"""Public (unauthenticated) share routes, plus the authenticated copy action."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.exceptions import NotFoundError
from app.crud import crud_trip
from app.models.user import User
from app.schemas.trip import PublicTripOut, TripDetail
from app.services import share_service

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/trips/{slug}", response_model=PublicTripOut)
def get_public_trip(slug: str, db: Session = Depends(get_db)) -> PublicTripOut:
    trip = crud_trip.get_by_slug(db, slug)
    if trip is None:
        raise NotFoundError("This shared trip does not exist or is no longer public")
    return share_service.build_public_view(trip)


@router.post("/trips/{slug}/copy", response_model=TripDetail)
def copy_public_trip(
    slug: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TripDetail:
    source = crud_trip.get_by_slug(db, slug)
    if source is None:
        raise NotFoundError("This shared trip does not exist or is no longer public")
    new_trip = share_service.copy_public_trip(db, source=source, new_owner_id=current_user.id)
    db.commit()
    return TripDetail.model_validate(crud_trip.get_detail(db, new_trip.id))
