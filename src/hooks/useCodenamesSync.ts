// Codenames Multiplayer Sync via Supabase Realtime
// Host-authoritative: host runs game logic, broadcasts state to all clients
import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import useCodenamesStore from '../games/codenames/codenamesStore';
import type { CodenamesPhase, CodenamesPlayer } from '../games/codenames/codenamesStore';
import type { CodenamesCard, TeamColor, PlayerRole } from '../games/codenames/codenamesData';

interface UseCodenamesSyncOptions {
  roomCode: string | null;
  playerId: string | null;
  isHost: boolean;
}

export function useCodenamesSync({ roomCode, playerId, isHost }: UseCodenamesSyncOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isReady, setIsReady] = useState(false);
  const store = useCodenamesStore;

  useEffect(() => {
    if (!roomCode || !playerId) return;

    setIsReady(false);

    const channel = supabase.channel(`game:codenames:${roomCode}`, {
      config: {
        broadcast: { self: false },
      },
    });

    if (!isHost) {
      // === NON-HOST LISTENERS ===

      // Full game state sync (team setup, game start, etc.)
      channel.on('broadcast', { event: 'cn_game_state' }, ({ payload }) => {
        if (!payload) return;
        const {
          phase, board, currentTeam, startingTeam,
          currentClue, guessesRemaining, clueHistory,
          pinkRemaining, blueRemaining,
          winner, winReason,
          timerEnabled, timeRemaining,
          players,
        } = payload as {
          phase: CodenamesPhase;
          board: CodenamesCard[];
          currentTeam: TeamColor;
          startingTeam: TeamColor;
          currentClue: any;
          guessesRemaining: number;
          clueHistory: any[];
          pinkRemaining: number;
          blueRemaining: number;
          winner: TeamColor | null;
          winReason: 'cards' | 'assassin' | null;
          timerEnabled: boolean;
          timeRemaining: number;
          players: CodenamesPlayer[];
        };

        store.setState({
          phase, board, currentTeam, startingTeam,
          currentClue, guessesRemaining, clueHistory,
          pinkRemaining, blueRemaining,
          winner, winReason,
          timerEnabled, timeRemaining,
          players,
        });
      });

      // Team role updates during setup
      channel.on('broadcast', { event: 'cn_team_update' }, ({ payload }) => {
        if (!payload) return;
        const { players } = payload as { players: CodenamesPlayer[] };
        store.setState({ players });
      });

      // Timer toggle
      channel.on('broadcast', { event: 'cn_timer_toggle' }, ({ payload }) => {
        if (!payload) return;
        store.setState({ timerEnabled: payload.enabled as boolean });
      });

      // Board update (vote changes)
      channel.on('broadcast', { event: 'cn_board_update' }, ({ payload }) => {
        if (!payload) return;
        store.setState({ board: payload.board as CodenamesCard[] });
      });

      // Card locked (reveal + state changes)
      channel.on('broadcast', { event: 'cn_card_locked' }, ({ payload }) => {
        if (!payload) return;
        const {
          board, phase, currentTeam, currentClue,
          guessesRemaining, pinkRemaining, blueRemaining,
          winner, winReason, timeRemaining,
        } = payload as any;
        store.setState({
          board, phase, currentTeam, currentClue,
          guessesRemaining, pinkRemaining, blueRemaining,
          winner, winReason, timeRemaining,
        });
      });

      // Clue submitted
      channel.on('broadcast', { event: 'cn_clue_submitted' }, ({ payload }) => {
        if (!payload) return;
        const { currentClue, guessesRemaining, phase, clueHistory, board, timeRemaining } = payload as any;
        store.setState({ currentClue, guessesRemaining, phase, clueHistory, board, timeRemaining });
      });

      // Turn ended
      channel.on('broadcast', { event: 'cn_turn_ended' }, ({ payload }) => {
        if (!payload) return;
        const { currentTeam, currentClue, guessesRemaining, phase, board, timeRemaining } = payload as any;
        store.setState({ currentTeam, currentClue, guessesRemaining, phase, board, timeRemaining });
      });

      // Timer tick
      channel.on('broadcast', { event: 'cn_timer_tick' }, ({ payload }) => {
        if (!payload) return;
        store.setState({ timeRemaining: payload.timeRemaining as number });
      });

    } else {
      // === HOST LISTENERS ===

      // Player wants to join/leave a team role
      channel.on('broadcast', { event: 'cn_join_team' }, ({ payload }) => {
        if (!payload) return;
        const { playerId: pid, team, role } = payload as {
          playerId: string;
          team: TeamColor;
          role: PlayerRole;
        };
        store.getState().setPlayerTeamRole(pid, team, role);
        // Broadcast updated player list
        channel.send({
          type: 'broadcast',
          event: 'cn_team_update',
          payload: { players: store.getState().players },
        });
      });

      channel.on('broadcast', { event: 'cn_leave_team' }, ({ payload }) => {
        if (!payload) return;
        const { playerId: pid } = payload as { playerId: string };
        store.getState().clearPlayerTeamRole(pid);
        channel.send({
          type: 'broadcast',
          event: 'cn_team_update',
          payload: { players: store.getState().players },
        });
      });

      // Player votes on a card
      channel.on('broadcast', { event: 'cn_vote_card' }, ({ payload }) => {
        if (!payload) return;
        const { playerId: pid, cardIndex } = payload as { playerId: string; cardIndex: number };
        store.getState().voteCard(pid, cardIndex);
        channel.send({
          type: 'broadcast',
          event: 'cn_board_update',
          payload: { board: store.getState().board },
        });
      });

      // Player unvotes a card
      channel.on('broadcast', { event: 'cn_unvote_card' }, ({ payload }) => {
        if (!payload) return;
        const { playerId: pid, cardIndex } = payload as { playerId: string; cardIndex: number };
        store.getState().unvoteCard(pid, cardIndex);
        channel.send({
          type: 'broadcast',
          event: 'cn_board_update',
          payload: { board: store.getState().board },
        });
      });

      // Player locks in a card
      channel.on('broadcast', { event: 'cn_lock_card' }, ({ payload }) => {
        if (!payload) return;
        const { playerId: pid, cardIndex } = payload as { playerId: string; cardIndex: number };
        store.getState().lockCard(pid, cardIndex);
        // Broadcast the full post-lock state
        const s = store.getState();
        channel.send({
          type: 'broadcast',
          event: 'cn_card_locked',
          payload: {
            board: s.board,
            phase: s.phase,
            currentTeam: s.currentTeam,
            currentClue: s.currentClue,
            guessesRemaining: s.guessesRemaining,
            pinkRemaining: s.pinkRemaining,
            blueRemaining: s.blueRemaining,
            winner: s.winner,
            winReason: s.winReason,
            timeRemaining: s.timeRemaining,
          },
        });
      });

      // Non-host spymaster submits clue
      channel.on('broadcast', { event: 'cn_submit_clue' }, ({ payload }) => {
        if (!payload) return;
        const { word, number } = payload as { word: string; number: number };
        store.getState().submitClue(word, number);
        const s = store.getState();
        channel.send({
          type: 'broadcast',
          event: 'cn_clue_submitted',
          payload: {
            currentClue: s.currentClue,
            guessesRemaining: s.guessesRemaining,
            phase: s.phase,
            clueHistory: s.clueHistory,
            board: s.board,
            timeRemaining: s.timeRemaining,
          },
        });
      });

      // Non-host operative ends turn
      channel.on('broadcast', { event: 'cn_end_turn' }, () => {
        store.getState().endTurn();
        const s = store.getState();
        channel.send({
          type: 'broadcast',
          event: 'cn_turn_ended',
          payload: {
            currentTeam: s.currentTeam,
            currentClue: s.currentClue,
            guessesRemaining: s.guessesRemaining,
            phase: s.phase,
            board: s.board,
            timeRemaining: s.timeRemaining,
          },
        });
      });

      // State request from late joiners
      channel.on('broadcast', { event: 'cn_request_state' }, () => {
        const s = store.getState();
        channel.send({
          type: 'broadcast',
          event: 'cn_game_state',
          payload: {
            phase: s.phase,
            board: s.board,
            currentTeam: s.currentTeam,
            startingTeam: s.startingTeam,
            currentClue: s.currentClue,
            guessesRemaining: s.guessesRemaining,
            clueHistory: s.clueHistory,
            pinkRemaining: s.pinkRemaining,
            blueRemaining: s.blueRemaining,
            winner: s.winner,
            winReason: s.winReason,
            timerEnabled: s.timerEnabled,
            timeRemaining: s.timeRemaining,
            players: s.players,
          },
        });
      });
    }

    channel
      .subscribe((status) => {
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

  // === BROADCAST HELPERS ===

  const broadcastGameState = useCallback(() => {
    if (!channelRef.current || !isHost) return;
    const s = store.getState();
    channelRef.current.send({
      type: 'broadcast',
      event: 'cn_game_state',
      payload: {
        phase: s.phase,
        board: s.board,
        currentTeam: s.currentTeam,
        startingTeam: s.startingTeam,
        currentClue: s.currentClue,
        guessesRemaining: s.guessesRemaining,
        clueHistory: s.clueHistory,
        pinkRemaining: s.pinkRemaining,
        blueRemaining: s.blueRemaining,
        winner: s.winner,
        winReason: s.winReason,
        timerEnabled: s.timerEnabled,
        timeRemaining: s.timeRemaining,
        players: s.players,
      },
    });
  }, [isHost]);

  const broadcastTeamUpdate = useCallback(() => {
    if (!channelRef.current || !isHost) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'cn_team_update',
      payload: { players: store.getState().players },
    });
  }, [isHost]);

  const broadcastTimerToggle = useCallback((enabled: boolean) => {
    if (!channelRef.current || !isHost) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'cn_timer_toggle',
      payload: { enabled },
    });
  }, [isHost]);

  const broadcastTimerTick = useCallback((timeRemaining: number) => {
    if (!channelRef.current || !isHost) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'cn_timer_tick',
      payload: { timeRemaining },
    });
  }, [isHost]);

  // Non-host sends actions to host
  const sendJoinTeam = useCallback((team: TeamColor, role: PlayerRole) => {
    if (!channelRef.current || !playerId) return;
    if (isHost) {
      // Host can do it locally
      store.getState().setPlayerTeamRole(playerId, team, role);
      broadcastTeamUpdate();
    } else {
      channelRef.current.send({
        type: 'broadcast',
        event: 'cn_join_team',
        payload: { playerId, team, role },
      });
    }
  }, [isHost, playerId, broadcastTeamUpdate]);

  const sendLeaveTeam = useCallback(() => {
    if (!channelRef.current || !playerId) return;
    if (isHost) {
      store.getState().clearPlayerTeamRole(playerId);
      broadcastTeamUpdate();
    } else {
      channelRef.current.send({
        type: 'broadcast',
        event: 'cn_leave_team',
        payload: { playerId },
      });
    }
  }, [isHost, playerId, broadcastTeamUpdate]);

  const sendVoteCard = useCallback((cardIndex: number) => {
    if (!channelRef.current || !playerId) return;
    if (isHost) {
      store.getState().voteCard(playerId, cardIndex);
      // Broadcast board update
      channelRef.current.send({
        type: 'broadcast',
        event: 'cn_board_update',
        payload: { board: store.getState().board },
      });
    } else {
      channelRef.current.send({
        type: 'broadcast',
        event: 'cn_vote_card',
        payload: { playerId, cardIndex },
      });
    }
  }, [isHost, playerId]);

  const sendLockCard = useCallback((cardIndex: number) => {
    if (!channelRef.current || !playerId) return;
    if (isHost) {
      store.getState().lockCard(playerId, cardIndex);
      const s = store.getState();
      channelRef.current.send({
        type: 'broadcast',
        event: 'cn_card_locked',
        payload: {
          board: s.board,
          phase: s.phase,
          currentTeam: s.currentTeam,
          currentClue: s.currentClue,
          guessesRemaining: s.guessesRemaining,
          pinkRemaining: s.pinkRemaining,
          blueRemaining: s.blueRemaining,
          winner: s.winner,
          winReason: s.winReason,
          timeRemaining: s.timeRemaining,
        },
      });
    } else {
      channelRef.current.send({
        type: 'broadcast',
        event: 'cn_lock_card',
        payload: { playerId, cardIndex },
      });
    }
  }, [isHost, playerId]);

  const sendSubmitClue = useCallback((word: string, number: number) => {
    if (!channelRef.current) return;
    if (isHost) {
      store.getState().submitClue(word, number);
      const s = store.getState();
      channelRef.current.send({
        type: 'broadcast',
        event: 'cn_clue_submitted',
        payload: {
          currentClue: s.currentClue,
          guessesRemaining: s.guessesRemaining,
          phase: s.phase,
          clueHistory: s.clueHistory,
          board: s.board,
          timeRemaining: s.timeRemaining,
        },
      });
    } else {
      channelRef.current.send({
        type: 'broadcast',
        event: 'cn_submit_clue',
        payload: { word, number },
      });
    }
  }, [isHost]);

  const sendEndTurn = useCallback(() => {
    if (!channelRef.current) return;
    if (isHost) {
      store.getState().endTurn();
      const s = store.getState();
      channelRef.current.send({
        type: 'broadcast',
        event: 'cn_turn_ended',
        payload: {
          currentTeam: s.currentTeam,
          currentClue: s.currentClue,
          guessesRemaining: s.guessesRemaining,
          phase: s.phase,
          board: s.board,
          timeRemaining: s.timeRemaining,
        },
      });
    } else {
      channelRef.current.send({
        type: 'broadcast',
        event: 'cn_end_turn',
        payload: {},
      });
    }
  }, [isHost]);

  return {
    isReady,
    broadcastGameState,
    broadcastTeamUpdate,
    broadcastTimerToggle,
    broadcastTimerTick,
    sendJoinTeam,
    sendLeaveTeam,
    sendVoteCard,
    sendLockCard,
    sendSubmitClue,
    sendEndTurn,
  };
}
