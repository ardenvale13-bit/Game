// Wavelength — Game Store (Zustand)
import { create } from 'zustand';
import { getRandomSpectrum, generateTargetPosition } from './wavelengthData';
import type { Spectrum } from './wavelengthData';

export type WavelengthPhase = 'lobby' | 'team-setup' | 'psychic-clue' | 'team-guess' | 'counter-guess' | 'reveal' | 'game-over';

export interface WavelengthPlayer {
  id: string;
  name: string;
  avatarId: string;
  avatarFilename: string;
  isHost: boolean;
  team: 'pink' | 'blue' | null;
}

export interface WavelengthGameState {
  roomCode: string | null;
  players: WavelengthPlayer[];
  currentPlayerId: string | null;

  phase: WavelengthPhase;
  spectrum: Spectrum | null;
  targetPosition: number; // 0-100
  currentClue: string; // One-word clue from psychic
  teamGuessPosition: number; // Where the team guessed (0-100)
  counterGuess: 'higher' | 'lower' | null; // Opposing team's guess for bonus point
  currentTeam: 'pink' | 'blue';
  psychicIndex: { pink: number; blue: number }; // Index in team to rotate psychics

  pinkScore: number;
  blueScore: number;
  pointsToWin: number; // default 10
  lastRoundPoints: number; // Points awarded this round
  lastCounterCorrect: boolean | null; // Was the counter-guess correct?
  winner: 'pink' | 'blue' | null;

  // Scoring breakdown for this round (for UI display)
  roundDistance: number; // Distance between guess and target
  roundAccuracy: 'bullseye' | 'close' | 'near' | 'miss' | null;
}

interface WavelengthActions {
  // Setup
  setRoomCode: (code: string) => void;
  setCurrentPlayer: (id: string) => void;
  addPlayer: (player: Omit<WavelengthPlayer, 'team'>) => void;

  // Team setup
  setPlayerTeam: (playerId: string, team: 'pink' | 'blue') => void;
  clearPlayerTeam: (playerId: string) => void;
  canStartGame: () => boolean;

  // Game flow
  startGame: () => void;
  submitClue: (clue: string) => void;
  submitTeamGuess: (position: number) => void;
  submitCounterGuess: (guess: 'higher' | 'lower') => void;
  advanceRound: () => void;

  // Helpers
  getCurrentPlayer: () => WavelengthPlayer | undefined;
  getTeamPlayers: (team: 'pink' | 'blue') => WavelengthPlayer[];
  getCurrentPsychic: () => WavelengthPlayer | undefined;
  isCurrentPsychic: (playerId: string) => boolean;

  resetGame: () => void;
}

const initialState: WavelengthGameState = {
  roomCode: null,
  players: [],
  currentPlayerId: null,

  phase: 'lobby',
  spectrum: null,
  targetPosition: 0,
  currentClue: '',
  teamGuessPosition: 0,
  counterGuess: null,
  currentTeam: 'pink',
  psychicIndex: { pink: 0, blue: 0 },

  pinkScore: 0,
  blueScore: 0,
  pointsToWin: 10,
  lastRoundPoints: 0,
  lastCounterCorrect: null,
  winner: null,

  roundDistance: 0,
  roundAccuracy: null,
};

const useWavelengthStore = create<WavelengthGameState & WavelengthActions>((set, get) => ({
  ...initialState,

  // --- Setup ---
  setRoomCode: (code) => set({ roomCode: code }),
  setCurrentPlayer: (id) => set({ currentPlayerId: id }),

  addPlayer: (data) => {
    const player: WavelengthPlayer = { ...data, team: null };
    set((s) => ({ players: [...s.players, player] }));
  },

  // --- Team setup ---
  setPlayerTeam: (playerId, team) => {
    set((s) => ({
      players: s.players.map(p =>
        p.id === playerId ? { ...p, team } : p
      ),
    }));
  },

  clearPlayerTeam: (playerId) => {
    set((s) => ({
      players: s.players.map(p =>
        p.id === playerId ? { ...p, team: null } : p
      ),
    }));
  },

  canStartGame: () => {
    const { players } = get();
    const pink = players.filter(p => p.team === 'pink');
    const blue = players.filter(p => p.team === 'blue');
    return pink.length >= 2 && blue.length >= 2;
  },

  // --- Game flow ---
  startGame: () => {
    const spectrum = getRandomSpectrum();
    const targetPosition = generateTargetPosition();

    set({
      phase: 'psychic-clue',
      spectrum,
      targetPosition,
      currentClue: '',
      teamGuessPosition: 50, // Start in the middle
      counterGuess: null,
      currentTeam: 'pink',
      psychicIndex: { pink: 0, blue: 0 },
      pinkScore: 0,
      blueScore: 0,
      lastRoundPoints: 0,
      lastCounterCorrect: null,
      winner: null,
      roundDistance: 0,
      roundAccuracy: null,
    });
  },

  submitClue: (clue) => {
    set({
      currentClue: clue.trim().toLowerCase(),
      phase: 'team-guess',
    });
  },

  submitTeamGuess: (position) => {
    const s = get();
    const distance = Math.abs(position - s.targetPosition);

    // Calculate accuracy tier
    let accuracy: 'bullseye' | 'close' | 'near' | 'miss';
    let points = 0;

    if (distance <= 5) {
      accuracy = 'bullseye';
      points = 4;
    } else if (distance <= 15) {
      accuracy = 'close';
      points = 3;
    } else if (distance <= 25) {
      accuracy = 'near';
      points = 2;
    } else {
      accuracy = 'miss';
      points = 0;
    }

    // Award points to current team
    const newState: Partial<WavelengthGameState> = {
      teamGuessPosition: position,
      roundDistance: distance,
      roundAccuracy: accuracy,
      lastRoundPoints: points,
      phase: 'counter-guess',
    };

    // Update score
    if (s.currentTeam === 'pink') {
      newState.pinkScore = s.pinkScore + points;
    } else {
      newState.blueScore = s.blueScore + points;
    }

    // Check if this team won
    const newScore = s.currentTeam === 'pink'
      ? (newState.pinkScore as number)
      : (newState.blueScore as number);

    if (newScore >= s.pointsToWin) {
      newState.winner = s.currentTeam;
      newState.phase = 'game-over';
    }

    set(newState);
  },

  submitCounterGuess: (guess) => {
    const s = get();
    const targetPos = s.targetPosition;
    const guessPos = s.teamGuessPosition;

    let isCorrect = false;
    if (guess === 'higher' && targetPos > guessPos) {
      isCorrect = true;
    } else if (guess === 'lower' && targetPos < guessPos) {
      isCorrect = true;
    }

    const counterTeam = s.currentTeam === 'pink' ? 'blue' : 'pink';
    const newState: Partial<WavelengthGameState> = {
      counterGuess: guess,
      lastCounterCorrect: isCorrect,
      phase: 'reveal',
    };

    // Award 1 bonus point if correct
    if (isCorrect) {
      if (counterTeam === 'pink') {
        newState.pinkScore = s.pinkScore + 1;
      } else {
        newState.blueScore = s.blueScore + 1;
      }

      // Check if counter team won with the bonus point
      const newScore = counterTeam === 'pink'
        ? (newState.pinkScore as number)
        : (newState.blueScore as number);

      if (newScore >= s.pointsToWin) {
        newState.winner = counterTeam;
        newState.phase = 'game-over';
      }
    }

    set(newState);
  },

  advanceRound: () => {
    const s = get();

    // If game is over, don't advance
    if (s.winner) return;

    // Rotate psychic for current team
    const teamPlayers = s.players.filter(p => p.team === s.currentTeam);
    if (teamPlayers.length === 0) return;

    const nextPsychicIdx = (s.psychicIndex[s.currentTeam] + 1) % teamPlayers.length;

    // Switch to other team
    const nextTeam = s.currentTeam === 'pink' ? 'blue' : 'pink';

    // Generate new spectrum and target
    const spectrum = getRandomSpectrum();
    const targetPosition = generateTargetPosition();

    set({
      phase: 'psychic-clue',
      currentTeam: nextTeam,
      psychicIndex: {
        ...s.psychicIndex,
        [s.currentTeam]: nextPsychicIdx,
      },
      spectrum,
      targetPosition,
      currentClue: '',
      teamGuessPosition: 50,
      counterGuess: null,
      lastRoundPoints: 0,
      lastCounterCorrect: null,
      roundDistance: 0,
      roundAccuracy: null,
    });
  },

  // --- Helpers ---
  getCurrentPlayer: () => {
    const s = get();
    return s.players.find(p => p.id === s.currentPlayerId);
  },

  getTeamPlayers: (team) => {
    const s = get();
    return s.players.filter(p => p.team === team);
  },

  getCurrentPsychic: () => {
    const s = get();
    const teamPlayers = s.players.filter(p => p.team === s.currentTeam);
    if (teamPlayers.length === 0) return undefined;
    return teamPlayers[s.psychicIndex[s.currentTeam] % teamPlayers.length];
  },

  isCurrentPsychic: (playerId) => {
    const currentPsychic = get().getCurrentPsychic();
    return currentPsychic?.id === playerId;
  },

  resetGame: () => set({ ...initialState, roomCode: get().roomCode }),
}));

export default useWavelengthStore;
