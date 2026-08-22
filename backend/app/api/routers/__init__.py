"""Aggregate every feature router into a single ``api_router``."""
from fastapi import APIRouter

from app.api.routers import (
    activities_router,
    admin_router,
    auth_router,
    cities_router,
    community_router,
    dashboard_router,
    public_router,
    saved_router,
    sections_router,
    trips_router,
    users_router,
)

api_router = APIRouter()
api_router.include_router(auth_router.router)
api_router.include_router(users_router.router)
api_router.include_router(dashboard_router.router)
api_router.include_router(trips_router.router)
api_router.include_router(sections_router.router)
api_router.include_router(cities_router.router)
api_router.include_router(activities_router.router)
api_router.include_router(community_router.router)
api_router.include_router(saved_router.router)
api_router.include_router(public_router.router)
api_router.include_router(admin_router.router)

__all__ = ["api_router"]
