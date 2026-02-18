// ElevenLabs TTS — generates speech audio and returns base64-encoded mp3
// Falls back to browser speechSynthesis if API key not configured

const API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || '';
const VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB'; // Default: "Adam" — deep male voice
const MODEL_ID = import.meta.env.VITE_ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';

export const isElevenLabsConfigured = (): boolean => !!API_KEY;

/**
 * Generate TTS audio via ElevenLabs API
 * Returns base64-encoded mp3 string, or null on failure
 */
export async function generateSpeech(text: string): Promise<string | null> {
  if (!API_KEY) return null;

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: MODEL_ID,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.4,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      console.warn('[ElevenLabs] API error:', response.status, response.statusText);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    // Convert to base64 for broadcasting
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (err) {
    console.warn('[ElevenLabs] TTS generation failed:', err);
    return null;
  }
}

/**
 * Play base64-encoded mp3 audio
 * Returns the Audio element for potential cleanup
 */
export function playBase64Audio(base64: string): HTMLAudioElement {
  const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
  audio.play().catch((err) => {
    console.warn('[ElevenLabs] Audio playback failed:', err);
  });
  return audio;
}

/**
 * Fallback: use browser speechSynthesis
 */
export function speakWithBrowser(text: string): void {
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch {
    // TTS not available
  }
}
