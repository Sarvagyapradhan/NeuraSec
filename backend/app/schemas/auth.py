from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None

class UserLogin(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    full_name: Optional[str] = None
    profile_picture: Optional[str] = None
    role: str
    created_at: Optional[datetime] = Field(default_factory=datetime.now)
    
    class Config:
        orm_mode = True

# OTP schemas
class OTPBase(BaseModel):
    email: EmailStr

class OTPCreate(OTPBase):
    pass

class OTPVerify(OTPBase):
    otp: str = Field(..., min_length=6, max_length=6)

class OTPOut(BaseModel):
    id: int
    email: str
    created_at: datetime
    expiry: datetime
    used: bool
    
    class Config:
        orm_mode = True

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None
    role: Optional[str] = None

# Google OAuth schemas
class GoogleAuthRequest(BaseModel):
    code: str

# Admin OTP Log schema
class OTPLogList(BaseModel):
    otps: List[OTPOut] 