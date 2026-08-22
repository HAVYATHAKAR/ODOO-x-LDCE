"""Trip routes: CRUD, budget, health, auto-rebalance, and sharing."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, get_owned_trip, get_owned_trip_detail
from app.core.config import settings
from app.crud import crud_trip
from app.models.trip import Trip
from app.models.user import User
from app.schemas.budget import BudgetSummary
from app.schemas.common import Page
from app.schemas.health import TripHealth
from app.schemas.trip import (
    ShareResponse,
    TripCreate,
    TripDetail,
    TripListItem,
    TripUpdate,
)
from app.services import budget_service, health_service, share_service

router = APIRouter(prefix="/trips", tags=["trips"])


@router.post("", response_model=TripDetail, status_code=status.HTTP_201_CREATED)
def create_trip(
    payload: TripCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TripDetail:
    trip = crud_trip.create(db, user_id=current_user.id, data=payload)
    db.commit()
    detail = crud_trip.get_detail(db, trip.id)
    return TripDetail.model_validate(detail)


@router.get("", response_model=Page[TripListItem])
def list_trips(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status_filter: str | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100, alias="size"),
) -> Page[TripListItem]:
    items, total = crud_trip.list_for_user(
        db,
        current_user.id,
        status=status_filter,
        limit=page_size,
        offset=(page - 1) * page_size,
    )
    return Page[TripListItem](
        items=[TripListItem.model_validate(t) for t in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{trip_id}", response_model=TripDetail)
def get_trip(trip: Trip = Depends(get_owned_trip_detail)) -> TripDetail:
    return TripDetail.model_validate(trip)


@router.put("/{trip_id}", response_model=TripDetail)
def update_trip(
    payload: TripUpdate,
    db: Session = Depends(get_db),
    trip: Trip = Depends(get_owned_trip),
) -> TripDetail:
    crud_trip.update(db, trip, payload)
    db.commit()
    detail = crud_trip.get_detail(db, trip.id)
    return TripDetail.model_validate(detail)


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def delete_trip(
    db: Session = Depends(get_db),
    trip: Trip = Depends(get_owned_trip),
) -> None:
    crud_trip.delete(db, trip)
    db.commit()


# ── Budget & health ──────────────────────────────────────────
@router.get("/{trip_id}/budget", response_model=BudgetSummary)
def get_budget(trip: Trip = Depends(get_owned_trip_detail)) -> BudgetSummary:
    return budget_service.compute(trip)


@router.get("/{trip_id}/health", response_model=TripHealth)
def get_health(trip: Trip = Depends(get_owned_trip_detail)) -> TripHealth:
    return health_service.evaluate(trip)


@router.post("/{trip_id}/health/move-it-for-me", response_model=TripHealth)
def move_it_for_me(
    db: Session = Depends(get_db),
    trip: Trip = Depends(get_owned_trip_detail),
) -> TripHealth:
    health_service.apply_move_it_for_me(db, trip)
    db.commit()
    refreshed = crud_trip.get_detail(db, trip.id)
    return health_service.evaluate(refreshed)


# ── Sharing ──────────────────────────────────────────────────
def _share_response(trip: Trip) -> ShareResponse:
    path = (
        f"{settings.API_V1_PREFIX}/public/trips/{trip.public_slug}"
        if trip.public_slug
        else None
    )
    return ShareResponse(is_public=trip.is_public, public_slug=trip.public_slug, public_path=path)


@router.post("/{trip_id}/share", response_model=ShareResponse)
def share_trip(
    db: Session = Depends(get_db),
    trip: Trip = Depends(get_owned_trip),
) -> ShareResponse:
    share_service.publish(db, trip)
    db.commit()
    db.refresh(trip)
    return _share_response(trip)


@router.delete("/{trip_id}/share", response_model=ShareResponse)
def unshare_trip(
    db: Session = Depends(get_db),
    trip: Trip = Depends(get_owned_trip),
) -> ShareResponse:
    share_service.unpublish(db, trip)
    db.commit()
    db.refresh(trip)
    return _share_response(trip)
