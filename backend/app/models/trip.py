"""The Trip aggregate root. Status is derived from dates, never stored."""
from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, CheckConstraint, Date, ForeignKey, Index, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, BigIntPK, TimestampMixin

if TYPE_CHECKING:  # pragma: no cover
    from app.models.community import CommunityPost
    from app.models.section import TripSection
    from app.models.user import User


class Trip(Base, TimestampMixin):
    """A user's plan: an ordered list of sections with a date range and budget."""

    __tablename__ = "trips"

    id: Mapped[int] = mapped_column(BigIntPK, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    cover_photo_url: Mapped[str | None] = mapped_column(String(500))
    total_budget: Mapped[float | None] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")
    is_public: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    show_public_budget: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    public_slug: Mapped[str | None] = mapped_column(String(16), unique=True)
    copied_from_trip_id: Mapped[int | None] = mapped_column(
        ForeignKey("trips.id", ondelete="SET NULL")
    )

    owner: Mapped["User"] = relationship("User", back_populates="trips")
    sections: Mapped[list["TripSection"]] = relationship(
        "TripSection",
        back_populates="trip",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="TripSection.sequence_order",
    )
    copied_from: Mapped["Trip | None"] = relationship(
        "Trip", remote_side="Trip.id", foreign_keys=[copied_from_trip_id]
    )
    posts: Mapped[list["CommunityPost"]] = relationship(
        "CommunityPost", back_populates="trip", passive_deletes=True
    )

    __table_args__ = (
        CheckConstraint("end_date >= start_date", name="ck_trips_date_order"),
        CheckConstraint("total_budget IS NULL OR total_budget >= 0", name="ck_trips_budget_nonneg"),
        Index("idx_trips_user_dates", "user_id", "start_date"),
    )

    @property
    def num_days(self) -> int:
        return (self.end_date - self.start_date).days + 1
