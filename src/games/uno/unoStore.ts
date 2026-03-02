// Uno Game Store (Zustand)
// Host-authoritative: host manages game logic, card draws, play validation
import { create } from 'zustand';
import { generateUnoDeck, canPlayCard, cardEquals } from './unoData';
import type { UnoCard, UnoColor } from './unoData';

export type UnoPhase = 'lobby' | 'playing' | 'round-over' | 'game-over';

export interface UnoPlayer {
  id: string;
  name: string;
  avatarId: string;
  avatarFilename: string;
  isHost: boolean;
  score: number; // Total points across all rounds
  hand: UnoCard[];
  calledUno: boolean; // Whether this player called UNO when down to 1 card
}

export interface UnoRoundResult {
  round: number;
  winnerId: string;
  winnerName: string;
  pointsAwarded: number; // Sum of all losers' card values
  scoreBreakdown: Record<string, number>; // playerId -> points from this round
}

interface UnoState {
  // Players
  players: UnoPlayer[];
  phase: UnoPhase;
  mode: 'classic' | 'chaos';

  // Round tracking
  currentRound: number;
  maxRounds: number;
  roundResults: UnoRoundResult[];

  // Deck state
  drawPile: UnoCard[];
  discardPile: UnoCard[];

  // Turn state
  currentTurnIndex: number;
  direction: 1 | -1; // 1 = clockwise, -1 = counter-clockwise
  currentColor: UnoColor | null; // Active color when wild is played

  // Chaos mode stacking
  drawStack: number; // Accumulated draw cards (for Draw Two / Wild Draw Four stacking)
  stackingWithWild4: boolean; // Track if the current stack is with Wild4

  // UNO tracking
  unoVulnerable: string | null; // Player who has 1 card and hasn't called UNO

  // Timer
  timeRemaining: number;
  turnTime: number; // 30 seconds per turn
}

interface UnoActions {
  // Setup
  initFromLobby: (players: {
    id: string;
    name: string;
    avatarId: string;
    avatarFilename: string;
    isHost: boolean;
  }[]) => void;
  setMode: (mode: 'classic' | 'chaos') => void;
  setMaxRounds: (rounds: number) => void;

  // Game flow
  startGame: () => void;
  dealCards: () => void;
  playCard: (playerId: string, cardId: string, chosenColor?: UnoColor) => boolean;
  drawCard: (playerId: string) => UnoCard | null;
  callUno: (playerId: string) => void;
  catchUno: (catcherId: string, targetId: string) => void;

  // Chaos mode
  jumpIn: (playerId: string, cardId: string) => boolean;
  swapHands: (playerId: string, targetId: string) => void;
  passHands: () => void;

  // Turn management
  nextTurn: () => void;
  skipNext: () => void;
  reverseDirection: () => void;
  applyDraw: (count: number) => void;

  // Round/Game end
  endRound: (winnerId: string) => void;
  endGame: () => void;

  // Helpers
  getPlayableCards: (playerId: string) => UnoCard[];
  getPlayerIndex: (playerId: string) => number;
  getTopCard: () => UnoCard | null;
  getCurrentPlayer: () => UnoPlayer | null;
  tickTimer: () => number;

  // State
  getFullState: () => UnoState;
  setFullState: (state: Partial<UnoState>) => void;
  reset: () => void;
}

const initialState: UnoState = {
  players: [],
  phase: 'lobby',
  mode: 'classic',
  currentRound: 0,
  maxRounds: 3,
  roundResults: [],
  drawPile: [],
  discardPile: [],
  currentTurnIndex: 0,
  direction: 1,
  currentColor: null,
  drawStack: 0,
  stackingWithWild4: false,
  unoVulnerable: null,
  timeRemaining: 30,
  turnTime: 30,
};

const useUnoStore = create<UnoState & UnoActions>((set, get) => ({
  ...initialState,

  initFromLobby: (lobbyPlayers) => {
    const players: UnoPlayer[] = lobbyPlayers.map((p) => ({
      ...p,
      score: 0,
      hand: [],
      calledUno: false,
    }));
    set({ ...initialState, players });
  },

  setMode: (mode) => set({ mode }),
  setMaxRounds: (rounds) => set({ maxRounds: rounds }),

  startGame: () => {
    const state = get();
    set({ phase: 'playing', currentRound: state.currentRound + 1 });
    get().dealCards();
  },

  dealCards: () => {
    set((state) => {
      const deck = generateUnoDeck();
      let deckIdx = 0;

      // Deal 7 cards to each player
      const players = state.players.map((p) => ({
        ...p,
        hand: [] as UnoCard[],
        calledUno: false,
      }));

      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < players.length; j++) {
          if (deckIdx < deck.length) {
            players[j].hand.push(deck[deckIdx++]);
          }
        }
      }

      // Discard pile starts with 1 card (keep drawing until it's not a special)
      let topCard: UnoCard;
      do {
        topCard = deck[deckIdx++];
      } while (
        topCard.value === 'wild' ||
        topCard.value === 'wild4'
      );

      // Remaining cards go to draw pile
      const drawPile = deck.slice(deckIdx);

      return {
        players,
        drawPile,
        discardPile: [topCard],
        currentColor: topCard.color,
        currentTurnIndex: 0,
        direction: 1,
        drawStack: 0,
        stackingWithWild4: false,
        unoVulnerable: null,
        timeRemaining: 30,
      };
    });
  },

  playCard: (playerId, cardId, chosenColor) => {
    const state = get();
    const playerIdx = state.players.findIndex((p) => p.id === playerId);
    if (playerIdx === -1 || state.currentTurnIndex !== playerIdx) {
      return false; // Not this player's turn
    }

    const player = state.players[playerIdx];
    const cardIdx = player.hand.findIndex((c) => c.id === cardId);
    if (cardIdx === -1) {
      return false; // Player doesn't have this card
    }

    const card = player.hand[cardIdx];
    const topCard = state.discardPile[state.discardPile.length - 1];

    // Check if card is playable
    if (!canPlayCard(card, topCard, state.currentColor)) {
      return false;
    }

    // Handle stacking logic in Chaos mode
    if (state.mode === 'chaos' && state.drawStack > 0) {
      // Can only play cards that continue the stack
      if (card.value === 'draw2' && !state.stackingWithWild4) {
        // Add to draw2 stack
        set((s) => ({
          drawStack: s.drawStack + 2,
          players: s.players.map((p) =>
            p.id === playerId
              ? { ...p, hand: p.hand.filter((c) => c.id !== cardId) }
              : p
          ),
          discardPile: [...s.discardPile, card],
          unoVulnerable: s.players.filter((p) => p.id === playerId && p.hand.length === 1).length > 0 ? playerId : s.unoVulnerable,
        }));
        return true;
      } else if (card.value === 'wild4' && (state.stackingWithWild4 || !state.stackingWithWild4)) {
        // Add wild4 to stack (wild4 can stack with anything)
        if (chosenColor) {
          set((s) => ({
            drawStack: s.drawStack + 4,
            stackingWithWild4: true,
            currentColor: chosenColor,
            players: s.players.map((p) =>
              p.id === playerId
                ? { ...p, hand: p.hand.filter((c) => c.id !== cardId) }
                : p
            ),
            discardPile: [...s.discardPile, card],
            unoVulnerable: s.players.filter((p) => p.id === playerId && p.hand.length === 1).length > 0 ? playerId : s.unoVulnerable,
          }));
          return true;
        }
        return false;
      } else {
        // Can't play, must draw
        return false;
      }
    }

    // Play the card
    set((s) => {
      const newState = { ...s };
      newState.players = s.players.map((p) =>
        p.id === playerId
          ? { ...p, hand: p.hand.filter((c) => c.id !== cardId) }
          : p
      );
      newState.discardPile = [...s.discardPile, card];

      // Update current color if wild was played
      if (card.value === 'wild' || card.value === 'wild4') {
        newState.currentColor = chosenColor || null;
      } else {
        newState.currentColor = card.color;
      }

      // Handle card effects
      if (card.value === 'skip') {
        newState.currentTurnIndex = (playerIdx + newState.direction + s.players.length) % s.players.length;
        newState.currentTurnIndex = (newState.currentTurnIndex + newState.direction + s.players.length) % s.players.length;
      } else if (card.value === 'reverse') {
        if (s.players.length === 2) {
          // With 2 players, reverse acts like skip
          newState.currentTurnIndex = (playerIdx + newState.direction + s.players.length) % s.players.length;
          newState.currentTurnIndex = (newState.currentTurnIndex + newState.direction + s.players.length) % s.players.length;
        } else {
          newState.direction = (newState.direction === 1 ? -1 : 1) as 1 | -1;
          newState.currentTurnIndex = (playerIdx + newState.direction + s.players.length) % s.players.length;
        }
      } else if (card.value === 'draw2') {
        if (newState.mode === 'chaos') {
          newState.drawStack = 2;
          newState.stackingWithWild4 = false;
        } else {
          newState.currentTurnIndex = (playerIdx + newState.direction + s.players.length) % s.players.length;
          const nextPlayer = newState.players[newState.currentTurnIndex];
          for (let i = 0; i < 2; i++) {
            if (newState.drawPile.length === 0 && newState.discardPile.length > 1) {
              const topCard = newState.discardPile[newState.discardPile.length - 1];
              const reshuffled = newState.discardPile.slice(0, -1);
              for (let j = reshuffled.length - 1; j > 0; j--) {
                const k = Math.floor(Math.random() * (j + 1));
                [reshuffled[j], reshuffled[k]] = [reshuffled[k], reshuffled[j]];
              }
              newState.drawPile = reshuffled;
              newState.discardPile = [topCard];
            }
            if (newState.drawPile.length > 0) {
              nextPlayer.hand.push(newState.drawPile.shift()!);
            }
          }
          newState.currentTurnIndex = (newState.currentTurnIndex + newState.direction + s.players.length) % s.players.length;
        }
      } else if (card.value === 'wild4') {
        if (newState.mode === 'chaos') {
          newState.drawStack = 4;
          newState.stackingWithWild4 = true;
        } else {
          newState.currentTurnIndex = (playerIdx + newState.direction + s.players.length) % s.players.length;
          const nextPlayer = newState.players[newState.currentTurnIndex];
          for (let i = 0; i < 4; i++) {
            if (newState.drawPile.length === 0 && newState.discardPile.length > 1) {
              const topCard = newState.discardPile[newState.discardPile.length - 1];
              const reshuffled = newState.discardPile.slice(0, -1);
              for (let j = reshuffled.length - 1; j > 0; j--) {
                const k = Math.floor(Math.random() * (j + 1));
                [reshuffled[j], reshuffled[k]] = [reshuffled[k], reshuffled[j]];
              }
              newState.drawPile = reshuffled;
              newState.discardPile = [topCard];
            }
            if (newState.drawPile.length > 0) {
              nextPlayer.hand.push(newState.drawPile.shift()!);
            }
          }
          newState.currentTurnIndex = (newState.currentTurnIndex + newState.direction + s.players.length) % s.players.length;
        }
      } else if (card.value === '0' && newState.mode === 'chaos') {
        // All players pass hands (rotate in play direction)
        const hands = newState.players.map((p) => p.hand);
        if (newState.direction === 1) {
          newState.players = newState.players.map((p, i) => ({
            ...p,
            hand: hands[(i - 1 + newState.players.length) % newState.players.length],
          }));
        } else {
          newState.players = newState.players.map((p, i) => ({
            ...p,
            hand: hands[(i + 1) % newState.players.length],
          }));
        }
      } else if (card.value === '7' && newState.mode === 'chaos') {
        // Current player will swap with someone (UI will handle selection)
        // For now, just mark that a swap is pending
      } else {
        // Normal card, next turn
        newState.currentTurnIndex = (playerIdx + newState.direction + s.players.length) % s.players.length;
      }

      // Check if current player is down to 1 card
      const currentHand = newState.players[playerIdx].hand;
      if (currentHand.length === 1) {
        newState.unoVulnerable = playerId;
      } else if (newState.unoVulnerable === playerId) {
        newState.unoVulnerable = null;
      }

      newState.timeRemaining = newState.turnTime;
      return newState;
    });

    return true;
  },

  drawCard: (playerId) => {
    const state = get();
    const playerIdx = state.players.findIndex((p) => p.id === playerId);
    if (playerIdx === -1) {
      return null;
    }

    set((s) => {
      // Reshuffle if needed
      if (s.drawPile.length === 0 && s.discardPile.length > 1) {
        const topCard = s.discardPile[s.discardPile.length - 1];
        const reshuffled = s.discardPile.slice(0, -1);
        for (let i = reshuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [reshuffled[i], reshuffled[j]] = [reshuffled[j], reshuffled[i]];
        }
        s.drawPile = reshuffled;
        s.discardPile = [topCard];
      }

      if (s.drawPile.length > 0) {
        const drawn = s.drawPile.shift()!;
        s.players[playerIdx].hand.push(drawn);
      }

      return s;
    });

    const drawnCard = state.drawPile[0] || null;
    return drawnCard;
  },

  callUno: (playerId) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, calledUno: true } : p
      ),
      unoVulnerable:
        state.unoVulnerable === playerId ? null : state.unoVulnerable,
    }));
  },

  catchUno: (catcherId, targetId) => {
    if (catcherId === targetId) {
      return; // Can't catch yourself
    }

    set((state) => {
      const targetIdx = state.players.findIndex((p) => p.id === targetId);
      if (targetIdx === -1) {
        return state;
      }

      const target = state.players[targetIdx];

      // Only apply penalty if target has 1 card and didn't call UNO
      if (target.hand.length !== 1 || target.calledUno) {
        return state;
      }

      // Draw 2 penalty cards
      const newState = { ...state };
      newState.players[targetIdx] = { ...target };

      for (let i = 0; i < 2; i++) {
        if (newState.drawPile.length === 0 && newState.discardPile.length > 1) {
          const topCard = newState.discardPile[newState.discardPile.length - 1];
          const reshuffled = newState.discardPile.slice(0, -1);
          for (let j = reshuffled.length - 1; j > 0; j--) {
            const k = Math.floor(Math.random() * (j + 1));
            [reshuffled[j], reshuffled[k]] = [reshuffled[k], reshuffled[j]];
          }
          newState.drawPile = reshuffled;
          newState.discardPile = [topCard];
        }
        if (newState.drawPile.length > 0) {
          newState.players[targetIdx].hand.push(
            newState.drawPile.shift()!
          );
        }
      }

      newState.unoVulnerable = null;
      return newState;
    });
  },

  jumpIn: (playerId, cardId) => {
    const state = get();
    if (state.mode !== 'chaos') {
      return false;
    }

    const playerIdx = state.players.findIndex((p) => p.id === playerId);
    if (playerIdx === -1) {
      return false;
    }

    const player = state.players[playerIdx];
    const cardIdx = player.hand.findIndex((c) => c.id === cardId);
    if (cardIdx === -1) {
      return false;
    }

    const card = player.hand[cardIdx];
    const topCard = state.discardPile[state.discardPile.length - 1];

    // Check for exact match (same color and value)
    if (!cardEquals(card, topCard)) {
      return false;
    }

    // Play the card and jump turn to this player
    set((s) => ({
      players: s.players.map((p) =>
        p.id === playerId
          ? { ...p, hand: p.hand.filter((c) => c.id !== cardId) }
          : p
      ),
      discardPile: [...s.discardPile, card],
      currentTurnIndex: playerIdx,
      currentColor: card.color,
      timeRemaining: s.turnTime,
    }));

    return true;
  },

  swapHands: (playerId, targetId) => {
    const state = get();
    const playerIdx = state.players.findIndex((p) => p.id === playerId);
    const targetIdx = state.players.findIndex((p) => p.id === targetId);

    if (playerIdx === -1 || targetIdx === -1) {
      return;
    }

    set((s) => {
      const temp = s.players[playerIdx].hand;
      s.players[playerIdx].hand = s.players[targetIdx].hand;
      s.players[targetIdx].hand = temp;
      return s;
    });
  },

  passHands: () => {
    set((s) => {
      const hands = s.players.map((p) => p.hand);
      const newHands = [hands[hands.length - 1], ...hands.slice(0, -1)];
      s.players = s.players.map((p, i) => ({
        ...p,
        hand: newHands[i],
      }));
      return s;
    });
  },

  nextTurn: () => {
    set((state) => ({
      currentTurnIndex:
        (state.currentTurnIndex +
          state.direction +
          state.players.length) %
        state.players.length,
      timeRemaining: state.turnTime,
    }));
  },

  skipNext: () => {
    set((s) => ({
      currentTurnIndex:
        (s.currentTurnIndex +
          s.direction +
          s.players.length) %
        s.players.length,
    }));
  },

  reverseDirection: () => {
    set((state) => ({
      direction: (state.direction === 1 ? -1 : 1) as 1 | -1,
    }));
  },

  applyDraw: (count) => {
    set((state) => {
      const nextIdx =
        (state.currentTurnIndex + state.direction + state.players.length) %
        state.players.length;
      const nextPlayer = state.players[nextIdx];
      let newDrawPile = [...state.drawPile];
      let newDiscardPile = [...state.discardPile];

      for (let i = 0; i < count; i++) {
        if (newDrawPile.length === 0 && newDiscardPile.length > 1) {
          const topCard = newDiscardPile[newDiscardPile.length - 1];
          const reshuffled = newDiscardPile.slice(0, -1);
          for (let j = reshuffled.length - 1; j > 0; j--) {
            const k = Math.floor(Math.random() * (j + 1));
            [reshuffled[j], reshuffled[k]] = [reshuffled[k], reshuffled[j]];
          }
          newDrawPile = reshuffled;
          newDiscardPile = [topCard];
        }
        if (newDrawPile.length > 0) {
          nextPlayer.hand.push(newDrawPile.shift()!);
        }
      }

      return {
        currentTurnIndex:
          (nextIdx + state.direction + state.players.length) %
          state.players.length,
        drawStack: 0,
        stackingWithWild4: false,
        players: state.players,
        drawPile: newDrawPile,
        discardPile: newDiscardPile,
        timeRemaining: state.turnTime,
      };
    });
  },

  endRound: (winnerId) => {
    const state = get();
    const winnerIdx = state.players.findIndex((p) => p.id === winnerId);
    if (winnerIdx === -1) {
      return;
    }

    // Calculate points
    const scoreBreakdown: Record<string, number> = {};
    let totalPoints = 0;

    state.players.forEach((p) => {
      if (p.id !== winnerId) {
        const playerPoints = p.hand.reduce(
          (sum, card) => sum + card.points,
          0
        );
        scoreBreakdown[p.id] = playerPoints;
        totalPoints += playerPoints;
      }
    });

    scoreBreakdown[winnerId] = totalPoints;

    const result: UnoRoundResult = {
      round: state.currentRound,
      winnerId,
      winnerName: state.players[winnerIdx].name,
      pointsAwarded: totalPoints,
      scoreBreakdown,
    };

    set((s) => ({
      phase: 'round-over',
      roundResults: [...s.roundResults, result],
      players: s.players.map((p) => ({
        ...p,
        score: p.score + (scoreBreakdown[p.id] || 0),
      })),
    }));
  },

  endGame: () => set({ phase: 'game-over' }),

  getPlayableCards: (playerId) => {
    const state = get();
    const player = state.players.find((p) => p.id === playerId);
    if (!player) {
      return [];
    }

    const topCard = state.discardPile[state.discardPile.length - 1];
    if (!topCard) {
      return [];
    }

    return player.hand.filter((c) =>
      canPlayCard(c, topCard, state.currentColor)
    );
  },

  getPlayerIndex: (playerId) => {
    return get().players.findIndex((p) => p.id === playerId);
  },

  getTopCard: () => {
    const state = get();
    return state.discardPile[state.discardPile.length - 1] || null;
  },

  getCurrentPlayer: () => {
    const state = get();
    return state.players[state.currentTurnIndex] || null;
  },

  tickTimer: () => {
    const state = get();
    const next = state.timeRemaining - 1;
    set({ timeRemaining: Math.max(0, next) });
    return next;
  },

  getFullState: () => {
    const s = get();
    return {
      players: s.players,
      phase: s.phase,
      mode: s.mode,
      currentRound: s.currentRound,
      maxRounds: s.maxRounds,
      roundResults: s.roundResults,
      drawPile: s.drawPile,
      discardPile: s.discardPile,
      currentTurnIndex: s.currentTurnIndex,
      direction: s.direction,
      currentColor: s.currentColor,
      drawStack: s.drawStack,
      stackingWithWild4: s.stackingWithWild4,
      unoVulnerable: s.unoVulnerable,
      timeRemaining: s.timeRemaining,
      turnTime: s.turnTime,
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

export default useUnoStore;
