// Guess Betrayal Multiplayer Sync via Supabase Realtime
// Host-authoritative: host runs game logic, broadcasts state to all
import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import useGuessBetrayalStore from '../games/guess-betrayal/guessBetrayalStore';
import type { GBPhase, GBAnswer } from '../games/guess-betrayal/guessBetrayalStore';

interface UseSyncOptions {
  roomCode: string | null;
  playerId: string | null;
  isHost: boolean;
}

export function useGuessBetrayalSync({ roomCode, playerId, isHost }: UseSyncOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isReady, setIsReady] = useState(false);
  const store = useGuessBetrayalStore;

  useEffect(() => {
    if (!roomCode || !playerId) return;
    setIsReady(false);

    const channel = supabase.channel(`game:gb:${roomCode}`, {
      config: { broadcast: { self: false } },
    });

    if (!isHost) {
      // NON-HOST listeners

      // Round start — question, phase, timer
      channel.on('broadcast', { event: 'gb_round_start' }, ({ payload }) => {
        if (!payload) return;
        const { question, round, maxRounds, phase, timeRemaining, category } = payload as {
          question: string;
          round: number;
          maxRounds: number;
          phase: GBPhase;
          timeRemaining: number;
          category: string;
        };
        const players = store.getState().players.map(p => ({
          ...p,
          answer: '',
          hasAnswered: false,
          guesses: {} as Record<string, string>,
          hasGuessed: false,
        }));
        store.setState({
          currentQuestion: question,
          currentRound: round,
          maxRounds,
          phase,
          timeRemaining,
          category: category as any,
          shuffledAnswers: [],
          players,
        });
      });

      // Phase change (answering → guessing, with shuffled answers)
      channel.on('broadcast', { event: 'gb_phase' }, ({ payload }) => {
        if (!payload) return;
        const { phase, timeRemaining, shuffledAnswers, answeredIds } = payload as {
          phase: GBPhase;
          timeRemaining: number;
          shuffledAnswers?: GBAnswer[];
          answeredIds?: string[];
        };
        const updates: Record<string, unknown> = { phase, timeRemaining };
        if (shuffledAnswers) updates.shuffledAnswers = shuffledAnswers;
        if (answeredIds) {
          updates.players = store.getState().players.map(p => ({
            ...p,
            hasAnswered: answeredIds.includes(p.id),
          }));
        }
        store.setState(updates as any);
      });

      // Timer sync
      channel.on('broadcast', { event: 'gb_timer_sync' }, ({ payload }) => {
        if (!payload) return;
        store.setState({ timeRemaining: (payload as any).timeRemaining });
      });

      // Answer count update
      channel.on('broadcast', { event: 'gb_answer_count' }, ({ payload }) => {
        if (!payload) return;
        const { answeredIds } = payload as { answeredIds: string[] };
        store.setState((state) => ({
          players: state.players.map(p => ({
            ...p,
            hasAnswered: answeredIds.includes(p.id),
          })),
        }));
      });

      // Results
      channel.on('broadcast', { event: 'gb_results' }, ({ payload }) => {
        if (!payload) return;
        const { scores, shuffledAnswers } = payload as {
          scores: Record<string, number>;
          shuffledAnswers: GBAnswer[];
        };
        const players = store.getState().players.map(p => ({
          ...p,
          score: scores[p.id] ?? p.score,
        }));
        store.setState({
          players,
          shuffledAnswers,
          phase: 'results',
          timeRemaining: 10,
        });
      });

      // Game over
      channel.on('broadcast', { event: 'gb_game_over' }, ({ payload }) => {
        if (!payload) return;
        const { scores } = payload as { scores: Record<string, number> };
        const players = store.getState().players.map(p => ({
          ...p,
          score: scores[p.id] ?? p.score,
        }));
        store.setState({ players, phase: 'game-over' });
      });
    }

    if (isHost) {
      // HOST listeners

      // Player submits answer
      channel.on('broadcast', { event: 'gb_submit_answer' }, ({ payload }) => {
        if (!payload) return;
        const { senderId, answer } = payload as { senderId: string; answer: string };
        store.getState().submitAnswer(senderId, answer);
      });

      // Player submits guesses
      channel.on('broadcast', { event: 'gb_submit_guesses' }, ({ payload }) => {
        if (!payload) return;
        const { senderId, guesses } = payload as { senderId: string; guesses: Record<string, string> };
        store.getState().submitGuesses(senderId, guesses);
      });
    }

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channelRef.current = channel;
        setIsReady(true);
      }
    });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      setIsReady(false);
    };
  }, [roomCode, playerId, isHost]);

  // --- BROADCAST HELPERS ---

  const broadcastRoundStart = useCallback(() => {
    const channel = channelRef.current;
    if (!channel || !isHost) return;
    const state = store.getState();
    channel.send({
      type: 'broadcast',
      event: 'gb_round_start',
      payload: {
        question: state.currentQuestion,
        round: state.currentRound,
        maxRounds: state.maxRounds,
        phase: state.phase,
        timeRemaining: state.timeRemaining,
        category: state.category,
      },
    });
  }, [isHost]);

  const broadcastPhaseChange = useCallback((phase: GBPhase, timeRemaining: number, shuffledAnswers?: GBAnswer[]) => {
    const channel = channelRef.current;
    if (!channel || !isHost) return;
    const state = store.getState();
    const answeredIds = state.players.filter(p => p.hasAnswered).map(p => p.id);
    channel.send({
      type: 'broadcast',
      event: 'gb_phase',
      payload: { phase, timeRemaining, shuffledAnswers, answeredIds },
    });
  }, [isHost]);

  const broadcastTimerSync = useCallback(() => {
    const channel = channelRef.current;
    if (!channel || !isHost) return;
    channel.send({
      type: 'broadcast',
      event: 'gb_timer_sync',
      payload: { timeRemaining: store.getState().timeRemaining },
    });
  }, [isHost]);

  const broadcastAnswerCount = useCallback(() => {
    const channel = channelRef.current;
    if (!channel || !isHost) return;
    const answeredIds = store.getState().players.filter(p => p.hasAnswered).map(p => p.id);
    channel.send({
      type: 'broadcast',
      event: 'gb_answer_count',
      payload: { answeredIds },
    });
  }, [isHost]);

  const broadcastResults = useCallback(() => {
    const channel = channelRef.current;
    if (!channel || !isHost) return;
    const state = store.getState();
    const scores: Record<string, number> = {};
    state.players.forEach(p => { scores[p.id] = p.score; });
    channel.send({
      type: 'broadcast',
      event: 'gb_results',
      payload: { scores, shuffledAnswers: state.shuffledAnswers },
    });
  }, [isHost]);

  const broadcastGameOver = useCallback(() => {
    const channel = channelRef.current;
    if (!channel || !isHost) return;
    const scores: Record<string, number> = {};
    store.getState().players.forEach(p => { scores[p.id] = p.score; });
    channel.send({
      type: 'broadcast',
      event: 'gb_game_over',
      payload: { scores },
    });
  }, [isHost]);

  // Non-host broadcasts
  const broadcastSubmitAnswer = useCallback((answer: string) => {
    const channel = channelRef.current;
    if (!channel || !playerId) return;
    channel.send({
      type: 'broadcast',
      event: 'gb_submit_answer',
      payload: { senderId: playerId, answer },
    });
  }, [playerId]);

  const broadcastSubmitGuesses = useCallback((guesses: Record<string, string>) => {
    const channel = channelRef.current;
    if (!channel || !playerId) return;
    channel.send({
      type: 'broadcast',
      event: 'gb_submit_guesses',
      payload: { senderId: playerId, guesses },
    });
  }, [playerId]);

  return {
    isReady,
    broadcastRoundStart,
    broadcastPhaseChange,
    broadcastTimerSync,
    broadcastAnswerCount,
    broadcastResults,
    broadcastGameOver,
    broadcastSubmitAnswer,
    broadcastSubmitGuesses,
    channel: channelRef,
  };
}
