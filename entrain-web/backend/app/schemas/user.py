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
    has_elevenlabs_api_key: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_user(cls, user):
        return cls(
            id=user.id,
            email=user.email,
            name=user.name,
            image=user.image,
            credits=user.credits,
            has_elevenlabs_api_key=bool(user.elevenlabs_api_key),
            created_at=user.created_at,
            updated_at=user.updated_at,
        )


class UserApiKeyUpdate(BaseModel):
    """Schema for updating user's ElevenLabs API key."""

    elevenlabs_api_key: Optional[str] = None
