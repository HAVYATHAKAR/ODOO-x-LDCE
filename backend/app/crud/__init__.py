"""CRUD layer — thin, testable persistence functions grouped by aggregate.

Imported as modules (``from app.crud import crud_trip``) so call sites read as
``crud_trip.get(...)``.
"""
from app.crud import (  # noqa: F401
    crud_activity,
    crud_city,
    crud_community,
    crud_saved,
    crud_section,
    crud_trip,
    crud_user,
)

__all__ = [
    "crud_activity",
    "crud_city",
    "crud_community",
    "crud_saved",
    "crud_section",
    "crud_trip",
    "crud_user",
]
