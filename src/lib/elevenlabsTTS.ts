// ElevenLabs TTS is proxied through a server-side endpoint so the API key is
// never embedded in the public Vite bundle. Local Vite development gracefully
// falls back to browser speech when the serverless endpoint is unavailable.
const TTS_ENDPOINT = '/api/tts';

export const isElevenLabsConfigured = (): boolean => true;

/**
 * Generate TTS audio via ElevenLabs API
 * Returns base64-encoded mp3 string, or null on failure
 */
export async function generateSpeech(text: string): Promise<string | null> {
  try {
    const response = await fetch(TTS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json() as { audioBase64?: string };
    return result.audioBase64 || null;
  } catch {
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
    console.error('[ElevenLabs] Audio playback failed:', err);
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
