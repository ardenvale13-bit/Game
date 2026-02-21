// Hangman - Game Store
import { create } from 'zustand';

export type HangmanPhase = 'lobby' | 'picking' | 'guessing' | 'won' | 'lost' | 'game-over';

export interface HangmanPlayer {
  id: string;
  name: string;
  avatarId: string;
  avatarFilename: string;
  isHost: boolean;
  score: number;
}

export interface HangmanGameState {
  roomCode: string | null;
  players: HangmanPlayer[];
  currentPlayerId: string | null;
  phase: HangmanPhase;
  secretWord: string;
  category: string;
  guessedLetters: string[];
  wrongGuesses: number;
  maxWrong: number;
  currentPickerIndex: number;
  currentRound: number;
  maxRounds: number;
  winner: string | null;
}

interface HangmanActions {
  // Setup
  setRoomCode: (code: string) => void;
  setCurrentPlayer: (id: string) => void;
  addPlayer: (player: Omit<HangmanPlayer, 'score'>) => void;
  removePlayer: (id: string) => void;

  // Game flow
  startGame: () => void;
  setWord: (word: string, category: string) => void;
  guessLetter: (letter: string, playerId: string) => void;
  nextRound: () => void;
  endGame: () => void;
  resetGame: () => void;

  // Helpers
  getCurrentPicker: () => HangmanPlayer | undefined;
  getCurrentPlayer: () => HangmanPlayer | undefined;
  isCurrentPlayerPicker: () => boolean;
  canStartGame: () => boolean;
  getLeaderboard: () => HangmanPlayer[];
  getWordDisplay: () => string;
  isWordComplete: () => boolean;
  isGameLost: () => boolean;
}

const MAX_WRONG = 10;
const MAX_ROUNDS = 5;

const initialState: HangmanGameState = {
  roomCode: null,
  players: [],
  currentPlayerId: null,
  phase: 'lobby',
  secretWord: '',
  category: '',
  guessedLetters: [],
  wrongGuesses: 0,
  maxWrong: MAX_WRONG,
  currentPickerIndex: 0,
  currentRound: 0,
  maxRounds: MAX_ROUNDS,
  winner: null,
};

const useHangmanStore = create<HangmanGameState & HangmanActions>((set, get) => ({
  ...initialState,

  // Setup
  setRoomCode: (code) => set({ roomCode: code }),
  setCurrentPlayer: (id) => set({ currentPlayerId: id }),

  addPlayer: (playerData) => {
    const player: HangmanPlayer = {
      ...playerData,
      score: 0,
    };
    set((state) => ({
      players: [...state.players, player],
    }));
  },

  removePlayer: (id) => set((state) => ({
    players: state.players.filter(p => p.id !== id),
  })),

  // Game flow
  startGame: () => {
    const state = get();

    // Reset players for game start
    const players = state.players.map((p) => ({
      ...p,
      score: 0,
    }));

    set({
      phase: 'picking',
      currentRound: 1,
      players,
      currentPickerIndex: 0,
      guessedLetters: [],
      wrongGuesses: 0,
      secretWord: '',
      category: '',
      winner: null,
    });
  },

  setWord: (word, category) => {
    const upperWord = word.toUpperCase();
    set({
      secretWord: upperWord,
      category,
      phase: 'guessing',
      guessedLetters: [],
      wrongGuesses: 0,
      winner: null,
    });
  },

  guessLetter: (letter, playerId) => {
    const state = get();

    // Only guesser (non-picker) can guess
    const picker = state.players[state.currentPickerIndex];
    if (playerId === picker.id) return; // Picker cannot guess

    const upperLetter = letter.toUpperCase();

    // Ignore non-letter characters (spaces etc.)
    if (!/^[A-Z]$/.test(upperLetter)) return;

    // Already guessed
    if (state.guessedLetters.includes(upperLetter)) return;

    const newGuessedLetters = [...state.guessedLetters, upperLetter];
    const isCorrect = state.secretWord.includes(upperLetter);
    const newWrongGuesses = isCorrect ? state.wrongGuesses : state.wrongGuesses + 1;

    // Award points for correct guess
    let pointsAward = 0;
    if (isCorrect) {
      pointsAward = 10;
    }

    // Check if word is complete (ignore spaces — they're auto-revealed)
    const isComplete = state.secretWord.split('').every((c) => c === ' ' || newGuessedLetters.includes(c));
    const isLost = newWrongGuesses >= state.maxWrong;

    if (isComplete) {
      // Guesser won
      pointsAward += 5; // Bonus for winning
      set({
        guessedLetters: newGuessedLetters,
        wrongGuesses: newWrongGuesses,
        phase: 'won',
        winner: playerId,
        players: state.players.map((p) =>
          p.id === playerId ? { ...p, score: p.score + pointsAward } : p
        ),
      });
    } else if (isLost) {
      // Word picker won
      set({
        guessedLetters: newGuessedLetters,
        wrongGuesses: newWrongGuesses,
        phase: 'lost',
        winner: picker.id,
        players: state.players.map((p) =>
          p.id === picker.id ? { ...p, score: p.score + 15 } : p
        ),
      });
    } else {
      // Game continues
      set({
        guessedLetters: newGuessedLetters,
        wrongGuesses: newWrongGuesses,
        players: state.players.map((p) =>
          p.id === playerId ? { ...p, score: p.score + (isCorrect ? pointsAward : 0) } : p
        ),
      });
    }
  },

  nextRound: () => {
    const state = get();

    // Check if game should end
    if (state.currentRound >= state.maxRounds) {
      set({ phase: 'game-over' });
      return;
    }

    // Rotate picker
    const nextPickerIndex = (state.currentPickerIndex + 1) % state.players.length;

    set({
      currentRound: state.currentRound + 1,
      currentPickerIndex: nextPickerIndex,
      phase: 'picking',
      guessedLetters: [],
      wrongGuesses: 0,
      secretWord: '',
      category: '',
      winner: null,
    });
  },

  endGame: () => set({ phase: 'game-over' }),

  resetGame: () => set({
    ...initialState,
    roomCode: get().roomCode,
  }),

  // Helpers
  getCurrentPicker: () => {
    const state = get();
    return state.players[state.currentPickerIndex];
  },

  getCurrentPlayer: () => {
    const state = get();
    return state.players.find((p) => p.id === state.currentPlayerId);
  },

  isCurrentPlayerPicker: () => {
    const state = get();
    const picker = state.players[state.currentPickerIndex];
    return picker?.id === state.currentPlayerId;
  },

  canStartGame: () => {
    const state = get();
    return state.players.length >= 2;
  },

  getLeaderboard: () => {
    const state = get();
    return [...state.players].sort((a, b) => b.score - a.score);
  },

  getWordDisplay: () => {
    const state = get();
    return state.secretWord
      .split('')
      .map((letter) => (letter === ' ' ? '  ' : state.guessedLetters.includes(letter) ? letter : '_'))
      .join(' ');
  },

  isWordComplete: () => {
    const state = get();
    return state.secretWord.split('').every((c) => c === ' ' || state.guessedLetters.includes(c));
  },

  isGameLost: () => {
    const state = get();
    return state.wrongGuesses >= state.maxWrong;
  },
}));

export default useHangmanStore;
