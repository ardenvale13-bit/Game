// Would You Rather - Game Store (Zustand)
// Host-authoritative: host manages prompts, rounds, vote tallying
import { create } from 'zustand';
import type { WYRPrompt } from './wyrData';

export type WYRPhase = 'voting' | 'results' | 'game-over';

export interface WYRPlayer {
  id: string;
  name: string;
  avatarId: string;
  avatarFilename: string;
  isHost: boolean;
  score: number;
  vote: 'A' | 'B' | null;
}

export interface WYRRoundResult {
  round: number;
  prompt: WYRPrompt;
  votesA: string[];
  votesB: string[];
  majorityOption: 'A' | 'B';
}

interface WYRState {
  players: WYRPlayer[];
  phase: WYRPhase;
  currentRound: number;
  maxRounds: number;
  currentPrompt: WYRPrompt | null;
  timeRemaining: number;
  votingTime: number;
  resultsTime: number;
  usedPromptIndices: Set<number>;
  roundResults: WYRRoundResult[];
}

interface WYRActions {
  // Setup
  initFromLobby: (players: { id: string; name: string; avatarId: string; avatarFilename: string; isHost: boolean }[]) => void;
  setMaxRounds: (rounds: number) => void;

  // Game flow (host actions)
  startGame: () => void;
  startRound: (prompt: WYRPrompt, promptIndex: number) => void;
  castVote: (voterId: string, option: 'A' | 'B') => void;
  revealResults: () => void;
  nextRound: () => void;
  endGame: () => void;
  tickTimer: () => number;

  // Getters
  getVoteCounts: () => { A: number; B: number };
  getVotersForOption: (option: 'A' | 'B') => string[];
  allVotesIn: () => boolean;
  getMajority: () => 'A' | 'B' | null;
  getFinalLeaderboard: () => WYRPlayer[];

  // Full state (for sync)
  getFullState: () => WYRState;
  setFullState: (state: Partial<WYRState>) => void;

  // Reset
  reset: () => void;
}

const initialState: WYRState = {
  players: [],
  phase: 'voting',
  currentRound: 0,
  maxRounds: 10,
  currentPrompt: null,
  timeRemaining: 30,
  votingTime: 30,
  resultsTime: 8,
  usedPromptIndices: new Set(),
  roundResults: [],
};

const useWYRStore = create<WYRState & WYRActions>((set, get) => ({
  ...initialState,

  initFromLobby: (lobbyPlayers) => {
    const players: WYRPlayer[] = lobbyPlayers.map(p => ({
      ...p,
      score: 0,
      vote: null,
    }));
    set({ ...initialState, players });
  },

  setMaxRounds: (rounds) => set({ maxRounds: rounds }),

  startGame: () => set({ phase: 'voting', currentRound: 0 }),

  startRound: (prompt, promptIndex) => {
    const state = get();
    const usedPromptIndices = new Set(state.usedPromptIndices);
    usedPromptIndices.add(promptIndex);

    set({
      currentRound: state.currentRound + 1,
      currentPrompt: prompt,
      phase: 'voting',
      timeRemaining: state.votingTime,
      usedPromptIndices,
      players: state.players.map(p => ({ ...p, vote: null })),
    });
  },

  castVote: (voterId, option) => {
    set((state) => ({
      players: state.players.map(p =>
        p.id === voterId ? { ...p, vote: option } : p
      ),
    }));
  },

  allVotesIn: () => {
    const state = get();
    return state.players.every(p => p.vote !== null);
  },

  revealResults: () => {
    const state = get();
    if (!state.currentPrompt) return;

    // Tally votes
    const votesA: string[] = [];
    const votesB: string[] = [];

    state.players.forEach(p => {
      if (p.vote === 'A') votesA.push(p.id);
      else if (p.vote === 'B') votesB.push(p.id);
    });

    // Determine majority
    const majorityOption = votesA.length > votesB.length ? 'A' : votesB.length > votesA.length ? 'B' : (votesA.length > 0 ? 'A' : 'B');

    // Update scores (+1 for being in majority)
    const players = state.players.map(p => {
      const inMajority = (majorityOption === 'A' && p.vote === 'A') || (majorityOption === 'B' && p.vote === 'B');
      return {
        ...p,
        score: p.score + (inMajority ? 1 : 0),
      };
    });

    const result: WYRRoundResult = {
      round: state.currentRound,
      prompt: state.currentPrompt,
      votesA,
      votesB,
      majorityOption,
    };

    set({
      phase: 'results',
      timeRemaining: state.resultsTime,
      players,
      roundResults: [...state.roundResults, result],
    });
  },

  nextRound: () => {
    const state = get();
    if (state.currentRound >= state.maxRounds) {
      set({ phase: 'game-over' });
      return;
    }
  },

  endGame: () => set({ phase: 'game-over' }),

  tickTimer: () => {
    const state = get();
    const next = state.timeRemaining - 1;
    set({ timeRemaining: Math.max(0, next) });
    return next;
  },

  getVoteCounts: () => {
    const state = get();
    let countA = 0;
    let countB = 0;
    state.players.forEach(p => {
      if (p.vote === 'A') countA++;
      else if (p.vote === 'B') countB++;
    });
    return { A: countA, B: countB };
  },

  getVotersForOption: (option) => {
    const state = get();
    return state.players
      .filter(p => p.vote === option)
      .map(p => p.id);
  },

  getMajority: () => {
    const counts = get().getVoteCounts();
    if (counts.A > counts.B) return 'A';
    if (counts.B > counts.A) return 'B';
    return null;
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
      currentPrompt: s.currentPrompt,
      timeRemaining: s.timeRemaining,
      votingTime: s.votingTime,
      resultsTime: s.resultsTime,
      usedPromptIndices: s.usedPromptIndices,
      roundResults: s.roundResults,
    };
  },

  setFullState: (incoming) => {
    set((state) => ({
      ...state,
      ...incoming,
      usedPromptIndices: incoming.usedPromptIndices
        ? new Set(incoming.usedPromptIndices)
        : state.usedPromptIndices,
    }));
  },

  reset: () => set(initialState),
}));

export default useWYRStore;
