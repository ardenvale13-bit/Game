// Codenames — Game Store (Zustand)
import { create } from 'zustand';
import type { CodenamesCard, TeamColor, PlayerRole, CardType } from './codenamesData';
import { generateBoard, countRemaining, pickStartingTeam } from './codenamesData';

export type CodenamesPhase = 'lobby' | 'team-setup' | 'spymaster-clue' | 'operative-guess' | 'game-over';

export interface CodenamesPlayer {
  id: string;
  name: string;
  avatarId: string;
  avatarFilename: string;
  isHost: boolean;
  team: TeamColor | null;
  role: PlayerRole | null;
}

export interface Clue {
  word: string;
  number: number; // 0 = unlimited
  team: TeamColor;
}

export interface CodenamesGameState {
  roomCode: string | null;
  players: CodenamesPlayer[];
  currentPlayerId: string | null;

  phase: CodenamesPhase;
  board: CodenamesCard[];
  startingTeam: TeamColor;
  currentTeam: TeamColor;
  currentClue: Clue | null;
  guessesRemaining: number;
  clueHistory: Clue[];

  pinkRemaining: number;
  blueRemaining: number;
  winner: TeamColor | null;
  winReason: 'cards' | 'assassin' | null;

  timerEnabled: boolean;
  timeRemaining: number;
  clueTime: number;
  guessTime: number;
}

interface CodenamesActions {
  // Setup
  setRoomCode: (code: string) => void;
  setCurrentPlayer: (id: string) => void;
  addPlayer: (player: Omit<CodenamesPlayer, 'team' | 'role'>) => void;

  // Team setup
  setPlayerTeamRole: (playerId: string, team: TeamColor, role: PlayerRole) => void;
  clearPlayerTeamRole: (playerId: string) => void;
  canStartGame: () => boolean;

  // Game flow
  startGame: () => void;
  submitClue: (word: string, number: number) => void;
  voteCard: (playerId: string, cardIndex: number) => void;
  unvoteCard: (playerId: string, cardIndex: number) => void;
  lockCard: (playerId: string, cardIndex: number) => CardType | null;
  endTurn: () => void;

  // Timer
  setTimerEnabled: (enabled: boolean) => void;
  decrementTime: () => void;
  setTimeRemaining: (t: number) => void;

  // Helpers
  getCurrentPlayer: () => CodenamesPlayer | undefined;
  isSpymaster: (playerId: string) => boolean;
  getTeamPlayers: (team: TeamColor) => CodenamesPlayer[];

  resetGame: () => void;
}

const CLUE_TIME = 120;
const GUESS_TIME = 90;

const initialState: CodenamesGameState = {
  roomCode: null,
  players: [],
  currentPlayerId: null,
  phase: 'lobby',
  board: [],
  startingTeam: 'pink',
  currentTeam: 'pink',
  currentClue: null,
  guessesRemaining: 0,
  clueHistory: [],
  pinkRemaining: 0,
  blueRemaining: 0,
  winner: null,
  winReason: null,
  timerEnabled: false,
  timeRemaining: 0,
  clueTime: CLUE_TIME,
  guessTime: GUESS_TIME,
};

const useCodenamesStore = create<CodenamesGameState & CodenamesActions>((set, get) => ({
  ...initialState,

  // --- Setup ---
  setRoomCode: (code) => set({ roomCode: code }),
  setCurrentPlayer: (id) => set({ currentPlayerId: id }),

  addPlayer: (data) => {
    const player: CodenamesPlayer = { ...data, team: null, role: null };
    set((s) => ({ players: [...s.players, player] }));
  },

  // --- Team setup ---
  setPlayerTeamRole: (playerId, team, role) => {
    set((s) => {
      // Check capacity
      const teamPlayers = s.players.filter(p => p.team === team && p.role === role && p.id !== playerId);
      const maxForRole = role === 'spymaster' ? 2 : 7;
      if (teamPlayers.length >= maxForRole) return s;

      return {
        players: s.players.map(p =>
          p.id === playerId ? { ...p, team, role } : p
        ),
      };
    });
  },

  clearPlayerTeamRole: (playerId) => {
    set((s) => ({
      players: s.players.map(p =>
        p.id === playerId ? { ...p, team: null, role: null } : p
      ),
    }));
  },

  canStartGame: () => {
    const s = get();
    const pink = s.players.filter(p => p.team === 'pink');
    const blue = s.players.filter(p => p.team === 'blue');
    const pinkSpy = pink.filter(p => p.role === 'spymaster');
    const pinkOps = pink.filter(p => p.role === 'operative');
    const blueSpy = blue.filter(p => p.role === 'spymaster');
    const blueOps = blue.filter(p => p.role === 'operative');
    return pinkSpy.length >= 1 && pinkOps.length >= 1 && blueSpy.length >= 1 && blueOps.length >= 1;
  },

  // --- Game flow ---
  startGame: () => {
    const s = get();
    const starting = pickStartingTeam();
    const board = generateBoard(starting);
    set({
      phase: 'spymaster-clue',
      board,
      startingTeam: starting,
      currentTeam: starting,
      currentClue: null,
      guessesRemaining: 0,
      clueHistory: [],
      pinkRemaining: countRemaining(board, 'pink'),
      blueRemaining: countRemaining(board, 'blue'),
      winner: null,
      winReason: null,
      timeRemaining: s.timerEnabled ? s.clueTime : 0,
    });
  },

  submitClue: (word, number) => {
    const s = get();
    const clue: Clue = { word: word.toUpperCase(), number, team: s.currentTeam };
    set({
      currentClue: clue,
      guessesRemaining: number === 0 ? 25 : number + 1, // 0 = unlimited
      clueHistory: [...s.clueHistory, clue],
      phase: 'operative-guess',
      timeRemaining: s.timerEnabled ? s.guessTime : 0,
      // Clear all votes when moving to guessing phase
      board: s.board.map(c => ({ ...c, votes: [] })),
    });
  },

  voteCard: (playerId, cardIndex) => {
    set((s) => ({
      board: s.board.map((c, i) => {
        if (i !== cardIndex || c.isRevealed) return c;
        // Remove vote from any other card first
        const withoutVote = s.board.map(card => ({
          ...card,
          votes: card.votes.filter(v => v.playerId !== playerId),
        }));
        // Add vote to this card
        const player = s.players.find(p => p.id === playerId);
        if (!player) return c;
        return {
          ...withoutVote[i],
          votes: [...withoutVote[i].votes, { playerId, avatarFilename: player.avatarFilename }],
        };
      }),
    }));

    // Cleaner approach: remove from all, add to target
    const state = get();
    const player = state.players.find(p => p.id === playerId);
    if (!player) return;
    const newBoard = state.board.map((c, i) => {
      const filteredVotes = c.votes.filter(v => v.playerId !== playerId);
      if (i === cardIndex && !c.isRevealed) {
        return { ...c, votes: [...filteredVotes, { playerId, avatarFilename: player.avatarFilename }] };
      }
      return { ...c, votes: filteredVotes };
    });
    set({ board: newBoard });
  },

  unvoteCard: (playerId, cardIndex) => {
    set((s) => ({
      board: s.board.map((c, i) =>
        i === cardIndex
          ? { ...c, votes: c.votes.filter(v => v.playerId !== playerId) }
          : c
      ),
    }));
  },

  lockCard: (_playerId, cardIndex) => {
    const s = get();
    const card = s.board[cardIndex];
    if (!card || card.isRevealed) return null;

    // Reveal the card
    const newBoard = s.board.map((c, i) =>
      i === cardIndex ? { ...c, isRevealed: true, votes: [] } : c
    );

    const pinkRemaining = countRemaining(newBoard, 'pink');
    const blueRemaining = countRemaining(newBoard, 'blue');

    // Check outcomes
    if (card.type === 'assassin') {
      // Assassin — other team wins
      const otherTeam: TeamColor = s.currentTeam === 'pink' ? 'blue' : 'pink';
      set({
        board: newBoard,
        pinkRemaining,
        blueRemaining,
        winner: otherTeam,
        winReason: 'assassin',
        phase: 'game-over',
      });
      return card.type;
    }

    if (pinkRemaining === 0) {
      set({ board: newBoard, pinkRemaining, blueRemaining, winner: 'pink', winReason: 'cards', phase: 'game-over' });
      return card.type;
    }
    if (blueRemaining === 0) {
      set({ board: newBoard, pinkRemaining, blueRemaining, winner: 'blue', winReason: 'cards', phase: 'game-over' });
      return card.type;
    }

    // Wrong card (neutral or other team) — end turn
    if (card.type !== s.currentTeam) {
      const nextTeam: TeamColor = s.currentTeam === 'pink' ? 'blue' : 'pink';
      set({
        board: newBoard,
        pinkRemaining,
        blueRemaining,
        guessesRemaining: 0,
        currentTeam: nextTeam,
        currentClue: null,
        phase: 'spymaster-clue',
        timeRemaining: s.timerEnabled ? s.clueTime : 0,
      });
      return card.type;
    }

    // Correct card — decrement guesses
    const remaining = s.guessesRemaining - 1;
    if (remaining <= 0) {
      // Out of guesses — switch turn
      const nextTeam: TeamColor = s.currentTeam === 'pink' ? 'blue' : 'pink';
      set({
        board: newBoard,
        pinkRemaining,
        blueRemaining,
        guessesRemaining: 0,
        currentTeam: nextTeam,
        currentClue: null,
        phase: 'spymaster-clue',
        timeRemaining: s.timerEnabled ? s.clueTime : 0,
      });
    } else {
      set({
        board: newBoard,
        pinkRemaining,
        blueRemaining,
        guessesRemaining: remaining,
      });
    }

    return card.type;
  },

  endTurn: () => {
    const s = get();
    const nextTeam: TeamColor = s.currentTeam === 'pink' ? 'blue' : 'pink';
    set({
      currentTeam: nextTeam,
      currentClue: null,
      guessesRemaining: 0,
      phase: 'spymaster-clue',
      timeRemaining: s.timerEnabled ? s.clueTime : 0,
      board: s.board.map(c => ({ ...c, votes: [] })),
    });
  },

  // --- Timer ---
  setTimerEnabled: (enabled) => set({ timerEnabled: enabled }),
  decrementTime: () => set((s) => ({ timeRemaining: Math.max(0, s.timeRemaining - 1) })),
  setTimeRemaining: (t) => set({ timeRemaining: t }),

  // --- Helpers ---
  getCurrentPlayer: () => {
    const s = get();
    return s.players.find(p => p.id === s.currentPlayerId);
  },

  isSpymaster: (playerId) => {
    const s = get();
    const player = s.players.find(p => p.id === playerId);
    return player?.role === 'spymaster';
  },

  getTeamPlayers: (team) => {
    const s = get();
    return s.players.filter(p => p.team === team);
  },

  resetGame: () => set({ ...initialState, roomCode: get().roomCode }),
}));

export default useCodenamesStore;
