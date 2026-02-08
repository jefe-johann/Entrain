from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class CustomVoiceCreate(BaseModel):
    name: str
    elevenlabs_voice_id: str
    use_user_api_key: bool = False


class CustomVoiceResponse(BaseModel):
    id: str
    user_id: str
    name: str
    elevenlabs_voice_id: str
    use_user_api_key: bool
    preview_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
