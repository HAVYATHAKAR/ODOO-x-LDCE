"""Service layer — business logic composed over CRUD.

Imported as modules so call sites read as ``budget_service.compute(...)``.
"""
from app.services import (  # noqa: F401
    auth_service,
    budget_service,
    health_service,
    share_service,
)

__all__ = [
    "auth_service",
    "budget_service",
    "health_service",
    "share_service",
]
