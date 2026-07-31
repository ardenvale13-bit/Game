import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import useWhoSaidThatStore from '../games/who-said-that/whoSaidThatStore';
import type {
  WSTAnswer,
  WSTPhase,
} from '../games/who-said-that/whoSaidThatStore';

interface UseWhoSaidThatSyncOptions {
  roomCode: string | null;
  playerId: string | null;
  isHost: boolean;
  onForceEnd?: () => void;
}

interface SyncedPlayer {
  id: string;
  name?: string;
  avatarId?: string;
  avatarFilename?: string;
  isHost?: boolean;
  score: number;
  roundScore: number;
  hasAnswered: boolean;
  hasGuessed: boolean;
}

export function useWhoSaidThatSync({
  roomCode,
  playerId,
  isHost,
  onForceEnd,
}: UseWhoSaidThatSyncOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isReady, setIsReady] = useState(false);
  const store = useWhoSaidThatStore;

  useEffect(() => {
    if (!roomCode || !playerId) return;

    setIsReady(false);
    const channel = supabase.channel(`game:who-said-that:${roomCode}`, {
      config: { broadcast: { self: false } },
    });

    channel.on('broadcast', { event: 'wst_force_end' }, () => onForceEnd?.());

    if (!isHost) {
      channel.on('broadcast', { event: 'wst_round_start' }, ({ payload }) => {
        if (!payload) return;
        const data = payload as {
          prompt: string;
          round: number;
          maxRounds: number;
          timeRemaining: number;
        };
        store.setState((state) => ({
          phase: 'answering',
          currentPrompt: data.prompt,
          currentRound: data.round,
          maxRounds: data.maxRounds,
          timeRemaining: data.timeRemaining,
          answers: [],
          players: state.players.map(player => ({
            ...player,
            roundScore: 0,
            answer: '',
            ownAnswerId: null,
            hasAnswered: false,
            guesses: {},
            hasGuessed: false,
          })),
        }));
      });

      channel.on('broadcast', { event: 'wst_answer_count' }, ({ payload }) => {
        if (!payload) return;
        const { answeredIds } = payload as { answeredIds: string[] };
        store.setState((state) => ({
          players: state.players.map(player => ({
            ...player,
            hasAnswered: answeredIds.includes(player.id),
          })),
        }));
      });

      channel.on('broadcast', { event: 'wst_guessing' }, ({ payload }) => {
        if (!payload) return;
        const data = payload as {
          answers: WSTAnswer[];
          answeredIds: string[];
          timeRemaining: number;
        };
        store.setState((state) => ({
          phase: 'guessing',
          answers: data.answers,
          timeRemaining: data.timeRemaining,
          players: state.players.map(player => ({
            ...player,
            hasAnswered: data.answeredIds.includes(player.id),
            guesses: {},
            hasGuessed: !data.answeredIds.includes(player.id),
          })),
        }));
      });

      channel.on('broadcast', { event: 'wst_own_answer' }, ({ payload }) => {
        if (!payload) return;
        const data = payload as { targetPlayerId: string; answerId: string };
        if (data.targetPlayerId !== playerId) return;
        store.setState((state) => ({
          players: state.players.map(player =>
            player.id === playerId ? { ...player, ownAnswerId: data.answerId } : player
          ),
        }));
      });

      channel.on('broadcast', { event: 'wst_guess_count' }, ({ payload }) => {
        if (!payload) return;
        const { guessedIds } = payload as { guessedIds: string[] };
        store.setState((state) => ({
          players: state.players.map(player => ({
            ...player,
            hasGuessed: guessedIds.includes(player.id) || !player.hasAnswered,
          })),
        }));
      });

      channel.on('broadcast', { event: 'wst_results' }, ({ payload }) => {
        if (!payload) return;
        const data = payload as { answers: WSTAnswer[]; players: SyncedPlayer[] };
        store.setState((state) => ({
          phase: 'results',
          timeRemaining: 10,
          answers: data.answers,
          players: state.players.map(player => {
            const synced = data.players.find(candidate => candidate.id === player.id);
            return synced
              ? { ...player, score: synced.score, roundScore: synced.roundScore }
              : player;
          }),
        }));
      });

      channel.on('broadcast', { event: 'wst_game_over' }, ({ payload }) => {
        if (!payload) return;
        const { players } = payload as { players: SyncedPlayer[] };
        store.setState((state) => ({
          phase: 'game-over',
          players: state.players.map(player => {
            const synced = players.find(candidate => candidate.id === player.id);
            return synced
              ? { ...player, score: synced.score, roundScore: synced.roundScore }
              : player;
          }),
        }));
      });

      channel.on('broadcast', { event: 'wst_timer' }, ({ payload }) => {
        if (!payload) return;
        const { timeRemaining } = payload as { timeRemaining: number };
        store.setState({ timeRemaining });
      });

      channel.on('broadcast', { event: 'wst_full_state' }, ({ payload }) => {
        if (!payload) return;
        const data = payload as {
          targetPlayerId: string;
          phase: WSTPhase;
          currentRound: number;
          maxRounds: number;
          currentPrompt: string;
          timeRemaining: number;
          answers: WSTAnswer[];
          players: SyncedPlayer[];
          ownAnswerId: string | null;
        };
        if (data.targetPlayerId !== playerId) return;

        store.setState((state) => ({
          phase: data.phase,
          currentRound: data.currentRound,
          maxRounds: data.maxRounds,
          currentPrompt: data.currentPrompt,
          timeRemaining: data.timeRemaining,
          answers: data.answers,
          players: data.players.map(synced => {
            const player = state.players.find(candidate => candidate.id === synced.id);
            return {
              id: synced.id,
              name: synced.name ?? player?.name ?? 'Player',
              avatarId: synced.avatarId ?? player?.avatarId ?? '',
              avatarFilename: synced.avatarFilename ?? player?.avatarFilename ?? '',
              isHost: synced.isHost ?? player?.isHost ?? false,
              score: synced.score,
              roundScore: synced.roundScore,
              answer: player?.answer ?? '',
              hasAnswered: synced.hasAnswered,
              guesses: player?.guesses ?? {},
              hasGuessed: synced.hasGuessed,
              ownAnswerId: synced.id === playerId ? data.ownAnswerId : player?.ownAnswerId ?? null,
            };
          }),
        }));
      });
    }

    if (isHost) {
      channel.on('broadcast', { event: 'wst_submit_answer' }, ({ payload }) => {
        if (!payload) return;
        const { senderId, answer } = payload as { senderId: string; answer: string };
        store.getState().submitAnswer(senderId, answer);
      });

      channel.on('broadcast', { event: 'wst_submit_guesses' }, ({ payload }) => {
        if (!payload) return;
        const { senderId, guesses } = payload as {
          senderId: string;
          guesses: Record<string, string>;
        };
        store.getState().submitGuesses(senderId, guesses);
      });

      channel.on('broadcast', { event: 'wst_request_state' }, ({ payload }) => {
        if (!payload) return;
        const { senderId } = payload as { senderId: string };
        const state = store.getState();
        const publicAnswers = state.phase === 'results' || state.phase === 'game-over'
          ? state.answers
          : state.answers.map(({ id, text }) => ({ id, text }));
        const player = state.players.find(candidate => candidate.id === senderId);

        channel.send({
          type: 'broadcast',
          event: 'wst_full_state',
          payload: {
            targetPlayerId: senderId,
            phase: state.phase,
            currentRound: state.currentRound,
            maxRounds: state.maxRounds,
            currentPrompt: state.currentPrompt,
            timeRemaining: state.timeRemaining,
            answers: publicAnswers,
            players: state.players.map(candidate => ({
              id: candidate.id,
              name: candidate.name,
              avatarId: candidate.avatarId,
              avatarFilename: candidate.avatarFilename,
              isHost: candidate.isHost,
              score: candidate.score,
              roundScore: candidate.roundScore,
              hasAnswered: candidate.hasAnswered,
              hasGuessed: candidate.hasGuessed,
            })),
            ownAnswerId: player?.ownAnswerId ?? null,
          },
        });
      });
    }

    channel.subscribe((status) => {
      if (status !== 'SUBSCRIBED') return;
      channelRef.current = channel;
      setIsReady(true);
      if (!isHost) {
        channel.send({
          type: 'broadcast',
          event: 'wst_request_state',
          payload: { senderId: playerId },
        });
      }
    });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      setIsReady(false);
    };
  }, [roomCode, playerId, isHost, onForceEnd, store]);

  const send = useCallback((event: string, payload: Record<string, unknown>) => {
    channelRef.current?.send({ type: 'broadcast', event, payload });
  }, []);

  const broadcastRoundStart = useCallback(() => {
    if (!isHost) return;
    const state = store.getState();
    send('wst_round_start', {
      prompt: state.currentPrompt,
      round: state.currentRound,
      maxRounds: state.maxRounds,
      timeRemaining: state.timeRemaining,
    });
  }, [isHost, send, store]);

  const broadcastAnswerCount = useCallback(() => {
    if (!isHost) return;
    const answeredIds = store.getState().players
      .filter(player => player.hasAnswered)
      .map(player => player.id);
    send('wst_answer_count', { answeredIds });
  }, [isHost, send, store]);

  const broadcastGuessing = useCallback(() => {
    if (!isHost) return;
    const state = store.getState();
    const publicAnswers = state.answers.map(({ id, text }) => ({ id, text }));
    const answeredPlayers = state.players.filter(player => Boolean(player.answer));
    send('wst_guessing', {
      answers: publicAnswers,
      answeredIds: answeredPlayers.map(player => player.id),
      timeRemaining: state.timeRemaining,
    });
    answeredPlayers.forEach(player => {
      if (!player.ownAnswerId) return;
      send('wst_own_answer', {
        targetPlayerId: player.id,
        answerId: player.ownAnswerId,
      });
    });
  }, [isHost, send, store]);

  const broadcastGuessCount = useCallback(() => {
    if (!isHost) return;
    const guessedIds = store.getState().players
      .filter(player => player.hasGuessed)
      .map(player => player.id);
    send('wst_guess_count', { guessedIds });
  }, [isHost, send, store]);

  const broadcastResults = useCallback(() => {
    if (!isHost) return;
    const state = store.getState();
    send('wst_results', {
      answers: state.answers,
      players: state.players.map(player => ({
        id: player.id,
        score: player.score,
        roundScore: player.roundScore,
        hasAnswered: player.hasAnswered,
        hasGuessed: player.hasGuessed,
      })),
    });
  }, [isHost, send, store]);

  const broadcastGameOver = useCallback(() => {
    if (!isHost) return;
    const state = store.getState();
    send('wst_game_over', {
      players: state.players.map(player => ({
        id: player.id,
        score: player.score,
        roundScore: player.roundScore,
        hasAnswered: player.hasAnswered,
        hasGuessed: player.hasGuessed,
      })),
    });
  }, [isHost, send, store]);

  const broadcastTimer = useCallback(() => {
    if (!isHost) return;
    send('wst_timer', { timeRemaining: store.getState().timeRemaining });
  }, [isHost, send, store]);

  const broadcastSubmitAnswer = useCallback((answer: string) => {
    if (!playerId) return;
    send('wst_submit_answer', { senderId: playerId, answer });
  }, [playerId, send]);

  const broadcastSubmitGuesses = useCallback((guesses: Record<string, string>) => {
    if (!playerId) return;
    send('wst_submit_guesses', { senderId: playerId, guesses });
  }, [playerId, send]);

  const broadcastForceEnd = useCallback(() => send('wst_force_end', {}), [send]);

  return {
    isReady,
    broadcastRoundStart,
    broadcastAnswerCount,
    broadcastGuessing,
    broadcastGuessCount,
    broadcastResults,
    broadcastGameOver,
    broadcastTimer,
    broadcastSubmitAnswer,
    broadcastSubmitGuesses,
    broadcastForceEnd,
  };
}
