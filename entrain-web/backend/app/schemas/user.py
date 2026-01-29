from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class UserSync(BaseModel):
    """Schema for syncing user from Auth.js."""

    email: EmailStr
    name: Optional[str] = None
    image: Optional[str] = None


class UserCreate(BaseModel):
    """Schema for creating a new user."""

    email: EmailStr
    name: Optional[str] = None
    image: Optional[str] = None


class UserResponse(BaseModel):
    """Schema for user response."""

    id: str
    email: str
    name: Optional[str]
    image: Optional[str]
    credits: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
