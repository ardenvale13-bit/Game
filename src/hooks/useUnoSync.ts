// Uno - Multiplayer Sync via Supabase Realtime
// Host-authoritative: host runs game logic, broadcasts state to all clients
import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import useUnoStore from '../games/uno/unoStore';
import type { UnoPhase } from '../games/uno/unoStore';

interface UseUnoSyncOptions {
  roomCode: string | null;
  playerId: string | null;
  isHost: boolean;
  onForceEnd?: () => void;
}

export function useUnoSync({
  roomCode,
  playerId,
  isHost,
  onForceEnd,
}: UseUnoSyncOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isReady, setIsReady] = useState(false);
  const store = useUnoStore;

  useEffect(() => {
    if (!roomCode || !playerId) return;

    setIsReady(false);

    const channel = supabase.channel(`game:uno:${roomCode}`, {
      config: {
        broadcast: { self: false },
      },
    });

    if (!isHost) {
      // --- NON-HOST LISTENERS ---

      // Force end game
      channel.on('broadcast', { event: 'uno_force_end' }, () => {
        if (onForceEnd) onForceEnd();
      });

      // Full game state sync
      channel.on('broadcast', { event: 'uno_game_state' }, ({ payload }) => {
        if (!payload) return;
        store.getState().setFullState(payload as any);
      });

      // Card played
      channel.on('broadcast', { event: 'uno_play_card' }, ({ payload }) => {
        if (!payload) return;
        // Non-host receives state update via uno_game_state
      });

      // Card drawn
      channel.on('broadcast', { event: 'uno_draw_card' }, ({ payload }) => {
        if (!payload) return;
        // Non-host receives state update via uno_game_state
      });

      // UNO called
      channel.on('broadcast', { event: 'uno_call_uno' }, ({ payload }) => {
        if (!payload) return;
        const { callerId } = payload;
        store.getState().callUno(callerId);
      });

      // UNO caught
      channel.on('broadcast', { event: 'uno_catch_uno' }, ({ payload }) => {
        if (!payload) return;
        const { catcherId, targetId } = payload;
        store.getState().catchUno(catcherId, targetId);
      });

      // Jump in (Chaos)
      channel.on('broadcast', { event: 'uno_jump_in' }, ({ payload }) => {
        if (!payload) return;
        // State updated via uno_game_state
      });

      // Swap hands (Chaos)
      channel.on('broadcast', { event: 'uno_swap_hands' }, ({ payload }) => {
        if (!payload) return;
        // State updated via uno_game_state
      });

      // Pass hands (Chaos)
      channel.on('broadcast', { event: 'uno_pass_hands' }, ({ payload }) => {
        if (!payload) return;
        store.getState().passHands();
      });

      // Color chosen (for wild)
      channel.on('broadcast', { event: 'uno_choose_color' }, ({ payload }) => {
        if (!payload) return;
        // State updated via uno_game_state
      });

      // Timer sync
      channel.on('broadcast', { event: 'uno_timer_sync' }, ({ payload }) => {
        if (!payload) return;
        store.setState({ timeRemaining: payload.timeRemaining as number });
      });

      // Round over
      channel.on('broadcast', { event: 'uno_round_over' }, ({ payload }) => {
        if (!payload) return;
        const { result } = payload;
        store.setState((state) => ({
          phase: 'round-over' as UnoPhase,
          roundResults: [...state.roundResults, result],
          players: state.players.map((p) => ({
            ...p,
            score: p.score + (result.scoreBreakdown[p.id] || 0),
          })),
        }));
      });

      // Game over
      channel.on('broadcast', { event: 'uno_game_over' }, ({ payload }) => {
        if (!payload) return;
        store.setState({ phase: 'game-over' as UnoPhase });
      });

      // Full state (for late joiners)
      channel.on('broadcast', { event: 'uno_full_state' }, ({ payload }) => {
        if (!payload) return;
        store.getState().setFullState(payload as any);
      });
    } else {
      // --- HOST LISTENERS ---

      // Force end game
      channel.on('broadcast', { event: 'uno_force_end' }, () => {
        if (onForceEnd) onForceEnd();
      });

      // Non-host plays a card → host processes and broadcasts updated state
      channel.on('broadcast', { event: 'uno_play_card' }, ({ payload }) => {
        if (!payload) return;
        const { playerId: pid, cardId, chosenColor } = payload as {
          playerId: string;
          cardId: string;
          chosenColor?: string;
        };
        if (store.getState().playCard(pid, cardId, chosenColor as any)) {
          // Check for round win
          const state = store.getState();
          const player = state.players.find(p => p.id === pid);
          if (player && player.hand.length === 0) {
            store.getState().endRound(pid);
            const fullState = store.getState().getFullState();
            channel.send({ type: 'broadcast', event: 'uno_game_state', payload: fullState });
          } else {
            const fullState = store.getState().getFullState();
            channel.send({ type: 'broadcast', event: 'uno_game_state', payload: fullState });
          }
        }
      });

      // Non-host draws a card → host processes and broadcasts
      channel.on('broadcast', { event: 'uno_draw_card' }, ({ payload }) => {
        if (!payload) return;
        const { playerId: pid } = payload as { playerId: string };
        store.getState().drawCard(pid);
        store.getState().nextTurn();
        const fullState = store.getState().getFullState();
        channel.send({ type: 'broadcast', event: 'uno_game_state', payload: fullState });
      });

      // Non-host calls UNO
      channel.on('broadcast', { event: 'uno_call_uno' }, ({ payload }) => {
        if (!payload) return;
        const { callerId } = payload as { callerId: string };
        store.getState().callUno(callerId);
        const fullState = store.getState().getFullState();
        channel.send({ type: 'broadcast', event: 'uno_game_state', payload: fullState });
      });

      // Non-host catches someone not calling UNO
      channel.on('broadcast', { event: 'uno_catch_uno' }, ({ payload }) => {
        if (!payload) return;
        const { catcherId, targetId } = payload as { catcherId: string; targetId: string };
        store.getState().catchUno(catcherId, targetId);
        const fullState = store.getState().getFullState();
        channel.send({ type: 'broadcast', event: 'uno_game_state', payload: fullState });
      });

      // Non-host jump-in (Chaos mode)
      channel.on('broadcast', { event: 'uno_jump_in' }, ({ payload }) => {
        if (!payload) return;
        const { playerId: pid, cardId } = payload as { playerId: string; cardId: string };
        store.getState().jumpIn(pid, cardId);
        const fullState = store.getState().getFullState();
        channel.send({ type: 'broadcast', event: 'uno_game_state', payload: fullState });
      });

      // Non-host swap hands (Chaos mode, 7 card)
      channel.on('broadcast', { event: 'uno_swap_hands' }, ({ payload }) => {
        if (!payload) return;
        const { playerId: pid, targetId } = payload as { playerId: string; targetId: string };
        store.getState().swapHands(pid, targetId);
        const fullState = store.getState().getFullState();
        channel.send({ type: 'broadcast', event: 'uno_game_state', payload: fullState });
      });

      // Player requests state (late joiner)
      channel.on('broadcast', { event: 'uno_request_state' }, () => {
        const state = store.getState().getFullState();
        channel.send({
          type: 'broadcast',
          event: 'uno_full_state',
          payload: state,
        });
      });
    }

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channelRef.current = channel;
        setIsReady(true);

        // Non-host requests state on connect
        if (!isHost) {
          setTimeout(() => {
            channel.send({
              type: 'broadcast',
              event: 'uno_request_state',
              payload: {},
            });
          }, 300);
        }
      }
    });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [roomCode, playerId, isHost]);

  // --- Broadcast helpers (host only) ---

  const broadcastGameState = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    const state = store.getState().getFullState();
    channel.send({
      type: 'broadcast',
      event: 'uno_game_state',
      payload: state,
    });
  }, []);

  const broadcastPlayCard = useCallback(
    (playerId: string, cardId: string, chosenColor?: string) => {
      const channel = channelRef.current;
      if (!channel) return;
      channel.send({
        type: 'broadcast',
        event: 'uno_play_card',
        payload: { playerId, cardId, chosenColor },
      });
    },
    []
  );

  const broadcastDrawCard = useCallback((playerId: string) => {
    const channel = channelRef.current;
    if (!channel) return;
    channel.send({
      type: 'broadcast',
      event: 'uno_draw_card',
      payload: { playerId },
    });
  }, []);

  const broadcastCallUno = useCallback((playerId: string) => {
    const channel = channelRef.current;
    if (!channel) return;
    channel.send({
      type: 'broadcast',
      event: 'uno_call_uno',
      payload: { callerId: playerId },
    });
  }, []);

  const broadcastCatchUno = useCallback(
    (catcherId: string, targetId: string) => {
      const channel = channelRef.current;
      if (!channel) return;
      channel.send({
        type: 'broadcast',
        event: 'uno_catch_uno',
        payload: { catcherId, targetId },
      });
    },
    []
  );

  const broadcastJumpIn = useCallback((playerId: string, cardId: string) => {
    const channel = channelRef.current;
    if (!channel) return;
    channel.send({
      type: 'broadcast',
      event: 'uno_jump_in',
      payload: { playerId, cardId },
    });
  }, []);

  const broadcastSwapHands = useCallback(
    (playerId: string, targetId: string) => {
      const channel = channelRef.current;
      if (!channel) return;
      channel.send({
        type: 'broadcast',
        event: 'uno_swap_hands',
        payload: { playerId, targetId },
      });
    },
    []
  );

  const broadcastPassHands = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    channel.send({
      type: 'broadcast',
      event: 'uno_pass_hands',
      payload: {},
    });
  }, []);

  const broadcastTimerSync = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    channel.send({
      type: 'broadcast',
      event: 'uno_timer_sync',
      payload: { timeRemaining: store.getState().timeRemaining },
    });
  }, []);

  const broadcastRoundOver = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    const state = store.getState();
    const result = state.roundResults[state.roundResults.length - 1];
    if (!result) return;
    channel.send({
      type: 'broadcast',
      event: 'uno_round_over',
      payload: { result },
    });
  }, []);

  const broadcastGameOver = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    channel.send({
      type: 'broadcast',
      event: 'uno_game_over',
      payload: {},
    });
  }, []);

  const broadcastForceEnd = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    channel.send({
      type: 'broadcast',
      event: 'uno_force_end',
      payload: {},
    });
  }, []);

  // --- Send helpers (non-host sends to host) ---

  const sendPlayCard = useCallback(
    (cardId: string, chosenColor?: string) => {
      const channel = channelRef.current;
      if (!channel) return;

      if (isHost) {
        // Host processes locally
        if (playerId && store.getState().playCard(playerId, cardId, chosenColor as any)) {
          // Check for round win (player emptied their hand)
          const afterState = store.getState();
          const player = afterState.players.find(p => p.id === playerId);
          if (player && player.hand.length === 0) {
            store.getState().endRound(playerId);
          }
          broadcastGameState();
        }
      } else {
        channel.send({
          type: 'broadcast',
          event: 'uno_play_card',
          payload: { playerId, cardId, chosenColor },
        });
      }
    },
    [isHost, playerId, broadcastGameState]
  );

  const sendDrawCard = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;

    if (isHost) {
      const state = store.getState();
      if (playerId) {
        state.drawCard(playerId);
        broadcastGameState();
      }
    } else {
      channel.send({
        type: 'broadcast',
        event: 'uno_draw_card',
        payload: { playerId },
      });
    }
  }, [isHost, playerId, broadcastGameState]);

  const sendCallUno = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;

    if (isHost) {
      if (playerId) {
        store.getState().callUno(playerId);
      }
    } else {
      channel.send({
        type: 'broadcast',
        event: 'uno_call_uno',
        payload: { callerId: playerId },
      });
    }
  }, [isHost, playerId]);

  const sendCatchUno = useCallback(
    (targetId: string) => {
      const channel = channelRef.current;
      if (!channel) return;

      if (isHost) {
        if (playerId) {
          store.getState().catchUno(playerId, targetId);
          broadcastGameState();
        }
      } else {
        channel.send({
          type: 'broadcast',
          event: 'uno_catch_uno',
          payload: { catcherId: playerId, targetId },
        });
      }
    },
    [isHost, playerId, broadcastGameState]
  );

  const sendJumpIn = useCallback(
    (cardId: string) => {
      const channel = channelRef.current;
      if (!channel) return;

      if (isHost) {
        if (playerId) {
          store.getState().jumpIn(playerId, cardId);
          broadcastGameState();
        }
      } else {
        channel.send({
          type: 'broadcast',
          event: 'uno_jump_in',
          payload: { playerId, cardId },
        });
      }
    },
    [isHost, playerId, broadcastGameState]
  );

  const sendSwapHands = useCallback(
    (targetId: string) => {
      const channel = channelRef.current;
      if (!channel) return;

      if (isHost) {
        if (playerId) {
          store.getState().swapHands(playerId, targetId);
          broadcastGameState();
        }
      } else {
        channel.send({
          type: 'broadcast',
          event: 'uno_swap_hands',
          payload: { playerId, targetId },
        });
      }
    },
    [isHost, playerId, broadcastGameState]
  );

  return {
    isReady,
    broadcastGameState,
    broadcastPlayCard,
    broadcastDrawCard,
    broadcastCallUno,
    broadcastCatchUno,
    broadcastJumpIn,
    broadcastSwapHands,
    broadcastPassHands,
    broadcastTimerSync,
    broadcastRoundOver,
    broadcastGameOver,
    broadcastForceEnd,
    sendPlayCard,
    sendDrawCard,
    sendCallUno,
    sendCatchUno,
    sendJumpIn,
    sendSwapHands,
  };
}
