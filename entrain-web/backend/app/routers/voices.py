import time
import logging
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..config import get_settings
from ..models import User, CustomVoice
from worker.generator import VOICES

router = APIRouter(prefix="/api/voices", tags=["voices"])
logger = logging.getLogger(__name__)

# Simple in-memory cache
_cache: dict = {"voices": None, "expires_at": 0}
CACHE_TTL = 3600  # 1 hour


class VoiceResponse(BaseModel):
    id: str
    name: str
    preview_url: Optional[str] = None
    is_custom: bool = False


@router.get("", response_model=List[VoiceResponse])
def list_voices(
    x_user_email: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """Return available voices with preview URLs from ElevenLabs, plus user's custom voices."""
    now = time.time()

    if _cache["voices"] and now < _cache["expires_at"]:
        preset_voices = list(_cache["voices"])
    else:
        settings = get_settings()
        if not settings.elevenlabs_api_key:
            raise HTTPException(status_code=503, detail="Voice service not configured")

        from elevenlabs import ElevenLabs

        client = ElevenLabs(api_key=settings.elevenlabs_api_key)
        voices = []

        for name, voice_id in VOICES.items():
            try:
                voice_data = client.voices.get(voice_id=voice_id)
                preview_url = getattr(voice_data, "preview_url", None)
            except Exception as e:
                logger.warning(f"Failed to fetch voice {name} ({voice_id}): {e}")
                preview_url = None

            voices.append(VoiceResponse(
                id=name,
                name=name,
                preview_url=preview_url,
            ))

        _cache["voices"] = voices
        _cache["expires_at"] = now + CACHE_TTL
        preset_voices = list(voices)

    # Append user's custom voices if authenticated
    if x_user_email:
        user = db.query(User).filter(User.email == x_user_email).first()
        if user:
            custom = (
                db.query(CustomVoice)
                .filter(CustomVoice.user_id == user.id)
                .order_by(CustomVoice.created_at.desc())
                .all()
            )
            for cv in custom:
                preset_voices.append(VoiceResponse(
                    id=cv.elevenlabs_voice_id,
                    name=cv.name,
                    preview_url=cv.preview_url,
                    is_custom=True,
                ))

    return preset_voices
