// fAImily Feud - Multiplayer Sync via Supabase Realtime
// Host-authoritative: host runs game logic, broadcasts state to all clients
import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import useFamilyFeudStore from '../games/family-feud/familyFeudStore';
import type { FFTeam, FFPhase } from '../games/family-feud/familyFeudStore';

interface UseFamilyFeudSyncOptions {
  roomCode: string | null;
  playerId: string | null;
  isHost: boolean;
}

export function useFamilyFeudSync({ roomCode, playerId, isHost }: UseFamilyFeudSyncOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isReady, setIsReady] = useState(false);
  const store = useFamilyFeudStore;

  useEffect(() => {
    if (!roomCode || !playerId) return;

    setIsReady(false);

    const channel = supabase.channel(`game:familyfeud:${roomCode}`, {
      config: {
        broadcast: { self: false },
      },
    });

    if (!isHost) {
      // --- NON-HOST LISTENERS ---

      // Team setup phase
      channel.on('broadcast', { event: 'ff_team_setup' }, ({ payload }) => {
        if (!payload) return;
        store.setState({
          phase: 'team-setup' as FFPhase,
          timeRemaining: payload.timeRemaining as number,
        });
      });

      // Team assignment update
      channel.on('broadcast', { event: 'ff_team_update' }, ({ payload }) => {
        if (!payload) return;
        const { teams, teamNames } = payload as {
          teams: Record<string, FFTeam | null>;
          teamNames: { pink: string; purple: string };
        };
        store.setState((state) => ({
          players: state.players.map((p) => ({
            ...p,
            team: teams[p.id] !== undefined ? teams[p.id] : p.team,
          })),
          pinkTeamName: teamNames.pink,
          purpleTeamName: teamNames.purple,
        }));
      });

      // Face-off start
      channel.on('broadcast', { event: 'ff_face_off' }, ({ payload }) => {
        if (!payload) return;
        store.setState(payload as Partial<ReturnType<typeof store.getState>>);
      });

      // Buzz update
      channel.on('broadcast', { event: 'ff_buzz_update' }, ({ payload }) => {
        if (!payload) return;
        const { faceOffBuzzes, faceOffLocked } = payload as {
          faceOffBuzzes: Record<string, { answer: string; timestamp: number }>;
          faceOffLocked: Record<string, boolean>;
        };
        store.setState({ faceOffBuzzes, faceOffLocked });
      });

      // Face-off resolved
      channel.on('broadcast', { event: 'ff_face_off_resolved' }, ({ payload }) => {
        if (!payload) return;
        store.setState(payload as Partial<ReturnType<typeof store.getState>>);
      });

      // Board play phase
      channel.on('broadcast', { event: 'ff_board_play' }, ({ payload }) => {
        if (!payload) return;
        store.setState(payload as Partial<ReturnType<typeof store.getState>>);
      });

      // Board answer revealed
      channel.on('broadcast', { event: 'ff_answer_revealed' }, ({ payload }) => {
        if (!payload) return;
        store.setState(payload as Partial<ReturnType<typeof store.getState>>);
      });

      // Strike added
      channel.on('broadcast', { event: 'ff_strike' }, ({ payload }) => {
        if (!payload) return;
        store.setState(payload as Partial<ReturnType<typeof store.getState>>);
      });

      // Steal attempt phase
      channel.on('broadcast', { event: 'ff_steal_attempt' }, ({ payload }) => {
        if (!payload) return;
        store.setState(payload as Partial<ReturnType<typeof store.getState>>);
      });

      // Steal result
      channel.on('broadcast', { event: 'ff_steal_result' }, ({ payload }) => {
        if (!payload) return;
        store.setState(payload as Partial<ReturnType<typeof store.getState>>);
      });

      // Round results
      channel.on('broadcast', { event: 'ff_round_results' }, ({ payload }) => {
        if (!payload) return;
        store.setState(payload as Partial<ReturnType<typeof store.getState>>);
      });

      // Game over
      channel.on('broadcast', { event: 'ff_game_over' }, ({ payload }) => {
        if (!payload) return;
        store.setState(payload as Partial<ReturnType<typeof store.getState>>);
      });

      // Timer sync
      channel.on('broadcast', { event: 'ff_timer_sync' }, ({ payload }) => {
        if (!payload) return;
        store.setState({ timeRemaining: payload.timeRemaining as number });
      });

      // Full state (late joiners)
      channel.on('broadcast', { event: 'ff_full_state' }, ({ payload }) => {
        if (!payload) return;
        store.getState().setFullState(payload as any);
      });

    } else {
      // --- HOST LISTENERS ---

      // Player team assignment
      channel.on('broadcast', { event: 'ff_assign_team' }, ({ payload }) => {
        if (!payload) return;
        const { playerId: pid, team } = payload as { playerId: string; team: FFTeam | null };
        store.getState().assignTeam(pid, team);
        broadcastTeamUpdate();
      });

      // Team name change
      channel.on('broadcast', { event: 'ff_team_name' }, ({ payload }) => {
        if (!payload) return;
        const { team, name } = payload as { team: FFTeam; name: string };
        if (team === 'pink') {
          store.setState({ pinkTeamName: name });
        } else {
          store.setState({ purpleTeamName: name });
        }
        broadcastTeamUpdate();
      });

      // Player buzz (face-off)
      channel.on('broadcast', { event: 'ff_buzz' }, ({ payload }) => {
        if (!payload) return;
        const { playerId: pid, answer, timestamp } = payload as {
          playerId: string;
          answer: string;
          timestamp: number;
        };
        store.getState().recordBuzz(pid, answer, timestamp);
        // Broadcast buzz state to all
        const state = store.getState();
        channel.send({
          type: 'broadcast',
          event: 'ff_buzz_update',
          payload: {
            faceOffBuzzes: state.faceOffBuzzes,
            faceOffLocked: state.faceOffLocked,
          },
        });
      });

      // Player guess (board play)
      channel.on('broadcast', { event: 'ff_guess' }, ({ payload }) => {
        if (!payload) return;
        const { answer } = payload as { answer: string };
        store.getState().makeGuess(answer);
        broadcastBoardState();
      });

      // Player steal attempt
      channel.on('broadcast', { event: 'ff_steal' }, ({ payload }) => {
        if (!payload) return;
        const { answer } = payload as { answer: string };
        store.getState().attemptSteal(answer);
        broadcastStealResult();
      });

      // State request (late joiner)
      channel.on('broadcast', { event: 'ff_request_state' }, () => {
        const fullState = store.getState().getFullState();
        channel.send({
          type: 'broadcast',
          event: 'ff_full_state',
          payload: fullState,
        });
      });
    }

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channelRef.current = channel;
        setIsReady(true);

        if (!isHost) {
          setTimeout(() => {
            channel.send({ type: 'broadcast', event: 'ff_request_state', payload: {} });
          }, 300);
        }
      }
    });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [roomCode, playerId, isHost]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Broadcast helpers (host only) ---

  const broadcastTeamUpdate = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    const state = store.getState();
    const teams: Record<string, FFTeam | null> = {};
    state.players.forEach((p) => { teams[p.id] = p.team; });
    channel.send({
      type: 'broadcast',
      event: 'ff_team_update',
      payload: {
        teams,
        teamNames: { pink: state.pinkTeamName, purple: state.purpleTeamName },
      },
    });
  }, []);

  const broadcastPhaseState = useCallback((event: string) => {
    const channel = channelRef.current;
    if (!channel) return;
    const fullState = store.getState().getFullState();
    channel.send({ type: 'broadcast', event, payload: fullState });
  }, []);

  const broadcastBoardState = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    const state = store.getState();
    channel.send({
      type: 'broadcast',
      event: 'ff_answer_revealed',
      payload: {
        boardAnswers: state.boardAnswers,
        lastGuess: state.lastGuess,
        lastGuessResult: state.lastGuessResult,
        strikes: state.strikes,
        currentTurnPlayerId: state.currentTurnPlayerId,
        turnIndex: state.turnIndex,
        phase: state.phase,
        stealingTeam: state.stealingTeam,
        timeRemaining: state.timeRemaining,
      },
    });
  }, []);

  const broadcastStealResult = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    const state = store.getState();
    channel.send({
      type: 'broadcast',
      event: 'ff_steal_result',
      payload: {
        stealAnswer: state.stealAnswer,
        stealResult: state.stealResult,
        boardAnswers: state.boardAnswers,
        phase: state.phase,
        roundPoints: state.roundPoints,
        roundWinnerTeam: state.roundWinnerTeam,
        pinkScore: state.pinkScore,
        purpleScore: state.purpleScore,
      },
    });
  }, []);

  const broadcastTimerSync = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    channel.send({
      type: 'broadcast',
      event: 'ff_timer_sync',
      payload: { timeRemaining: store.getState().timeRemaining },
    });
  }, []);

  // --- Send helpers (both host and non-host) ---

  const sendAssignTeam = useCallback((pid: string, team: FFTeam | null) => {
    const channel = channelRef.current;
    if (!channel) return;

    if (isHost) {
      store.getState().assignTeam(pid, team);
      broadcastTeamUpdate();
    } else {
      channel.send({
        type: 'broadcast',
        event: 'ff_assign_team',
        payload: { playerId: pid, team },
      });
    }
  }, [isHost, broadcastTeamUpdate]);

  const sendTeamName = useCallback((team: FFTeam, name: string) => {
    const channel = channelRef.current;
    if (!channel) return;

    if (isHost) {
      if (team === 'pink') store.setState({ pinkTeamName: name });
      else store.setState({ purpleTeamName: name });
      broadcastTeamUpdate();
    } else {
      channel.send({
        type: 'broadcast',
        event: 'ff_team_name',
        payload: { team, name },
      });
    }
  }, [isHost, broadcastTeamUpdate]);

  const sendBuzz = useCallback((answer: string) => {
    const channel = channelRef.current;
    if (!channel || !playerId) return;
    const timestamp = Date.now();

    if (isHost) {
      store.getState().recordBuzz(playerId, answer, timestamp);
      const state = store.getState();
      channel.send({
        type: 'broadcast',
        event: 'ff_buzz_update',
        payload: {
          faceOffBuzzes: state.faceOffBuzzes,
          faceOffLocked: state.faceOffLocked,
        },
      });
    } else {
      channel.send({
        type: 'broadcast',
        event: 'ff_buzz',
        payload: { playerId, answer, timestamp },
      });
    }
  }, [isHost, playerId]);

  const sendGuess = useCallback((answer: string) => {
    const channel = channelRef.current;
    if (!channel) return;

    if (isHost) {
      store.getState().makeGuess(answer);
      broadcastBoardState();
    } else {
      channel.send({
        type: 'broadcast',
        event: 'ff_guess',
        payload: { answer },
      });
    }
  }, [isHost, broadcastBoardState]);

  const sendSteal = useCallback((answer: string) => {
    const channel = channelRef.current;
    if (!channel) return;

    if (isHost) {
      store.getState().attemptSteal(answer);
      broadcastStealResult();
    } else {
      channel.send({
        type: 'broadcast',
        event: 'ff_steal',
        payload: { answer },
      });
    }
  }, [isHost, broadcastStealResult]);

  return {
    isReady,
    broadcastPhaseState,
    broadcastTeamUpdate,
    broadcastBoardState,
    broadcastStealResult,
    broadcastTimerSync,
    sendAssignTeam,
    sendTeamName,
    sendBuzz,
    sendGuess,
    sendSteal,
  };
}
