// Persist player ID across page refreshes within the same tab
const PLAYER_ID_KEY = 'party_player_id';
const PLAYER_NAME_KEY = 'party_player_name';
const PLAYER_AVATAR_KEY = 'party_player_avatar';
const PLAYER_AVATAR_FILE_KEY = 'party_player_avatar_file';
const ROOM_CODE_KEY = 'party_room_code';
const IS_HOST_KEY = 'party_is_host';

export function generatePlayerId(): string {
  return `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getOrCreatePlayerId(): string {
  let id = sessionStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = generatePlayerId();
    sessionStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

export function setPlayerId(id: string): void {
  sessionStorage.setItem(PLAYER_ID_KEY, id);
}

export function getPlayerId(): string | null {
  return sessionStorage.getItem(PLAYER_ID_KEY);
}

export function savePlayerSession(data: {
  playerId: string;
  name: string;
  avatarId: string;
  avatarFilename: string;
  roomCode: string;
  isHost: boolean;
}): void {
  sessionStorage.setItem(PLAYER_ID_KEY, data.playerId);
  sessionStorage.setItem(PLAYER_NAME_KEY, data.name);
  sessionStorage.setItem(PLAYER_AVATAR_KEY, data.avatarId);
  sessionStorage.setItem(PLAYER_AVATAR_FILE_KEY, data.avatarFilename);
  sessionStorage.setItem(ROOM_CODE_KEY, data.roomCode);
  sessionStorage.setItem(IS_HOST_KEY, data.isHost ? 'true' : 'false');
}

export function getPlayerSession() {
  const playerId = sessionStorage.getItem(PLAYER_ID_KEY);
  const name = sessionStorage.getItem(PLAYER_NAME_KEY);
  const avatarId = sessionStorage.getItem(PLAYER_AVATAR_KEY);
  const avatarFilename = sessionStorage.getItem(PLAYER_AVATAR_FILE_KEY);
  const roomCode = sessionStorage.getItem(ROOM_CODE_KEY);
  const isHost = sessionStorage.getItem(IS_HOST_KEY) === 'true';

  if (!playerId || !name || !avatarId || !avatarFilename || !roomCode) {
    return null;
  }

  return { playerId, name, avatarId, avatarFilename, roomCode, isHost };
}

export function clearPlayerSession(): void {
  sessionStorage.removeItem(PLAYER_ID_KEY);
  sessionStorage.removeItem(PLAYER_NAME_KEY);
  sessionStorage.removeItem(PLAYER_AVATAR_KEY);
  sessionStorage.removeItem(PLAYER_AVATAR_FILE_KEY);
  sessionStorage.removeItem(ROOM_CODE_KEY);
  sessionStorage.removeItem(IS_HOST_KEY);
}
