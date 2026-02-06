import math

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from enum import Enum

AFFIRMATIONS_PER_CREDIT = 50


class BinauralPreset(str, Enum):
    DELTA = "delta"  # 0.5-4 Hz - Deep sleep
    THETA = "theta"  # 4-8 Hz - Meditation, creativity
    ALPHA = "alpha"  # 8-13 Hz - Relaxation
    BETA = "beta"  # 13-30 Hz - Focus, alertness


class VoiceSettings(BaseModel):
    """Voice customization settings."""

    stability: float = Field(default=0.8, ge=0.0, le=1.0)
    similarity_boost: float = Field(default=0.75, ge=0.0, le=1.0)
    style: float = Field(default=0.0, ge=0.0, le=1.0)
    use_speaker_boost: bool = True


class LowpassFilter(BaseModel):
    """Low-pass filter settings."""

    enabled: bool = True
    cutoff_hz: int = Field(default=3750, ge=2000, le=8000)


class JobConfig(BaseModel):
    """Configuration for a generation job."""

    # Required
    affirmations: List[str] = Field(..., min_length=1)

    # Basic settings
    title: Optional[str] = Field(default=None, max_length=100)
    voice_id: str = "Rachel"
    duration_minutes: int = Field(default=40, ge=5, le=40)
    binaural_preset: Optional[BinauralPreset] = BinauralPreset.THETA
    binaural_frequency_hz: Optional[float] = Field(default=None, ge=0.5, le=30)

    # Advanced settings
    affirmation_volume_db: float = Field(default=-15, ge=-30, le=0)
    binaural_volume_db: float = Field(default=-12, ge=-30, le=0)
    voice_settings: VoiceSettings = Field(default_factory=VoiceSettings)
    lowpass_filter: LowpassFilter = Field(default_factory=LowpassFilter)
    repetitions: int = Field(default=1, ge=1, le=10)

    def credits_required(self) -> int:
        total = len(self.affirmations) * self.repetitions
        return max(1, math.ceil(total / AFFIRMATIONS_PER_CREDIT))

    def get_binaural_frequency(self) -> float:
        """Get the actual binaural frequency, resolving preset if needed."""
        if self.binaural_frequency_hz is not None:
            return self.binaural_frequency_hz

        presets = {
            BinauralPreset.DELTA: 2.0,
            BinauralPreset.THETA: 6.0,
            BinauralPreset.ALPHA: 10.0,
            BinauralPreset.BETA: 20.0,
        }
        return presets.get(self.binaural_preset, 6.0)


class JobCreate(BaseModel):
    """Schema for creating a new job."""

    config: JobConfig


class JobStatusResponse(BaseModel):
    """Lightweight status response for polling."""

    id: str
    status: str
    progress: int
    progress_message: Optional[str]
    error_message: Optional[str]


class JobResponse(BaseModel):
    """Full job response."""

    id: str
    user_id: str
    status: str
    progress: int
    progress_message: Optional[str]
    error_message: Optional[str]
    config: dict
    file_path: Optional[str]
    file_size_bytes: Optional[int]
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]
    archived_at: Optional[datetime]

    class Config:
        from_attributes = True
