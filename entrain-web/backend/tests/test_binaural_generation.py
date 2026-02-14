import unittest

import numpy as np

from worker.generator import DEFAULT_CARRIER_FREQ, DEFAULT_SAMPLE_RATE, generate_binaural_beat


class TestBinauralGeneration(unittest.TestCase):
    def test_binaural_generation_has_no_late_track_precision_drift(self):
        duration_seconds = 8 * 60
        sample_rate = DEFAULT_SAMPLE_RATE
        carrier_freq = DEFAULT_CARRIER_FREQ
        binaural_freq = 6.0

        audio = generate_binaural_beat(
            duration_seconds=duration_seconds,
            sample_rate=sample_rate,
            carrier_freq=carrier_freq,
            binaural_freq=binaural_freq,
        )

        left_channel = audio[:, 0].astype(np.float64)
        amplitude = 32767 * 0.3
        sample_idx = np.arange(left_channel.shape[0], dtype=np.float64)
        reference = np.int16(
            np.sin((2 * np.pi * carrier_freq * sample_idx) / sample_rate) * amplitude
        ).astype(np.float64)

        error = left_channel - reference
        one_minute_samples = sample_rate * 60
        first_minute_rms = float(np.sqrt(np.mean(np.square(error[:one_minute_samples]))))
        last_minute_rms = float(np.sqrt(np.mean(np.square(error[-one_minute_samples:]))))

        # Drift regression guard: late-track error should remain close to early-track error.
        self.assertLessEqual(last_minute_rms, max(4.0, first_minute_rms * 2.0))


if __name__ == "__main__":
    unittest.main()
