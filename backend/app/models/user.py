from sqlalchemy import Column, BigInteger, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin

class User(Base, TimestampMixin):
    __tablename__ = "users"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(80), nullable=False)
    last_name = Column(String(80), nullable=False)
    phone_number = Column(String(20), nullable=True)
    city = Column(String(120), nullable=True)
    country = Column(String(120), nullable=True)
    additional_info = Column(String(1000), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    language_pref = Column(String(10), default="en", nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
