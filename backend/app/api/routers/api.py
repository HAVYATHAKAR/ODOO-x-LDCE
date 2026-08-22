from fastapi import APIRouter
from app.api.routers import auth, trips

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(trips.router, prefix="/trips", tags=["trips"])
