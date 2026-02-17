// Cards Against Humanity Multiplayer Sync via Supabase Realtime
// Host-authoritative: host runs game logic, broadcasts state to all clients
import { useEffect, useRef, useCallback, useState } from 'react';
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
  const [isReady, setIsReady] = useState(false);
  const store = useCAHStore;

  useEffect(() => {
    if (!roomCode || !playerId) return;

    setIsReady(false);

    const channel = supabase.channel(`game:cah:${roomCode}`, {
      config: {
        broadcast: { self: false },
      },
    });

    if (!isHost) {
      // --- NON-HOST: Listen for game state from host ---

      // Round start — black card, czar, hands, etc. (single atomic broadcast)
      channel.on('broadcast', { event: 'cah_round_start' }, ({ payload }) => {
        if (!payload) return;
        const { blackCard, czarIndex, czarPlayerId, round, phase, timeRemaining, playerHands } = payload as {
          blackCard: BlackCard;
          czarIndex: number;
          czarPlayerId?: string;
          round: number;
          phase: CAHPhase;
          timeRemaining: number;
          playerHands?: Record<string, WhiteCard[]>;
        };
        const players = store.getState().players.map((p, idx) => {
          const hand = playerHands?.[p.id] ?? p.hand;
          return {
            ...p,
            hand,
            // Use czarPlayerId (player ID) if available — immune to ordering differences
            isCzar: czarPlayerId ? p.id === czarPlayerId : idx === czarIndex,
            selectedCards: [] as WhiteCard[],
            hasSubmitted: false,
          };
        });
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
        const updates: Record<string, unknown> = { phase, timeRemaining };
        if (submissions) {
          updates.submissions = submissions;
        }
        store.setState(updates as any);
      });

      // Timer sync from host
      channel.on('broadcast', { event: 'cah_timer_sync' }, ({ payload }) => {
        if (!payload) return;
        const { timeRemaining } = payload as { timeRemaining: number };
        store.setState({ timeRemaining });
      });

      // Submission count update — only update hasSubmitted flag, preserve everything else
      channel.on('broadcast', { event: 'cah_submission_count' }, ({ payload }) => {
        if (!payload) return;
        const { submittedIds } = payload as { submittedIds: string[] };
        // Use a function updater to get the latest state and only touch hasSubmitted
        store.setState((state) => ({
          players: state.players.map(p => ({
            ...p,
            hasSubmitted: submittedIds.includes(p.id),
          })),
        }));
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

      // Full state response (for late joiners / reconnects)
      channel.on('broadcast', { event: 'cah_full_state' }, ({ payload }) => {
        if (!payload) return;
        const state = payload as {
          phase: CAHPhase;
          currentRound: number;
          maxRounds: number;
          czarIndex: number;
          timeRemaining: number;
          currentBlackCard: BlackCard | null;
          submissions: CAHSubmission[];
          players: Array<{
            id: string;
            name: string;
            score: number;
            isCzar: boolean;
            hasSubmitted: boolean;
          }>;
        };

        // Update player metadata without overwriting hands
        const currentPlayers = store.getState().players;
        const updatedPlayers = currentPlayers.map(p => {
          const synced = state.players.find(sp => sp.id === p.id);
          if (synced) {
            return {
              ...p,
              score: synced.score,
              isCzar: synced.isCzar,
              hasSubmitted: synced.hasSubmitted,
            };
          }
          return p;
        });

        store.setState({
          phase: state.phase,
          currentRound: state.currentRound,
          maxRounds: state.maxRounds,
          czarIndex: state.czarIndex,
          timeRemaining: state.timeRemaining,
          currentBlackCard: state.currentBlackCard,
          submissions: state.submissions,
          players: updatedPlayers,
        });
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

        // Set selected cards then submit
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

      // Respond to state requests from newly connected clients
      channel.on('broadcast', { event: 'cah_request_state' }, () => {
        setTimeout(() => {
          const state = store.getState();
          if (state.phase === 'lobby') return;

          channel.send({
            type: 'broadcast',
            event: 'cah_full_state',
            payload: {
              phase: state.phase,
              currentRound: state.currentRound,
              maxRounds: state.maxRounds,
              czarIndex: state.czarIndex,
              timeRemaining: state.timeRemaining,
              currentBlackCard: state.currentBlackCard,
              submissions: state.submissions,
              players: state.players.map(p => ({
                id: p.id,
                name: p.name,
                score: p.score,
                isCzar: p.isCzar,
                hasSubmitted: p.hasSubmitted,
              })),
            },
          });

          // Also send each non-host player their hand
          const nonHostPlayers = state.players.filter(p => !p.isHost);
          nonHostPlayers.forEach(p => {
            channel.send({
              type: 'broadcast',
              event: 'cah_deal_cards',
              payload: { targetPlayerId: p.id, cards: p.hand },
            });
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
            event: 'cah_request_state',
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

  // Host broadcasts round start (includes all player hands in one atomic message)
  const broadcastRoundStart = useCallback(() => {
    const channel = channelRef.current;
    if (!channel || !isHost) return;
    const state = store.getState();
    // Include each player's hand so non-host gets cards in the same broadcast
    const playerHands: Record<string, WhiteCard[]> = {};
    state.players.forEach(p => {
      playerHands[p.id] = p.hand;
    });
    const czarPlayer = state.players.find(p => p.isCzar);
    channel.send({
      type: 'broadcast',
      event: 'cah_round_start',
      payload: {
        blackCard: state.currentBlackCard,
        czarIndex: state.czarIndex,
        czarPlayerId: czarPlayer?.id ?? null,
        round: state.currentRound,
        phase: state.phase,
        timeRemaining: state.timeRemaining,
        playerHands,
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

  // Host broadcasts timer sync
  const broadcastTimerSync = useCallback(() => {
    const channel = channelRef.current;
    if (!channel || !isHost) return;
    channel.send({
      type: 'broadcast',
      event: 'cah_timer_sync',
      payload: { timeRemaining: store.getState().timeRemaining },
    });
  }, [isHost]);

  // Host broadcasts submission count
  const broadcastSubmissionCount = useCallback(() => {
    const channel = channelRef.current;
    if (!channel || !isHost) return;
    const state = store.getState();
    const submittedIds = state.players.filter(p => p.hasSubmitted).map(p => p.id);
    channel.send({
      type: 'broadcast',
      event: 'cah_submission_count',
      payload: { submittedIds, submissionCount: state.submissions.length },
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
    isReady,
    broadcastRoundStart,
    broadcastDealCards,
    broadcastPhaseChange,
    broadcastTimerSync,
    broadcastSubmissionCount,
    broadcastWinner,
    broadcastGameOver,
    broadcastSubmitCards,
    broadcastPickWinner,
    channel: channelRef,
  };
}
