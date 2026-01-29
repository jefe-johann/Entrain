from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..models import User
from ..schemas import UserSync, UserResponse

router = APIRouter(prefix="/api/users", tags=["users"])


def get_current_user_email(x_user_email: Optional[str] = Header(None)) -> str:
    """Extract user email from header (set by frontend after Auth.js verification)."""
    if not x_user_email:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return x_user_email


@router.post("/sync", response_model=UserResponse)
def sync_user(user_data: UserSync, db: Session = Depends(get_db)):
    """
    Sync user from Auth.js on signup/signin.
    Creates user if not exists, updates if exists.
    """
    user = db.query(User).filter(User.email == user_data.email).first()

    if user:
        # Update existing user
        if user_data.name:
            user.name = user_data.name
        if user_data.image:
            user.image = user_data.image
        db.commit()
        db.refresh(user)
    else:
        # Create new user with 1 free credit
        user = User(
            email=user_data.email,
            name=user_data.name,
            image=user_data.image,
            credits=1,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user


@router.get("/me", response_model=UserResponse)
def get_current_user(
    email: str = Depends(get_current_user_email), db: Session = Depends(get_db)
):
    """Get the current user's profile and credits."""
    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user
