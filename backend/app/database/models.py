from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from datetime import datetime, timedelta, timezone

from .database import Base

class UserRole(enum.Enum):
    USER = "user"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    # username column commented out until migration is performed
    # username = Column(String, unique=True, index=True, nullable=True)
    password = Column(String)
    full_name = Column(String, nullable=True)
    role = Column(String, default="user")
    # Fields below do not exist in the database yet - uncomment after migration
    # is_active = Column(Boolean, default=True)
    # is_verified = Column(Boolean, default=False)
    # created_at = Column(DateTime, default=datetime.utcnow)
    # last_login = Column(DateTime, nullable=True)
    # profile_picture = Column(String, nullable=True)
    # google_id = Column(String, nullable=True, unique=True)
    # updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    otps = relationship("OTP", back_populates="user")

class OTP(Base):
    __tablename__ = "otps"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    otp = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expiry = Column(DateTime(timezone=True))
    used = Column(Boolean, default=False)
    
    # Relationships
    user = relationship("User", back_populates="otps")
    
    def is_expired(self):
        """Check if the OTP is expired"""
        return datetime.now(timezone.utc) > self.expiry
        
    @classmethod
    def create_expiry(cls):
        """Create an expiry time 10 minutes from now"""
        return datetime.now(timezone.utc) + timedelta(minutes=10) 