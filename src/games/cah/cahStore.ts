// Cards Against Humanity - Game Store
import { create } from 'zustand';
import type { BlackCard, WhiteCard } from './cardData';
import { getRandomBlackCard, dealWhiteCards, shuffleArray, blackCards } from './cardData';

export type CAHPhase = 
  | 'lobby'
  | 'playing'      // Players selecting cards
  | 'judging'      // Czar reviewing submissions
  | 'reveal'       // Showing winner
  | 'game-over';

export interface CAHPlayer {
  id: string;
  name: string;
  avatarId: string;
  avatarFilename: string;
  score: number;
  isHost: boolean;
  isCzar: boolean;
  hand: WhiteCard[];
  selectedCards: WhiteCard[];
  hasSubmitted: boolean;
}

export interface CAHSubmission {
  playerId: string;
  playerName: string;
  cards: WhiteCard[];
  isWinner: boolean;
}

export interface CAHGameState {
  // Room
  roomCode: string | null;
  roomName: string | null;
  
  // Players
  players: CAHPlayer[];
  currentPlayerId: string | null;
  czarIndex: number;
  
  // Game state
  phase: CAHPhase;
  currentRound: number;
  maxRounds: number;
  
  // Cards
  currentBlackCard: BlackCard | null;
  submissions: CAHSubmission[];
  usedBlackCards: string[];
  usedWhiteCards: string[];
  
  // Timer
  timeRemaining: number;
  
  // Settings
  cardsPerHand: number;
  roundTime: number;
  judgeTime: number;
}

interface CAHActions {
  // Setup
  setRoomCode: (code: string) => void;
  setRoomName: (name: string) => void;
  setCurrentPlayer: (id: string) => void;
  addPlayer: (player: Omit<CAHPlayer, 'hand' | 'selectedCards' | 'hasSubmitted' | 'isCzar' | 'score'>) => void;
  removePlayer: (id: string) => void;
  
  // Game flow
  startGame: () => void;
  startRound: () => void;
  selectCard: (playerId: string, card: WhiteCard) => void;
  deselectCard: (playerId: string, card: WhiteCard) => void;
  submitCards: (playerId: string) => void;
  selectWinner: (playerId: string) => void;
  nextRound: () => void;
  endGame: () => void;
  resetGame: () => void;
  
  // Timer
  setTimeRemaining: (time: number) => void;
  decrementTime: () => void;
  
  // Settings
  setMaxRounds: (rounds: number) => void;
  
  // Helpers
  getCurrentCzar: () => CAHPlayer | undefined;
  getCurrentPlayer: () => CAHPlayer | undefined;
  isCurrentPlayerCzar: () => boolean;
  canStartGame: () => boolean;
  allPlayersSubmitted: () => boolean;
  getLeaderboard: () => CAHPlayer[];
}

const CARDS_PER_HAND = 7;
const ROUND_TIME = 60;
const JUDGE_TIME = 45;

const initialState: CAHGameState = {
  roomCode: null,
  roomName: null,
  players: [],
  currentPlayerId: null,
  czarIndex: 0,
  phase: 'lobby',
  currentRound: 0,
  maxRounds: 10,
  currentBlackCard: null,
  submissions: [],
  usedBlackCards: [],
  usedWhiteCards: [],
  timeRemaining: 0,
  cardsPerHand: CARDS_PER_HAND,
  roundTime: ROUND_TIME,
  judgeTime: JUDGE_TIME,
};

const useCAHStore = create<CAHGameState & CAHActions>((set, get) => ({
  ...initialState,
  
  // Setup
  setRoomCode: (code) => set({ roomCode: code }),
  setRoomName: (name) => set({ roomName: name }),
  setCurrentPlayer: (id) => set({ currentPlayerId: id }),
  
  addPlayer: (playerData) => {
    const state = get();
    const hand = dealWhiteCards(state.cardsPerHand, state.usedWhiteCards);
    const usedIds = hand.map(c => c.id);
    
    const player: CAHPlayer = {
      ...playerData,
      score: 0,
      isCzar: false,
      hand,
      selectedCards: [],
      hasSubmitted: false,
    };
    
    set({
      players: [...state.players, player],
      usedWhiteCards: [...state.usedWhiteCards, ...usedIds],
    });
  },
  
  removePlayer: (id) => set((state) => ({
    players: state.players.filter(p => p.id !== id),
  })),
  
  // Game flow
  startGame: () => {
    const state = get();
    
    // Reset players for game start
    const players = state.players.map((p, idx) => ({
      ...p,
      score: 0,
      isCzar: idx === 0,
      selectedCards: [],
      hasSubmitted: false,
    }));
    
    set({
      phase: 'playing',
      currentRound: 1,
      players,
      czarIndex: 0,
      usedBlackCards: [],
      submissions: [],
    });
    
    get().startRound();
  },
  
  startRound: () => {
    const state = get();
    
    // Get a new black card
    let blackCard: BlackCard;
    const availableBlackCards = blackCards.filter(c => !state.usedBlackCards.includes(c.id));
    
    if (availableBlackCards.length === 0) {
      // Reset if we've used all cards
      blackCard = getRandomBlackCard();
      set({ usedBlackCards: [blackCard.id] });
    } else {
      blackCard = availableBlackCards[Math.floor(Math.random() * availableBlackCards.length)];
      set({ usedBlackCards: [...state.usedBlackCards, blackCard.id] });
    }
    
    // Reset player submission state and refill hands
    const players = state.players.map(p => {
      const cardsNeeded = state.cardsPerHand - p.hand.length;
      let newHand = [...p.hand];
      
      if (cardsNeeded > 0) {
        const newCards = dealWhiteCards(cardsNeeded, state.usedWhiteCards);
        newHand = [...p.hand, ...newCards];
        // Track used cards
        set(s => ({ usedWhiteCards: [...s.usedWhiteCards, ...newCards.map(c => c.id)] }));
      }
      
      return {
        ...p,
        hand: newHand,
        selectedCards: [],
        hasSubmitted: false,
      };
    });
    
    set({
      currentBlackCard: blackCard,
      submissions: [],
      players,
      phase: 'playing',
      timeRemaining: state.roundTime,
    });
  },
  
  selectCard: (playerId, card) => set((state) => {
    const player = state.players.find(p => p.id === playerId);
    if (!player || player.isCzar || player.hasSubmitted) return state;
    
    const maxPicks = state.currentBlackCard?.pick || 1;
    if (player.selectedCards.length >= maxPicks) return state;
    
    // Check if card is already selected
    if (player.selectedCards.find(c => c.id === card.id)) return state;
    
    return {
      players: state.players.map(p => 
        p.id === playerId 
          ? { ...p, selectedCards: [...p.selectedCards, card] }
          : p
      ),
    };
  }),
  
  deselectCard: (playerId, card) => set((state) => {
    const player = state.players.find(p => p.id === playerId);
    if (!player || player.hasSubmitted) return state;
    
    return {
      players: state.players.map(p => 
        p.id === playerId 
          ? { ...p, selectedCards: p.selectedCards.filter(c => c.id !== card.id) }
          : p
      ),
    };
  }),
  
  submitCards: (playerId) => {
    const state = get();
    const player = state.players.find(p => p.id === playerId);
    if (!player || player.isCzar) return;
    
    const requiredPicks = state.currentBlackCard?.pick || 1;
    if (player.selectedCards.length !== requiredPicks) return;
    
    // Add submission
    const submission: CAHSubmission = {
      playerId,
      playerName: player.name,
      cards: player.selectedCards,
      isWinner: false,
    };
    
    // Remove selected cards from hand
    const newHand = player.hand.filter(c => !player.selectedCards.find(sc => sc.id === c.id));
    
    set({
      submissions: [...state.submissions, submission],
      players: state.players.map(p => 
        p.id === playerId 
          ? { ...p, hasSubmitted: true, hand: newHand, selectedCards: [] }
          : p
      ),
    });
    
    // Check if all non-czar players have submitted
    if (get().allPlayersSubmitted()) {
      set({ 
        phase: 'judging',
        timeRemaining: state.judgeTime,
        // Shuffle submissions so czar doesn't know who submitted what
        submissions: shuffleArray(get().submissions),
      });
    }
  },
  
  selectWinner: (playerId) => {
    const state = get();
    
    // Mark winner and give them a point
    set({
      submissions: state.submissions.map(s => ({
        ...s,
        isWinner: s.playerId === playerId,
      })),
      players: state.players.map(p => 
        p.id === playerId 
          ? { ...p, score: p.score + 1 }
          : p
      ),
      phase: 'reveal',
      timeRemaining: 5,
    });
  },
  
  nextRound: () => {
    const state = get();
    
    // Check if game should end
    if (state.currentRound >= state.maxRounds) {
      set({ phase: 'game-over' });
      return;
    }
    
    // Rotate czar
    const nextCzarIndex = (state.czarIndex + 1) % state.players.length;
    
    set({
      currentRound: state.currentRound + 1,
      czarIndex: nextCzarIndex,
      players: state.players.map((p, idx) => ({
        ...p,
        isCzar: idx === nextCzarIndex,
      })),
    });
    
    get().startRound();
  },
  
  endGame: () => set({ phase: 'game-over' }),
  
  resetGame: () => set({
    ...initialState,
    roomCode: get().roomCode,
    roomName: get().roomName,
  }),
  
  // Timer
  setTimeRemaining: (time) => set({ timeRemaining: time }),
  decrementTime: () => set((state) => ({ timeRemaining: Math.max(0, state.timeRemaining - 1) })),
  
  // Settings
  setMaxRounds: (rounds) => set({ maxRounds: rounds }),
  
  // Helpers
  getCurrentCzar: () => {
    const state = get();
    return state.players.find(p => p.isCzar);
  },
  
  getCurrentPlayer: () => {
    const state = get();
    return state.players.find(p => p.id === state.currentPlayerId);
  },
  
  isCurrentPlayerCzar: () => {
    const state = get();
    const player = state.players.find(p => p.id === state.currentPlayerId);
    return player?.isCzar ?? false;
  },
  
  canStartGame: () => {
    const state = get();
    return state.players.length >= 3; // Need at least 3 for CAH
  },
  
  allPlayersSubmitted: () => {
    const state = get();
    const nonCzarPlayers = state.players.filter(p => !p.isCzar);
    return nonCzarPlayers.every(p => p.hasSubmitted);
  },
  
  getLeaderboard: () => {
    const state = get();
    return [...state.players].sort((a, b) => b.score - a.score);
  },
}));

export default useCAHStore;
