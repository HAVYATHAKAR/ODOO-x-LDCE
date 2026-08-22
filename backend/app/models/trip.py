from sqlalchemy import Column, BigInteger, String, Boolean, Date, Numeric, Text, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin

class Trip(Base, TimestampMixin):
    __tablename__ = "trips"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    name = Column(String(160), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    cover_photo_url = Column(String(500), nullable=True)
    total_budget = Column(Numeric(12,2), nullable=True)
    currency = Column(String(3), default='INR', nullable=False)
    is_public = Column(Boolean, default=False, nullable=False)
    public_slug = Column(String(16), unique=True, nullable=True)
    copied_from_trip_id = Column(BigInteger, ForeignKey("trips.id"), nullable=True)
    
    owner = relationship("User")
    sections = relationship("TripSection", back_populates="trip", cascade="all, delete-orphan", order_by="TripSection.sequence_order")
    
    __table_args__ = (
        CheckConstraint("end_date >= start_date", name="check_trip_dates"),
        CheckConstraint("total_budget IS NULL OR total_budget >= 0", name="check_trip_budget"),
    )
