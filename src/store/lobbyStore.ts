// Unified Lobby Store - Shared across all games
import { create } from 'zustand';

export interface Player {
  id: string;
  name: string;
  avatarId: string;
  avatarFilename: string;
  isHost: boolean;
  score: number; // Persists across games in same session
}

export type GameType = 'pictionary' | 'cah' | 'codenames' | null;

interface LobbyState {
  // Room
  roomCode: string | null;
  roomName: string | null;

  // Players
  players: Player[];
  currentPlayerId: string | null;

  // Game selection
  selectedGame: GameType;
  isInGame: boolean;

  // Game settings
  roundCount: number; // For Pictionary: 3, 5, or 10
}

interface LobbyActions {
  // Room setup
  setRoomCode: (code: string) => void;
  setRoomName: (name: string) => void;

  // Player management
  setCurrentPlayer: (id: string) => void;
  addPlayer: (player: Omit<Player, 'score'>) => void;
  removePlayer: (id: string) => void;
  setPlayers: (players: Player[]) => void;
  updatePlayerScore: (id: string, points: number) => void;
  resetScores: () => void;

  // Game selection & settings
  selectGame: (game: GameType) => void;
  setRoundCount: (count: number) => void;
  startGame: () => void;
  endGame: () => void;

  // Full reset
  leaveLobby: () => void;

  // Helpers
  isHost: () => boolean;
  canStartGame: () => boolean;
  getCurrentPlayer: () => Player | undefined;
  getLeaderboard: () => Player[];
}

const initialState: LobbyState = {
  roomCode: null,
  roomName: null,
  players: [],
  currentPlayerId: null,
  selectedGame: null,
  isInGame: false,
  roundCount: 3,
};

const useLobbyStore = create<LobbyState & LobbyActions>((set, get) => ({
  ...initialState,

  // Room setup
  setRoomCode: (code) => set({ roomCode: code }),
  setRoomName: (name) => set({ roomName: name }),

  // Player management
  setCurrentPlayer: (id) => set({ currentPlayerId: id }),

  addPlayer: (playerData) => set((state) => {
    // Prevent duplicate players
    if (state.players.find(p => p.id === playerData.id)) return state;
    return { players: [...state.players, { ...playerData, score: 0 }] };
  }),

  removePlayer: (id) => set((state) => ({
    players: state.players.filter(p => p.id !== id),
  })),

  // Sync full player list from Presence
  setPlayers: (players) => set({ players }),

  updatePlayerScore: (id, points) => set((state) => ({
    players: state.players.map(p =>
      p.id === id ? { ...p, score: p.score + points } : p
    ),
  })),

  resetScores: () => set((state) => ({
    players: state.players.map(p => ({ ...p, score: 0 })),
  })),

  // Game selection & settings
  selectGame: (game) => set({ selectedGame: game }),
  setRoundCount: (count) => set({ roundCount: count }),

  startGame: () => set({ isInGame: true }),

  endGame: () => set({ isInGame: false, selectedGame: null }),

  // Full reset (leaving room entirely)
  leaveLobby: () => set(initialState),

  // Helpers
  isHost: () => {
    const state = get();
    const player = state.players.find(p => p.id === state.currentPlayerId);
    return player?.isHost ?? false;
  },

  canStartGame: () => {
    const state = get();
    if (!state.selectedGame) return false;
    if (state.selectedGame === 'cah') return state.players.length >= 3;
    if (state.selectedGame === 'codenames') return state.players.length >= 4;
    return state.players.length >= 2;
  },

  getCurrentPlayer: () => {
    const state = get();
    return state.players.find(p => p.id === state.currentPlayerId);
  },

  getLeaderboard: () => {
    return [...get().players].sort((a, b) => b.score - a.score);
  },
}));

export default useLobbyStore;
