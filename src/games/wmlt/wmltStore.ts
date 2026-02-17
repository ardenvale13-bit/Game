// Who's Most Likely To - Game Store (Zustand)
// Host-authoritative: host manages prompts, rounds, vote tallying
import { create } from 'zustand';

export type WMLTPhase = 'voting' | 'results' | 'game-over';

export interface WMLTPlayer {
  id: string;
  name: string;
  avatarId: string;
  avatarFilename: string;
  isHost: boolean;
  score: number;       // Total votes received across all rounds
  votedFor: string | null; // Who this player voted for this round
}

export interface WMLTRoundResult {
  round: number;
  prompt: string;
  votes: Record<string, string[]>; // targetId -> list of voterIds
  winnerId: string;                // Most voted
  winnerVotes: number;
}

interface WMLTState {
  players: WMLTPlayer[];
  phase: WMLTPhase;
  currentRound: number;
  maxRounds: number;
  currentPrompt: string;
  timeRemaining: number;
  votingTime: number;     // seconds per round
  resultsTime: number;    // seconds to show results
  usedPromptIndices: Set<number>;
  roundResults: WMLTRoundResult[];
}

interface WMLTActions {
  // Setup
  initFromLobby: (players: { id: string; name: string; avatarId: string; avatarFilename: string; isHost: boolean }[]) => void;
  setMaxRounds: (rounds: number) => void;

  // Game flow (host actions)
  startGame: () => void;
  startRound: (prompt: string, promptIndex: number) => void;
  castVote: (voterId: string, targetId: string) => void;
  revealResults: () => void;
  nextRound: () => void;
  endGame: () => void;
  tickTimer: () => number;

  // Getters
  getVoteCounts: () => Record<string, number>;
  getVoterNames: (targetId: string) => string[];
  allVotesIn: () => boolean;
  getMostVoted: () => { playerId: string; votes: number } | null;
  getFinalLeaderboard: () => WMLTPlayer[];

  // Full state (for sync)
  getFullState: () => WMLTState;
  setFullState: (state: Partial<WMLTState>) => void;

  // Reset
  reset: () => void;
}

const initialState: WMLTState = {
  players: [],
  phase: 'voting',
  currentRound: 0,
  maxRounds: 10,
  currentPrompt: '',
  timeRemaining: 20,
  votingTime: 20,
  resultsTime: 8,
  usedPromptIndices: new Set(),
  roundResults: [],
};

const useWMLTStore = create<WMLTState & WMLTActions>((set, get) => ({
  ...initialState,

  initFromLobby: (lobbyPlayers) => {
    const players: WMLTPlayer[] = lobbyPlayers.map(p => ({
      ...p,
      score: 0,
      votedFor: null,
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
      players: state.players.map(p => ({ ...p, votedFor: null })),
    });
  },

  castVote: (voterId, targetId) => {
    set((state) => ({
      players: state.players.map(p =>
        p.id === voterId ? { ...p, votedFor: targetId } : p
      ),
    }));
  },

  allVotesIn: () => {
    const state = get();
    return state.players.every(p => p.votedFor !== null);
  },

  revealResults: () => {
    const state = get();
    // Tally votes
    const votes: Record<string, string[]> = {};
    state.players.forEach(p => {
      if (!votes[p.id]) votes[p.id] = [];
    });
    state.players.forEach(p => {
      if (p.votedFor) {
        if (!votes[p.votedFor]) votes[p.votedFor] = [];
        votes[p.votedFor].push(p.id);
      }
    });

    // Find most voted
    let winnerId = '';
    let winnerVotes = 0;
    Object.entries(votes).forEach(([playerId, voters]) => {
      if (voters.length > winnerVotes) {
        winnerId = playerId;
        winnerVotes = voters.length;
      }
    });

    // Update scores
    const players = state.players.map(p => {
      const votesReceived = votes[p.id]?.length ?? 0;
      return { ...p, score: p.score + votesReceived };
    });

    const result: WMLTRoundResult = {
      round: state.currentRound,
      prompt: state.currentPrompt,
      votes,
      winnerId,
      winnerVotes,
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
    // Round start will be triggered by wrapper
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
    const counts: Record<string, number> = {};
    state.players.forEach(p => { counts[p.id] = 0; });
    state.players.forEach(p => {
      if (p.votedFor) {
        counts[p.votedFor] = (counts[p.votedFor] || 0) + 1;
      }
    });
    return counts;
  },

  getVoterNames: (targetId) => {
    const state = get();
    return state.players
      .filter(p => p.votedFor === targetId)
      .map(p => p.name);
  },

  getMostVoted: () => {
    const counts = get().getVoteCounts();
    let best = { playerId: '', votes: 0 };
    Object.entries(counts).forEach(([id, v]) => {
      if (v > best.votes) best = { playerId: id, votes: v };
    });
    return best.votes > 0 ? best : null;
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

export default useWMLTStore;
