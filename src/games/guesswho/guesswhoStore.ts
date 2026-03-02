// Guess Who - Game Store (Zustand)
// Host-authoritative: host manages rounds, questions, guesses
import { create } from 'zustand';
import { GUESSWHO_CHARACTERS, type GWCharacter } from './guesswhoData';

export type GWPhase = 'choosing' | 'questioning' | 'game-over';

export interface GWPlayer {
  id: string;
  name: string;
  avatarId: string;
  avatarFilename: string;
  isHost: boolean;
  score: number;
  eliminated: boolean; // per round (wrong guess)
}

export interface GWQuestion {
  askerId: string;
  askerName: string;
  question: string;
  answer: 'yes' | 'no' | null; // null = waiting for answer
}

export interface GWRoundResult {
  round: number;
  chooserId: string;
  chooserName: string;
  chosenCharacterId: string;
  chosenCharacterName: string;
  winner: { playerId: string; playerName: string } | null;
  winnerWasCorrect: boolean;
  questionsAsked: number;
  secondsElapsed: number;
}

interface GWState {
  players: GWPlayer[];
  phase: GWPhase;
  currentRound: number;
  maxRounds: number;
  chooserIndex: number; // which player is the Chooser
  chosenCharacterId: string | null; // the secretly chosen character
  characters: GWCharacter[]; // the 24 characters
  eliminatedCharIds: string[]; // characters eliminated by group
  questions: GWQuestion[]; // history of all questions
  currentQuestion: string | null; // pending question being answered
  currentAsker: string | null; // who asked the current question
  timeRemaining: number;
  roundTime: number; // 90 seconds per round
  roundStartTime: number; // timestamp when round started
  roundResults: GWRoundResult[];
}

interface GWActions {
  // Setup
  initFromLobby: (players: { id: string; name: string; avatarId: string; avatarFilename: string; isHost: boolean }[]) => void;
  setMaxRounds: (rounds: number) => void;

  // Game flow (host actions)
  startRound: () => void;
  confirmChoice: (charId: string) => void;
  askQuestion: (askerId: string, askerName: string, question: string) => void;
  answerQuestion: (answer: 'yes' | 'no') => void;
  makeGuess: (guesser: GWPlayer, charId: string) => boolean;
  eliminateCharacter: (charId: string) => void;
  endRound: (winner: { playerId: string; playerName: string } | null) => void;
  endGame: () => void;
  tickTimer: () => number;

  // Getters
  getChooser: () => GWPlayer | null;
  getRemainingCharacters: () => GWCharacter[];
  getFinalLeaderboard: () => GWPlayer[];

  // Full state (for sync)
  getFullState: () => GWState;
  setFullState: (state: Partial<GWState>) => void;

  // Reset
  reset: () => void;
}

const initialState: GWState = {
  players: [],
  phase: 'choosing',
  currentRound: 0,
  maxRounds: 3,
  chooserIndex: 0,
  chosenCharacterId: null,
  characters: [...GUESSWHO_CHARACTERS],
  eliminatedCharIds: [],
  questions: [],
  currentQuestion: null,
  currentAsker: null,
  timeRemaining: 90,
  roundTime: 90,
  roundStartTime: 0,
  roundResults: [],
};

const useGuesswhoStore = create<GWState & GWActions>((set, get) => ({
  ...initialState,

  initFromLobby: (lobbyPlayers) => {
    const players: GWPlayer[] = lobbyPlayers.map(p => ({
      ...p,
      score: 0,
      eliminated: false,
    }));
    set({ ...initialState, players });
  },

  setMaxRounds: (rounds) => set({ maxRounds: rounds }),

  startRound: () => {
    const state = get();
    set({
      currentRound: state.currentRound + 1,
      phase: 'choosing',
      chosenCharacterId: null,
      currentQuestion: null,
      currentAsker: null,
      questions: [],
      eliminatedCharIds: [],
      timeRemaining: state.roundTime,
      roundStartTime: Date.now(),
      players: state.players.map(p => ({ ...p, eliminated: false })),
    });
  },

  confirmChoice: (charId) => {
    set({
      chosenCharacterId: charId,
      phase: 'questioning',
      timeRemaining: get().roundTime,
      roundStartTime: Date.now(),
    });
  },

  askQuestion: (askerId, askerName, question) => {
    set((state) => ({
      questions: [
        ...state.questions,
        {
          askerId,
          askerName,
          question,
          answer: null,
        },
      ],
      currentQuestion: question,
      currentAsker: askerId,
    }));
  },

  answerQuestion: (answer) => {
    set((state) => {
      const updated = [...state.questions];
      if (updated.length > 0) {
        updated[updated.length - 1].answer = answer;
      }
      return {
        questions: updated,
        currentQuestion: null,
        currentAsker: null,
      };
    });
  },

  makeGuess: (guesser, charId) => {
    const state = get();
    const isCorrect = charId === state.chosenCharacterId;

    if (!isCorrect) {
      // Mark guesser as eliminated
      set((state) => ({
        players: state.players.map(p =>
          p.id === guesser.id ? { ...p, eliminated: true } : p
        ),
      }));
    }

    // Return whether guess was correct
    return isCorrect;
  },

  eliminateCharacter: (charId) => {
    set((state) => ({
      eliminatedCharIds: state.eliminatedCharIds.includes(charId)
        ? state.eliminatedCharIds.filter(id => id !== charId)
        : [...state.eliminatedCharIds, charId],
    }));
  },

  endRound: (winner) => {
    const state = get();
    const chooser = state.players[state.chooserIndex];

    let winningPlayer = winner;
    let points = 0;

    if (winner) {
      // Correct guesser gets 3 points
      points = 3;
    } else if (chooser && state.timeRemaining > 0) {
      // Chooser gets 2 points if time runs out with no correct guess
      winningPlayer = { playerId: chooser.id, playerName: chooser.name };
      points = 2;
    }

    const result: GWRoundResult = {
      round: state.currentRound,
      chooserId: chooser?.id || '',
      chooserName: chooser?.name || '',
      chosenCharacterId: state.chosenCharacterId || '',
      chosenCharacterName:
        state.characters.find(c => c.id === state.chosenCharacterId)?.name || '',
      winner: winningPlayer || null,
      winnerWasCorrect: winner ? true : false,
      questionsAsked: state.questions.length,
      secondsElapsed: state.roundTime - state.timeRemaining,
    };

    const updatedPlayers = state.players.map(p => {
      if (winningPlayer && p.id === winningPlayer.playerId) {
        return { ...p, score: p.score + points };
      }
      return p;
    });

    // Move to next round or game-over
    const nextRound = state.currentRound + 1;
    const isGameOver = nextRound > state.maxRounds;

    set({
      roundResults: [...state.roundResults, result],
      players: updatedPlayers,
      chooserIndex: (state.chooserIndex + 1) % state.players.length,
      phase: isGameOver ? 'game-over' : 'choosing',
    });
  },

  endGame: () => set({ phase: 'game-over' }),

  tickTimer: () => {
    const state = get();
    const next = state.timeRemaining - 1;
    set({ timeRemaining: Math.max(0, next) });
    return next;
  },

  getChooser: () => {
    const state = get();
    return state.players[state.chooserIndex] || null;
  },

  getRemainingCharacters: () => {
    const state = get();
    return state.characters.filter(c => !state.eliminatedCharIds.includes(c.id));
  },

  getFinalLeaderboard: () => {
    return [...get().players].sort((a, b) => b.score - a.score);
  },

  getFullState: () => {
    const s = get();
    return {
      players: s.players,
      phase: s.phase,
      currentRound: s.currentRound,
      maxRounds: s.maxRounds,
      chooserIndex: s.chooserIndex,
      chosenCharacterId: s.chosenCharacterId,
      characters: s.characters,
      eliminatedCharIds: s.eliminatedCharIds,
      questions: s.questions,
      currentQuestion: s.currentQuestion,
      currentAsker: s.currentAsker,
      timeRemaining: s.timeRemaining,
      roundTime: s.roundTime,
      roundStartTime: s.roundStartTime,
      roundResults: s.roundResults,
    };
  },

  setFullState: (incoming) => {
    set((state) => ({
      ...state,
      ...incoming,
    }));
  },

  reset: () => set(initialState),
}));

export default useGuesswhoStore;
