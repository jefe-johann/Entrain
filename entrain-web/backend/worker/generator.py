"""
Entrain Generator - Adapted for web worker
Based on the original generate.py, modified to:
- Accept config from database job
- Report progress via callback
- Remove interactive prompts
"""

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, filtfilt, lfilter
import soundfile as sf
import os
import tempfile
import random
from elevenlabs import ElevenLabs, VoiceSettings
import subprocess
from typing import Callable, Optional

ASSETS_DIR = os.path.join(os.path.dirname(__file__), "assets")

# Maps noise type keys to asset filenames
AUDIO_LOOP_FILES = {
    'rain': 'rain-loop.mp3',
    'small-waves': 'small-waves.mp3',
    'ocean-waves': 'ocean-waves.mp3',
    'river': 'river.mp3',
}


# Voice ID mappings (same as original config)
VOICES = {
    "Clara": "Qggl4b0xRMiqOwhPtVWT",
    "Anne": "flHkNRp1BlvT73UL6gyz",
    "Emma": "56bWURjYFHyYyVf490Dp",
    "Sadie": "bD9maNcCuQQS75DGuteM",
    "Brian": "nPczCjzI2devNBz1zQrb",
    "Charlie": "IKne3meq5aSn9XLyUdCD",
    "Jon": "Cz0K1kOv9tD8l0b5Qu53",
}

# Default audio settings
DEFAULT_SAMPLE_RATE = 22050
DEFAULT_CARRIER_FREQ = 200


def resolve_voice_id(voice_name: str) -> str:
    """Resolve voice name to ElevenLabs voice ID."""
    return VOICES.get(voice_name, voice_name)


def apply_lowpass_filter(audio_data, cutoff_hz: int, sample_rate: int, order: int = 5):
    """Apply a low-pass Butterworth filter to remove high frequencies."""
    nyquist = sample_rate / 2
    normal_cutoff = cutoff_hz / nyquist
    b, a = butter(order, normal_cutoff, btype='low', analog=False)
    filtered_data = filtfilt(b, a, audio_data)
    return filtered_data.astype(np.int16)


def generate_pink_noise_chunk(num_samples: int, rng: np.random.Generator) -> np.ndarray:
    """Generate pink noise using FFT spectral shaping (1/sqrt(f) filter)."""
    white = rng.standard_normal(num_samples)
    fft = np.fft.rfft(white)
    freqs = np.fft.rfftfreq(num_samples, d=1.0)
    # Avoid division by zero at DC; leave DC component as-is
    freqs[0] = 1.0
    fft *= 1.0 / np.sqrt(freqs)
    pink = np.fft.irfft(fft, n=num_samples)
    # Normalize to [-1, 1]
    peak = np.max(np.abs(pink))
    if peak > 0:
        pink /= peak
    return pink


def generate_brown_noise_chunk(num_samples: int, rng: np.random.Generator) -> np.ndarray:
    """Generate brown noise using a leaky integrator (1/f² spectrum)."""
    white = rng.standard_normal(num_samples)
    # Leaky integrator: H(z) = 1 / (1 - 0.98·z⁻¹)
    # Gives the ~-6 dB/octave rolloff characteristic of brown noise
    # while keeping energy in the audible range
    brown = lfilter([1], [1, -0.98], white)
    # Normalize to [-1, 1]
    peak = np.max(np.abs(brown))
    if peak > 0:
        brown /= peak
    return brown


def load_audio_loop(filename: str, sample_rate: int) -> np.ndarray:
    """Decode an audio file from assets, resample to sample_rate, return normalized float64 array.

    Returns just the loop itself — callers use modulo indexing to avoid tiling in memory.
    """
    src_path = os.path.join(ASSETS_DIR, filename)
    with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp:
        wav_path = tmp.name
    try:
        subprocess.run([
            'ffmpeg', '-i', src_path,
            '-ar', str(sample_rate),
            '-ac', '1',
            '-y', wav_path,
        ], check=True, capture_output=True)
        _, audio = wavfile.read(wav_path)
        audio = audio.astype(np.float64)
        peak = np.max(np.abs(audio))
        if peak > 0:
            audio /= peak
        return audio
    finally:
        if os.path.exists(wav_path):
            os.unlink(wav_path)


def generate_binaural_beat(
    duration_seconds: int,
    sample_rate: int,
    carrier_freq: int,
    binaural_freq: float,
    noise_type: Optional[str] = None,
    noise_volume_db: float = -20,
) -> np.ndarray:
    """Generate stereo binaural beat audio in chunks to limit memory usage."""
    total_samples = int(sample_rate * duration_seconds)
    stereo = np.empty((total_samples, 2), dtype=np.int16)

    # Process in 30-second chunks to stay under ~50 MB per chunk
    chunk_samples = sample_rate * 30
    amplitude = 32767 * 0.3
    left_phase_step = (2 * np.pi * carrier_freq) / sample_rate
    right_phase_step = (2 * np.pi * (carrier_freq + binaural_freq)) / sample_rate
    left_phase = 0.0
    right_phase = 0.0

    # Set up noise source
    noise_amplitude = 32767 * (10 ** (noise_volume_db / 20)) if noise_type else 0
    procedural_generators = {
        'pink': generate_pink_noise_chunk,
        'brown': generate_brown_noise_chunk,
    }
    noise_gen_fn = procedural_generators.get(noise_type) if noise_type else None
    rng = np.random.default_rng(seed=42) if noise_gen_fn else None
    # Load file-based loop if needed (just the loop itself, not tiled — we use modulo per chunk)
    loop_filename = AUDIO_LOOP_FILES.get(noise_type) if noise_type else None
    audio_loop = load_audio_loop(loop_filename, sample_rate) if loop_filename else None

    # Fade duration: 3s at each end of the track to smooth the repeat transition
    fade_samples = sample_rate * 3

    for start in range(0, total_samples, chunk_samples):
        end = min(start + chunk_samples, total_samples)
        chunk_len = end - start
        sample_idx = np.arange(chunk_len, dtype=np.float64)
        # Use float64 phase accumulation to avoid late-track float32 timestamp precision drift.
        left_phase_chunk = left_phase + (sample_idx * left_phase_step)
        right_phase_chunk = right_phase + (sample_idx * right_phase_step)

        left = np.sin(left_phase_chunk) * amplitude
        right = np.sin(right_phase_chunk) * amplitude

        # Mix in background noise (same signal in both channels for spatial consistency)
        if noise_gen_fn and rng is not None:
            noise_chunk = noise_gen_fn(chunk_len, rng) * noise_amplitude
        elif audio_loop is not None:
            # Modulo indexing wraps the loop without tiling the full track in memory
            indices = np.arange(start, end) % len(audio_loop)
            noise_chunk = audio_loop[indices] * noise_amplitude
        else:
            noise_chunk = None

        if noise_chunk is not None:
            # Fade in/out envelope so ambient layer doesn't cut abruptly at track boundaries
            positions = np.arange(start, end, dtype=np.float64)
            gain = np.ones(chunk_len)
            gain = np.where(positions < fade_samples, positions / fade_samples, gain)
            gain = np.where(positions >= total_samples - fade_samples,
                            (total_samples - positions) / fade_samples, gain)
            noise_chunk *= gain
            left += noise_chunk
            right += noise_chunk

        stereo[start:end, 0] = np.clip(left, -32767, 32767).astype(np.int16)
        stereo[start:end, 1] = np.clip(right, -32767, 32767).astype(np.int16)

        left_phase = (left_phase + (chunk_len * left_phase_step)) % (2 * np.pi)
        right_phase = (right_phase + (chunk_len * right_phase_step)) % (2 * np.pi)

    return stereo


def text_to_speech(
    text: str,
    client: ElevenLabs,
    voice_id: str,
    voice_settings: dict,
    lowpass_config: dict,
    sample_rate: int,
) -> np.ndarray:
    """Convert text to speech using ElevenLabs TTS."""
    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp_mp3:
        mp3_path = tmp_mp3.name

    with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp_wav:
        wav_path = tmp_wav.name

    try:
        # Create VoiceSettings object
        voice_settings_obj = VoiceSettings(
            stability=voice_settings.get('stability', 0.8),
            similarity_boost=voice_settings.get('similarity_boost', 0.75),
            style=voice_settings.get('style', 0.0),
            use_speaker_boost=voice_settings.get('use_speaker_boost', True),
        )

        # Generate speech
        audio_generator = client.text_to_speech.convert(
            voice_id=voice_id,
            text=text,
            model_id="eleven_multilingual_v2",
            voice_settings=voice_settings_obj,
            output_format="mp3_44100_128",
        )

        # Save to MP3
        audio_bytes = b''.join(audio_generator)
        with open(mp3_path, 'wb') as f:
            f.write(audio_bytes)

        # Convert MP3 to WAV using ffmpeg
        subprocess.run([
            'ffmpeg', '-i', mp3_path,
            '-ar', str(sample_rate),
            '-ac', '1',  # Mono
            '-y',
            wav_path
        ], check=True, capture_output=True)

        # Load WAV file
        _, audio_data = wavfile.read(wav_path)

        # Apply low-pass filter if enabled
        if lowpass_config.get('enabled', True):
            cutoff_hz = lowpass_config.get('cutoff_hz', 3750)
            audio_data = apply_lowpass_filter(audio_data, cutoff_hz, sample_rate)

        return audio_data

    finally:
        if os.path.exists(mp3_path):
            os.unlink(mp3_path)
        if os.path.exists(wav_path):
            os.unlink(wav_path)


def overlay_affirmations_on_binaural(
    binaural_audio: np.ndarray,
    affirmations: list,
    duration_seconds: int,
    sample_rate: int,
    affirmation_volume_db: float,
    binaural_volume_db: float,
    repetitions: int,
    client: ElevenLabs,
    voice_id: str,
    voice_settings: dict,
    lowpass_config: dict,
    progress_callback: Optional[Callable[[int, str], None]] = None,
) -> np.ndarray:
    """Overlay spoken affirmations onto binaural beat track (memory-efficient).

    Works directly on the int16 binaural array. For each affirmation, converts
    only the affected region to float32, mixes, and writes back to int16.
    """
    binaural_volume_factor = np.float32(10 ** (binaural_volume_db / 20.0))
    affirmation_volume_factor = np.float32(10 ** (affirmation_volume_db / 20.0))

    # Apply binaural volume in chunks to avoid full float32 copy
    chunk_size = sample_rate * 30  # 30-second chunks
    for start in range(0, len(binaural_audio), chunk_size):
        end = min(start + chunk_size, len(binaural_audio))
        chunk = binaural_audio[start:end].astype(np.float32) * binaural_volume_factor
        np.clip(chunk, -32767, 32767, out=chunk)
        binaural_audio[start:end] = chunk.astype(np.int16)

    # Calculate spacing
    num_affirmations = len(affirmations) * repetitions
    interval = duration_seconds / num_affirmations

    current_sample = int(30 * sample_rate)  # Start after 30 seconds

    # Shuffle affirmations
    shuffled_affirmations = affirmations * repetitions
    random.shuffle(shuffled_affirmations)

    total_affirmations = len(shuffled_affirmations)
    total_samples = len(binaural_audio)
    end_boundary = total_samples - (30 * sample_rate)

    for i, affirmation in enumerate(shuffled_affirmations):
        if current_sample >= end_boundary:
            break

        # Report progress (30-90% range for affirmation overlay)
        if progress_callback:
            progress = 30 + int((i / total_affirmations) * 60)
            progress_callback(progress, f"Processing affirmation {i+1}/{total_affirmations}")

        # Generate speech
        speech_audio = text_to_speech(
            affirmation,
            client,
            voice_id,
            voice_settings,
            lowpass_config,
            sample_rate,
        )

        speech_len = len(speech_audio)
        end_sample = min(current_sample + speech_len, total_samples)
        mix_len = end_sample - current_sample

        # Mix only the affected region in float32, then write back as int16
        region = binaural_audio[current_sample:end_sample].astype(np.float32)
        speech_scaled = speech_audio[:mix_len].astype(np.float32) * affirmation_volume_factor
        region[:, 0] += speech_scaled
        region[:, 1] += speech_scaled

        # Clip to int16 range
        np.clip(region, -32767, 32767, out=region)
        binaural_audio[current_sample:end_sample] = region.astype(np.int16)

        # Move to next position with randomness
        interval_samples = int(interval * sample_rate)
        current_sample += interval_samples + random.randint(-3 * sample_rate, 3 * sample_rate)

    return binaural_audio


def generate_meditation(
    config: dict,
    output_path: str,
    elevenlabs_api_key: str,
    progress_callback: Optional[Callable[[int, str], None]] = None,
) -> dict:
    """
    Generate a meditation track with binaural beats and affirmations.

    Args:
        config: Job configuration dictionary
        output_path: Path to save the output FLAC file
        elevenlabs_api_key: ElevenLabs API key
        progress_callback: Optional callback for progress updates (progress_percent, message)

    Returns:
        dict with file_path and file_size_bytes
    """
    # Extract config values
    affirmations = config['affirmations']
    voice_name = config.get('voice_id', 'Rachel')
    duration_minutes = config.get('duration_minutes', 10)
    binaural_frequency = config.get('binaural_frequency_hz')

    # Resolve binaural frequency from preset if not explicitly set
    if binaural_frequency is None:
        preset = config.get('binaural_preset', 'theta')
        preset_frequencies = {
            'delta': 2.0,
            'delta4': 4.0,
            'theta': 6.0,
            'alpha': 10.0,
            'beta': 20.0,
        }
        binaural_frequency = preset_frequencies.get(preset, 6.0)

    affirmation_volume_db = config.get('affirmation_volume_db', -15)
    binaural_volume_db = config.get('binaural_volume_db', -12)
    voice_settings = config.get('voice_settings', {})
    lowpass_config = config.get('lowpass_filter', {'enabled': True, 'cutoff_hz': 3750})
    repetitions = config.get('repetitions', 1)
    background_noise = config.get('background_noise')

    sample_rate = DEFAULT_SAMPLE_RATE
    duration_seconds = duration_minutes * 60

    # Resolve voice ID
    voice_id = resolve_voice_id(voice_name)

    # Initialize ElevenLabs client
    client = ElevenLabs(api_key=elevenlabs_api_key)

    # Step 1: Generate binaural beat (0-30% progress)
    if progress_callback:
        progress_callback(5, "Generating binaural beat background...")

    binaural_beat = generate_binaural_beat(
        duration_seconds,
        sample_rate,
        DEFAULT_CARRIER_FREQ,
        binaural_frequency,
        noise_type=background_noise['type'] if background_noise else None,
        noise_volume_db=background_noise.get('volume_db', -14) if background_noise else -14,
    )

    if progress_callback:
        progress_callback(30, "Binaural beat generated, adding affirmations...")

    # Step 2: Overlay affirmations (30-90% progress)
    final_audio = overlay_affirmations_on_binaural(
        binaural_beat,
        affirmations,
        duration_seconds,
        sample_rate,
        affirmation_volume_db,
        binaural_volume_db,
        repetitions,
        client,
        voice_id,
        voice_settings,
        lowpass_config,
        progress_callback,
    )

    # Step 3: Export to FLAC (90-100% progress)
    if progress_callback:
        progress_callback(95, "Exporting to FLAC...")

    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    sf.write(output_path, final_audio, sample_rate, format='FLAC')

    file_size = os.path.getsize(output_path)

    if progress_callback:
        progress_callback(100, "Complete!")

    return {
        'file_path': output_path,
        'file_size_bytes': file_size,
    }
