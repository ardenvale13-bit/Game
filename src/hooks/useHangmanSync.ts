// Hangman Multiplayer Sync via Supabase Realtime
// Host-authoritative: host runs game logic, broadcasts state to all clients
import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import useHangmanStore from '../games/hangman/hangmanStore';
import type { HangmanPhase } from '../games/hangman/hangmanStore';

interface UseHangmanSyncOptions {
  roomCode: string | null;
  playerId: string | null;
  isHost: boolean;
}

export function useHangmanSync({ roomCode, playerId, isHost }: UseHangmanSyncOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isReady, setIsReady] = useState(false);
  const store = useHangmanStore;

  useEffect(() => {
    if (!roomCode || !playerId) return;

    setIsReady(false);

    const channel = supabase.channel(`game:hangman:${roomCode}`, {
      config: {
        broadcast: { self: false },
      },
    });

    if (!isHost) {
      // --- NON-HOST: Listen for game state from host ---

      // Game state update (phase, word, letters, etc.)
      channel.on('broadcast', { event: 'hm_game_state' }, ({ payload }) => {
        if (!payload) return;
        const {
          phase,
          currentPickerIndex,
          secretWord,
          category,
          guessedLetters,
          wrongGuesses,
          currentRound,
        } = payload as {
          phase: HangmanPhase;
          currentPickerIndex: number;
          secretWord: string;
          category: string;
          guessedLetters: string[];
          wrongGuesses: number;
          currentRound: number;
        };
        store.setState({
          phase,
          currentPickerIndex,
          secretWord,
          category,
          guessedLetters,
          wrongGuesses,
          currentRound,
        });
      });

      // Word is set by picker
      channel.on('broadcast', { event: 'hm_word_set' }, ({ payload }) => {
        if (!payload) return;
        const { word, category } = payload as { word: string; category: string };
        store.setState({
          secretWord: word,
          category,
          phase: 'guessing',
          guessedLetters: [],
          wrongGuesses: 0,
        });
      });

      // Letter guessed
      channel.on('broadcast', { event: 'hm_letter_guessed' }, ({ payload }) => {
        if (!payload) return;
        const { guessedLetters, wrongGuesses, scores } = payload as {
          letter: string;
          guessedLetters: string[];
          wrongGuesses: number;
          scores: Record<string, number>;
        };

        const players = store.getState().players.map((p) => ({
          ...p,
          score: scores[p.id] ?? p.score,
        }));

        store.setState({
          guessedLetters,
          wrongGuesses,
          players,
        });
      });

      // Round result (won or lost)
      channel.on('broadcast', { event: 'hm_round_result' }, ({ payload }) => {
        if (!payload) return;
        const { phase, winner, scores } = payload as {
          phase: HangmanPhase;
          winner: string;
          scores: Record<string, number>;
        };

        const players = store.getState().players.map((p) => ({
          ...p,
          score: scores[p.id] ?? p.score,
        }));

        store.setState({
          phase,
          winner,
          players,
        });
      });

      // Next round
      channel.on('broadcast', { event: 'hm_next_round' }, ({ payload }) => {
        if (!payload) return;
        const { currentRound, currentPickerIndex } = payload as {
          currentRound: number;
          currentPickerIndex: number;
        };

        store.setState({
          phase: 'picking',
          currentRound,
          currentPickerIndex,
          guessedLetters: [],
          wrongGuesses: 0,
          secretWord: '',
          category: '',
          winner: null,
        });
      });

      // Game over
      channel.on('broadcast', { event: 'hm_game_over' }, ({ payload }) => {
        if (!payload) return;
        const { scores } = payload as { scores: Record<string, number> };

        const players = store.getState().players.map((p) => ({
          ...p,
          score: scores[p.id] ?? p.score,
        }));

        store.setState({
          phase: 'game-over',
          players,
        });
      });

      // Full state response (for late joiners / reconnects)
      channel.on('broadcast', { event: 'hm_full_state' }, ({ payload }) => {
        if (!payload) return;
        const state = payload as {
          phase: HangmanPhase;
          currentRound: number;
          currentPickerIndex: number;
          secretWord: string;
          category: string;
          guessedLetters: string[];
          wrongGuesses: number;
          winner: string | null;
          players: Array<{
            id: string;
            name: string;
            score: number;
          }>;
        };

        const currentPlayers = store.getState().players;
        const updatedPlayers = currentPlayers.map((p) => {
          const synced = state.players.find((sp) => sp.id === p.id);
          if (synced) {
            return {
              ...p,
              score: synced.score,
            };
          }
          return p;
        });

        store.setState({
          phase: state.phase,
          currentRound: state.currentRound,
          currentPickerIndex: state.currentPickerIndex,
          secretWord: state.secretWord,
          category: state.category,
          guessedLetters: state.guessedLetters,
          wrongGuesses: state.wrongGuesses,
          winner: state.winner,
          players: updatedPlayers,
        });
      });
    }

    if (isHost) {
      // --- HOST: Listen for player actions ---

      // Player sends word (picker)
      channel.on('broadcast', { event: 'hm_word_set' }, ({ payload }) => {
        if (!payload) return;
        const { word, category } = payload as { word: string; category: string };
        store.getState().setWord(word, category);
      });

      // Player guesses letter
      channel.on('broadcast', { event: 'hm_letter_guessed' }, ({ payload }) => {
        if (!payload) return;
        // Note: the actual letter is already processed in the non-host listeners
      });

      // Respond to state requests from newly connected clients
      channel.on('broadcast', { event: 'hm_request_state' }, () => {
        setTimeout(() => {
          const state = store.getState();
          if (state.phase === 'lobby') return;

          channel.send({
            type: 'broadcast',
            event: 'hm_full_state',
            payload: {
              phase: state.phase,
              currentRound: state.currentRound,
              currentPickerIndex: state.currentPickerIndex,
              secretWord: state.secretWord,
              category: state.category,
              guessedLetters: state.guessedLetters,
              wrongGuesses: state.wrongGuesses,
              winner: state.winner,
              players: state.players.map((p) => ({
                id: p.id,
                name: p.name,
                score: p.score,
              })),
            },
          });
        }, 200);
      });
    }

    // Subscribe WITH callback — only set channel ref after confirmed connected
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channelRef.current = channel;
        setIsReady(true);

        // Non-host: request current game state in case we missed initial broadcasts
        if (!isHost) {
          channel.send({
            type: 'broadcast',
            event: 'hm_request_state',
            payload: {},
          });
        }
      }
    });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      setIsReady(false);
    };
  }, [roomCode, playerId, isHost]);

  // --- BROADCAST HELPERS ---

  // Host broadcasts game state
  const broadcastGameState = useCallback(() => {
    const channel = channelRef.current;
    if (!channel || !isHost) return;
    const state = store.getState();
    channel.send({
      type: 'broadcast',
      event: 'hm_game_state',
      payload: {
        phase: state.phase,
        currentPickerIndex: state.currentPickerIndex,
        secretWord: state.secretWord,
        category: state.category,
        guessedLetters: state.guessedLetters,
        wrongGuesses: state.wrongGuesses,
        currentRound: state.currentRound,
      },
    });
  }, [isHost]);

  // Non-host picker sends word to host
  const broadcastSetWord = useCallback((word: string, category: string) => {
    const channel = channelRef.current;
    if (!channel || !playerId) return;
    channel.send({
      type: 'broadcast',
      event: 'hm_word_set',
      payload: { word, category, senderId: playerId },
    });
  }, [playerId]);

  // Non-host player guesses letter to host
  const broadcastGuessLetter = useCallback((letter: string) => {
    const channel = channelRef.current;
    if (!channel || !playerId) return;
    channel.send({
      type: 'broadcast',
      event: 'hm_letter_guessed',
      payload: { letter, senderId: playerId },
    });
  }, [playerId]);

  // Host broadcasts round result
  const broadcastRoundEnd = useCallback((phase: HangmanPhase, winner: string) => {
    const channel = channelRef.current;
    if (!channel || !isHost) return;
    const state = store.getState();
    const scores: Record<string, number> = {};
    state.players.forEach((p) => {
      scores[p.id] = p.score;
    });
    channel.send({
      type: 'broadcast',
      event: 'hm_round_result',
      payload: { phase, winner, scores },
    });
  }, [isHost]);

  // Host broadcasts next round
  const broadcastNextRound = useCallback(() => {
    const channel = channelRef.current;
    if (!channel || !isHost) return;
    const state = store.getState();
    channel.send({
      type: 'broadcast',
      event: 'hm_next_round',
      payload: {
        currentRound: state.currentRound,
        currentPickerIndex: state.currentPickerIndex,
      },
    });
  }, [isHost]);

  // Host broadcasts game over
  const broadcastGameOver = useCallback(() => {
    const channel = channelRef.current;
    if (!channel || !isHost) return;
    const scores: Record<string, number> = {};
    store.getState().players.forEach((p) => {
      scores[p.id] = p.score;
    });
    channel.send({
      type: 'broadcast',
      event: 'hm_game_over',
      payload: { scores },
    });
  }, [isHost]);

  return {
    isReady,
    broadcastGameState,
    broadcastSetWord,
    broadcastGuessLetter,
    broadcastRoundEnd,
    broadcastNextRound,
    broadcastGameOver,
  };
}
