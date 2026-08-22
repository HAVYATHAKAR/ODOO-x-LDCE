"""Admin analytics & management routes (admin-only)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_db
from app.crud import crud_activity, crud_city, crud_community, crud_trip, crud_user
from app.models.city import Activity, City
from app.models.section import SectionActivity, TripSection
from app.models.user import User
from app.schemas.activity import ActivityOut
from app.schemas.admin import AdminOverview, PopularActivity, PopularCity
from app.schemas.city import CityOut
from app.schemas.common import Page
from app.schemas.user import UserProfile

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/overview", response_model=AdminOverview)
def overview(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> AdminOverview:
    city_rows = db.execute(
        select(City, func.count(TripSection.id))
        .join(TripSection, TripSection.city_id == City.id)
        .group_by(City.id)
        .order_by(func.count(TripSection.id).desc())
        .limit(5)
    ).all()
    activity_rows = db.execute(
        select(Activity, func.count(SectionActivity.id))
        .join(SectionActivity, SectionActivity.activity_id == Activity.id)
        .group_by(Activity.id)
        .order_by(func.count(SectionActivity.id).desc())
        .limit(5)
    ).all()

    return AdminOverview(
        user_count=crud_user.count(db),
        trip_count=crud_trip.count_all(db),
        public_trip_count=crud_trip.count_public(db),
        city_count=crud_city.count(db),
        activity_count=crud_activity.count(db),
        post_count=crud_community.count_posts(db),
        popular_cities=[
            PopularCity(city=CityOut.model_validate(c), usage_count=cnt) for c, cnt in city_rows
        ],
        popular_activities=[
            PopularActivity(activity=ActivityOut.model_validate(a), usage_count=cnt)
            for a, cnt in activity_rows
        ],
    )


@router.get("/users", response_model=Page[UserProfile])
def list_users(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> Page[UserProfile]:
    total = db.scalar(select(func.count()).select_from(User)) or 0
    users = list(
        db.scalars(
            select(User)
            .order_by(User.created_at.desc())
            .limit(page_size)
            .offset((page - 1) * page_size)
        )
    )
    return Page[UserProfile](
        items=[UserProfile.model_validate(u) for u in users],
        total=total, page=page, page_size=page_size,
    )
