import { create } from 'zustand';
import { shuffleArray } from '../../utils/random';
import { WHO_SAID_THAT_PROMPTS } from './questionData';

export type WSTPhase = 'lobby' | 'answering' | 'guessing' | 'results' | 'game-over';

export interface WSTAnswer {
  id: string;
  text: string;
  authorId?: string;
  fooledCount?: number;
}

export interface WSTPlayer {
  id: string;
  name: string;
  avatarId: string;
  avatarFilename: string;
  isHost: boolean;
  score: number;
  roundScore: number;
  answer: string;
  ownAnswerId: string | null;
  hasAnswered: boolean;
  guesses: Record<string, string>;
  hasGuessed: boolean;
}

interface WSTState {
  roomCode: string | null;
  players: WSTPlayer[];
  currentPlayerId: string | null;
  phase: WSTPhase;
  currentRound: number;
  maxRounds: number;
  currentPrompt: string;
  usedPromptIndexes: number[];
  answers: WSTAnswer[];
  answerTime: number;
  guessTime: number;
  timeRemaining: number;
}

interface WSTActions {
  setRoomCode: (roomCode: string) => void;
  setCurrentPlayer: (playerId: string) => void;
  setMaxRounds: (rounds: number) => void;
  addPlayer: (player: Omit<WSTPlayer, 'score' | 'roundScore' | 'answer' | 'ownAnswerId' | 'hasAnswered' | 'guesses' | 'hasGuessed'>) => void;
  startGame: () => void;
  startRound: () => void;
  submitAnswer: (playerId: string, answer: string) => boolean;
  beginGuessing: () => void;
  submitGuesses: (playerId: string, guesses: Record<string, string>) => boolean;
  calculateResults: () => void;
  nextRound: () => void;
  decrementTime: () => void;
  resetGame: () => void;
  allPlayersAnswered: () => boolean;
  allPlayersGuessed: () => boolean;
}

const ANSWER_TIME = 60;
const GUESS_TIME = 75;

const initialState: WSTState = {
  roomCode: null,
  players: [],
  currentPlayerId: null,
  phase: 'lobby',
  currentRound: 0,
  maxRounds: 5,
  currentPrompt: '',
  usedPromptIndexes: [],
  answers: [],
  answerTime: ANSWER_TIME,
  guessTime: GUESS_TIME,
  timeRemaining: 0,
};

export const makeAnswerId = (playerId: string, round: number) =>
  `wst-${round}-${playerId}`;

const useWhoSaidThatStore = create<WSTState & WSTActions>((set, get) => ({
  ...initialState,

  setRoomCode: (roomCode) => set({ roomCode }),
  setCurrentPlayer: (currentPlayerId) => set({ currentPlayerId }),
  setMaxRounds: (maxRounds) => set({ maxRounds }),

  addPlayer: (player) => set((state) => {
    if (state.players.some(existing => existing.id === player.id)) return state;
    return {
      players: [...state.players, {
        ...player,
        score: 0,
        roundScore: 0,
        answer: '',
        ownAnswerId: null,
        hasAnswered: false,
        guesses: {},
        hasGuessed: false,
      }],
    };
  }),

  startGame: () => {
    set({
      phase: 'answering',
      currentRound: 1,
      usedPromptIndexes: [],
      players: get().players.map(player => ({ ...player, score: 0 })),
    });
    get().startRound();
  },

  startRound: () => {
    const state = get();
    let available = WHO_SAID_THAT_PROMPTS
      .map((_, index) => index)
      .filter(index => !state.usedPromptIndexes.includes(index));
    if (available.length === 0) available = WHO_SAID_THAT_PROMPTS.map((_, index) => index);
    const promptIndex = available[Math.floor(Math.random() * available.length)] ?? 0;

    set({
      currentPrompt: WHO_SAID_THAT_PROMPTS[promptIndex],
      usedPromptIndexes: available.length === WHO_SAID_THAT_PROMPTS.length && state.usedPromptIndexes.length > 0
        ? [promptIndex]
        : [...state.usedPromptIndexes, promptIndex],
      answers: [],
      phase: 'answering',
      timeRemaining: state.answerTime,
      players: state.players.map(player => ({
        ...player,
        roundScore: 0,
        answer: '',
        ownAnswerId: null,
        hasAnswered: false,
        guesses: {},
        hasGuessed: false,
      })),
    });
  },

  submitAnswer: (playerId, rawAnswer) => {
    const answer = rawAnswer.trim().slice(0, 180);
    const state = get();
    const player = state.players.find(candidate => candidate.id === playerId);
    if (state.phase !== 'answering' || !player || player.hasAnswered || !answer) return false;

    set({
      players: state.players.map(candidate =>
        candidate.id === playerId
          ? { ...candidate, answer, hasAnswered: true }
          : candidate
      ),
    });
    return true;
  },

  beginGuessing: () => {
    const state = get();
    if (state.phase !== 'answering') return;
    const completedPlayers = state.players.filter(player => player.hasAnswered && player.answer);
    if (completedPlayers.length < 2) return;

    const answers = shuffleArray(completedPlayers.map(player => ({
      id: makeAnswerId(player.id, state.currentRound),
      text: player.answer,
      authorId: player.id,
      fooledCount: 0,
    })));

    set({
      answers,
      phase: 'guessing',
      timeRemaining: state.guessTime,
      players: state.players.map(player => ({
        ...player,
        hasAnswered: Boolean(player.answer),
        ownAnswerId: player.answer ? makeAnswerId(player.id, state.currentRound) : null,
        guesses: {},
        hasGuessed: !player.answer,
      })),
    });
  },

  submitGuesses: (playerId, guesses) => {
    const state = get();
    const player = state.players.find(candidate => candidate.id === playerId);
    if (state.phase !== 'guessing' || !player || player.hasGuessed) return false;

    const answerIds = state.answers
      .filter(answer => answer.id !== player.ownAnswerId)
      .map(answer => answer.id);
    const candidateIds = state.players
      .filter(candidate => candidate.id !== playerId && candidate.hasAnswered)
      .map(candidate => candidate.id);
    const submittedAnswerIds = Object.keys(guesses);
    const submittedAuthorIds = Object.values(guesses);
    const valid = answerIds.length === submittedAnswerIds.length
      && answerIds.every(id => submittedAnswerIds.includes(id))
      && submittedAuthorIds.every(id => candidateIds.includes(id))
      && new Set(submittedAuthorIds).size === submittedAuthorIds.length;
    if (!valid) return false;

    set({
      players: state.players.map(candidate =>
        candidate.id === playerId
          ? { ...candidate, guesses: { ...guesses }, hasGuessed: true }
          : candidate
      ),
    });
    return true;
  },

  calculateResults: () => {
    const state = get();
    if (state.phase !== 'guessing') return;
    const fooledByAuthor: Record<string, number> = {};
    const correctByPlayer: Record<string, number> = {};

    state.players.forEach(player => {
      if (!player.hasGuessed) return;
      Object.entries(player.guesses).forEach(([answerId, guessedAuthorId]) => {
        const answer = state.answers.find(candidate => candidate.id === answerId);
        if (!answer?.authorId || answer.authorId === player.id) return;
        if (guessedAuthorId === answer.authorId) {
          correctByPlayer[player.id] = (correctByPlayer[player.id] ?? 0) + 1;
        } else {
          fooledByAuthor[answer.authorId] = (fooledByAuthor[answer.authorId] ?? 0) + 1;
        }
      });
    });

    set({
      phase: 'results',
      timeRemaining: 10,
      answers: state.answers.map(answer => ({
        ...answer,
        fooledCount: answer.authorId ? fooledByAuthor[answer.authorId] ?? 0 : 0,
      })),
      players: state.players.map(player => {
        const roundScore = (correctByPlayer[player.id] ?? 0) * 2 + (fooledByAuthor[player.id] ?? 0);
        return { ...player, roundScore, score: player.score + roundScore };
      }),
    });
  },

  nextRound: () => {
    const state = get();
    if (state.currentRound >= state.maxRounds) {
      set({ phase: 'game-over' });
      return;
    }
    set({ currentRound: state.currentRound + 1 });
    get().startRound();
  },

  decrementTime: () => set((state) => ({ timeRemaining: Math.max(0, state.timeRemaining - 1) })),
  resetGame: () => set({ ...initialState }),
  allPlayersAnswered: () => get().players.every(player => player.hasAnswered),
  allPlayersGuessed: () => get().players.filter(player => player.hasAnswered).every(player => player.hasGuessed),
}));

export default useWhoSaidThatStore;
