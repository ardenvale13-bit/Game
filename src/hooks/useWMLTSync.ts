// Who's Most Likely To - Multiplayer Sync via Supabase Realtime
// Host-authoritative: host runs game logic, broadcasts state to all clients
import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import useWMLTStore from '../games/wmlt/wmltStore';
import type { WMLTPhase, WMLTRoundResult } from '../games/wmlt/wmltStore';

interface UseWMLTSyncOptions {
  roomCode: string | null;
  playerId: string | null;
  isHost: boolean;
}

export function useWMLTSync({ roomCode, playerId, isHost }: UseWMLTSyncOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isReady, setIsReady] = useState(false);
  const store = useWMLTStore;

  useEffect(() => {
    if (!roomCode || !playerId) return;

    setIsReady(false);

    const channel = supabase.channel(`game:wmlt:${roomCode}`, {
      config: {
        broadcast: { self: false },
      },
    });

    if (!isHost) {
      // --- NON-HOST LISTENERS ---

      // Round start (prompt, round number, timer)
      channel.on('broadcast', { event: 'wmlt_round_start' }, ({ payload }) => {
        if (!payload) return;
        const { prompt, promptIndex, round, timeRemaining } = payload as {
          prompt: string;
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
          phase: 'voting' as WMLTPhase,
          timeRemaining,
          usedPromptIndices,
          players: state.players.map(p => ({ ...p, votedFor: null })),
        });
      });

      // Vote received (broadcast vote counts to all)
      channel.on('broadcast', { event: 'wmlt_vote_update' }, ({ payload }) => {
        if (!payload) return;
        const { votes } = payload as { votes: Record<string, string | null> };
        store.setState((state) => ({
          players: state.players.map(p => ({
            ...p,
            votedFor: votes[p.id] !== undefined ? votes[p.id] : p.votedFor,
          })),
        }));
      });

      // Results reveal
      channel.on('broadcast', { event: 'wmlt_results' }, ({ payload }) => {
        if (!payload) return;
        const { result, scores, timeRemaining } = payload as {
          result: WMLTRoundResult;
          scores: Record<string, number>;
          timeRemaining: number;
        };
        store.setState((state) => ({
          phase: 'results' as WMLTPhase,
          timeRemaining,
          roundResults: [...state.roundResults, result],
          players: state.players.map(p => ({
            ...p,
            score: scores[p.id] ?? p.score,
          })),
        }));
      });

      // Timer sync
      channel.on('broadcast', { event: 'wmlt_timer_sync' }, ({ payload }) => {
        if (!payload) return;
        store.setState({ timeRemaining: payload.timeRemaining as number });
      });

      // Game over
      channel.on('broadcast', { event: 'wmlt_game_over' }, ({ payload }) => {
        if (!payload) return;
        const { scores } = payload as { scores: Record<string, number> };
        store.setState((state) => ({
          phase: 'game-over' as WMLTPhase,
          players: state.players.map(p => ({
            ...p,
            score: scores[p.id] ?? p.score,
          })),
        }));
      });

      // Full state (for late joiners)
      channel.on('broadcast', { event: 'wmlt_full_state' }, ({ payload }) => {
        if (!payload) return;
        store.getState().setFullState(payload as any);
      });

    } else {
      // --- HOST LISTENERS ---

      // Player vote
      channel.on('broadcast', { event: 'wmlt_cast_vote' }, ({ payload }) => {
        if (!payload) return;
        const { voterId, targetId } = payload as { voterId: string; targetId: string };
        store.getState().castVote(voterId, targetId);

        // Broadcast updated votes to all
        const votes: Record<string, string | null> = {};
        store.getState().players.forEach(p => { votes[p.id] = p.votedFor; });
        channel.send({ type: 'broadcast', event: 'wmlt_vote_update', payload: { votes } });
      });

      // State request (late joiner)
      channel.on('broadcast', { event: 'wmlt_request_state' }, () => {
        const state = store.getState().getFullState();
        channel.send({
          type: 'broadcast',
          event: 'wmlt_full_state',
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
            channel.send({ type: 'broadcast', event: 'wmlt_request_state', payload: {} });
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

  const broadcastRoundStart = useCallback((prompt: string, promptIndex: number) => {
    const channel = channelRef.current;
    if (!channel) return;
    const state = store.getState();
    channel.send({
      type: 'broadcast',
      event: 'wmlt_round_start',
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
      event: 'wmlt_results',
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
      event: 'wmlt_timer_sync',
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
      event: 'wmlt_game_over',
      payload: { scores },
    });
  }, []);

  // --- Send helpers (non-host sends to host) ---

  const sendVote = useCallback((targetId: string) => {
    const channel = channelRef.current;
    if (!channel) return;

    if (isHost) {
      // Host processes locally
      store.getState().castVote(playerId!, targetId);
      // Broadcast to others
      const votes: Record<string, string | null> = {};
      store.getState().players.forEach(p => { votes[p.id] = p.votedFor; });
      channel.send({ type: 'broadcast', event: 'wmlt_vote_update', payload: { votes } });
    } else {
      channel.send({
        type: 'broadcast',
        event: 'wmlt_cast_vote',
        payload: { voterId: playerId, targetId },
      });
    }
  }, [isHost, playerId]);

  return {
    isReady,
    broadcastRoundStart,
    broadcastResults,
    broadcastTimerSync,
    broadcastGameOver,
    sendVote,
  };
}
