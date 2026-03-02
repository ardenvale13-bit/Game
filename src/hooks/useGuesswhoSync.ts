// Guess Who - Multiplayer Sync via Supabase Realtime
// Host-authoritative: host runs game logic, broadcasts state to all clients
import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import useGuesswhoStore from '../games/guesswho/guesswhoStore';
import type { GWPhase } from '../games/guesswho/guesswhoStore';

interface UseGuesswhoSyncOptions {
  roomCode: string | null;
  playerId: string | null;
  isHost: boolean;
  onForceEnd?: () => void;
}

export function useGuesswhoSync({ roomCode, playerId, isHost, onForceEnd }: UseGuesswhoSyncOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isReady, setIsReady] = useState(false);
  const store = useGuesswhoStore;

  useEffect(() => {
    if (!roomCode || !playerId) return;

    setIsReady(false);

    const channel = supabase.channel(`game:guesswho:${roomCode}`, {
      config: {
        broadcast: { self: false },
      },
    });

    if (!isHost) {
      // --- NON-HOST LISTENERS ---

      channel.on('broadcast', { event: 'gw_force_end' }, () => {
        if (onForceEnd) onForceEnd();
      });

      // Round start
      channel.on('broadcast', { event: 'gw_round_start' }, ({ payload }) => {
        if (!payload) return;
        const { round, chooserId, timeRemaining } = payload as {
          round: number;
          chooserId: string;
          timeRemaining: number;
        };
        const state = store.getState();
        const chooserIndex = state.players.findIndex(p => p.id === chooserId);
        store.setState({
          currentRound: round,
          chooserIndex: chooserIndex >= 0 ? chooserIndex : 0,
          phase: 'choosing' as GWPhase,
          timeRemaining,
          chosenCharacterId: null,
          currentQuestion: null,
          currentAsker: null,
          questions: [],
          eliminatedCharIds: [],
          players: state.players.map(p => ({ ...p, eliminated: false })),
        });
      });

      // Chooser confirmed character
      channel.on('broadcast', { event: 'gw_round_question_phase' }, ({ payload }) => {
        if (!payload) return;
        const { timeRemaining } = payload as { timeRemaining: number };
        store.setState({
          phase: 'questioning' as GWPhase,
          timeRemaining,
        });
      });

      // Question asked
      channel.on('broadcast', { event: 'gw_question_asked' }, ({ payload }) => {
        if (!payload) return;
        const { askerName, question } = payload as {
          askerName: string;
          question: string;
        };
        store.setState((state) => ({
          currentQuestion: question,
          questions: [
            ...state.questions,
            {
              askerId: '', // Will be filled by host broadcast
              askerName,
              question,
              answer: null,
            },
          ],
        }));
      });

      // Question answered
      channel.on('broadcast', { event: 'gw_question_answered' }, ({ payload }) => {
        if (!payload) return;
        const { answer } = payload as { answer: 'yes' | 'no' };
        store.setState((state) => {
          const updated = [...state.questions];
          if (updated.length > 0) {
            updated[updated.length - 1].answer = answer;
          }
          return {
            questions: updated,
            currentQuestion: null,
          };
        });
      });

      // Player eliminated (wrong guess)
      channel.on('broadcast', { event: 'gw_player_eliminated' }, ({ payload }) => {
        if (!payload) return;
        const { playerId: eliminatedPlayerId } = payload as { playerId: string };
        store.setState((state) => ({
          players: state.players.map(p =>
            p.id === eliminatedPlayerId ? { ...p, eliminated: true } : p
          ),
        }));
      });

      // Round end
      channel.on('broadcast', { event: 'gw_round_end' }, ({ payload }) => {
        if (!payload) return;
        const { result, scores, newPhase } = payload as {
          result: any;
          scores: Record<string, number>;
          newPhase: GWPhase;
        };
        store.setState((state) => ({
          phase: newPhase,
          roundResults: [...state.roundResults, result],
          players: state.players.map(p => ({
            ...p,
            score: scores[p.id] ?? p.score,
          })),
        }));
      });

      // Timer sync
      channel.on('broadcast', { event: 'gw_timer_sync' }, ({ payload }) => {
        if (!payload) return;
        store.setState({ timeRemaining: payload.timeRemaining as number });
      });

      // Game over
      channel.on('broadcast', { event: 'gw_game_over' }, ({ payload }) => {
        if (!payload) return;
        const { scores } = payload as { scores: Record<string, number> };
        store.setState((state) => ({
          phase: 'game-over' as GWPhase,
          players: state.players.map(p => ({
            ...p,
            score: scores[p.id] ?? p.score,
          })),
        }));
      });

      // Full state (for late joiners)
      channel.on('broadcast', { event: 'gw_full_state' }, ({ payload }) => {
        if (!payload) return;
        store.getState().setFullState(payload as any);
      });

    } else {
      // --- HOST LISTENERS ---

      // Player asks question
      channel.on('broadcast', { event: 'gw_ask_question' }, ({ payload }) => {
        if (!payload) return;
        const { askerId, askerName, question } = payload as {
          askerId: string;
          askerName: string;
          question: string;
        };
        store.getState().askQuestion(askerId, askerName, question);

        // Broadcast to all
        channel.send({
          type: 'broadcast',
          event: 'gw_question_asked',
          payload: { askerName, question },
        });
      });

      // Player makes a guess
      channel.on('broadcast', { event: 'gw_player_guess' }, ({ payload }) => {
        if (!payload) return;
        const { guesser, charId } = payload as { guesser: any; charId: string };
        const state = store.getState();
        const player = state.players.find(p => p.id === guesser.id);
        if (!player) return;

        const isCorrect = store.getState().makeGuess(player, charId);

        // Broadcast result
        if (!isCorrect) {
          channel.send({
            type: 'broadcast',
            event: 'gw_player_eliminated',
            payload: { playerId: guesser.id },
          });
        }

        // In questioning phase - broadcast result to all clients
        channel.send({
          type: 'broadcast',
          event: 'gw_guess_result',
          payload: {
            guesser: guesser.name,
            charId,
            isCorrect,
          },
        });
      });

      // State request (late joiner)
      channel.on('broadcast', { event: 'gw_request_state' }, () => {
        const state = store.getState().getFullState();
        channel.send({
          type: 'broadcast',
          event: 'gw_full_state',
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
            channel.send({ type: 'broadcast', event: 'gw_request_state', payload: {} });
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

  const broadcastRoundStart = useCallback((chooserId: string) => {
    const channel = channelRef.current;
    if (!channel) return;
    const state = store.getState();
    channel.send({
      type: 'broadcast',
      event: 'gw_round_start',
      payload: {
        round: state.currentRound,
        chooserId,
        timeRemaining: state.timeRemaining,
      },
    });
  }, []);

  const broadcastQuestioningPhase = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    const state = store.getState();
    channel.send({
      type: 'broadcast',
      event: 'gw_round_question_phase',
      payload: {
        timeRemaining: state.timeRemaining,
      },
    });
  }, []);

  const broadcastAnswerQuestion = useCallback((answer: 'yes' | 'no') => {
    const channel = channelRef.current;
    if (!channel) return;
    channel.send({
      type: 'broadcast',
      event: 'gw_question_answered',
      payload: { answer },
    });
  }, []);

  const broadcastRoundEnd = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    const state = store.getState();
    const latestResult = state.roundResults[state.roundResults.length - 1];
    if (!latestResult) return;
    const scores: Record<string, number> = {};
    state.players.forEach(p => { scores[p.id] = p.score; });

    const nextRound = state.currentRound + 1;
    const newPhase = nextRound > state.maxRounds ? 'game-over' : 'choosing';

    channel.send({
      type: 'broadcast',
      event: 'gw_round_end',
      payload: {
        result: latestResult,
        scores,
        newPhase,
      },
    });
  }, []);

  const broadcastTimerSync = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    channel.send({
      type: 'broadcast',
      event: 'gw_timer_sync',
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
      event: 'gw_game_over',
      payload: { scores },
    });
  }, []);

  const broadcastForceEnd = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    channel.send({
      type: 'broadcast',
      event: 'gw_force_end',
      payload: {},
    });
  }, []);

  // --- Send helpers (non-host sends to host) ---

  const sendQuestion = useCallback((question: string) => {
    const channel = channelRef.current;
    if (!channel) return;

    if (isHost) {
      const state = store.getState();
      const asker = state.players.find(p => p.id === playerId);
      if (asker) {
        store.getState().askQuestion(playerId!, asker.name, question);
        // Broadcast to others
        channel.send({
          type: 'broadcast',
          event: 'gw_question_asked',
          payload: { askerName: asker.name, question },
        });
      }
    } else {
      const state = store.getState();
      const asker = state.players.find(p => p.id === playerId);
      channel.send({
        type: 'broadcast',
        event: 'gw_ask_question',
        payload: {
          askerId: playerId,
          askerName: asker?.name || 'Player',
          question,
        },
      });
    }
  }, [isHost, playerId]);

  const sendGuess = useCallback((charId: string) => {
    const channel = channelRef.current;
    if (!channel) return;
    const state = store.getState();
    const guesser = state.players.find(p => p.id === playerId);
    if (!guesser) return;

    channel.send({
      type: 'broadcast',
      event: 'gw_player_guess',
      payload: { guesser, charId },
    });
  }, [playerId]);

  return {
    isReady,
    broadcastRoundStart,
    broadcastQuestioningPhase,
    broadcastAnswerQuestion,
    broadcastRoundEnd,
    broadcastTimerSync,
    broadcastGameOver,
    broadcastForceEnd,
    sendQuestion,
    sendGuess,
  };
}
