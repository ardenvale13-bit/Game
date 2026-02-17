import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface PresencePlayer {
  id: string;
  name: string;
  avatarId: string;
  avatarFilename: string;
  isHost: boolean;
  score: number;
  joinedAt: number;
}

export interface BroadcastEvent {
  type: string;
  payload: Record<string, unknown>;
  senderId: string;
}

interface UseRealtimeRoomOptions {
  roomCode: string | null;
  player: PresencePlayer | null;
  onPlayersSync?: (players: PresencePlayer[]) => void;
  onPlayerJoin?: (player: PresencePlayer) => void;
  onPlayerLeave?: (player: PresencePlayer) => void;
  onBroadcast?: (event: BroadcastEvent) => void;
}

export function useRealtimeRoom({
  roomCode,
  player,
  onPlayersSync,
  onPlayerJoin,
  onPlayerLeave,
  onBroadcast,
}: UseRealtimeRoomOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [presencePlayers, setPresencePlayers] = useState<PresencePlayer[]>([]);

  // Track whether we've successfully called channel.track() yet.
  // Until this is true, we IGNORE presence sync events so they don't
  // wipe the local player list with an empty array.
  const hasTrackedRef = useRef(false);

  // Stable refs for callbacks to avoid re-subscribing
  const onPlayersSyncRef = useRef(onPlayersSync);
  const onPlayerJoinRef = useRef(onPlayerJoin);
  const onPlayerLeaveRef = useRef(onPlayerLeave);
  const onBroadcastRef = useRef(onBroadcast);

  useEffect(() => { onPlayersSyncRef.current = onPlayersSync; }, [onPlayersSync]);
  useEffect(() => { onPlayerJoinRef.current = onPlayerJoin; }, [onPlayerJoin]);
  useEffect(() => { onPlayerLeaveRef.current = onPlayerLeave; }, [onPlayerLeave]);
  useEffect(() => { onBroadcastRef.current = onBroadcast; }, [onBroadcast]);

  // Parse presence state into player list
  const parsePresenceState = useCallback((state: Record<string, unknown[]>): PresencePlayer[] => {
    const players: PresencePlayer[] = [];
    for (const presences of Object.values(state)) {
      for (const presence of presences) {
        const p = presence as PresencePlayer;
        if (p.id) {
          players.push(p);
        }
      }
    }
    // Sort: host first, then by joinedAt
    return players.sort((a, b) => {
      if (a.isHost && !b.isHost) return -1;
      if (!a.isHost && b.isHost) return 1;
      return a.joinedAt - b.joinedAt;
    });
  }, []);

  // Subscribe to channel
  useEffect(() => {
    if (!roomCode || !player) return;

    // Reset tracking flag for new subscription
    hasTrackedRef.current = false;

    const channel = supabase.channel(`room:${roomCode}`, {
      config: {
        presence: { key: player.id },
        broadcast: { self: false },
      },
    });

    // Presence sync — full state reconciliation
    // ONLY fires the callback after we've tracked ourselves
    channel.on('presence', { event: 'sync' }, () => {
      if (!hasTrackedRef.current) return; // Ignore early syncs

      const state = channel.presenceState();
      const players = parsePresenceState(state);
      setPresencePlayers(players);
      onPlayersSyncRef.current?.(players);
    });

    // Presence join
    channel.on('presence', { event: 'join' }, ({ newPresences }) => {
      if (!hasTrackedRef.current) return;
      for (const presence of newPresences) {
        const p = presence as unknown as PresencePlayer;
        if (p.id) {
          onPlayerJoinRef.current?.(p);
        }
      }
    });

    // Presence leave
    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      if (!hasTrackedRef.current) return;
      for (const presence of leftPresences) {
        const p = presence as unknown as PresencePlayer;
        if (p.id) {
          onPlayerLeaveRef.current?.(p);
        }
      }
    });

    // Broadcast — game events
    channel.on('broadcast', { event: 'game_event' }, ({ payload }) => {
      onBroadcastRef.current?.(payload as BroadcastEvent);
    });

    channel
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);

          // Track our presence FIRST
          await channel.track({
            id: player.id,
            name: player.name,
            avatarId: player.avatarId,
            avatarFilename: player.avatarFilename,
            isHost: player.isHost,
            score: player.score,
            joinedAt: player.joinedAt || Date.now(),
          });

          // NOW it's safe to process sync events
          hasTrackedRef.current = true;

          // Manually fire a sync now that we're tracked,
          // so we pick up anyone who was already in the room
          const state = channel.presenceState();
          const players = parsePresenceState(state);
          setPresencePlayers(players);
          onPlayersSyncRef.current?.(players);
        }
      });

    channelRef.current = channel;

    return () => {
      hasTrackedRef.current = false;
      channel.unsubscribe();
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [roomCode, player?.id]); // Only re-subscribe if room or player ID changes

  // Send a broadcast event to all other clients
  const sendEvent = useCallback((type: string, payload: Record<string, unknown> = {}) => {
    const channel = channelRef.current;
    if (!channel || !player) return;

    channel.send({
      type: 'broadcast',
      event: 'game_event',
      payload: {
        type,
        payload,
        senderId: player.id,
      },
    });
  }, [player?.id]);

  // Update presence data (e.g., score changes)
  const updatePresence = useCallback(async (updates: Partial<PresencePlayer>) => {
    const channel = channelRef.current;
    if (!channel || !player) return;

    await channel.track({
      id: player.id,
      name: player.name,
      avatarId: player.avatarId,
      avatarFilename: player.avatarFilename,
      isHost: player.isHost,
      score: player.score,
      joinedAt: player.joinedAt || Date.now(),
      ...updates,
    });
  }, [player]);

  return {
    isConnected,
    presencePlayers,
    sendEvent,
    updatePresence,
    channel: channelRef,
  };
}
