"""Activity catalog routes (public search + admin management)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_db
from app.core.exceptions import ConflictError, NotFoundError
from app.crud import crud_activity, crud_city
from app.models.user import User
from app.schemas.activity import ActivityCreate, ActivityOut, ActivityUpdate
from app.schemas.common import Page

router = APIRouter(prefix="/activities", tags=["catalog"])


@router.get("", response_model=Page[ActivityOut])
def search_activities(
    db: Session = Depends(get_db),
    city_id: int | None = None,
    category: str | None = None,
    q: str | None = None,
    max_cost: float | None = Query(default=None, ge=0),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> Page[ActivityOut]:
    items, total = crud_activity.search(
        db, city_id=city_id, category=category, q=q, max_cost=max_cost,
        limit=page_size, offset=(page - 1) * page_size,
    )
    return Page[ActivityOut](
        items=[ActivityOut.model_validate(a) for a in items],
        total=total, page=page, page_size=page_size,
    )


@router.get("/{activity_id}", response_model=ActivityOut)
def get_activity(activity_id: int, db: Session = Depends(get_db)) -> ActivityOut:
    activity = crud_activity.get(db, activity_id)
    if activity is None:
        raise NotFoundError("Activity not found")
    return ActivityOut.model_validate(activity)


# ── Admin management ─────────────────────────────────────────
@router.post("", response_model=ActivityOut, status_code=status.HTTP_201_CREATED)
def create_activity(
    payload: ActivityCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> ActivityOut:
    if crud_city.get(db, payload.city_id) is None:
        raise NotFoundError("City not found")
    activity = crud_activity.create(db, payload)
    db.commit()
    db.refresh(activity)
    return ActivityOut.model_validate(activity)


@router.put("/{activity_id}", response_model=ActivityOut)
def update_activity(
    activity_id: int,
    payload: ActivityUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> ActivityOut:
    activity = crud_activity.get(db, activity_id)
    if activity is None:
        raise NotFoundError("Activity not found")
    crud_activity.update(db, activity, payload)
    db.commit()
    db.refresh(activity)
    return ActivityOut.model_validate(activity)


@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_activity(
    activity_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> None:
    activity = crud_activity.get(db, activity_id)
    if activity is None:
        raise NotFoundError("Activity not found")
    crud_activity.delete(db, activity)
    db.commit()
