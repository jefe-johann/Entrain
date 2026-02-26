export const ELEVENLABS_URL = "https://try.elevenlabs.io/dzno4ab4ajsy";
export const ELEVENLABS_LABEL = "ElevenLabs";

export const LIBRARY_VOICE_HELPER_PREFIX = "Browse voices at";
export const LIBRARY_VOICE_HELPER_SUFFIX = ", copy the Voice ID, and enter it below.";

export const VOICE_CLONE_INTRO_TEXT = "To create a voice clone:";

export type VoiceCloneStep =
  | {
      text: string;
    }
  | {
      beforeLink: string;
      afterLink: string;
    };

export const VOICE_CLONE_STEPS: readonly VoiceCloneStep[] = [
  { beforeLink: "Sign up at ", afterLink: " (Starter plan required)" },
  { text: "Go to VoiceLab > Instant Voice Cloning" },
  { text: "Upload 1-3 min of clean audio of your voice" },
  { text: "Copy Voice ID from My Voices (three dots menu)" },
  { text: "Copy API Key from Developers (left sidebar) > API Keys" },
];
