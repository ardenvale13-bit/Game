// Make It Meme - Multiplayer Sync via Supabase Realtime
// Host-authoritative: host runs game logic, broadcasts state to all clients
import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import useMemeStore from '../games/meme/memeStore';
import type { MemePhase, MemeRoundResult } from '../games/meme/memeStore';

interface UseMemeSyncOptions {
  roomCode: string | null;
  playerId: string | null;
  isHost: boolean;
}

export function useMemeSync({ roomCode, playerId, isHost }: UseMemeSyncOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isReady, setIsReady] = useState(false);
  const store = useMemeStore;

  useEffect(() => {
    if (!roomCode || !playerId) return;

    setIsReady(false);

    const channel = supabase.channel(`game:meme:${roomCode}`, {
      config: {
        broadcast: { self: false },
      },
    });

    if (!isHost) {
      // --- NON-HOST LISTENERS ---

      // Caption phase start (new round)
      channel.on('broadcast', { event: 'meme_caption_start' }, ({ payload }) => {
        if (!payload) return;
        const { templateId, templateSrc, isGif, captionPos, round, timeRemaining } = payload as {
          templateId: string;
          templateSrc: string;
          isGif: boolean;
          captionPos: 'top' | 'bottom' | 'both';
          round: number;
          timeRemaining: number;
        };
        const state = store.getState();
        const usedTemplateIds = new Set(state.usedTemplateIds);
        usedTemplateIds.add(templateId);
        store.setState({
          currentRound: round,
          currentTemplateId: templateId,
          currentTemplateSrc: templateSrc,
          currentTemplateIsGif: isGif,
          currentTemplateCaptionPos: captionPos,
          phase: 'captioning' as MemePhase,
          timeRemaining,
          usedTemplateIds,
          players: state.players.map(p => ({ ...p, caption: null, votedForPlayerId: null })),
        });
      });

      // Caption update (someone submitted)
      channel.on('broadcast', { event: 'meme_caption_update' }, ({ payload }) => {
        if (!payload) return;
        const { captions } = payload as { captions: Record<string, string | null> };
        store.setState((state) => ({
          players: state.players.map(p => ({
            ...p,
            caption: captions[p.id] !== undefined ? captions[p.id] : p.caption,
          })),
        }));
      });

      // Voting phase start
      channel.on('broadcast', { event: 'meme_voting_start' }, ({ payload }) => {
        if (!payload) return;
        const { timeRemaining, captions } = payload as {
          timeRemaining: number;
          captions: Record<string, string | null>;
        };
        store.setState((state) => ({
          phase: 'voting' as MemePhase,
          timeRemaining,
          players: state.players.map(p => ({
            ...p,
            caption: captions[p.id] !== undefined ? captions[p.id] : p.caption,
          })),
        }));
      });

      // Vote update
      channel.on('broadcast', { event: 'meme_vote_update' }, ({ payload }) => {
        if (!payload) return;
        const { votes } = payload as { votes: Record<string, string | null> };
        store.setState((state) => ({
          players: state.players.map(p => ({
            ...p,
            votedForPlayerId: votes[p.id] !== undefined ? votes[p.id] : p.votedForPlayerId,
          })),
        }));
      });

      // Results reveal
      channel.on('broadcast', { event: 'meme_results' }, ({ payload }) => {
        if (!payload) return;
        const { result, scores, timeRemaining } = payload as {
          result: MemeRoundResult;
          scores: Record<string, number>;
          timeRemaining: number;
        };
        store.setState((state) => ({
          phase: 'results' as MemePhase,
          timeRemaining,
          roundResults: [...state.roundResults, result],
          players: state.players.map(p => ({
            ...p,
            score: scores[p.id] ?? p.score,
          })),
        }));
      });

      // Timer sync
      channel.on('broadcast', { event: 'meme_timer_sync' }, ({ payload }) => {
        if (!payload) return;
        store.setState({ timeRemaining: payload.timeRemaining as number });
      });

      // Game over
      channel.on('broadcast', { event: 'meme_game_over' }, ({ payload }) => {
        if (!payload) return;
        const { scores } = payload as { scores: Record<string, number> };
        store.setState((state) => ({
          phase: 'game-over' as MemePhase,
          players: state.players.map(p => ({
            ...p,
            score: scores[p.id] ?? p.score,
          })),
        }));
      });

      // Full state (late joiners)
      channel.on('broadcast', { event: 'meme_full_state' }, ({ payload }) => {
        if (!payload) return;
        store.getState().setFullState(payload as any);
      });

    } else {
      // --- HOST LISTENERS ---

      // Player caption submission
      channel.on('broadcast', { event: 'meme_submit_caption' }, ({ payload }) => {
        if (!payload) return;
        const { playerId: pid, caption } = payload as { playerId: string; caption: string };
        store.getState().submitCaption(pid, caption);

        // Broadcast updated captions to all
        const captions: Record<string, string | null> = {};
        store.getState().players.forEach(p => { captions[p.id] = p.caption; });
        channel.send({ type: 'broadcast', event: 'meme_caption_update', payload: { captions } });
      });

      // Player vote
      channel.on('broadcast', { event: 'meme_cast_vote' }, ({ payload }) => {
        if (!payload) return;
        const { voterId, targetPlayerId } = payload as { voterId: string; targetPlayerId: string };
        store.getState().castVote(voterId, targetPlayerId);

        // Broadcast updated votes to all
        const votes: Record<string, string | null> = {};
        store.getState().players.forEach(p => { votes[p.id] = p.votedForPlayerId; });
        channel.send({ type: 'broadcast', event: 'meme_vote_update', payload: { votes } });
      });

      // State request (late joiner)
      channel.on('broadcast', { event: 'meme_request_state' }, () => {
        const state = store.getState().getFullState();
        channel.send({
          type: 'broadcast',
          event: 'meme_full_state',
          payload: {
            ...state,
            usedTemplateIds: Array.from(state.usedTemplateIds),
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
            channel.send({ type: 'broadcast', event: 'meme_request_state', payload: {} });
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

  const broadcastCaptionStart = useCallback((templateId: string, templateSrc: string, isGif: boolean, captionPos: 'top' | 'bottom' | 'both') => {
    const channel = channelRef.current;
    if (!channel) return;
    const state = store.getState();
    channel.send({
      type: 'broadcast',
      event: 'meme_caption_start',
      payload: {
        templateId,
        templateSrc,
        isGif,
        captionPos,
        round: state.currentRound,
        timeRemaining: state.timeRemaining,
      },
    });
  }, []);

  const broadcastVotingStart = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    const state = store.getState();
    const captions: Record<string, string | null> = {};
    state.players.forEach(p => { captions[p.id] = p.caption; });
    channel.send({
      type: 'broadcast',
      event: 'meme_voting_start',
      payload: {
        timeRemaining: state.timeRemaining,
        captions,
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
      event: 'meme_results',
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
      event: 'meme_timer_sync',
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
      event: 'meme_game_over',
      payload: { scores },
    });
  }, []);

  // --- Send helpers (non-host sends to host) ---

  const sendCaption = useCallback((caption: string) => {
    const channel = channelRef.current;
    if (!channel) return;

    if (isHost) {
      // Host processes locally
      store.getState().submitCaption(playerId!, caption);
      // Broadcast to others
      const captions: Record<string, string | null> = {};
      store.getState().players.forEach(p => { captions[p.id] = p.caption; });
      channel.send({ type: 'broadcast', event: 'meme_caption_update', payload: { captions } });
    } else {
      channel.send({
        type: 'broadcast',
        event: 'meme_submit_caption',
        payload: { playerId, caption },
      });
    }
  }, [isHost, playerId]);

  const sendVote = useCallback((targetPlayerId: string) => {
    const channel = channelRef.current;
    if (!channel) return;

    if (isHost) {
      // Host processes locally
      store.getState().castVote(playerId!, targetPlayerId);
      // Broadcast to others
      const votes: Record<string, string | null> = {};
      store.getState().players.forEach(p => { votes[p.id] = p.votedForPlayerId; });
      channel.send({ type: 'broadcast', event: 'meme_vote_update', payload: { votes } });
    } else {
      channel.send({
        type: 'broadcast',
        event: 'meme_cast_vote',
        payload: { voterId: playerId, targetPlayerId },
      });
    }
  }, [isHost, playerId]);

  return {
    isReady,
    broadcastCaptionStart,
    broadcastVotingStart,
    broadcastResults,
    broadcastTimerSync,
    broadcastGameOver,
    sendCaption,
    sendVote,
  };
}
