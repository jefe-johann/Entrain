# Entrain

Generates meditation audio tracks combining binaural beats with spoken affirmations using ElevenLabs TTS.

## Purpose

Creates 40-minute (configurable) theta wave meditation tracks with customizable affirmations. Designed for subconscious reprogramming during sleep/meditation.

## Key Features

- **Binaural beats**: Theta (6Hz default), Alpha, Beta, or Delta waves
- **Voice synthesis**: ElevenLabs TTS with 6 preset voices
- **Voice customization**: Stability, style, similarity boost, speaker boost
- **Low-pass filtering**: Optional high-frequency removal (3.5kHz default) for softer, subconscious-targeted audio
- **Affirmation control**: Configurable repetitions and spacing confirmation
- **Voice-based organization**: Outputs automatically saved to `complete/{voice_name}/`
- **FLAC compression**: ~70% smaller file sizes than WAV
- **Config presets**: Easy switching between meditation types

## Quick Start

```bash
# Default usage (uses config.yaml)
python generate.py

# Use different config
python generate.py --config config-presets/config-sleep.yaml

# Quick switch: Edit ACTIVE_CONFIG variable at top of generate.py
```

## File Structure

```
config.yaml                    # Main configuration (duration, voice, affirmations)
generate.py                    # Generator script
config-presets/                # Alternative configs
complete/{voice_name}/         # Output files organized by voice
.env                          # API keys (ELEVENLABS_API_KEY)
```

## Configuration

**config.yaml** contains:
- `audio`: Duration, sample rate, binaural frequency (Hz)
- `volume`: Affirmation and binaural track volumes (dB)
- `tts.elevenlabs.voice_id`: Voice name (e.g., "Jeff", "Rachel", "Brian")
- `tts.elevenlabs.voice_settings`: Stability, similarity, style, speaker boost
- `tts.elevenlabs.lowpass_filter`: Enable/disable, cutoff frequency (3.5kHz default)
- `affirmations_config`: Repetitions (how many times to repeat) and confirm_spacing (y/n prompt before generation)
- `voices`: Mapping of voice IDs to friendly names
- `affirmations`: List of affirmations to be spoken

**Switching configs:**
1. Edit `ACTIVE_CONFIG` variable in generate.py (line 22), OR
2. Use CLI: `python generate.py --config other-config.yaml`

## Available Voices

- Jeff, Emma, Rachel (default), Maria-Mysh, Brittney, Brian
- Switch by changing `voice_id` in config.yaml to voice name

## Technical Details

- **Sample rate**: 22.05kHz (half CD quality, optimized for affirmations)
- **Binaural carrier**: 200Hz base tone
- **Frequency difference**: Creates perceived brainwave frequency
- **Audio format**: FLAC output (lossless, ~70% compression), MP3 intermediate (via ElevenLabs)
- **Low-pass filter**: 5th-order Butterworth, zero-phase distortion
- **Python**: Requires numpy, scipy, soundfile, elevenlabs, pyyaml, python-dotenv

---

## Web App (`entrain-web/`)

Full-stack web interface for audio generation with user management and async job processing.

**Stack**: Next.js 15 (App Router) + FastAPI + PostgreSQL + Redis + RQ

### Frontend (`frontend/`)
- **Framework**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **Auth**: Auth.js with Google OAuth
- **Database**: Prisma ORM (schema in `prisma/`)
- **Pages**: `app/` directory
  - `/dashboard` - Job history and status
  - `/generate` - Generation form
  - `/api/auth/[...nextauth]` - Auth.js routes
- **Components**: `components/` - Reusable UI components
- **API Client**: `lib/api.ts` - Backend communication

### Backend (`backend/`)
- **Framework**: FastAPI with SQLAlchemy
- **Structure**:
  - `app/routers/` - API endpoints (users, jobs, files)
  - `app/models/` - SQLAlchemy database models
  - `app/schemas/` - Pydantic request/response schemas
  - `app/services/` - Business logic (queue, storage)
  - `worker/` - RQ async worker
    - `generator.py` - Audio generation (uses root `generate.py` logic)
    - `tasks.py` - RQ task definitions
    - `run_worker.py` - Worker entry point
- **Generated files**: `generated_files/{job_id}/` - Temporary audio outputs

### Infrastructure
- **Docker Compose**: PostgreSQL + Redis (required for dev)
- **Ports**: Frontend :3000, Backend :8000, Postgres :5432, Redis :6379
- **Queue**: RQ for async job processing (requires separate worker process)
