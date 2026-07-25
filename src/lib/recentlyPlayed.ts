const STORAGE_KEY = 'party_recently_played_v1';

type RecentGameKey = 'cah-black' | 'wyr' | 'wmlt' | 'guess-betrayal';
type RecentState = Partial<Record<RecentGameKey, string[]>>;

function readState(): RecentState {
  if (typeof localStorage === 'undefined') return {};

  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as RecentState;
  } catch {
    return {};
  }
}

function writeState(state: RecentState): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getRecentlyPlayed(key: RecentGameKey): string[] {
  return readState()[key] ?? [];
}

export function rememberRecentlyPlayed(
  key: RecentGameKey,
  value: string,
  limit: number,
): void {
  const state = readState();
  const previous = state[key] ?? [];
  state[key] = [...previous.filter(item => item !== value), value].slice(-limit);
  writeState(state);
}
