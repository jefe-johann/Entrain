# Entrain

A Python tool that generates affirmation audio tracks combining binaural frequencies with spoken affirmations using ElevenLabs text-to-speech. The perfect tool for changing your self-concept, and manifesting the life you desire. 

## Overview

This tool creates customizable affirmation tracks that combine:
- **Binaural beats** for brainwave entrainment (Theta, Alpha, Beta, or Delta waves)
- **Spoken affirmations** using high-quality AI voices from ElevenLabs
- **Low-pass filtering** to target the subconscious mind rather than active speech centers

Binaural frequencies allow your brain to access certain states, like the theta state, where it is much more receptive to suggestions. Perfect for meditation, sleep programming, manifestation practice, and subconscious reprogramming. 

Note: Binaural frequencies only work with headphones!

## Features

- **Multiple brainwave frequencies**: Theta (4-8 Hz), Alpha (8-13 Hz), Beta (13-30 Hz), Delta (0.5-4 Hz)
- **ElevenLabs TTS integration**: High-quality, natural-sounding voices
- **Voice customization**: Adjust stability, style, similarity boost, and speaker boost
- **Low-pass filtering**: Optional high-frequency removal (default 3.5kHz) for softer, subconscious-targeted audio
- **Flexible affirmation control**: Configurable repetitions and spacing
- **Voice-based organization**: Outputs automatically saved to `complete/{voice_name}/`
- **FLAC compression**: ~70% smaller file sizes than WAV with lossless quality
- **YAML configuration**: Easy-to-edit config files with preset support

## Prerequisites

- **Python 3.x**
- **ffmpeg**: Required for audio format conversion
  - macOS: `brew install ffmpeg`
  - Ubuntu/Debian: `sudo apt-get install ffmpeg`
  - Windows: Download from [ffmpeg.org](https://ffmpeg.org/download.html)
- **ElevenLabs API account**: Sign up at [elevenlabs.io](https://elevenlabs.io)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Entrain.git
cd Entrain
```

2. Create and activate a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

## Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Add your ElevenLabs API key to `.env`:
```env
ELEVENLABS_API_KEY=your_actual_api_key_here
```

3. (Optional) Find voice IDs from your ElevenLabs dashboard:
   - Go to [ElevenLabs Voice Library](https://elevenlabs.io/app/voice-library)
   - Select a voice and copy its ID
   - Add to `voices` section in `config-presets/config.yaml`
   - You can even generate your own voice on ElevenLabs by providing an audio sample

## Usage

### Basic Usage

Run with default configuration:
```bash
python generate.py
```

This uses `config-presets/config.yaml` and generates a 40-minute meditation track.

### Custom Configuration

Use a different config file:
```bash
python generate.py --config path/to/your-config.yaml
```

Or edit the `ACTIVE_CONFIG` variable at the top of `generate.py` (line 23):
```python
ACTIVE_CONFIG = "config-presets/config.yaml"
```

## Configuration

Edit `config-presets/config.yaml` to customize your meditation:

### Audio Settings
```yaml
audio:
  duration_minutes: 40              # Track length
  sample_rate: 22050                # Audio quality (22.05kHz recommended)
  carrier_frequency_hz: 200         # Base binaural tone
  binaural_frequency_hz: 6          # Brainwave frequency
```

**Brainwave frequency guide:**
- **Delta (0.5-4 Hz)**: Deep sleep, healing
- **Theta (4-8 Hz)**: Meditation, creativity, subconscious access (default: 6Hz)
- **Alpha (8-13 Hz)**: Relaxation, light meditation
- **Beta (13-30 Hz)**: Focus, concentration

### Volume Settings
```yaml
volume:
  affirmation_db: -15  # Affirmation volume (negative = quieter)
  binaural_db: -12     # Binaural beat volume
```

### Voice Settings
```yaml
tts:
  elevenlabs:
    voice_id: "Emma"   # Voice name or ID from voices section
    voice_settings:
      stability: 0.8           # 0.0-1.0: Higher = more consistent
      similarity_boost: 0.75   # 0.0-1.0: Higher = closer to original voice
      style: 0.0               # 0.0-1.0: Higher = more expressive
      use_speaker_boost: true  # Enhances clarity
```

### Low-Pass Filter
```yaml
lowpass_filter:
  enabled: true        # Set to false to disable
  cutoff_hz: 3750     # Frequency cutoff
```

**Filter guide:**
- **2000-2500 Hz**: Very soft, mellow (may reduce clarity)
- **3000-3500 Hz**: Balanced - soft consonants, clear speech (recommended)
- **4000-5000 Hz**: Subtle filtering, maintains clarity

### Affirmations
```yaml
affirmations_config:
  repetitions: 3           # How many times to cycle through affirmations
  confirm_spacing: true    # Show spacing calculation before generation

affirmations:
  - "I AM"
  - "I am loved"
  - "Everything works in my favor"
  # Add your own affirmations here
```

## Output

Generated files are saved to:
```
complete/{voice_name}/filename.flac
```

For example: `complete/Emma/love affirmations 40m.flac`

**File format**: FLAC (lossless compression, ~70% smaller than WAV)

## How It Works

1. **Binaural Beat Generation**: Creates two slightly different frequencies (e.g., 200 Hz left ear, 206 Hz right ear) to produce a perceived 6 Hz theta wave
2. **Text-to-Speech**: Converts affirmations to natural speech using ElevenLabs
3. **Low-Pass Filtering**: Removes high frequencies to make speech softer and more subconscious-targeted
4. **Audio Mixing**: Overlays affirmations throughout the binaural beat track with randomized spacing
5. **Export**: Saves as high-quality FLAC file

## Customization

### Adding Affirmations

Edit the `affirmations` section in `config-presets/config.yaml`:
```yaml
affirmations:
  - "Your affirmation here"
  - "Another affirmation"
```

**Tips for effective affirmations:**
- Use present tense ("I am" not "I will be")
- Keep them positive (avoid negatives like "not")
- Make them personal and specific
- Use Neville Goddard's "Isn't it wonderful..." technique

### Changing Duration

Modify `audio.duration_minutes`:
```yaml
audio:
  duration_minutes: 60  # For a 1-hour track
```

### Adjusting Voice

Choose from available voices or add your own ElevenLabs voice IDs:
```yaml
voices:
  "your_voice_id_here": "Your Voice Name"
```

Get voice IDs from: https://elevenlabs.io/app/voice-library

## Technical Details

- **Sample Rate**: 22.05 kHz (half CD quality, optimized for voice)
- **Binaural Carrier**: 200 Hz base tone
- **Audio Processing**: NumPy and SciPy for signal processing
- **Filter**: 5th-order Butterworth low-pass filter (zero-phase distortion)
- **Format**: FLAC output (lossless), MP3 intermediate (via ElevenLabs)

## Troubleshooting

### "ffmpeg not found"
Install ffmpeg using your system's package manager (see Prerequisites section).

### "ELEVENLABS_API_KEY not found"
Make sure you:
1. Created a `.env` file (copy from `.env.example`)
2. Added your actual API key to `.env`
3. Are in the project directory when running the script

### Voice ID errors
If you get voice errors:
1. Check that your voice ID exists in ElevenLabs
2. Verify the voice ID is correct in `config.yaml`
3. Make sure you have API credits in your ElevenLabs account

### Low-quality audio
If the output sounds muffled:
- Increase `lowpass_filter.cutoff_hz` (try 4000-5000 Hz)
- Or disable the filter: `lowpass_filter.enabled: false`

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - See LICENSE file for details

## Acknowledgments

- Built with [ElevenLabs](https://elevenlabs.io) for high-quality text-to-speech
- Inspired by Neville Goddard's manifestation teachings
- Uses binaural beat technology for brainwave entrainment

## Disclaimer

This tool is for personal development and meditation purposes. Binaural beats affect people differently - start with short sessions and discontinue if you experience discomfort.
