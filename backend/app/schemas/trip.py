from pydantic import BaseModel, Field, HttpUrl
from datetime import date
from typing import Optional

class TripCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=160)
    description: Optional[str] = None
    start_date: date
    end_date: date
    cover_photo_url: Optional[HttpUrl] = None
    total_budget: Optional[float] = Field(None, ge=0)
    currency: str = Field("INR", max_length=3)

class TripUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=160)
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    total_budget: Optional[float] = Field(None, ge=0)

class TripResponse(TripCreate):
    id: int
    user_id: int
    is_public: bool
    public_slug: Optional[str]
    
    class Config:
        from_attributes = True
