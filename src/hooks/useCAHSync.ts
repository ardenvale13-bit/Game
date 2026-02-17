// Cards Against Humanity Multiplayer Sync via Supabase Realtime
// Host-authoritative: host runs game logic, broadcasts state to all clients
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import useCAHStore from '../games/cah/cahStore';
import type { CAHPhase, CAHSubmission } from '../games/cah/cahStore';
import type { WhiteCard, BlackCard } from '../games/cah/cardData';

interface UseCAHSyncOptions {
  roomCode: string | null;
  playerId: string | null;
  isHost: boolean;
}

export function useCAHSync({ roomCode, playerId, isHost }: UseCAHSyncOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const store = useCAHStore;

  useEffect(() => {
    if (!roomCode || !playerId) return;

    const channel = supabase.channel(`game:cah:${roomCode}`, {
      config: {
        broadcast: { self: false },
      },
    });

    if (!isHost) {
      // --- NON-HOST: Listen for game state from host ---

      // Round start — black card, czar, etc.
      channel.on('broadcast', { event: 'cah_round_start' }, ({ payload }) => {
        if (!payload) return;
        const { blackCard, czarIndex, round, phase, timeRemaining } = payload as {
          blackCard: BlackCard;
          czarIndex: number;
          round: number;
          phase: CAHPhase;
          timeRemaining: number;
        };
        const players = store.getState().players.map((p, idx) => ({
          ...p,
          isCzar: idx === czarIndex,
          selectedCards: [],
          hasSubmitted: false,
        }));
        store.setState({
          currentBlackCard: blackCard,
          czarIndex,
          currentRound: round,
          phase,
          timeRemaining,
          submissions: [],
          players,
        });
      });

      // Deal cards to this player
      channel.on('broadcast', { event: 'cah_deal_cards' }, ({ payload }) => {
        if (!payload) return;
        const { targetPlayerId, cards } = payload as { targetPlayerId: string; cards: WhiteCard[] };
        if (targetPlayerId !== playerId) return;

        const players = store.getState().players.map(p =>
          p.id === playerId ? { ...p, hand: cards } : p
        );
        store.setState({ players });
      });

      // Phase change
      channel.on('broadcast', { event: 'cah_phase' }, ({ payload }) => {
        if (!payload) return;
        const { phase, timeRemaining, submissions } = payload as {
          phase: CAHPhase;
          timeRemaining: number;
          submissions?: CAHSubmission[];
        };
        const updates: Partial<ReturnType<typeof store.getState>> = { phase, timeRemaining };
        if (submissions) {
          updates.submissions = submissions;
        }
        store.setState(updates as any);
      });

      // Submission count update
      channel.on('broadcast', { event: 'cah_submission_count' }, ({ payload }) => {
        if (!payload) return;
        const { submittedIds } = payload as { submittedIds: string[] };
        const players = store.getState().players.map(p => ({
          ...p,
          hasSubmitted: submittedIds.includes(p.id),
        }));
        store.setState({ players });
      });

      // Winner reveal
      channel.on('broadcast', { event: 'cah_winner' }, ({ payload }) => {
        if (!payload) return;
        const { submissions, scores } = payload as {
          winnerId: string;
          submissions: CAHSubmission[];
          scores: Record<string, number>;
        };
        const players = store.getState().players.map(p => ({
          ...p,
          score: scores[p.id] ?? p.score,
        }));
        store.setState({
          submissions,
          players,
          phase: 'reveal',
          timeRemaining: 5,
        });
      });

      // Game over
      channel.on('broadcast', { event: 'cah_game_over' }, ({ payload }) => {
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
      // --- HOST: Listen for player actions ---

      // Player submits cards
      channel.on('broadcast', { event: 'cah_submit' }, ({ payload }) => {
        if (!payload) return;
        const { senderId, cardIds } = payload as { senderId: string; cardIds: string[] };

        // Find the player and their selected cards
        const player = store.getState().players.find(p => p.id === senderId);
        if (!player || player.isCzar || player.hasSubmitted) return;

        const selectedCards = player.hand.filter(c => cardIds.includes(c.id));
        if (selectedCards.length === 0) return;

        // Temporarily set selected cards and submit
        store.setState({
          players: store.getState().players.map(p =>
            p.id === senderId ? { ...p, selectedCards } : p
          ),
        });
        store.getState().submitCards(senderId);
      });

      // Czar picks winner (if czar is non-host)
      channel.on('broadcast', { event: 'cah_pick_winner' }, ({ payload }) => {
        if (!payload) return;
        const { winnerId } = payload as { winnerId: string };
        store.getState().selectWinner(winnerId);
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

  // Host broadcasts round start
  const broadcastRoundStart = useCallback(() => {
    const channel = channelRef.current;
    if (!channel || !isHost) return;
    const state = store.getState();
    channel.send({
      type: 'broadcast',
      event: 'cah_round_start',
      payload: {
        blackCard: state.currentBlackCard,
        czarIndex: state.czarIndex,
        round: state.currentRound,
        phase: state.phase,
        timeRemaining: state.timeRemaining,
      },
    });
  }, [isHost]);

  // Host deals cards to a specific player
  const broadcastDealCards = useCallback((targetPlayerId: string, cards: WhiteCard[]) => {
    const channel = channelRef.current;
    if (!channel || !isHost) return;
    channel.send({
      type: 'broadcast',
      event: 'cah_deal_cards',
      payload: { targetPlayerId, cards },
    });
  }, [isHost]);

  // Host broadcasts phase change
  const broadcastPhaseChange = useCallback((phase: CAHPhase, timeRemaining: number, submissions?: CAHSubmission[]) => {
    const channel = channelRef.current;
    if (!channel || !isHost) return;
    channel.send({
      type: 'broadcast',
      event: 'cah_phase',
      payload: { phase, timeRemaining, submissions },
    });
  }, [isHost]);

  // Host broadcasts submission count
  const broadcastSubmissionCount = useCallback(() => {
    const channel = channelRef.current;
    if (!channel || !isHost) return;
    const submittedIds = store.getState().players.filter(p => p.hasSubmitted).map(p => p.id);
    channel.send({
      type: 'broadcast',
      event: 'cah_submission_count',
      payload: { submittedIds },
    });
  }, [isHost]);

  // Host broadcasts winner
  const broadcastWinner = useCallback((winnerId: string) => {
    const channel = channelRef.current;
    if (!channel || !isHost) return;
    const state = store.getState();
    const scores: Record<string, number> = {};
    state.players.forEach(p => { scores[p.id] = p.score; });
    channel.send({
      type: 'broadcast',
      event: 'cah_winner',
      payload: { winnerId, submissions: state.submissions, scores },
    });
  }, [isHost]);

  // Host broadcasts game over
  const broadcastGameOver = useCallback(() => {
    const channel = channelRef.current;
    if (!channel || !isHost) return;
    const scores: Record<string, number> = {};
    store.getState().players.forEach(p => { scores[p.id] = p.score; });
    channel.send({
      type: 'broadcast',
      event: 'cah_game_over',
      payload: { scores },
    });
  }, [isHost]);

  // Player submits cards (non-host)
  const broadcastSubmitCards = useCallback((cardIds: string[]) => {
    const channel = channelRef.current;
    if (!channel || !playerId) return;
    channel.send({
      type: 'broadcast',
      event: 'cah_submit',
      payload: { senderId: playerId, cardIds },
    });
  }, [playerId]);

  // Czar picks winner (non-host czar)
  const broadcastPickWinner = useCallback((winnerId: string) => {
    const channel = channelRef.current;
    if (!channel) return;
    channel.send({
      type: 'broadcast',
      event: 'cah_pick_winner',
      payload: { winnerId },
    });
  }, []);

  return {
    broadcastRoundStart,
    broadcastDealCards,
    broadcastPhaseChange,
    broadcastSubmissionCount,
    broadcastWinner,
    broadcastGameOver,
    broadcastSubmitCards,
    broadcastPickWinner,
    channel: channelRef,
  };
}
