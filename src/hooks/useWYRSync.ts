// Would You Rather - Multiplayer Sync via Supabase Realtime
// Host-authoritative: host runs game logic, broadcasts state to all clients
import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import useWYRStore from '../games/wyr/wyrStore';
import type { WYRPhase, WYRRoundResult } from '../games/wyr/wyrStore';
import type { WYRPrompt } from '../games/wyr/wyrData';

interface UseWYRSyncOptions {
  roomCode: string | null;
  playerId: string | null;
  isHost: boolean;
  onForceEnd?: () => void;
}

export function useWYRSync({ roomCode, playerId, isHost, onForceEnd }: UseWYRSyncOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isReady, setIsReady] = useState(false);
  const store = useWYRStore;

  useEffect(() => {
    if (!roomCode || !playerId) return;

    setIsReady(false);

    const channel = supabase.channel(`game:wyr:${roomCode}`, {
      config: {
        broadcast: { self: false },
      },
    });

    if (!isHost) {
      // --- NON-HOST LISTENERS ---

      // Force end game
      channel.on('broadcast', { event: 'wyr_force_end' }, () => {
        if (onForceEnd) onForceEnd();
      });

      // Round start (prompt, round number, timer)
      channel.on('broadcast', { event: 'wyr_round_start' }, ({ payload }) => {
        if (!payload) return;
        const { prompt, promptIndex, round, timeRemaining } = payload as {
          prompt: WYRPrompt;
          promptIndex: number;
          round: number;
          timeRemaining: number;
        };
        const state = store.getState();
        const usedPromptIndices = new Set(state.usedPromptIndices);
        usedPromptIndices.add(promptIndex);
        store.setState({
          currentRound: round,
          currentPrompt: prompt,
          phase: 'voting' as WYRPhase,
          timeRemaining,
          usedPromptIndices,
          players: state.players.map(p => ({ ...p, vote: null })),
        });
      });

      // Vote received (broadcast vote counts to all)
      channel.on('broadcast', { event: 'wyr_vote_update' }, ({ payload }) => {
        if (!payload) return;
        const { votes } = payload as { votes: Record<string, 'A' | 'B' | null> };
        store.setState((state) => ({
          players: state.players.map(p => ({
            ...p,
            vote: votes[p.id] !== undefined ? votes[p.id] : p.vote,
          })),
        }));
      });

      // Results reveal
      channel.on('broadcast', { event: 'wyr_results' }, ({ payload }) => {
        if (!payload) return;
        const { result, scores, timeRemaining } = payload as {
          result: WYRRoundResult;
          scores: Record<string, number>;
          timeRemaining: number;
        };
        store.setState((state) => ({
          phase: 'results' as WYRPhase,
          timeRemaining,
          roundResults: [...state.roundResults, result],
          players: state.players.map(p => ({
            ...p,
            score: scores[p.id] ?? p.score,
          })),
        }));
      });

      // Timer sync
      channel.on('broadcast', { event: 'wyr_timer_sync' }, ({ payload }) => {
        if (!payload) return;
        store.setState({ timeRemaining: payload.timeRemaining as number });
      });

      // Game over
      channel.on('broadcast', { event: 'wyr_game_over' }, ({ payload }) => {
        if (!payload) return;
        const { scores } = payload as { scores: Record<string, number> };
        store.setState((state) => ({
          phase: 'game-over' as WYRPhase,
          players: state.players.map(p => ({
            ...p,
            score: scores[p.id] ?? p.score,
          })),
        }));
      });

      // Full state (for late joiners)
      channel.on('broadcast', { event: 'wyr_full_state' }, ({ payload }) => {
        if (!payload) return;
        store.getState().setFullState(payload as any);
      });

    } else {
      // --- HOST LISTENERS ---

      // Player vote
      channel.on('broadcast', { event: 'wyr_cast_vote' }, ({ payload }) => {
        if (!payload) return;
        const { voterId, option } = payload as { voterId: string; option: 'A' | 'B' };
        store.getState().castVote(voterId, option);

        // Broadcast updated votes to all
        const votes: Record<string, 'A' | 'B' | null> = {};
        store.getState().players.forEach(p => { votes[p.id] = p.vote; });
        channel.send({ type: 'broadcast', event: 'wyr_vote_update', payload: { votes } });
      });

      // State request (late joiner)
      channel.on('broadcast', { event: 'wyr_request_state' }, () => {
        const state = store.getState().getFullState();
        channel.send({
          type: 'broadcast',
          event: 'wyr_full_state',
          payload: {
            ...state,
            usedPromptIndices: Array.from(state.usedPromptIndices),
          },
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
            channel.send({ type: 'broadcast', event: 'wyr_request_state', payload: {} });
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

  const broadcastRoundStart = useCallback((prompt: WYRPrompt, promptIndex: number) => {
    const channel = channelRef.current;
    if (!channel) return;
    const state = store.getState();
    channel.send({
      type: 'broadcast',
      event: 'wyr_round_start',
      payload: {
        prompt,
        promptIndex,
        round: state.currentRound,
        timeRemaining: state.timeRemaining,
      },
    });
  }, []);

  const broadcastResults = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    const state = store.getState();
    const latestResult = state.roundResults[state.roundResults.length - 1];
    if (!latestResult) return;
    const scores: Record<string, number> = {};
    state.players.forEach(p => { scores[p.id] = p.score; });
    channel.send({
      type: 'broadcast',
      event: 'wyr_results',
      payload: {
        result: latestResult,
        scores,
        timeRemaining: state.timeRemaining,
      },
    });
  }, []);

  const broadcastTimerSync = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    channel.send({
      type: 'broadcast',
      event: 'wyr_timer_sync',
      payload: { timeRemaining: store.getState().timeRemaining },
    });
  }, []);

  const broadcastGameOver = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    const scores: Record<string, number> = {};
    store.getState().players.forEach(p => { scores[p.id] = p.score; });
    channel.send({
      type: 'broadcast',
      event: 'wyr_game_over',
      payload: { scores },
    });
  }, []);

  const broadcastForceEnd = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    channel.send({
      type: 'broadcast',
      event: 'wyr_force_end',
      payload: {},
    });
  }, []);

  // --- Send helpers (non-host sends to host) ---

  const sendVote = useCallback((option: 'A' | 'B') => {
    const channel = channelRef.current;
    if (!channel) return;

    if (isHost) {
      // Host processes locally
      store.getState().castVote(playerId!, option);
      // Broadcast to others
      const votes: Record<string, 'A' | 'B' | null> = {};
      store.getState().players.forEach(p => { votes[p.id] = p.vote; });
      channel.send({ type: 'broadcast', event: 'wyr_vote_update', payload: { votes } });
    } else {
      channel.send({
        type: 'broadcast',
        event: 'wyr_cast_vote',
        payload: { voterId: playerId, option },
      });
    }
  }, [isHost, playerId]);

  return {
    isReady,
    broadcastRoundStart,
    broadcastResults,
    broadcastTimerSync,
    broadcastGameOver,
    broadcastForceEnd,
    sendVote,
  };
}
