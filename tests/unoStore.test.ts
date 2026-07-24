import test from 'node:test';
import assert from 'node:assert/strict';
import useUnoStore from '../src/games/uno/unoStore';
import type { UnoPlayer } from '../src/games/uno/unoStore';
import type { UnoCard, UnoColor } from '../src/games/uno/unoData';

function card(id: string, value: string, color: UnoColor | null = 'pink', points = 0): UnoCard {
  return { id, value, color, points };
}

function player(id: string, hand: UnoCard[]): UnoPlayer {
  return {
    id,
    name: id,
    avatarId: id,
    avatarFilename: `${id}.png`,
    isHost: id === 'p0',
    score: 0,
    hand,
    calledUno: false,
  };
}

function setGame(players: UnoPlayer[], overrides: Record<string, unknown> = {}) {
  useUnoStore.getState().reset();
  useUnoStore.setState({
    players,
    phase: 'playing',
    mode: 'classic',
    currentRound: 1,
    maxRounds: 3,
    roundResults: [],
    drawPile: Array.from({ length: 20 }, (_, index) =>
      card(`draw-${index}`, String((index % 9) + 1), 'blue', (index % 9) + 1),
    ),
    discardPile: [card('top', '5')],
    currentTurnIndex: 0,
    direction: 1,
    currentColor: 'pink',
    drawStack: 0,
    stackingWithWild4: false,
    unoVulnerable: null,
    timeRemaining: 30,
    turnTime: 30,
    ...overrides,
  });
}

test('chaos stacks advance between players and the recipient draws the full stack', () => {
  setGame(
    [
      player('p0', [card('p0-d2', 'draw2'), card('p0-1', '1')]),
      player('p1', [card('p1-d2', 'draw2'), card('p1-2', '2')]),
      player('p2', [card('p2-3', '3')]),
    ],
    { mode: 'chaos' },
  );

  assert.equal(useUnoStore.getState().playCard('p0', 'p0-d2'), true);
  assert.equal(useUnoStore.getState().currentTurnIndex, 1);
  assert.equal(useUnoStore.getState().drawStack, 2);

  assert.equal(useUnoStore.getState().playCard('p1', 'p1-d2'), true);
  assert.equal(useUnoStore.getState().currentTurnIndex, 2);
  assert.equal(useUnoStore.getState().drawStack, 4);

  useUnoStore.getState().drawCard('p2');
  const state = useUnoStore.getState();
  assert.equal(state.players[2].hand.length, 5);
  assert.equal(state.currentTurnIndex, 0);
  assert.equal(state.drawStack, 0);
});

test('draw requests are accepted only for the current player and advance exactly once', () => {
  setGame([
    player('p0', [card('p0-1', '1')]),
    player('p1', [card('p1-2', '2')]),
  ]);

  assert.equal(useUnoStore.getState().drawCard('p1'), null);
  assert.equal(useUnoStore.getState().currentTurnIndex, 0);
  assert.equal(useUnoStore.getState().players[1].hand.length, 1);

  assert.notEqual(useUnoStore.getState().drawCard('p0'), null);
  assert.equal(useUnoStore.getState().currentTurnIndex, 1);
  assert.equal(useUnoStore.getState().players[0].hand.length, 2);

  assert.equal(useUnoStore.getState().drawCard('p0'), null);
  assert.equal(useUnoStore.getState().currentTurnIndex, 1);
  assert.equal(useUnoStore.getState().players[0].hand.length, 2);
});

test('only the round winner receives the value of opponents cards', () => {
  setGame([
    player('p0', []),
    player('p1', [card('five', '5', 'blue', 5)]),
    player('p2', [card('skip', 'skip', 'purple', 20)]),
  ]);

  useUnoStore.getState().endRound('p0');
  const state = useUnoStore.getState();
  assert.equal(state.players[0].score, 25);
  assert.equal(state.players[1].score, 0);
  assert.equal(state.players[2].score, 0);
  assert.deepEqual(state.roundResults[0].scoreBreakdown, { p1: 0, p2: 0, p0: 25 });
});

test('chaos seven swaps hands immutably and then advances the turn', () => {
  const firstHand = [card('seven', '7'), card('one', '1')];
  const secondHand = [card('two', '2', 'blue'), card('three', '3', 'green')];
  setGame(
    [player('p0', firstHand), player('p1', secondHand)],
    { mode: 'chaos' },
  );

  assert.equal(useUnoStore.getState().playCard('p0', 'seven'), true);
  assert.equal(useUnoStore.getState().currentTurnIndex, 0);
  useUnoStore.getState().swapHands('p0', 'p1');

  const state = useUnoStore.getState();
  assert.deepEqual(state.players[0].hand.map((item) => item.id), ['two', 'three']);
  assert.deepEqual(state.players[1].hand.map((item) => item.id), ['one']);
  assert.equal(state.currentTurnIndex, 1);
});

test('drawing cards resets a previous UNO call', () => {
  const caller = player('p0', [card('one', '1')]);
  caller.calledUno = true;
  setGame([caller, player('p1', [card('two', '2')])]);

  useUnoStore.getState().drawCard('p0');
  assert.equal(useUnoStore.getState().players[0].calledUno, false);
});
