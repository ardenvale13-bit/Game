import type { IncomingMessage, ServerResponse } from 'node:http';

interface TTSRequest extends IncomingMessage {
  body?: {
    text?: unknown;
  };
}

interface TTSResponse extends ServerResponse {
  status: (code: number) => TTSResponse;
  json: (body: unknown) => void;
}

const DEFAULT_VOICE_ID = 'pNInz6obpgDQGcFmaJgB';
const DEFAULT_MODEL_ID = 'eleven_multilingual_v2';

export default async function handler(req: TTSRequest, res: TTSResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'TTS is not configured' });
    return;
  }

  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  if (!text || text.length > 500) {
    res.status(400).json({ error: 'Text must be between 1 and 500 characters' });
    return;
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          Accept: 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: process.env.ELEVENLABS_MODEL_ID || DEFAULT_MODEL_ID,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.4,
            use_speaker_boost: true,
          },
        }),
      },
    );

    if (!response.ok) {
      res.status(response.status).json({ error: 'TTS request failed' });
      return;
    }

    const audio = Buffer.from(await response.arrayBuffer()).toString('base64');
    res.status(200).json({ audioBase64: audio });
  } catch {
    res.status(502).json({ error: 'TTS service unavailable' });
  }
}
