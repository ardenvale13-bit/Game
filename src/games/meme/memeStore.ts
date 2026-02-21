// Make It Meme - Game Store (Zustand)
// Host-authoritative: host manages templates, rounds, vote tallying
// Flow: captioning → voting → results → (repeat) → game-over
import { create } from 'zustand';

export type MemePhase = 'captioning' | 'voting' | 'results' | 'game-over';

export interface MemePlayer {
  id: string;
  name: string;
  avatarId: string;
  avatarFilename: string;
  isHost: boolean;
  score: number;
  caption: string | null;       // This player's caption for current round
  votedForPlayerId: string | null; // Who this player voted for
}

export interface MemeRoundResult {
  round: number;
  templateId: string;
  templateSrc: string;
  captions: Record<string, string>;     // playerId -> caption
  votes: Record<string, string[]>;      // targetPlayerId -> voterIds[]
  winnerId: string;
  winnerCaption: string;
  winnerVotes: number;
}

interface MemeState {
  players: MemePlayer[];
  phase: MemePhase;
  currentRound: number;
  maxRounds: number;
  currentTemplateId: string;
  currentTemplateSrc: string;
  currentTemplateIsGif: boolean;
  currentTemplateCaptionPos: 'top' | 'bottom' | 'both';
  timeRemaining: number;
  captionTime: number;     // seconds for captioning
  votingTime: number;      // seconds for voting
  resultsTime: number;     // seconds to show results
  usedTemplateIds: Set<string>;
  roundResults: MemeRoundResult[];
}

interface MemeActions {
  // Setup
  initFromLobby: (players: { id: string; name: string; avatarId: string; avatarFilename: string; isHost: boolean }[]) => void;
  setMaxRounds: (rounds: number) => void;

  // Game flow (host actions)
  startCaptionPhase: (templateId: string, templateSrc: string, isGif: boolean, captionPos: 'top' | 'bottom' | 'both') => void;
  submitCaption: (playerId: string, caption: string) => void;
  startVotingPhase: () => void;
  castVote: (voterId: string, targetPlayerId: string) => void;
  revealResults: () => void;
  endGame: () => void;
  tickTimer: () => number;

  // Getters
  allCaptionsIn: () => boolean;
  allVotesIn: () => boolean;
  getCaptions: () => { playerId: string; playerName: string; caption: string }[];
  getVoteCounts: () => Record<string, number>;
  getMostVoted: () => { playerId: string; votes: number; caption: string } | null;
  getFinalLeaderboard: () => MemePlayer[];

  // Full state (for sync)
  getFullState: () => MemeState;
  setFullState: (state: Partial<MemeState>) => void;

  // Reset
  reset: () => void;
}

const initialState: MemeState = {
  players: [],
  phase: 'captioning',
  currentRound: 0,
  maxRounds: 8,
  currentTemplateId: '',
  currentTemplateSrc: '',
  currentTemplateIsGif: false,
  currentTemplateCaptionPos: 'bottom',
  timeRemaining: 30,
  captionTime: 30,
  votingTime: 20,
  resultsTime: 8,
  usedTemplateIds: new Set(),
  roundResults: [],
};

const useMemeStore = create<MemeState & MemeActions>((set, get) => ({
  ...initialState,

  initFromLobby: (lobbyPlayers) => {
    const players: MemePlayer[] = lobbyPlayers.map(p => ({
      ...p,
      score: 0,
      caption: null,
      votedForPlayerId: null,
    }));
    set({ ...initialState, players });
  },

  setMaxRounds: (rounds) => set({ maxRounds: rounds }),

  startCaptionPhase: (templateId, templateSrc, isGif, captionPos) => {
    const state = get();
    const usedTemplateIds = new Set(state.usedTemplateIds);
    usedTemplateIds.add(templateId);

    set({
      currentRound: state.currentRound + 1,
      currentTemplateId: templateId,
      currentTemplateSrc: templateSrc,
      currentTemplateIsGif: isGif,
      currentTemplateCaptionPos: captionPos,
      phase: 'captioning',
      timeRemaining: state.captionTime,
      usedTemplateIds,
      players: state.players.map(p => ({ ...p, caption: null, votedForPlayerId: null })),
    });
  },

  submitCaption: (playerId, caption) => {
    set((state) => ({
      players: state.players.map(p =>
        p.id === playerId ? { ...p, caption } : p
      ),
    }));
  },

  allCaptionsIn: () => {
    return get().players.every(p => p.caption !== null);
  },

  startVotingPhase: () => {
    set((state) => ({
      phase: 'voting',
      timeRemaining: state.votingTime,
    }));
  },

  castVote: (voterId, targetPlayerId) => {
    set((state) => ({
      players: state.players.map(p =>
        p.id === voterId ? { ...p, votedForPlayerId: targetPlayerId } : p
      ),
    }));
  },

  allVotesIn: () => {
    return get().players.every(p => p.votedForPlayerId !== null);
  },

  getCaptions: () => {
    return get().players
      .filter(p => p.caption !== null)
      .map(p => ({ playerId: p.id, playerName: p.name, caption: p.caption! }));
  },

  getVoteCounts: () => {
    const state = get();
    const counts: Record<string, number> = {};
    state.players.forEach(p => { counts[p.id] = 0; });
    state.players.forEach(p => {
      if (p.votedForPlayerId) {
        counts[p.votedForPlayerId] = (counts[p.votedForPlayerId] || 0) + 1;
      }
    });
    return counts;
  },

  getMostVoted: () => {
    const state = get();
    const counts = get().getVoteCounts();
    let best = { playerId: '', votes: 0, caption: '' };
    Object.entries(counts).forEach(([id, v]) => {
      if (v > best.votes) {
        const player = state.players.find(p => p.id === id);
        best = { playerId: id, votes: v, caption: player?.caption || '' };
      }
    });
    return best.votes > 0 ? best : null;
  },

  revealResults: () => {
    const state = get();

    // Build votes map: targetPlayerId -> voterIds[]
    const votes: Record<string, string[]> = {};
    state.players.forEach(p => { votes[p.id] = []; });
    state.players.forEach(p => {
      if (p.votedForPlayerId) {
        if (!votes[p.votedForPlayerId]) votes[p.votedForPlayerId] = [];
        votes[p.votedForPlayerId].push(p.id);
      }
    });

    // Find winner
    let winnerId = '';
    let winnerVotes = 0;
    Object.entries(votes).forEach(([playerId, voters]) => {
      if (voters.length > winnerVotes) {
        winnerId = playerId;
        winnerVotes = voters.length;
      }
    });

    const winnerPlayer = state.players.find(p => p.id === winnerId);

    // Build captions map
    const captions: Record<string, string> = {};
    state.players.forEach(p => {
      if (p.caption) captions[p.id] = p.caption;
    });

    // Update scores: +1 per vote received
    const players = state.players.map(p => {
      const votesReceived = votes[p.id]?.length ?? 0;
      return { ...p, score: p.score + votesReceived };
    });

    const result: MemeRoundResult = {
      round: state.currentRound,
      templateId: state.currentTemplateId,
      templateSrc: state.currentTemplateSrc,
      captions,
      votes,
      winnerId,
      winnerCaption: winnerPlayer?.caption || '',
      winnerVotes,
    };

    set({
      phase: 'results',
      timeRemaining: state.resultsTime,
      players,
      roundResults: [...state.roundResults, result],
    });
  },

  endGame: () => set({ phase: 'game-over' }),

  tickTimer: () => {
    const state = get();
    const next = state.timeRemaining - 1;
    set({ timeRemaining: Math.max(0, next) });
    return next;
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
      currentTemplateId: s.currentTemplateId,
      currentTemplateSrc: s.currentTemplateSrc,
      currentTemplateIsGif: s.currentTemplateIsGif,
      currentTemplateCaptionPos: s.currentTemplateCaptionPos,
      timeRemaining: s.timeRemaining,
      captionTime: s.captionTime,
      votingTime: s.votingTime,
      resultsTime: s.resultsTime,
      usedTemplateIds: s.usedTemplateIds,
      roundResults: s.roundResults,
    };
  },

  setFullState: (incoming) => {
    set((state) => ({
      ...state,
      ...incoming,
      usedTemplateIds: incoming.usedTemplateIds
        ? new Set(incoming.usedTemplateIds)
        : state.usedTemplateIds,
    }));
  },

  reset: () => set(initialState),
}));

export default useMemeStore;
