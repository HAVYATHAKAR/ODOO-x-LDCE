"""Trip sections (the core building block) and their day-scheduled activities."""
from __future__ import annotations

from datetime import date, time
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    Date,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    Time,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, BigIntPK

if TYPE_CHECKING:  # pragma: no cover
    from app.models.city import Activity, City
    from app.models.trip import Trip

# Allowed section types (maps directly onto budget categories).
SECTION_TYPES = ("transport", "accommodation", "activity", "food", "sightseeing", "other")


class TripSection(Base):
    """"Anything — a travel leg, a hotel, or an activity" with a date range + budget."""

    __tablename__ = "trip_sections"

    id: Mapped[int] = mapped_column(BigIntPK, primary_key=True)
    trip_id: Mapped[int] = mapped_column(
        ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    section_type: Mapped[str] = mapped_column(String(20), nullable=False)
    city_id: Mapped[int | None] = mapped_column(ForeignKey("cities.id", ondelete="RESTRICT"))
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    budget: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    sequence_order: Mapped[int] = mapped_column(Integer, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)

    trip: Mapped["Trip"] = relationship("Trip", back_populates="sections")
    city: Mapped["City | None"] = relationship("City", back_populates="sections")
    activities: Mapped[list["SectionActivity"]] = relationship(
        "SectionActivity",
        back_populates="section",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="SectionActivity.sequence_order",
    )

    __table_args__ = (
        CheckConstraint("end_date >= start_date", name="ck_sections_date_order"),
        CheckConstraint("budget >= 0", name="ck_sections_budget_nonneg"),
        # NOTE: promoted to DEFERRABLE in the Postgres migration; SQLite can't
        # defer, so reorders use a two-phase (offset) write instead.
        UniqueConstraint("trip_id", "sequence_order", name="uq_section_trip_order"),
        Index("idx_sections_trip_order", "trip_id", "sequence_order"),
        Index("idx_sections_type", "trip_id", "section_type"),
    )


class SectionActivity(Base):
    """A day-scheduled item within a section: a catalog activity OR a custom name.

    ``expense`` is a deliberate price snapshot, protecting saved itineraries from
    later catalog edits.
    """

    __tablename__ = "section_activities"

    id: Mapped[int] = mapped_column(BigIntPK, primary_key=True)
    trip_section_id: Mapped[int] = mapped_column(
        ForeignKey("trip_sections.id", ondelete="CASCADE"), nullable=False, index=True
    )
    activity_id: Mapped[int | None] = mapped_column(ForeignKey("activities.id", ondelete="RESTRICT"))
    custom_name: Mapped[str | None] = mapped_column(String(160))
    scheduled_date: Mapped[date] = mapped_column(Date, nullable=False)
    scheduled_time: Mapped[time | None] = mapped_column(Time)
    sequence_order: Mapped[int] = mapped_column(Integer, nullable=False)
    expense: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    notes: Mapped[str | None] = mapped_column(Text)

    section: Mapped["TripSection"] = relationship("TripSection", back_populates="activities")
    activity: Mapped["Activity | None"] = relationship("Activity", back_populates="section_activities")

    __table_args__ = (
        CheckConstraint(
            "activity_id IS NOT NULL OR custom_name IS NOT NULL", name="ck_secact_identity"
        ),
        CheckConstraint("expense >= 0", name="ck_secact_expense_nonneg"),
        Index("idx_secact_section_day_order", "trip_section_id", "scheduled_date", "sequence_order"),
    )

    @property
    def display_name(self) -> str:
        if self.custom_name:
            return self.custom_name
        return self.activity.name if self.activity else "Untitled activity"
