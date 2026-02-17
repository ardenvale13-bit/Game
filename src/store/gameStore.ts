import { create } from 'zustand';
import type { Avatar } from '../data/avatars';
import { getWordSelection } from '../data/wordBank';
import type { Word } from '../data/wordBank';

// Types
export interface Player {
  id: string;
  name: string;
  avatar: Avatar;
  score: number;
  isHost: boolean;
  isDrawing: boolean;
  hasGuessedCorrectly: boolean;
  joinedAt: number;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  content: string;
  isCorrectGuess: boolean;
  isSystemMessage: boolean;
  timestamp: number;
}

export interface DrawCommand {
  type: 'start' | 'draw' | 'end' | 'clear';
  x?: number;
  y?: number;
  color?: string;
  size?: number;
}

export type GamePhase = 
  | 'lobby'           // Waiting for players, host can start
  | 'word-selection'  // Current drawer is picking a word
  | 'drawing'         // Active drawing/guessing
  | 'round-end'       // Show round results
  | 'game-over';      // Final scores

export interface GameSettings {
  roundTime: number;        // Seconds per round (default 80)
  rounds: number;           // Total rounds (default: each player draws once)
  wordSelectionTime: number; // Seconds to pick a word (default 15)
  maxPlayers: number;       // Max players allowed (default 30)
  wordChoices: number;      // Number of words to choose from (3 or 4)
}

export interface GameState {
  // Room info
  roomCode: string | null;
  roomName: string | null;
  isConnected: boolean;
  
  // Players
  players: Player[];
  currentPlayerId: string | null;
  
  // Game state
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  currentDrawerIndex: number;
  
  // Word state
  currentWord: string | null;
  wordOptions: Word[];
  wordHint: string;
  
  // Timer
  timeRemaining: number;
  
  // Drawing
  drawCommands: DrawCommand[];
  canvasSnapshot: string | null; // data URL for undo/redo sync

  // Chat
  messages: ChatMessage[];
  
  // Scoring
  guessOrder: string[]; // Player IDs in order they guessed correctly
  
  // Settings
  settings: GameSettings;
}

interface GameActions {
  // Room actions
  setRoomCode: (code: string) => void;
  setRoomName: (name: string) => void;
  setConnected: (connected: boolean) => void;
  
  // Player actions
  setCurrentPlayer: (id: string) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  setPlayers: (players: Player[]) => void;
  
  // Game flow
  setPhase: (phase: GamePhase) => void;
  startWordSelection: () => void;
  selectWord: (word: string) => void;
  startDrawing: () => void;
  endRound: () => void;
  nextRound: () => void;
  endGame: () => void;
  resetGame: () => void;
  
  // Timer
  setTimeRemaining: (time: number) => void;
  decrementTime: () => void;
  
  // Drawing
  addDrawCommand: (command: DrawCommand) => void;
  clearCanvas: () => void;
  setDrawCommands: (commands: DrawCommand[]) => void;
  
  // Chat/Guessing
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  submitGuess: (playerId: string, playerName: string, guess: string) => boolean;
  
  // Settings
  updateSettings: (settings: Partial<GameSettings>) => void;
  
  // Helpers
  getCurrentDrawer: () => Player | undefined;
  getCurrentPlayer: () => Player | undefined;
  isCurrentPlayerDrawing: () => boolean;
  canStartGame: () => boolean;
  getLeaderboard: () => Player[];
}

const defaultSettings: GameSettings = {
  roundTime: 80,
  rounds: 3, // 3, 5, or 10 rounds
  wordSelectionTime: 15,
  maxPlayers: 30,
  wordChoices: 3, // 3 or 4 words to pick from
};

const initialState: GameState = {
  roomCode: null,
  roomName: null,
  isConnected: false,
  players: [],
  currentPlayerId: null,
  phase: 'lobby',
  currentRound: 0,
  totalRounds: 0,
  currentDrawerIndex: 0,
  currentWord: null,
  wordOptions: [],
  wordHint: '',
  timeRemaining: 0,
  drawCommands: [],
  canvasSnapshot: null,
  messages: [],
  guessOrder: [],
  settings: defaultSettings,
};

// Generate word hint (underscores with spaces)
function generateHint(word: string): string {
  return word.split('').map(char => char === ' ' ? '  ' : '_').join(' ');
}

// Calculate points based on guess order
function calculatePoints(position: number): number {
  const basePoints = 100;
  const decay = Math.max(0.4, 1 - (position * 0.2)); // First gets 100%, decreases by 20%
  return Math.round(basePoints * decay);
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,
  
  // Room actions
  setRoomCode: (code) => set({ roomCode: code }),
  setRoomName: (name) => set({ roomName: name }),
  setConnected: (connected) => set({ isConnected: connected }),
  
  // Player actions
  setCurrentPlayer: (id) => set({ currentPlayerId: id }),
  
  addPlayer: (player) => set((state) => ({
    players: [...state.players, player],
  })),
  
  removePlayer: (playerId) => set((state) => ({
    players: state.players.filter(p => p.id !== playerId),
  })),
  
  updatePlayer: (playerId, updates) => set((state) => ({
    players: state.players.map(p => 
      p.id === playerId ? { ...p, ...updates } : p
    ),
  })),
  
  setPlayers: (players) => set({ players }),
  
  // Game flow
  setPhase: (phase) => set({ phase }),
  
  startWordSelection: () => {
    const state = get();
    const wordOptions = getWordSelection(state.settings.wordChoices);
    
    // Reset guess state for new round
    const updatedPlayers = state.players.map(p => ({
      ...p,
      hasGuessedCorrectly: false,
      isDrawing: state.players.indexOf(p) === state.currentDrawerIndex,
    }));
    
    set({
      phase: 'word-selection',
      wordOptions,
      currentWord: null,
      wordHint: '',
      timeRemaining: state.settings.wordSelectionTime,
      drawCommands: [],
      guessOrder: [],
      players: updatedPlayers,
    });
  },
  
  selectWord: (word) => {
    set({
      currentWord: word,
      wordHint: generateHint(word),
      phase: 'drawing',
      timeRemaining: get().settings.roundTime,
    });
    
    // Add system message
    get().addMessage({
      playerId: 'system',
      playerName: 'System',
      content: `${get().getCurrentDrawer()?.name} is drawing!`,
      isCorrectGuess: false,
      isSystemMessage: true,
    });
  },
  
  startDrawing: () => set({ phase: 'drawing' }),
  
  endRound: () => {
    const state = get();
    const drawer = state.getCurrentDrawer();
    
    // Give drawer points based on how many people guessed
    if (drawer) {
      const guessCount = state.guessOrder.length;
      const drawerPoints = guessCount * 10; // 10 points per correct guess
      get().updatePlayer(drawer.id, { 
        score: drawer.score + drawerPoints,
        isDrawing: false,
      });
    }
    
    // Add round end message
    get().addMessage({
      playerId: 'system',
      playerName: 'System',
      content: `The word was: ${state.currentWord}`,
      isCorrectGuess: false,
      isSystemMessage: true,
    });
    
    set({ phase: 'round-end' });
  },
  
  nextRound: () => {
    const state = get();
    const nextDrawerIndex = (state.currentDrawerIndex + 1) % state.players.length;
    const nextRound = state.currentRound + 1;
    
    // Check if game should end — rounds means each player draws that many times
    const totalTurns = (state.settings.rounds || 1) * state.players.length;
    if (nextRound >= totalTurns) {
      get().endGame();
      return;
    }
    
    set({
      currentDrawerIndex: nextDrawerIndex,
      currentRound: nextRound,
    });
    
    get().startWordSelection();
  },
  
  endGame: () => set({ phase: 'game-over' }),
  
  resetGame: () => set({
    ...initialState,
    roomCode: get().roomCode,
    players: get().players.map(p => ({ ...p, score: 0, isDrawing: false, hasGuessedCorrectly: false })),
    currentPlayerId: get().currentPlayerId,
    isConnected: get().isConnected,
  }),
  
  // Timer
  setTimeRemaining: (time) => set({ timeRemaining: time }),
  
  decrementTime: () => {
    const state = get();
    const newTime = Math.max(0, state.timeRemaining - 1);
    set({ timeRemaining: newTime });
    
    // Auto-end round if time runs out during drawing
    if (newTime === 0 && state.phase === 'drawing') {
      get().endRound();
    }
    
    // Auto-select random word if time runs out during word selection
    if (newTime === 0 && state.phase === 'word-selection') {
      const randomWord = state.wordOptions[Math.floor(Math.random() * state.wordOptions.length)];
      get().selectWord(randomWord.text);
    }
  },
  
  // Drawing
  addDrawCommand: (command) => set((state) => ({
    drawCommands: [...state.drawCommands, command],
  })),
  
  clearCanvas: () => set((state) => ({
    drawCommands: [...state.drawCommands, { type: 'clear' }],
  })),
  
  setDrawCommands: (commands) => set({ drawCommands: commands }),
  
  // Chat/Guessing
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    }],
  })),
  
  submitGuess: (playerId, playerName, guess) => {
    const state = get();
    
    // Can't guess if you're drawing or already guessed correctly
    const player = state.players.find(p => p.id === playerId);
    if (!player || player.isDrawing || player.hasGuessedCorrectly) {
      return false;
    }
    
    // Normalize for comparison
    const normalizedGuess = guess.toLowerCase().trim();
    const normalizedWord = state.currentWord?.toLowerCase().trim();
    
    const isCorrect = normalizedGuess === normalizedWord;
    
    // Add message
    get().addMessage({
      playerId,
      playerName,
      content: isCorrect ? `${playerName} guessed correctly!` : guess,
      isCorrectGuess: isCorrect,
      isSystemMessage: isCorrect,
    });
    
    if (isCorrect) {
      // Calculate and award points
      const position = state.guessOrder.length;
      const points = calculatePoints(position);
      
      get().updatePlayer(playerId, {
        score: player.score + points,
        hasGuessedCorrectly: true,
      });
      
      set((state) => ({
        guessOrder: [...state.guessOrder, playerId],
      }));
      
      // Check if everyone has guessed (except drawer)
      const updatedState = get();
      const nonDrawers = updatedState.players.filter(p => !p.isDrawing);
      const allGuessed = nonDrawers.every(p => p.hasGuessedCorrectly);
      
      if (allGuessed) {
        setTimeout(() => get().endRound(), 1000);
      }
    }
    
    return isCorrect;
  },
  
  // Settings
  updateSettings: (settings) => set((state) => ({
    settings: { ...state.settings, ...settings },
  })),
  
  // Helpers
  getCurrentDrawer: () => {
    const state = get();
    return state.players[state.currentDrawerIndex];
  },
  
  getCurrentPlayer: () => {
    const state = get();
    return state.players.find(p => p.id === state.currentPlayerId);
  },
  
  isCurrentPlayerDrawing: () => {
    const state = get();
    const currentPlayer = state.players.find(p => p.id === state.currentPlayerId);
    return currentPlayer?.isDrawing ?? false;
  },
  
  canStartGame: () => {
    const state = get();
    return state.players.length >= 2;
  },
  
  getLeaderboard: () => {
    const state = get();
    return [...state.players].sort((a, b) => b.score - a.score);
  },
}));

export default useGameStore;
