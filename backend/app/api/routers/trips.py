from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.core.database import get_db
from app.models.user import User
from app.models.trip import Trip
from app.schemas.trip import TripCreate, TripResponse, TripUpdate
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
async def create_trip(
    trip_in: TripCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if trip_in.end_date < trip_in.start_date:
        raise HTTPException(status_code=400, detail="end_date cannot be before start_date")
        
    new_trip = Trip(
        user_id=current_user.id,
        name=trip_in.name,
        description=trip_in.description,
        start_date=trip_in.start_date,
        end_date=trip_in.end_date,
        cover_photo_url=str(trip_in.cover_photo_url) if trip_in.cover_photo_url else None,
        total_budget=trip_in.total_budget,
        currency=trip_in.currency
    )
    db.add(new_trip)
    await db.commit()
    await db.refresh(new_trip)
    return new_trip

@router.get("/", response_model=List[TripResponse])
async def read_user_trips(
    skip: int = 0, 
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Trip).where(Trip.user_id == current_user.id).offset(skip).limit(limit)
    )
    trips = result.scalars().all()
    return trips

@router.get("/{trip_id}", response_model=TripResponse)
async def read_trip(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Trip).where(Trip.id == trip_id, Trip.user_id == current_user.id)
    )
    trip = result.scalars().first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip

@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trip(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Trip).where(Trip.id == trip_id, Trip.user_id == current_user.id)
    )
    trip = result.scalars().first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    await db.delete(trip)
    await db.commit()
    return None
