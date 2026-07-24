import test from 'node:test';
import assert from 'node:assert/strict';

const memory = new Map<string, string>();
Object.defineProperty(globalThis, 'sessionStorage', {
  value: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => memory.set(key, value),
    removeItem: (key: string) => memory.delete(key),
  },
  configurable: true,
});

const { default: useLobbyStore } = await import('../src/store/lobbyStore');

const host = {
  id: 'host',
  name: 'Host',
  avatarId: 'one',
  avatarFilename: 'one.png',
  isHost: true,
  score: 0,
};

const guest = {
  id: 'guest',
  name: 'Guest',
  avatarId: 'two',
  avatarFilename: 'two.png',
  isHost: false,
  score: 0,
};

test('only the host can start a selected lobby game', () => {
  useLobbyStore.setState({
    players: [host, guest],
    selectedGame: 'checkers',
    currentPlayerId: guest.id,
  });
  assert.equal(useLobbyStore.getState().canStartGame(), false);

  useLobbyStore.setState({ currentPlayerId: host.id });
  assert.equal(useLobbyStore.getState().canStartGame(), true);
});

test('host permission still respects each game minimum player count', () => {
  useLobbyStore.setState({
    players: [host],
    selectedGame: 'checkers',
    currentPlayerId: host.id,
  });
  assert.equal(useLobbyStore.getState().canStartGame(), false);
});
