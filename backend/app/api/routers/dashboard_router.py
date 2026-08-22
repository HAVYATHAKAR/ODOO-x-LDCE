"""Dashboard aggregation route."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.crud import crud_city, crud_trip
from app.models.user import User
from app.schemas.city import CityOut
from app.schemas.dashboard import DashboardResponse, TripCounts
from app.schemas.trip import TripListItem

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardResponse:
    counts = crud_trip.status_counts(db, current_user.id)
    upcoming, _ = crud_trip.list_for_user(db, current_user.id, status="upcoming", limit=5)
    recent, _ = crud_trip.list_for_user(db, current_user.id, limit=5)
    return DashboardResponse(
        counts=TripCounts(**counts),
        upcoming_trips=[TripListItem.model_validate(t) for t in upcoming],
        recent_trips=[TripListItem.model_validate(t) for t in recent],
        popular_cities=[CityOut.model_validate(c) for c in crud_city.popular(db, limit=6)],
    )
