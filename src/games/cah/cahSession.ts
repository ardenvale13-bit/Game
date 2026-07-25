import type { CAHGameState } from './cahStore';

const SESSION_PREFIX = 'party_cah_session_v1';
const MAX_SESSION_AGE_MS = 12 * 60 * 60 * 1000;

interface SavedCAHSession {
  savedAt: number;
  state: CAHGameState;
}

function sessionKey(roomCode: string, playerId: string): string {
  return `${SESSION_PREFIX}:${roomCode}:${playerId}`;
}

export function saveCAHSession(
  roomCode: string,
  playerId: string,
  state: CAHGameState,
): void {
  if (typeof sessionStorage === 'undefined' || state.phase === 'lobby') return;
  const saved: SavedCAHSession = { savedAt: Date.now(), state };
  sessionStorage.setItem(sessionKey(roomCode, playerId), JSON.stringify(saved));
}

export function loadCAHSession(
  roomCode: string,
  playerId: string,
): CAHGameState | null {
  if (typeof sessionStorage === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(sessionKey(roomCode, playerId));
    if (!raw) return null;
    const saved = JSON.parse(raw) as SavedCAHSession;

    if (Date.now() - saved.savedAt > MAX_SESSION_AGE_MS) {
      clearCAHSession(roomCode, playerId);
      return null;
    }

    if (
      saved.state.roomCode !== roomCode
      || saved.state.currentPlayerId !== playerId
      || !saved.state.players.some(player => player.id === playerId)
    ) {
      return null;
    }

    return saved.state;
  } catch {
    return null;
  }
}

export function clearCAHSession(roomCode: string, playerId: string): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(sessionKey(roomCode, playerId));
}
