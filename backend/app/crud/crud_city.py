"""City catalog persistence and search."""
from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.city import Activity, City
from app.schemas.city import CityCreate, CityUpdate


def get(db: Session, city_id: int) -> City | None:
    return db.get(City, city_id)


def search(
    db: Session,
    *,
    q: str | None = None,
    region: str | None = None,
    country: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[City], int]:
    stmt = select(City)
    if q:
        like = f"%{q.strip().lower()}%"
        stmt = stmt.where(
            func.lower(City.name).like(like) | func.lower(City.country).like(like)
        )
    if region:
        stmt = stmt.where(func.lower(City.region) == region.strip().lower())
    if country:
        stmt = stmt.where(func.lower(City.country) == country.strip().lower())

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    items = list(
        db.scalars(
            stmt.order_by(City.popularity_score.desc(), City.name.asc())
            .limit(limit)
            .offset(offset)
        )
    )
    return items, total


def popular(db: Session, limit: int = 10) -> list[City]:
    return list(
        db.scalars(select(City).order_by(City.popularity_score.desc(), City.name.asc()).limit(limit))
    )


def count(db: Session) -> int:
    return db.scalar(select(func.count()).select_from(City)) or 0


def create(db: Session, data: CityCreate) -> City:
    city = City(**data.model_dump())
    db.add(city)
    db.flush()
    return city


def update(db: Session, city: City, data: CityUpdate) -> City:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(city, field, value)
    db.flush()
    return city


def delete(db: Session, city: City) -> None:
    db.delete(city)
    db.flush()


def get_by_name_country(db: Session, name: str, country: str) -> City | None:
    return db.scalar(
        select(City).where(
            func.lower(City.name) == name.strip().lower(),
            func.lower(City.country) == country.strip().lower(),
        )
    )


def activity_count_for_city(db: Session, city_id: int) -> int:
    return (
        db.scalar(select(func.count()).select_from(Activity).where(Activity.city_id == city_id))
        or 0
    )
