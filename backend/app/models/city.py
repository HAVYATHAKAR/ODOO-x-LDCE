from sqlalchemy import Column, BigInteger, String, Numeric, Integer, Text, UniqueConstraint, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class City(Base):
    __tablename__ = "cities"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(120), nullable=False)
    country = Column(String(120), nullable=False)
    region = Column(String(120), nullable=True)
    latitude = Column(Numeric(9,6), nullable=True)
    longitude = Column(Numeric(9,6), nullable=True)
    cost_index = Column(Numeric(6,2), default=100, nullable=False)
    popularity_score = Column(Integer, default=0, nullable=False)
    image_url = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    
    activities = relationship("Activity", back_populates="city")
    
    __table_args__ = (
        UniqueConstraint("name", "country", name="uq_city_country"),
    )

class Activity(Base):
    __tablename__ = "activities"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    city_id = Column(BigInteger, ForeignKey("cities.id"), nullable=False)
    name = Column(String(160), nullable=False)
    category = Column(String(40), nullable=False)
    description = Column(Text, nullable=True)
    estimated_cost = Column(Numeric(10,2), default=0, nullable=False)
    duration_minutes = Column(Integer, nullable=True)
    image_url = Column(String(500), nullable=True)
    
    city = relationship("City", back_populates="activities")
