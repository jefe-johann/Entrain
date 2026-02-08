import time
import logging
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from fastapi.responses import StreamingResponse
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


def _extract_first_sample_id(voice_data) -> Optional[str]:
    samples = getattr(voice_data, "samples", None) or []
    for sample in samples:
        sample_id = getattr(sample, "sample_id", None)
        if sample_id:
            return sample_id
    return None


def _resolve_preview_url(
    request: Request,
    voice_name: str,
    preview_url: Optional[str],
    sample_id: Optional[str],
) -> Optional[str]:
    if preview_url:
        return preview_url
    if sample_id:
        return str(
            request.url_for(
                "get_voice_sample_audio",
                voice_name=voice_name,
                sample_id=sample_id,
            )
        )
    return None


@router.get("/{voice_name}/samples/{sample_id}/audio")
def get_voice_sample_audio(voice_name: str, sample_id: str):
    """Stream a preset voice sample via backend API key when preview_url is absent."""
    settings = get_settings()
    if not settings.elevenlabs_api_key:
        raise HTTPException(status_code=503, detail="Voice service not configured")

    voice_id = VOICES.get(voice_name)
    if not voice_id:
        raise HTTPException(status_code=404, detail="Voice not found")

    from elevenlabs import ElevenLabs

    client = ElevenLabs(api_key=settings.elevenlabs_api_key)
    try:
        audio_chunks = client.voices.samples.audio.get(
            voice_id=voice_id,
            sample_id=sample_id,
        )
    except Exception as e:
        logger.warning(
            f"Failed to fetch sample audio for voice {voice_name} ({sample_id}): {e}"
        )
        raise HTTPException(status_code=404, detail="Voice sample not found")

    return StreamingResponse(audio_chunks, media_type="audio/mpeg")


@router.get("", response_model=List[VoiceResponse])
def list_voices(
    request: Request,
    x_user_email: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """Return available voices with preview URLs from ElevenLabs, plus user's custom voices."""
    now = time.time()

    if _cache["voices"] and now < _cache["expires_at"]:
        cached_voices = list(_cache["voices"])
    else:
        settings = get_settings()
        if not settings.elevenlabs_api_key:
            raise HTTPException(status_code=503, detail="Voice service not configured")

        from elevenlabs import ElevenLabs

        client = ElevenLabs(api_key=settings.elevenlabs_api_key)
        voices = []

        for name, voice_id in VOICES.items():
            preview_url = None
            sample_id = None
            try:
                voice_data = client.voices.get(voice_id=voice_id)
                preview_url = getattr(voice_data, "preview_url", None)
                sample_id = _extract_first_sample_id(voice_data)
            except Exception as e:
                logger.warning(f"Failed to fetch voice {name} ({voice_id}): {e}")

            voices.append({
                "id": name,
                "name": name,
                "preview_url": preview_url,
                "sample_id": sample_id,
            })

        _cache["voices"] = voices
        _cache["expires_at"] = now + CACHE_TTL
        cached_voices = list(voices)

    preset_voices = [
        VoiceResponse(
            id=voice["id"],
            name=voice["name"],
            preview_url=_resolve_preview_url(
                request=request,
                voice_name=voice["id"],
                preview_url=voice.get("preview_url"),
                sample_id=voice.get("sample_id"),
            ),
        )
        for voice in cached_voices
    ]

    # Append user's custom voices if authenticated
    if x_user_email:
        try:
            user = db.query(User).filter(User.email == x_user_email).first()
            if user:
                custom = (
                    db.query(CustomVoice)
                    .filter(CustomVoice.user_id == user.id)
                    .order_by(CustomVoice.created_at.desc())
                    .all()
                )
                for cv in custom:
                    preset_voices.append(
                        VoiceResponse(
                            id=cv.elevenlabs_voice_id,
                            name=cv.name,
                            preview_url=cv.preview_url,
                            is_custom=True,
                        )
                    )
        except Exception as e:
            logger.warning(f"Failed to load custom voices for {x_user_email}: {e}")

    return preset_voices
