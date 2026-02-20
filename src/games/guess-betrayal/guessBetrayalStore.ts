// Guess Betrayal - Game Store
import { create } from 'zustand';
import type { QuestionCategory } from './questionData';
import { getRandomQuestion } from './questionData';

export type GBPhase =
  | 'lobby'
  | 'answering'   // Everyone types their answer to the question
  | 'guessing'    // All answers revealed shuffled — guess who said what
  | 'results'     // Show correct matches, points awarded
  | 'game-over';

export interface GBPlayer {
  id: string;
  name: string;
  avatarId: string;
  avatarFilename: string;
  score: number;
  isHost: boolean;
  answer: string;         // This player's answer to the current question
  hasAnswered: boolean;
  guesses: Record<string, string>; // answerId -> playerId guess
  hasGuessed: boolean;
}

export interface GBAnswer {
  id: string;       // Shuffled ID (not the player ID)
  text: string;
  playerId: string; // Who actually wrote it (hidden during guessing)
}

export interface GBGameState {
  // Room
  roomCode: string | null;

  // Players
  players: GBPlayer[];
  currentPlayerId: string | null;

  // Game state
  phase: GBPhase;
  currentRound: number;
  maxRounds: number;
  category: QuestionCategory;

  // Current round
  currentQuestion: string;
  usedQuestions: string[];
  shuffledAnswers: GBAnswer[];  // Shuffled order for display

  // Timer
  timeRemaining: number;

  // Settings
  answerTime: number;
  guessTime: number;
}

interface GBActions {
  // Setup
  setRoomCode: (code: string) => void;
  setCurrentPlayer: (id: string) => void;
  addPlayer: (player: Omit<GBPlayer, 'answer' | 'hasAnswered' | 'guesses' | 'hasGuessed' | 'score'>) => void;
  removePlayer: (id: string) => void;
  setCategory: (cat: QuestionCategory) => void;
  setMaxRounds: (rounds: number) => void;

  // Game flow
  startGame: () => void;
  startRound: () => void;
  submitAnswer: (playerId: string, answer: string) => void;
  submitGuesses: (playerId: string, guesses: Record<string, string>) => void;
  calculateResults: () => void;
  nextRound: () => void;
  endGame: () => void;
  resetGame: () => void;

  // Timer
  setTimeRemaining: (time: number) => void;
  decrementTime: () => void;

  // Helpers
  allPlayersAnswered: () => boolean;
  allPlayersGuessed: () => boolean;
  getLeaderboard: () => GBPlayer[];
}

const ANSWER_TIME = 30;
const GUESS_TIME = 45;

const initialState: GBGameState = {
  roomCode: null,
  players: [],
  currentPlayerId: null,
  phase: 'lobby',
  currentRound: 0,
  maxRounds: 8,
  category: 'blend',
  currentQuestion: '',
  usedQuestions: [],
  shuffledAnswers: [],
  timeRemaining: 0,
  answerTime: ANSWER_TIME,
  guessTime: GUESS_TIME,
};

// Generate a random short ID for answer shuffling
const genId = () => Math.random().toString(36).slice(2, 8);

const useGuessBetrayalStore = create<GBGameState & GBActions>((set, get) => ({
  ...initialState,

  // Setup
  setRoomCode: (code) => set({ roomCode: code }),
  setCurrentPlayer: (id) => set({ currentPlayerId: id }),

  addPlayer: (playerData) => {
    const player: GBPlayer = {
      ...playerData,
      score: 0,
      answer: '',
      hasAnswered: false,
      guesses: {},
      hasGuessed: false,
    };
    set((state) => ({
      players: [...state.players, player],
    }));
  },

  removePlayer: (id) => set((state) => ({
    players: state.players.filter(p => p.id !== id),
  })),

  setCategory: (cat) => set({ category: cat }),
  setMaxRounds: (rounds) => set({ maxRounds: rounds }),

  // Game flow
  startGame: () => {
    const state = get();
    const players = state.players.map(p => ({
      ...p,
      score: 0,
      answer: '',
      hasAnswered: false,
      guesses: {},
      hasGuessed: false,
    }));
    set({
      phase: 'answering',
      currentRound: 1,
      players,
      usedQuestions: [],
      shuffledAnswers: [],
    });
    get().startRound();
  },

  startRound: () => {
    const state = get();
    const question = getRandomQuestion(state.category, state.usedQuestions);

    const players = state.players.map(p => ({
      ...p,
      answer: '',
      hasAnswered: false,
      guesses: {},
      hasGuessed: false,
    }));

    set({
      currentQuestion: question,
      usedQuestions: [...state.usedQuestions, question],
      shuffledAnswers: [],
      players,
      phase: 'answering',
      timeRemaining: state.answerTime,
    });
  },

  submitAnswer: (playerId, answer) => {
    set((state) => ({
      players: state.players.map(p =>
        p.id === playerId ? { ...p, answer, hasAnswered: true } : p
      ),
    }));
  },

  submitGuesses: (playerId, guesses) => {
    set((state) => ({
      players: state.players.map(p =>
        p.id === playerId ? { ...p, guesses, hasGuessed: true } : p
      ),
    }));
  },

  calculateResults: () => {
    const state = get();
    const answers = state.shuffledAnswers;

    // Calculate scores
    const players = state.players.map(p => {
      let roundScore = 0;

      // +1 for each correct guess
      Object.entries(p.guesses).forEach(([answerId, guessedPlayerId]) => {
        const answer = answers.find(a => a.id === answerId);
        if (answer && answer.playerId === guessedPlayerId) {
          roundScore += 1;
        }
      });

      return {
        ...p,
        score: p.score + roundScore,
      };
    });

    // Betrayal bonus: +2 if nobody guessed your answer correctly
    const finalPlayers = players.map(p => {
      const myAnswer = answers.find(a => a.playerId === p.id);
      if (!myAnswer) return p;

      const anyoneGuessedMe = players.some(other => {
        if (other.id === p.id) return false; // Don't count self
        return other.guesses[myAnswer.id] === p.id;
      });

      if (!anyoneGuessedMe) {
        return { ...p, score: p.score + 2 };
      }
      return p;
    });

    set({
      players: finalPlayers,
      phase: 'results',
      timeRemaining: 10,
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

  endGame: () => set({ phase: 'game-over' }),

  resetGame: () => set({
    ...initialState,
    roomCode: get().roomCode,
  }),

  // Timer
  setTimeRemaining: (time) => set({ timeRemaining: time }),
  decrementTime: () => set((state) => ({
    timeRemaining: Math.max(0, state.timeRemaining - 1),
  })),

  // Helpers
  allPlayersAnswered: () => {
    return get().players.every(p => p.hasAnswered);
  },

  allPlayersGuessed: () => {
    return get().players.every(p => p.hasGuessed);
  },

  getLeaderboard: () => {
    return [...get().players].sort((a, b) => b.score - a.score);
  },
}));

export { genId };
export default useGuessBetrayalStore;
