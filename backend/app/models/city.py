"""Reference catalog: cities and their activities (seeded)."""
from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, BigIntPK

if TYPE_CHECKING:  # pragma: no cover
    from app.models.community import SavedDestination
    from app.models.section import SectionActivity, TripSection


class City(Base):
    """Master list of destinations users search and select from."""

    __tablename__ = "cities"

    id: Mapped[int] = mapped_column(BigIntPK, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    country: Mapped[str] = mapped_column(String(120), nullable=False)
    region: Mapped[str | None] = mapped_column(String(120))
    latitude: Mapped[float | None] = mapped_column(Numeric(9, 6))
    longitude: Mapped[float | None] = mapped_column(Numeric(9, 6))
    cost_index: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False, default=100)
    popularity_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    image_url: Mapped[str | None] = mapped_column(String(500))
    description: Mapped[str | None] = mapped_column(Text)

    activities: Mapped[list["Activity"]] = relationship("Activity", back_populates="city")
    sections: Mapped[list["TripSection"]] = relationship("TripSection", back_populates="city")
    saved_by: Mapped[list["SavedDestination"]] = relationship(
        "SavedDestination", back_populates="city", cascade="all, delete-orphan", passive_deletes=True
    )

    __table_args__ = (
        UniqueConstraint("name", "country", name="uq_city_country"),
        Index("idx_cities_region_pop", "region", "popularity_score"),
    )


class Activity(Base):
    """Searchable catalog of things to do, scoped to a city."""

    __tablename__ = "activities"

    id: Mapped[int] = mapped_column(BigIntPK, primary_key=True)
    city_id: Mapped[int] = mapped_column(
        ForeignKey("cities.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    category: Mapped[str] = mapped_column(String(40), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    estimated_cost: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    duration_minutes: Mapped[int | None] = mapped_column(Integer)
    image_url: Mapped[str | None] = mapped_column(String(500))

    city: Mapped["City"] = relationship("City", back_populates="activities")
    section_activities: Mapped[list["SectionActivity"]] = relationship(
        "SectionActivity", back_populates="activity"
    )

    __table_args__ = (
        CheckConstraint("estimated_cost >= 0", name="ck_activities_cost_nonneg"),
        Index("idx_activities_city_cat", "city_id", "category"),
    )
