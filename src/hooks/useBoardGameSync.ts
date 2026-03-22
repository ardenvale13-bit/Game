// Shared hook for syncing simple turn-based board games via Supabase Realtime
// Host-authoritative: host owns game state, broadcasts to opponent after each move
import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseBoardGameSyncOptions {
  roomCode: string;
  playerId: string;
  isHost: boolean;
}

interface BoardGameSync {
  isReady: boolean;
  // Host calls this after every state change to push to opponent
  broadcastState: (state: unknown) => void;
  // Send a move from client to host
  sendMove: (move: unknown) => void;
  // Latest state received (opponent's perspective)
  receivedState: unknown | null;
  // Latest move received (host's perspective)
  receivedMove: unknown | null;
  // Clear received move after processing
  clearMove: () => void;
  // Send force-end signal
  sendForceEnd: () => void;
  // Whether force-end was received
  forceEnded: boolean;
}

export function useBoardGameSync({ roomCode, playerId, isHost: _isHost }: UseBoardGameSyncOptions): BoardGameSync {
  // _isHost kept in interface for callers; may be used for future host-specific logic
  void _isHost;
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [receivedState, setReceivedState] = useState<unknown | null>(null);
  const [receivedMove, setReceivedMove] = useState<unknown | null>(null);
  const [forceEnded, setForceEnded] = useState(false);

  useEffect(() => {
    if (!roomCode || !playerId) return;

    const channel = supabase.channel(`board-game-${roomCode}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'board_state' }, ({ payload }) => {
        setReceivedState(payload.state);
      })
      .on('broadcast', { event: 'board_move' }, ({ payload }) => {
        setReceivedMove(payload.move);
      })
      .on('broadcast', { event: 'board_force_end' }, () => {
        setForceEnded(true);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setIsReady(true);
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      setIsReady(false);
    };
  }, [roomCode, playerId]);

  const broadcastState = useCallback((state: unknown) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'board_state',
      payload: { state, senderId: playerId },
    });
  }, [playerId]);

  const sendMove = useCallback((move: unknown) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'board_move',
      payload: { move, senderId: playerId },
    });
  }, [playerId]);

  const clearMove = useCallback(() => {
    setReceivedMove(null);
  }, []);

  const sendForceEnd = useCallback(() => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'board_force_end',
      payload: {},
    });
  }, []);

  return { isReady, broadcastState, sendMove, receivedState, receivedMove, clearMove, sendForceEnd, forceEnded };
}
