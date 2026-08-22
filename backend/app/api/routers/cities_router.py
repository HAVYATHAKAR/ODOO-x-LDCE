"""City catalog routes (public search + admin management)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_db
from app.core.exceptions import ConflictError, NotFoundError
from app.crud import crud_activity, crud_city
from app.models.user import User
from app.schemas.activity import ActivityOut
from app.schemas.city import CityCreate, CityOut, CityUpdate
from app.schemas.common import Page

router = APIRouter(prefix="/cities", tags=["catalog"])


@router.get("", response_model=Page[CityOut])
def search_cities(
    db: Session = Depends(get_db),
    q: str | None = Query(default=None, description="Match city or country name"),
    region: str | None = None,
    country: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> Page[CityOut]:
    items, total = crud_city.search(
        db, q=q, region=region, country=country,
        limit=page_size, offset=(page - 1) * page_size,
    )
    return Page[CityOut](
        items=[CityOut.model_validate(c) for c in items],
        total=total, page=page, page_size=page_size,
    )


@router.get("/{city_id}", response_model=CityOut)
def get_city(city_id: int, db: Session = Depends(get_db)) -> CityOut:
    city = crud_city.get(db, city_id)
    if city is None:
        raise NotFoundError("City not found")
    return CityOut.model_validate(city)


@router.get("/{city_id}/activities", response_model=Page[ActivityOut])
def list_city_activities(
    city_id: int,
    db: Session = Depends(get_db),
    category: str | None = None,
    q: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
) -> Page[ActivityOut]:
    if crud_city.get(db, city_id) is None:
        raise NotFoundError("City not found")
    items, total = crud_activity.search(
        db, city_id=city_id, category=category, q=q,
        limit=page_size, offset=(page - 1) * page_size,
    )
    return Page[ActivityOut](
        items=[ActivityOut.model_validate(a) for a in items],
        total=total, page=page, page_size=page_size,
    )


# ── Admin management ─────────────────────────────────────────
@router.post("", response_model=CityOut, status_code=status.HTTP_201_CREATED)
def create_city(
    payload: CityCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> CityOut:
    if crud_city.get_by_name_country(db, payload.name, payload.country):
        raise ConflictError("A city with that name and country already exists")
    city = crud_city.create(db, payload)
    db.commit()
    db.refresh(city)
    return CityOut.model_validate(city)


@router.put("/{city_id}", response_model=CityOut)
def update_city(
    city_id: int,
    payload: CityUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> CityOut:
    city = crud_city.get(db, city_id)
    if city is None:
        raise NotFoundError("City not found")
    crud_city.update(db, city, payload)
    db.commit()
    db.refresh(city)
    return CityOut.model_validate(city)


@router.delete("/{city_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_city(
    city_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> None:
    city = crud_city.get(db, city_id)
    if city is None:
        raise NotFoundError("City not found")
    crud_city.delete(db, city)
    db.commit()
