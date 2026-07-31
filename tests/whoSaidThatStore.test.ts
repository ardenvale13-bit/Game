import test from 'node:test';
import assert from 'node:assert/strict';
import useWhoSaidThatStore, { makeAnswerId } from '../src/games/who-said-that/whoSaidThatStore';

const players = [
  { id: 'arden', name: 'Arden', avatarId: 'one', avatarFilename: 'one.png', isHost: true },
  { id: 'bee', name: 'Bee', avatarId: 'two', avatarFilename: 'two.png', isHost: false },
  { id: 'paula', name: 'Paula', avatarId: 'three', avatarFilename: 'three.png', isHost: false },
];

const startThreePlayerRound = () => {
  useWhoSaidThatStore.getState().resetGame();
  players.forEach(player => useWhoSaidThatStore.getState().addPlayer(player));
  useWhoSaidThatStore.getState().startGame();
  useWhoSaidThatStore.getState().submitAnswer('arden', 'The emotional support spreadsheet');
  useWhoSaidThatStore.getState().submitAnswer('bee', 'A raccoon with admin access');
  useWhoSaidThatStore.getState().submitAnswer('paula', 'Three husbands and one braincell');
  useWhoSaidThatStore.getState().beginGuessing();
};

test('starts a private-answer round and creates one anonymous card per answer', () => {
  startThreePlayerRound();
  const state = useWhoSaidThatStore.getState();

  assert.equal(state.phase, 'guessing');
  assert.equal(state.answers.length, 3);
  assert.deepEqual(
    new Set(state.answers.map(answer => answer.id)),
    new Set(players.map(player => makeAnswerId(player.id, 1))),
  );
  assert.ok(state.players.every(player => player.ownAnswerId === makeAnswerId(player.id, 1)));
});

test('rejects incomplete guesses and assigning the same person twice', () => {
  startThreePlayerRound();
  const store = useWhoSaidThatStore.getState();
  const beeAnswer = makeAnswerId('bee', 1);
  const paulaAnswer = makeAnswerId('paula', 1);

  assert.equal(store.submitGuesses('arden', { [beeAnswer]: 'bee' }), false);
  assert.equal(store.submitGuesses('arden', {
    [beeAnswer]: 'bee',
    [paulaAnswer]: 'bee',
  }), false);
  assert.equal(useWhoSaidThatStore.getState().players.find(player => player.id === 'arden')?.hasGuessed, false);
});

test('awards two points per correct author and one point when an answer fools someone', () => {
  startThreePlayerRound();
  const store = useWhoSaidThatStore.getState();
  const ardenAnswer = makeAnswerId('arden', 1);
  const beeAnswer = makeAnswerId('bee', 1);
  const paulaAnswer = makeAnswerId('paula', 1);

  assert.equal(store.submitGuesses('arden', {
    [beeAnswer]: 'bee',
    [paulaAnswer]: 'paula',
  }), true);
  assert.equal(store.submitGuesses('bee', {
    [ardenAnswer]: 'paula',
    [paulaAnswer]: 'arden',
  }), true);
  assert.equal(store.submitGuesses('paula', {
    [ardenAnswer]: 'arden',
    [beeAnswer]: 'bee',
  }), true);

  useWhoSaidThatStore.getState().calculateResults();
  const scores = Object.fromEntries(
    useWhoSaidThatStore.getState().players.map(player => [player.id, player.roundScore]),
  );

  assert.deepEqual(scores, { arden: 5, bee: 0, paula: 5 });
});
