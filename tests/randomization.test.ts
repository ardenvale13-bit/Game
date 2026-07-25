import test from 'node:test';
import assert from 'node:assert/strict';
import { shuffleArray } from '../src/utils/random';
import {
  dealWhiteCardsWithRecycle,
  whiteCards,
} from '../src/games/cah/cardData';
import {
  getRandomPrompts as getWyrPrompts,
  wyrPrompts,
} from '../src/games/wyr/wyrData';
import {
  getRandomPrompts as getWmltPrompts,
  wmltPrompts,
} from '../src/games/wmlt/wmltData';
import {
  getRecentlyPlayed,
  rememberRecentlyPlayed,
} from '../src/lib/recentlyPlayed';
import {
  getVetoedBlackCardIds,
  recordAggregateCardRating,
} from '../src/games/cah/cardFeedback';
import { loadCAHSession, saveCAHSession } from '../src/games/cah/cahSession';
import useCAHStore from '../src/games/cah/cahStore';

const localMemory = new Map<string, string>();
const sessionMemory = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => localMemory.get(key) ?? null,
    setItem: (key: string, value: string) => localMemory.set(key, value),
    removeItem: (key: string) => localMemory.delete(key),
  },
  configurable: true,
});
Object.defineProperty(globalThis, 'sessionStorage', {
  value: {
    getItem: (key: string) => sessionMemory.get(key) ?? null,
    setItem: (key: string, value: string) => sessionMemory.set(key, value),
    removeItem: (key: string) => sessionMemory.delete(key),
  },
  configurable: true,
});

test('shuffle returns a new permutation without changing the source', () => {
  const source = Array.from({ length: 100 }, (_, index) => index);
  const shuffled = shuffleArray(source);

  assert.notStrictEqual(shuffled, source);
  assert.deepEqual(source, Array.from({ length: 100 }, (_, index) => index));
  assert.deepEqual([...shuffled].sort((a, b) => a - b), source);
});

test('WYR and Most Likely To select the only unused prompt', () => {
  const wyrRemaining = wyrPrompts.length - 1;
  const wyrUsed = new Set(wyrPrompts.map((_, index) => index).filter(index => index !== wyrRemaining));
  assert.deepEqual(getWyrPrompts(1, wyrUsed).indices, [wyrRemaining]);

  const wmltRemaining = wmltPrompts.length - 1;
  const wmltUsed = new Set(wmltPrompts.map((_, index) => index).filter(index => index !== wmltRemaining));
  assert.deepEqual(getWmltPrompts(1, wmltUsed).indices, [wmltRemaining]);
});

test('CAH safely recycles an exhausted white deck without duplicating active hands', () => {
  const allCardIds = whiteCards.map(card => card.id);
  const protectedCardIds = allCardIds.slice(0, 20);
  const { cards, nextUsedCardIds } = dealWhiteCardsWithRecycle(
    7,
    allCardIds,
    protectedCardIds,
  );

  assert.equal(cards.length, 7);
  assert.equal(new Set(cards.map(card => card.id)).size, 7);
  assert.ok(cards.every(card => !protectedCardIds.includes(card.id)));
  assert.deepEqual(
    new Set(nextUsedCardIds),
    new Set([...protectedCardIds, ...cards.map(card => card.id)]),
  );
});

test('CAH uses remaining unseen cards before recycling', () => {
  const unseenCard = whiteCards.at(-1);
  assert.ok(unseenCard);

  const usedCardIds = whiteCards.slice(0, -1).map(card => card.id);
  const protectedCardIds = whiteCards.slice(0, 20).map(card => card.id);
  const { cards } = dealWhiteCardsWithRecycle(7, usedCardIds, protectedCardIds);

  assert.equal(cards.length, 7);
  assert.ok(cards.some(card => card.id === unseenCard.id));
});

test('recently played history keeps the newest unique entries', () => {
  rememberRecentlyPlayed('wyr', '1', 3);
  rememberRecentlyPlayed('wyr', '2', 3);
  rememberRecentlyPlayed('wyr', '3', 3);
  rememberRecentlyPlayed('wyr', '2', 3);
  rememberRecentlyPlayed('wyr', '4', 3);

  assert.deepEqual(getRecentlyPlayed('wyr'), ['3', '2', '4']);
});

test('two quiet vetoes remove a CAH prompt from future host picks', () => {
  recordAggregateCardRating('test-card', null, 'veto');
  assert.ok(!getVetoedBlackCardIds().includes('test-card'));

  recordAggregateCardRating('test-card', null, 'veto');
  assert.ok(getVetoedBlackCardIds().includes('test-card'));
});

test('CAH refresh recovery restores the current hand, score, and round', () => {
  useCAHStore.getState().resetGame();
  useCAHStore.setState({
    roomCode: 'ROOM',
    currentPlayerId: 'p1',
    phase: 'playing',
    currentRound: 7,
    players: [{
      id: 'p1',
      name: 'Player',
      avatarId: 'avatar',
      avatarFilename: 'avatar.png',
      score: 4,
      isHost: true,
      isCzar: false,
      hand: whiteCards.slice(0, 7),
      selectedCards: [],
      hasSubmitted: false,
    }],
  });

  saveCAHSession('ROOM', 'p1', useCAHStore.getState());
  const restored = loadCAHSession('ROOM', 'p1');

  assert.equal(restored?.currentRound, 7);
  assert.equal(restored?.players[0].score, 4);
  assert.deepEqual(restored?.players[0].hand, whiteCards.slice(0, 7));
});
