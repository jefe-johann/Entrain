#!/usr/bin/env python3
"""
Entrain - Binaural Beat affirmation Generator
Generates binaural audio tracks with spoken affirmations
"""

import numpy as np
from scipy.io import wavfile
import soundfile as sf
import os
from elevenlabs import ElevenLabs, VoiceSettings
import tempfile
import random
from dotenv import load_dotenv
import yaml
import argparse

# Load environment variables
load_dotenv()

# Configuration File Selection
# Change this to use a different config preset from config-presets/ folder
ACTIVE_CONFIG = "config.yaml"  # Default config


def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Entrain - Generate binaural affirmations')
    parser.add_argument('--config', type=str, default=None,
                      help='Config file to use (overrides ACTIVE_CONFIG variable)')
    return parser.parse_args()


def load_config(config_path=None):
    """Load and validate configuration from YAML file"""
    # Use provided path, or fall back to ACTIVE_CONFIG
    if config_path is None:
        config_path = ACTIVE_CONFIG

    # Check config-presets folder first, then root
    if not os.path.exists(config_path):
        preset_path = os.path.join("config-presets", config_path)
        if os.path.exists(preset_path):
            config_path = preset_path
        else:
            raise FileNotFoundError(f"Config file not found: {config_path}")

    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)

    # Validate required sections
    required = ['output', 'audio', 'volume', 'tts', 'affirmations']
    for section in required:
        if section not in config:
            raise ValueError(f"Missing required section in config: {section}")

    if not config['affirmations']:
        raise ValueError("Affirmations list cannot be empty")

    # Voices section is optional but recommended
    if 'voices' not in config:
        print("Warning: No 'voices' section found in config. Unknown voices will use 'unknown' folder.")

    return config


def resolve_voice_id(voice_name_or_id, config):
    """Resolve voice name to ID (or pass through if already an ID)"""
    voices_map = config.get('voices', {})

    # Check if it's already a valid ID (key in voices dict)
    if voice_name_or_id in voices_map:
        return voice_name_or_id

    # Check if it's a name (value in voices dict) - do reverse lookup
    for voice_id, voice_name in voices_map.items():
        if voice_name.lower() == voice_name_or_id.lower():
            return voice_id

    # Not found - return as-is and let downstream handle it
    print(f"Warning: Voice '{voice_name_or_id}' not found in voices mapping. Using as-is.")
    return voice_name_or_id


def resolve_voice_name(voice_id, config):
    """Resolve voice ID to human-readable name from voices mapping"""
    voices_map = config.get('voices', {})

    # Look up voice name
    if voice_id in voices_map:
        return voices_map[voice_id]
    else:
        # Unknown voice - use 'unknown' folder
        print(f"Warning: Voice ID '{voice_id}' not found in voices mapping. Using 'unknown' folder.")
        return "unknown"


def calculate_and_confirm_spacing(config):
    """Calculate affirmation spacing and get user confirmation"""
    affirmations_config = config.get('affirmations_config', {})
    confirm_enabled = affirmations_config.get('confirm_spacing', True)

    if not confirm_enabled:
        return True

    # Calculate and display spacing
    duration_seconds = config['audio']['duration_minutes'] * 60
    num_affirmations = len(config['affirmations'])
    repetitions = affirmations_config.get('repetitions', 3)
    total_affirmations = num_affirmations * repetitions
    seconds_between = duration_seconds / total_affirmations

    # Display calculation in formatted box
    print("\n" + "=" * 60)
    print("AFFIRMATION SPACING CALCULATION")
    print("=" * 60)
    print(f"  Total affirmations: {num_affirmations} affirmations × {repetitions} repetitions = {total_affirmations}")
    print(f"  Track duration: {config['audio']['duration_minutes']} minutes ({duration_seconds} seconds)")
    print(f"  Seconds between affirmations: {seconds_between:.1f}s")
    print("=" * 60)

    # Get user confirmation with validation loop
    while True:
        response = input("\nProceed with generation? (y/n): ").strip().lower()
        if response in ['y', 'yes']:
            return True
        elif response in ['n', 'no']:
            print("\nGeneration cancelled by user.")
            return False
        else:
            print("Please enter 'y' or 'n'")


def get_output_path(config):
    """Determine the full output path including voice-based subfolder"""
    voice_name_or_id = config['tts']['elevenlabs']['voice_id']
    voice_id = resolve_voice_id(voice_name_or_id, config)
    voice_name = resolve_voice_name(voice_id, config)
    filename = config['output']['filename']

    # Create output directory structure
    output_dir = os.path.join("complete", voice_name)
    os.makedirs(output_dir, exist_ok=True)

    # Full output path
    output_path = os.path.join(output_dir, filename)

    return output_path, voice_name


def apply_lowpass_filter(audio_data, cutoff_hz, sample_rate, order=5):
    """Apply a low-pass Butterworth filter to remove high frequencies"""
    from scipy.signal import butter, filtfilt

    # Design the Butterworth filter
    nyquist = sample_rate / 2
    normal_cutoff = cutoff_hz / nyquist
    b, a = butter(order, normal_cutoff, btype='low', analog=False)

    # Apply the filter (filtfilt applies it forward and backward for zero phase distortion)
    filtered_data = filtfilt(b, a, audio_data)

    return filtered_data.astype(np.int16)


def generate_binaural_beat(duration_seconds, sample_rate, carrier_freq, binaural_freq):
    """Generate stereo binaural beat audio"""
    print(f"Generating {duration_seconds}s binaural beat: {carrier_freq}Hz carrier, {binaural_freq}Hz difference")

    t = np.linspace(0, duration_seconds, int(sample_rate * duration_seconds), False)

    # Left ear: carrier frequency
    left_channel = np.sin(2 * np.pi * carrier_freq * t)

    # Right ear: carrier + binaural frequency
    right_channel = np.sin(2 * np.pi * (carrier_freq + binaural_freq) * t)

    # Combine into stereo
    stereo = np.vstack((left_channel, right_channel)).T

    # Normalize to 16-bit range
    stereo = np.int16(stereo * 32767 * 0.3)  # 30% volume for gentle effect

    return stereo


def text_to_speech(text, client, config):
    """Convert text to speech using ElevenLabs TTS with voice settings"""
    print(f"Generating speech: '{text[:50]}...'")

    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp_mp3:
        mp3_path = tmp_mp3.name

    with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp_wav:
        wav_path = tmp_wav.name

    try:
        # Extract voice settings from config
        tts_config = config['tts']['elevenlabs']
        voice_settings_dict = tts_config.get('voice_settings', {})

        # Resolve voice name to ID (supports both names and IDs)
        voice_name_or_id = tts_config['voice_id']
        actual_voice_id = resolve_voice_id(voice_name_or_id, config)

        # Create VoiceSettings object
        voice_settings_obj = None
        if voice_settings_dict:
            voice_settings_obj = VoiceSettings(
                stability=voice_settings_dict.get('stability', 0.5),
                similarity_boost=voice_settings_dict.get('similarity_boost', 0.75),
                style=voice_settings_dict.get('style', 0.0),
                use_speaker_boost=voice_settings_dict.get('use_speaker_boost', True)
            )

        # Generate speech with ElevenLabs using MP3 format
        audio_generator = client.text_to_speech.convert(
            voice_id=actual_voice_id,
            text=text,
            model_id=tts_config['model'],
            voice_settings=voice_settings_obj,
            output_format="mp3_44100_128"  # MP3 at 44.1kHz
        )

        # Collect audio bytes and save to MP3 file
        audio_bytes = b''.join(audio_generator)
        with open(mp3_path, 'wb') as f:
            f.write(audio_bytes)

        # Convert MP3 to WAV using ffmpeg
        import subprocess
        subprocess.run([
            'ffmpeg', '-i', mp3_path,
            '-ar', str(config['audio']['sample_rate']),  # Set sample rate from config
            '-ac', '1',  # Mono
            '-y',  # Overwrite output file
            wav_path
        ], check=True, capture_output=True)

        # Load WAV file
        sample_rate, audio_data = wavfile.read(wav_path)

        # Apply low-pass filter if enabled
        lowpass_config = tts_config.get('lowpass_filter', {})
        if lowpass_config.get('enabled', False):
            cutoff_hz = lowpass_config.get('cutoff_hz', 3500)
            print(f"  Applying low-pass filter at {cutoff_hz}Hz...")
            audio_data = apply_lowpass_filter(audio_data, cutoff_hz, sample_rate)

        return audio_data

    finally:
        if os.path.exists(mp3_path):
            os.unlink(mp3_path)
        if os.path.exists(wav_path):
            os.unlink(wav_path)


def overlay_affirmations_on_binaural(binaural_audio, affirmations, duration_seconds, affirmation_volume_db, client, config):
    """Overlay spoken affirmations throughout the binaural beat track"""
    print("Overlaying affirmations on binaural beat...")

    # Convert binaural from int16 to float32 for easier manipulation
    binaural_float = binaural_audio.astype(np.float32) / 32767.0

    # Apply volume adjustment to binaural beat (convert dB to linear)
    binaural_volume_factor = 10 ** (config['volume']['binaural_db'] / 20.0)
    binaural_float *= binaural_volume_factor

    # Get repetition count from config
    affirmation_repetitions = config.get('affirmations_config', {}).get('repetitions', 3)

    # Calculate spacing between affirmations
    num_affirmations = len(affirmations) * affirmation_repetitions
    interval = duration_seconds / num_affirmations

    sample_rate = config['audio']['sample_rate']
    current_sample = int(30 * sample_rate)  # Start after 30 seconds

    # Shuffle for variety
    shuffled_affirmations = affirmations * affirmation_repetitions
    random.shuffle(shuffled_affirmations)

    # Volume factor for affirmations (convert dB to linear)
    affirmation_volume_factor = 10 ** (affirmation_volume_db / 20.0)

    for i, affirmation in enumerate(shuffled_affirmations):
        if current_sample >= (duration_seconds * sample_rate) - (30 * sample_rate):
            break

        print(f"Processing affirmation {i+1}/{len(shuffled_affirmations)}: {affirmation[:40]}...")

        # Generate speech (mono)
        speech_audio = text_to_speech(affirmation, client, config)

        # Convert to float and normalize
        speech_float = speech_audio.astype(np.float32) / 32767.0

        # Apply volume
        speech_float *= affirmation_volume_factor

        # Convert mono to stereo by duplicating
        speech_stereo = np.column_stack([speech_float, speech_float])

        # Overlay on binaural track
        end_sample = min(current_sample + len(speech_stereo), len(binaural_float))
        speech_length = end_sample - current_sample

        # Mix by adding
        binaural_float[current_sample:end_sample] += speech_stereo[:speech_length]

        # Move to next position with some randomness
        interval_samples = int(interval * sample_rate)
        current_sample += interval_samples + random.randint(-3 * sample_rate, 3 * sample_rate)

    # Normalize to prevent clipping
    max_val = np.abs(binaural_float).max()
    if max_val > 1.0:
        binaural_float /= max_val

    # Convert back to int16
    final_audio = np.int16(binaural_float * 32767)

    return final_audio


def main():
    """Generate binaural affirmations with Entrain"""
    # Parse command line arguments
    args = parse_arguments()

    # Load configuration (CLI overrides ACTIVE_CONFIG variable)
    config_file = args.config if args.config else None
    config = load_config(config_file)

    # Print header with config values
    print("=" * 60)
    print("Entrain - Binaural Affirmations Generator")
    print(f"{config['audio']['duration_minutes']} Minutes - {config['audio']['binaural_frequency_hz']}Hz")
    print("ElevenLabs TTS")
    print("=" * 60)

    # Calculate spacing and get confirmation
    if not calculate_and_confirm_spacing(config):
        return  # Exit if user cancels

    # Initialize ElevenLabs client
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        raise ValueError("ELEVENLABS_API_KEY not found in environment variables")
    client = ElevenLabs(api_key=api_key)

    duration_seconds = config['audio']['duration_minutes'] * 60

    # Step 1: Generate binaural beat background
    print("\n[1/3] Generating binaural beat background...")
    binaural_beat = generate_binaural_beat(
        duration_seconds,
        config['audio']['sample_rate'],
        config['audio']['carrier_frequency_hz'],
        config['audio']['binaural_frequency_hz']
    )

    # Step 2: Overlay affirmations
    print("\n[2/3] Adding affirmations...")
    final_audio = overlay_affirmations_on_binaural(
        binaural_beat,
        config['affirmations'],
        duration_seconds,
        config['volume']['affirmation_db'],
        client,
        config
    )

    # Step 3: Export to FLAC with voice-based folder organization
    output_path, voice_name = get_output_path(config)
    print(f"\n[3/3] Exporting to {output_path}...")
    print(f"  Voice: {voice_name}")
    sf.write(output_path, final_audio, config['audio']['sample_rate'], format='FLAC')

    # Print completion info
    file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print("\n" + "=" * 60)
    print(f"Complete! File: {output_path}")
    print(f"  Voice: {voice_name}")
    print(f"  Duration: {config['audio']['duration_minutes']} minutes")
    print(f"  Frequency: {config['audio']['binaural_frequency_hz']}Hz")
    print(f"  Size: {file_size_mb:.1f} MB")
    print("=" * 60)
    print("\nReady for bedtime meditation!")


if __name__ == "__main__":
    main()
