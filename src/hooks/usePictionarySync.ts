// Pictionary Multiplayer Sync via Supabase Realtime
// Host-authoritative: host runs game logic, broadcasts state to all clients
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useGameStore } from '../store/gameStore';
import type { DrawCommand, ChatMessage, GamePhase } from '../store/gameStore';

interface UsePictionarySyncOptions {
  roomCode: string | null;
  playerId: string | null;
  isHost: boolean;
}

export function usePictionarySync({ roomCode, playerId, isHost }: UsePictionarySyncOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const store = useGameStore;

  // Subscribe to game channel
  useEffect(() => {
    if (!roomCode || !playerId) return;

    const channel = supabase.channel(`game:pictionary:${roomCode}`, {
      config: {
        broadcast: { self: false },
      },
    });

    // --- DRAWING EVENTS (all clients listen) ---
    channel.on('broadcast', { event: 'draw' }, ({ payload }) => {
      if (!payload) return;
      const cmd = payload as DrawCommand;
      store.getState().addDrawCommand(cmd);
    });

    channel.on('broadcast', { event: 'clear_canvas' }, () => {
      store.getState().clearCanvas();
    });

    // --- GAME STATE EVENTS (non-host clients listen) ---
    if (!isHost) {
      channel.on('broadcast', { event: 'game_state' }, ({ payload }) => {
        if (!payload) return;
        const state = payload as {
          phase: GamePhase;
          currentRound: number;
          totalRounds: number;
          currentDrawerIndex: number;
          wordHint: string;
          timeRemaining: number;
          currentWord: string | null;
          players: Array<{
            id: string;
            name: string;
            score: number;
            isDrawing: boolean;
            hasGuessedCorrectly: boolean;
          }>;
        };

        // Apply state updates
        store.setState({
          phase: state.phase,
          currentRound: state.currentRound,
          totalRounds: state.totalRounds,
          currentDrawerIndex: state.currentDrawerIndex,
          wordHint: state.wordHint,
          timeRemaining: state.timeRemaining,
          // Only set currentWord if this player is the drawer
          currentWord: store.getState().players[state.currentDrawerIndex]?.id === playerId
            ? state.currentWord
            : null,
        });

        // Update player scores and states
        const currentPlayers = store.getState().players;
        const updatedPlayers = currentPlayers.map(p => {
          const synced = state.players.find(sp => sp.id === p.id);
          if (synced) {
            return {
              ...p,
              score: synced.score,
              isDrawing: synced.isDrawing,
              hasGuessedCorrectly: synced.hasGuessedCorrectly,
            };
          }
          return p;
        });
        store.setState({ players: updatedPlayers });
      });

      // Word options for drawer
      channel.on('broadcast', { event: 'word_options' }, ({ payload }) => {
        if (!payload) return;
        const { targetPlayerId, words } = payload as { targetPlayerId: string; words: Array<{ text: string; difficulty: 'easy' | 'medium' | 'hard' }> };
        if (targetPlayerId === playerId) {
          store.setState({ wordOptions: words });
        }
      });

      // Chat/guess messages
      channel.on('broadcast', { event: 'chat_message' }, ({ payload }) => {
        if (!payload) return;
        const msg = payload as ChatMessage;
        // Avoid duplicates
        const existing = store.getState().messages;
        if (!existing.find(m => m.id === msg.id)) {
          store.setState({ messages: [...existing, msg] });
        }
      });

      // Guess result
      channel.on('broadcast', { event: 'guess_result' }, ({ payload }) => {
        if (!payload) return;
        const { playerId: guesserId, isCorrect, points } = payload as {
          playerId: string;
          isCorrect: boolean;
          points: number;
        };
        if (isCorrect) {
          store.getState().updatePlayer(guesserId, {
            score: (store.getState().players.find(p => p.id === guesserId)?.score || 0) + points,
            hasGuessedCorrectly: true,
          });
        }
      });

      // Round end — reveal word
      channel.on('broadcast', { event: 'round_end' }, ({ payload }) => {
        if (!payload) return;
        store.setState({
          currentWord: (payload as { word: string }).word,
          phase: 'round-end',
        });
      });
    }

    // --- GUESS EVENTS (host listens for guesses from other players) ---
    if (isHost) {
      channel.on('broadcast', { event: 'submit_guess' }, ({ payload }) => {
        if (!payload) return;
        const { senderId, playerName, guess } = payload as {
          senderId: string;
          playerName: string;
          guess: string;
        };
        // Host validates the guess
        const isCorrect = store.getState().submitGuess(senderId, playerName, guess);

        // Broadcast the result
        if (isCorrect) {
          const player = store.getState().players.find(p => p.id === senderId);
          channel.send({
            type: 'broadcast',
            event: 'guess_result',
            payload: {
              playerId: senderId,
              isCorrect: true,
              points: player?.score || 0,
            },
          });
        }

        // Broadcast chat message
        const messages = store.getState().messages;
        const latestMsg = messages[messages.length - 1];
        if (latestMsg) {
          channel.send({
            type: 'broadcast',
            event: 'chat_message',
            payload: latestMsg,
          });
        }
      });

      // Host listens for word selection from drawer
      channel.on('broadcast', { event: 'select_word' }, ({ payload }) => {
        if (!payload) return;
        const { word } = payload as { word: string };
        store.getState().selectWord(word);
      });
    }

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [roomCode, playerId, isHost]);

  // --- BROADCAST HELPERS ---

  // Host broadcasts full game state
  const broadcastGameState = useCallback(() => {
    const channel = channelRef.current;
    if (!channel || !isHost) return;

    const state = store.getState();
    channel.send({
      type: 'broadcast',
      event: 'game_state',
      payload: {
        phase: state.phase,
        currentRound: state.currentRound,
        totalRounds: state.totalRounds,
        currentDrawerIndex: state.currentDrawerIndex,
        wordHint: state.wordHint,
        timeRemaining: state.timeRemaining,
        currentWord: state.currentWord,
        players: state.players.map(p => ({
          id: p.id,
          name: p.name,
          score: p.score,
          isDrawing: p.isDrawing,
          hasGuessedCorrectly: p.hasGuessedCorrectly,
        })),
      },
    });
  }, [isHost]);

  // Broadcast draw command (from drawer)
  const broadcastDraw = useCallback((command: DrawCommand) => {
    const channel = channelRef.current;
    if (!channel) return;
    channel.send({
      type: 'broadcast',
      event: 'draw',
      payload: command,
    });
  }, []);

  // Broadcast clear canvas
  const broadcastClearCanvas = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    channel.send({
      type: 'broadcast',
      event: 'clear_canvas',
      payload: {},
    });
  }, []);

  // Submit guess (from non-host non-drawer players)
  const broadcastGuess = useCallback((playerName: string, guess: string) => {
    const channel = channelRef.current;
    if (!channel || !playerId) return;
    channel.send({
      type: 'broadcast',
      event: 'submit_guess',
      payload: { senderId: playerId, playerName, guess },
    });
  }, [playerId]);

  // Broadcast word options to drawer
  const broadcastWordOptions = useCallback((targetPlayerId: string, words: Array<{ text: string; difficulty?: number }>) => {
    const channel = channelRef.current;
    if (!channel || !isHost) return;
    channel.send({
      type: 'broadcast',
      event: 'word_options',
      payload: { targetPlayerId, words },
    });
  }, [isHost]);

  // Drawer selects word (non-host drawer sends to host)
  const broadcastWordSelection = useCallback((word: string) => {
    const channel = channelRef.current;
    if (!channel) return;
    channel.send({
      type: 'broadcast',
      event: 'select_word',
      payload: { word },
    });
  }, []);

  // Broadcast round end with word reveal
  const broadcastRoundEnd = useCallback((word: string) => {
    const channel = channelRef.current;
    if (!channel || !isHost) return;
    channel.send({
      type: 'broadcast',
      event: 'round_end',
      payload: { word },
    });
  }, [isHost]);

  // Broadcast chat message
  const broadcastChatMessage = useCallback((message: ChatMessage) => {
    const channel = channelRef.current;
    if (!channel) return;
    channel.send({
      type: 'broadcast',
      event: 'chat_message',
      payload: message,
    });
  }, []);

  return {
    broadcastGameState,
    broadcastDraw,
    broadcastClearCanvas,
    broadcastGuess,
    broadcastWordOptions,
    broadcastWordSelection,
    broadcastRoundEnd,
    broadcastChatMessage,
    channel: channelRef,
  };
}
