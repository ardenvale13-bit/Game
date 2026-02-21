// Family Feud - Game Store (Zustand 5)
import { create } from 'zustand';
import type { FFQuestion } from './familyFeudData';
import { findMatchingAnswer, getRandomQuestion, resetUsedQuestions } from './familyFeudData';

export type FFTeam = 'pink' | 'purple';

export type FFPhase =
  | 'lobby'
  | 'team-setup'
  | 'face-off'
  | 'board-play'
  | 'steal-attempt'
  | 'round-results'
  | 'game-over';

export interface FFPlayer {
  id: string;
  name: string;
  avatarId: string;
  avatarFilename: string;
  isHost: boolean;
  team: FFTeam | null;
}

export interface FFGameState {
  roomCode: string | null;
  players: FFPlayer[];
  currentPlayerId: string | null;

  // Teams
  pinkTeamName: string;
  purpleTeamName: string;
  pinkScore: number;
  purpleScore: number;

  // Game settings
  maxRounds: number;
  currentRound: number;

  // Phase
  phase: FFPhase;
  timeRemaining: number;

  // Current question
  currentQuestion: FFQuestion | null;
  boardAnswers: {
    text: string;
    points: number;
    revealed: boolean;
    revealedBy: FFTeam | null;
  }[];
  usedQuestionIds: string[];

  // Face-off
  faceOffPinkPlayerId: string | null;
  faceOffPurplePlayerId: string | null;
  faceOffBuzzes: Record<string, { answer: string; timestamp: number }>;
  faceOffWinner: FFTeam | null;
  faceOffLocked: Record<string, boolean>; // who has buzzed

  // Board play
  controllingTeam: FFTeam | null;
  strikes: number;
  currentTurnPlayerId: string | null;
  turnOrder: string[]; // player IDs in order for board play
  turnIndex: number;
  lastGuess: string | null;
  lastGuessResult: 'correct' | 'strike' | null;

  // Steal
  stealingTeam: FFTeam | null;
  stealAnswer: string | null;
  stealResult: 'success' | 'fail' | null;

  // Round results
  roundPoints: number;
  roundWinnerTeam: FFTeam | null;

  // Game over
  winnerTeam: FFTeam | null;

  // Used face-off players tracking (to avoid repeat matchups)
  usedFaceOffPink: string[];
  usedFaceOffPurple: string[];
}

interface FFActions {
  // Setup
  setRoomCode: (code: string) => void;
  setCurrentPlayer: (id: string) => void;
  addPlayer: (player: Omit<FFPlayer, 'team'>) => void;
  setMaxRounds: (rounds: number) => void;

  // Team setup
  assignTeam: (playerId: string, team: FFTeam | null) => void;
  setTeamName: (team: FFTeam, name: string) => void;
  canStartGame: () => boolean;
  startGame: () => void;

  // Face-off
  startFaceOff: () => void;
  recordBuzz: (playerId: string, answer: string, timestamp: number) => void;
  resolveFaceOff: () => { winner: FFTeam | null; answerIndex: number };
  setFaceOffWinner: (team: FFTeam) => void;

  // Board play
  startBoardPlay: (team: FFTeam) => void;
  makeGuess: (answer: string) => { correct: boolean; answerIndex: number };
  addStrike: () => void;
  advanceTurn: () => void;
  revealAnswer: (index: number, team: FFTeam) => void;
  isBoardCleared: () => boolean;

  // Steal
  startStealAttempt: () => void;
  attemptSteal: (answer: string) => { correct: boolean; answerIndex: number };
  resolveSteal: (success: boolean) => void;

  // Round flow
  awardRoundPoints: () => void;
  startRoundResults: () => void;
  nextRound: () => void;
  endGame: () => void;

  // Timer
  setTimeRemaining: (time: number) => void;
  decrementTime: () => void;

  // Helpers
  getTeamPlayers: (team: FFTeam) => FFPlayer[];
  getPinkPlayers: () => FFPlayer[];
  getPurplePlayers: () => FFPlayer[];
  getTeamScore: (team: FFTeam) => number;

  // State sync (for broadcast)
  getFullState: () => Partial<FFGameState>;
  setFullState: (state: Partial<FFGameState>) => void;

  // Reset
  resetGame: () => void;
}

const initialState: FFGameState = {
  roomCode: null,
  players: [],
  currentPlayerId: null,

  pinkTeamName: 'Pink Team',
  purpleTeamName: 'Purple Team',
  pinkScore: 0,
  purpleScore: 0,

  maxRounds: 3,
  currentRound: 0,

  phase: 'lobby',
  timeRemaining: 0,

  currentQuestion: null,
  boardAnswers: [],
  usedQuestionIds: [],

  faceOffPinkPlayerId: null,
  faceOffPurplePlayerId: null,
  faceOffBuzzes: {},
  faceOffWinner: null,
  faceOffLocked: {},

  controllingTeam: null,
  strikes: 0,
  currentTurnPlayerId: null,
  turnOrder: [],
  turnIndex: 0,
  lastGuess: null,
  lastGuessResult: null,

  stealingTeam: null,
  stealAnswer: null,
  stealResult: null,

  roundPoints: 0,
  roundWinnerTeam: null,

  winnerTeam: null,

  usedFaceOffPink: [],
  usedFaceOffPurple: [],
};

const useFamilyFeudStore = create<FFGameState & FFActions>((set, get) => ({
  ...initialState,

  // --- Setup ---
  setRoomCode: (code) => set({ roomCode: code }),
  setCurrentPlayer: (id) => set({ currentPlayerId: id }),

  addPlayer: (playerData) => {
    const player: FFPlayer = {
      ...playerData,
      team: null,
    };
    set((state) => ({
      players: [...state.players, player],
    }));
  },

  setMaxRounds: (rounds) => set({ maxRounds: rounds }),

  // --- Team Setup ---
  assignTeam: (playerId, team) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, team } : p
      ),
    }));
  },

  setTeamName: (team, name) => {
    if (team === 'pink') {
      set({ pinkTeamName: name || 'Pink Team' });
    } else {
      set({ purpleTeamName: name || 'Purple Team' });
    }
  },

  canStartGame: () => {
    const state = get();
    const pinkPlayers = state.players.filter((p) => p.team === 'pink');
    const purplePlayers = state.players.filter((p) => p.team === 'purple');
    // Both teams must have at least 1 player, and differ by at most 1
    return (
      pinkPlayers.length >= 1 &&
      purplePlayers.length >= 1 &&
      Math.abs(pinkPlayers.length - purplePlayers.length) <= 1
    );
  },

  startGame: () => {
    resetUsedQuestions();
    set({
      phase: 'face-off',
      currentRound: 1,
      pinkScore: 0,
      purpleScore: 0,
      usedQuestionIds: [],
      usedFaceOffPink: [],
      usedFaceOffPurple: [],
    });
    // Start first face-off
    get().startFaceOff();
  },

  // --- Face-off ---
  startFaceOff: () => {
    const state = get();

    // Pick a random question
    const question = getRandomQuestion(state.usedQuestionIds);
    if (!question) {
      // No more questions, end game
      get().endGame();
      return;
    }

    // Track used question
    const newUsedQuestionIds = [...state.usedQuestionIds, question.id];

    // Pick random players from each team (avoid repeats)
    const pinkPlayers = state.players.filter((p) => p.team === 'pink');
    const purplePlayers = state.players.filter((p) => p.team === 'purple');

    // Find available pink player
    let availablePinkPlayers = pinkPlayers.filter(
      (p) => !state.usedFaceOffPink.includes(p.id)
    );
    if (availablePinkPlayers.length === 0) {
      availablePinkPlayers = pinkPlayers;
    }
    const pinkPlayer =
      availablePinkPlayers[
        Math.floor(Math.random() * availablePinkPlayers.length)
      ];

    // Find available purple player
    let availablePurplePlayers = purplePlayers.filter(
      (p) => !state.usedFaceOffPurple.includes(p.id)
    );
    if (availablePurplePlayers.length === 0) {
      availablePurplePlayers = purplePlayers;
    }
    const purplePlayer =
      availablePurplePlayers[
        Math.floor(Math.random() * availablePurplePlayers.length)
      ];

    // Set up board answers from question
    const boardAnswers = question.answers.map((answer) => ({
      text: answer.text,
      points: answer.points,
      revealed: false,
      revealedBy: null as FFTeam | null,
    }));

    // Reset face-off tracking if both teams have used all players
    const newUsedFaceOffPink =
      availablePinkPlayers.length === 1 &&
      pinkPlayers.some((p) => p.id === pinkPlayer.id)
        ? [...state.usedFaceOffPink, pinkPlayer.id]
        : pinkPlayers.every((p) =>
            [...state.usedFaceOffPink, pinkPlayer.id].includes(p.id)
          )
          ? [pinkPlayer.id]
          : [...state.usedFaceOffPink, pinkPlayer.id];

    const newUsedFaceOffPurple =
      availablePurplePlayers.length === 1 &&
      purplePlayers.some((p) => p.id === purplePlayer.id)
        ? [...state.usedFaceOffPurple, purplePlayer.id]
        : purplePlayers.every((p) =>
            [...state.usedFaceOffPurple, purplePlayer.id].includes(p.id)
          )
          ? [purplePlayer.id]
          : [...state.usedFaceOffPurple, purplePlayer.id];

    set({
      phase: 'face-off',
      currentQuestion: question,
      boardAnswers,
      usedQuestionIds: newUsedQuestionIds,
      faceOffPinkPlayerId: pinkPlayer.id,
      faceOffPurplePlayerId: purplePlayer.id,
      faceOffBuzzes: {},
      faceOffWinner: null,
      faceOffLocked: {},
      usedFaceOffPink: newUsedFaceOffPink,
      usedFaceOffPurple: newUsedFaceOffPurple,
      timeRemaining: 30,
    });
  },

  recordBuzz: (playerId, answer, timestamp) => {
    set((state) => ({
      faceOffBuzzes: {
        ...state.faceOffBuzzes,
        [playerId]: { answer, timestamp },
      },
      faceOffLocked: {
        ...state.faceOffLocked,
        [playerId]: true,
      },
    }));
  },

  resolveFaceOff: () => {
    const state = get();
    const pinkBuzz = state.faceOffBuzzes[state.faceOffPinkPlayerId!];
    const purpleBuzz = state.faceOffBuzzes[state.faceOffPurplePlayerId!];

    let winner: FFTeam | null = null;
    let answerIndex = -1;

    // Determine who buzzed first
    if (pinkBuzz && purpleBuzz) {
      if (pinkBuzz.timestamp < purpleBuzz.timestamp) {
        // Pink buzzed first
        const match = findMatchingAnswer(pinkBuzz.answer, state.boardAnswers);
        if (match !== -1) {
          winner = 'pink';
          answerIndex = match;
          // Reveal the answer
          set((s) => ({
            boardAnswers: s.boardAnswers.map((a, i) =>
              i === match ? { ...a, revealed: true, revealedBy: 'pink' } : a
            ),
            faceOffWinner: 'pink',
          }));
        } else {
          // Pink wrong, try purple
          const purpleMatch = findMatchingAnswer(
            purpleBuzz.answer,
            state.boardAnswers
          );
          if (purpleMatch !== -1) {
            winner = 'purple';
            answerIndex = purpleMatch;
            set((s) => ({
              boardAnswers: s.boardAnswers.map((a, i) =>
                i === purpleMatch
                  ? { ...a, revealed: true, revealedBy: 'purple' }
                  : a
              ),
              faceOffWinner: 'purple',
            }));
          } else {
            // Both wrong, reveal all
            set((s) => ({
              boardAnswers: s.boardAnswers.map((a) => ({
                ...a,
                revealed: true,
              })),
              faceOffWinner: null,
            }));
          }
        }
      } else {
        // Purple buzzed first
        const match = findMatchingAnswer(purpleBuzz.answer, state.boardAnswers);
        if (match !== -1) {
          winner = 'purple';
          answerIndex = match;
          set((s) => ({
            boardAnswers: s.boardAnswers.map((a, i) =>
              i === match ? { ...a, revealed: true, revealedBy: 'purple' } : a
            ),
            faceOffWinner: 'purple',
          }));
        } else {
          // Purple wrong, try pink
          const pinkMatch = findMatchingAnswer(
            pinkBuzz.answer,
            state.boardAnswers
          );
          if (pinkMatch !== -1) {
            winner = 'pink';
            answerIndex = pinkMatch;
            set((s) => ({
              boardAnswers: s.boardAnswers.map((a, i) =>
                i === pinkMatch
                  ? { ...a, revealed: true, revealedBy: 'pink' }
                  : a
              ),
              faceOffWinner: 'pink',
            }));
          } else {
            // Both wrong, reveal all
            set((s) => ({
              boardAnswers: s.boardAnswers.map((a) => ({
                ...a,
                revealed: true,
              })),
              faceOffWinner: null,
            }));
          }
        }
      }
    }

    return { winner, answerIndex };
  },

  setFaceOffWinner: (team) => set({ faceOffWinner: team }),

  // --- Board Play ---
  startBoardPlay: (team) => {
    const state = get();
    const teamPlayers = state.players.filter((p) => p.team === team);

    // Sort by ID for determinism
    const sortedPlayerIds = teamPlayers
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((p) => p.id);

    // Find face-off player index
    const faceOffPlayerId =
      team === 'pink'
        ? state.faceOffPinkPlayerId
        : state.faceOffPurplePlayerId;
    const faceOffIndex = sortedPlayerIds.indexOf(faceOffPlayerId!);

    // Start from next player after face-off player
    const startIndex = (faceOffIndex + 1) % sortedPlayerIds.length;

    set({
      phase: 'board-play',
      controllingTeam: team,
      turnOrder: sortedPlayerIds,
      turnIndex: startIndex,
      currentTurnPlayerId: sortedPlayerIds[startIndex],
      strikes: 0,
      lastGuess: null,
      lastGuessResult: null,
      timeRemaining: 20,
    });
  },

  makeGuess: (answer) => {
    const state = get();
    const unrevealedAnswers = state.boardAnswers.filter((a) => !a.revealed);
    const match = findMatchingAnswer(
      answer,
      unrevealedAnswers.map((a) => ({ text: a.text, points: a.points }))
    );

    if (match !== -1) {
      // Find actual index in boardAnswers
      let count = 0;
      let actualIndex = -1;
      for (let i = 0; i < state.boardAnswers.length; i++) {
        if (!state.boardAnswers[i].revealed) {
          if (count === match) {
            actualIndex = i;
            break;
          }
          count++;
        }
      }

      set((s) => ({
        boardAnswers: s.boardAnswers.map((a, i) =>
          i === actualIndex
            ? { ...a, revealed: true, revealedBy: s.controllingTeam }
            : a
        ),
        lastGuess: answer,
        lastGuessResult: 'correct',
        timeRemaining: 20,
      }));

      return { correct: true, answerIndex: actualIndex };
    } else {
      set({
        lastGuess: answer,
        lastGuessResult: 'strike',
      });
      return { correct: false, answerIndex: -1 };
    }
  },

  addStrike: () => {
    const state = get();
    const newStrikes = state.strikes + 1;

    if (newStrikes >= 3) {
      // Three strikes, switch to steal
      const otherTeam: FFTeam =
        state.controllingTeam === 'pink' ? 'purple' : 'pink';
      set({
        strikes: newStrikes,
        phase: 'steal-attempt',
        stealingTeam: otherTeam,
        stealAnswer: null,
        stealResult: null,
        timeRemaining: 20,
      });
    } else {
      set({ strikes: newStrikes });
    }
  },

  advanceTurn: () => {
    const state = get();
    const newTurnIndex = (state.turnIndex + 1) % state.turnOrder.length;
    set({
      turnIndex: newTurnIndex,
      currentTurnPlayerId: state.turnOrder[newTurnIndex],
      timeRemaining: 20,
      lastGuess: null,
      lastGuessResult: null,
    });
  },

  revealAnswer: (index, team) => {
    set((state) => ({
      boardAnswers: state.boardAnswers.map((a, i) =>
        i === index ? { ...a, revealed: true, revealedBy: team } : a
      ),
    }));
  },

  isBoardCleared: () => {
    const state = get();
    return state.boardAnswers.every((a) => a.revealed);
  },

  // --- Steal ---
  startStealAttempt: () => {
    const state = get();
    const otherTeam: FFTeam =
      state.controllingTeam === 'pink' ? 'purple' : 'pink';
    set({
      phase: 'steal-attempt',
      stealingTeam: otherTeam,
      stealAnswer: null,
      stealResult: null,
      timeRemaining: 20,
    });
  },

  attemptSteal: (answer) => {
    const state = get();
    const unrevealedAnswers = state.boardAnswers.filter((a) => !a.revealed);
    const match = findMatchingAnswer(
      answer,
      unrevealedAnswers.map((a) => ({ text: a.text, points: a.points }))
    );

    if (match !== -1) {
      // Find actual index in boardAnswers
      let count = 0;
      let actualIndex = -1;
      for (let i = 0; i < state.boardAnswers.length; i++) {
        if (!state.boardAnswers[i].revealed) {
          if (count === match) {
            actualIndex = i;
            break;
          }
          count++;
        }
      }

      set((s) => ({
        boardAnswers: s.boardAnswers.map((a, i) =>
          i === actualIndex
            ? { ...a, revealed: true, revealedBy: s.stealingTeam }
            : a
        ),
        stealAnswer: answer,
        stealResult: 'success',
      }));

      return { correct: true, answerIndex: actualIndex };
    } else {
      set({
        stealAnswer: answer,
        stealResult: 'fail',
      });
      return { correct: false, answerIndex: -1 };
    }
  },

  resolveSteal: (success) => {
    set(() => ({
      stealResult: success ? 'success' : 'fail',
      phase: 'round-results',
      timeRemaining: 0,
    }));
  },

  // --- Round Flow ---
  awardRoundPoints: () => {
    set((state) => {
      const points = state.boardAnswers.reduce((sum, a) => {
        if (a.revealed) {
          return sum + a.points;
        }
        return sum;
      }, 0);

      // Determine winning team
      let winner: FFTeam | null = null;
      if (state.stealingTeam && state.stealResult === 'success') {
        winner = state.stealingTeam;
      } else if (state.controllingTeam) {
        winner = state.controllingTeam;
      }

      // Award points
      if (winner === 'pink') {
        return {
          roundPoints: points,
          roundWinnerTeam: 'pink',
          pinkScore: state.pinkScore + points,
        };
      } else if (winner === 'purple') {
        return {
          roundPoints: points,
          roundWinnerTeam: 'purple',
          purpleScore: state.purpleScore + points,
        };
      }

      return state;
    });
  },

  startRoundResults: () => {
    set({ phase: 'round-results' });
  },

  nextRound: () => {
    const state = get();

    if (state.currentRound >= state.maxRounds) {
      get().endGame();
      return;
    }

    set({
      currentRound: state.currentRound + 1,
      phase: 'face-off',
      currentQuestion: null,
      boardAnswers: [],
      faceOffBuzzes: {},
      faceOffLocked: {},
      controllingTeam: null,
      strikes: 0,
      stealingTeam: null,
      stealAnswer: null,
      stealResult: null,
      roundPoints: 0,
      roundWinnerTeam: null,
    });

    get().startFaceOff();
  },

  endGame: () => {
    const state = get();
    const winner: FFTeam | null =
      state.pinkScore > state.purpleScore
        ? 'pink'
        : state.purpleScore > state.pinkScore
          ? 'purple'
          : null;

    set({
      phase: 'game-over',
      winnerTeam: winner,
    });
  },

  // --- Timer ---
  setTimeRemaining: (time) => set({ timeRemaining: time }),
  decrementTime: () =>
    set((state) => ({
      timeRemaining: Math.max(0, state.timeRemaining - 1),
    })),

  // --- Helpers ---
  getTeamPlayers: (team) => {
    const state = get();
    return state.players.filter((p) => p.team === team);
  },

  getPinkPlayers: () => {
    const state = get();
    return state.players.filter((p) => p.team === 'pink');
  },

  getPurplePlayers: () => {
    const state = get();
    return state.players.filter((p) => p.team === 'purple');
  },

  getTeamScore: (team) => {
    const state = get();
    return team === 'pink' ? state.pinkScore : state.purpleScore;
  },

  // --- State Sync ---
  getFullState: () => {
    const state = get();
    // Return all state except functions
    return {
      roomCode: state.roomCode,
      players: state.players,
      currentPlayerId: state.currentPlayerId,
      pinkTeamName: state.pinkTeamName,
      purpleTeamName: state.purpleTeamName,
      pinkScore: state.pinkScore,
      purpleScore: state.purpleScore,
      maxRounds: state.maxRounds,
      currentRound: state.currentRound,
      phase: state.phase,
      timeRemaining: state.timeRemaining,
      currentQuestion: state.currentQuestion,
      boardAnswers: state.boardAnswers,
      usedQuestionIds: state.usedQuestionIds,
      faceOffPinkPlayerId: state.faceOffPinkPlayerId,
      faceOffPurplePlayerId: state.faceOffPurplePlayerId,
      faceOffBuzzes: state.faceOffBuzzes,
      faceOffWinner: state.faceOffWinner,
      faceOffLocked: state.faceOffLocked,
      controllingTeam: state.controllingTeam,
      strikes: state.strikes,
      currentTurnPlayerId: state.currentTurnPlayerId,
      turnOrder: state.turnOrder,
      turnIndex: state.turnIndex,
      lastGuess: state.lastGuess,
      lastGuessResult: state.lastGuessResult,
      stealingTeam: state.stealingTeam,
      stealAnswer: state.stealAnswer,
      stealResult: state.stealResult,
      roundPoints: state.roundPoints,
      roundWinnerTeam: state.roundWinnerTeam,
      winnerTeam: state.winnerTeam,
      usedFaceOffPink: state.usedFaceOffPink,
      usedFaceOffPurple: state.usedFaceOffPurple,
    };
  },

  setFullState: (state) => set(state),

  // --- Reset ---
  resetGame: () =>
    set({
      ...initialState,
      roomCode: get().roomCode,
    }),
}));

export default useFamilyFeudStore;
