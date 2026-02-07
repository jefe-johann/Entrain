import time
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from ..config import get_settings
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


@router.get("", response_model=List[VoiceResponse])
def list_voices():
    """Return available voices with preview URLs from ElevenLabs."""
    now = time.time()

    if _cache["voices"] and now < _cache["expires_at"]:
        return _cache["voices"]

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

    return voices
