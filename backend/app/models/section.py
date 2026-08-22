from sqlalchemy import Column, BigInteger, String, Integer, Date, Time, Numeric, Text, ForeignKey, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import relationship
from .base import Base

class TripSection(Base):
    __tablename__ = "trip_sections"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    trip_id = Column(BigInteger, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(160), nullable=False)
    description = Column(Text, nullable=True)
    section_type = Column(String(20), nullable=False)
    city_id = Column(BigInteger, ForeignKey("cities.id"), nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    budget = Column(Numeric(12,2), default=0, nullable=False)
    sequence_order = Column(Integer, nullable=False)
    notes = Column(Text, nullable=True)
    
    trip = relationship("Trip", back_populates="sections")
    activities = relationship("SectionActivity", back_populates="section", cascade="all, delete-orphan", order_by="SectionActivity.sequence_order")
    
    __table_args__ = (
        CheckConstraint("end_date >= start_date", name="check_section_dates"),
        CheckConstraint("budget >= 0", name="check_section_budget"),
        UniqueConstraint("trip_id", "sequence_order", name="uq_trip_section_order", deferrable=True)
    )

class SectionActivity(Base):
    __tablename__ = "section_activities"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    trip_section_id = Column(BigInteger, ForeignKey("trip_sections.id", ondelete="CASCADE"), nullable=False)
    activity_id = Column(BigInteger, ForeignKey("activities.id"), nullable=True)
    custom_name = Column(String(160), nullable=True)
    scheduled_date = Column(Date, nullable=False)
    scheduled_time = Column(Time, nullable=True)
    sequence_order = Column(Integer, nullable=False)
    expense = Column(Numeric(10,2), default=0, nullable=False)
    notes = Column(Text, nullable=True)
    
    section = relationship("TripSection", back_populates="activities")
    activity_ref = relationship("Activity")
    
    __table_args__ = (
        CheckConstraint("activity_id IS NOT NULL OR custom_name IS NOT NULL", name="check_activity_identity"),
        CheckConstraint("expense >= 0", name="check_activity_expense"),
    )
