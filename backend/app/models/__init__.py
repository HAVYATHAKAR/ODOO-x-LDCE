"""Import every model so SQLAlchemy's registry and Alembic autogenerate see them.

Import order is not significant: relationships use string targets and runtime
cross-imports are avoided (only ``TYPE_CHECKING`` imports in the modules).
"""
from app.models.base import Base, BigIntPK, TimestampMixin
from app.models.city import Activity, City
from app.models.community import (
    CommunityComment,
    CommunityLike,
    CommunityPost,
    SavedDestination,
)
from app.models.section import SECTION_TYPES, SectionActivity, TripSection
from app.models.trip import Trip
from app.models.user import PasswordResetToken, User

__all__ = [
    "Base",
    "BigIntPK",
    "TimestampMixin",
    "User",
    "PasswordResetToken",
    "City",
    "Activity",
    "Trip",
    "TripSection",
    "SectionActivity",
    "SECTION_TYPES",
    "CommunityPost",
    "CommunityComment",
    "CommunityLike",
    "SavedDestination",
]
