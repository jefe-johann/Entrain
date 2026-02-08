import logging

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional

from ..config import get_settings
from ..database import get_db
from ..models import User, CustomVoice
from ..schemas import CustomVoiceCreate, CustomVoiceResponse

router = APIRouter(prefix="/api/custom-voices", tags=["custom-voices"])
logger = logging.getLogger(__name__)


def get_current_user_email(x_user_email: Optional[str] = Header(None)) -> str:
    if not x_user_email:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return x_user_email


def get_user_by_email(email: str, db: Session) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("", response_model=CustomVoiceResponse)
def create_custom_voice(
    voice_data: CustomVoiceCreate,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db),
):
    user = get_user_by_email(email, db)

    if voice_data.use_user_api_key and not user.elevenlabs_api_key:
        raise HTTPException(
            status_code=400,
            detail="You must set your ElevenLabs API key before adding a voice clone.",
        )

    # Try to fetch preview URL at creation time using the appropriate API key
    preview_url = None
    api_key = (
        user.elevenlabs_api_key if voice_data.use_user_api_key
        else get_settings().elevenlabs_api_key
    )
    if api_key:
        try:
            from elevenlabs import ElevenLabs
            client = ElevenLabs(api_key=api_key)
            voice_info = client.voices.get(voice_id=voice_data.elevenlabs_voice_id)
            preview_url = getattr(voice_info, "preview_url", None)
        except Exception as e:
            logger.warning(f"Could not fetch preview for voice {voice_data.elevenlabs_voice_id}: {e}")

    voice = CustomVoice(
        user_id=user.id,
        name=voice_data.name,
        elevenlabs_voice_id=voice_data.elevenlabs_voice_id,
        use_user_api_key=voice_data.use_user_api_key,
        preview_url=preview_url,
    )
    db.add(voice)
    db.commit()
    db.refresh(voice)
    return voice


@router.get("", response_model=List[CustomVoiceResponse])
def list_custom_voices(
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db),
):
    user = get_user_by_email(email, db)
    voices = (
        db.query(CustomVoice)
        .filter(CustomVoice.user_id == user.id)
        .order_by(CustomVoice.created_at.desc())
        .all()
    )
    return voices


@router.delete("/{voice_id}")
def delete_custom_voice(
    voice_id: str,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db),
):
    user = get_user_by_email(email, db)
    voice = (
        db.query(CustomVoice)
        .filter(CustomVoice.id == voice_id, CustomVoice.user_id == user.id)
        .first()
    )
    if not voice:
        raise HTTPException(status_code=404, detail="Custom voice not found")

    db.delete(voice)
    db.commit()
    return {"message": "Custom voice deleted"}
