// Wavelength Multiplayer Sync via Supabase Realtime
// Host-authoritative: host runs game logic, broadcasts state to all clients
import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import useWavelengthStore from '../games/wavelength/wavelengthStore';
import type { WavelengthPhase, WavelengthPlayer } from '../games/wavelength/wavelengthStore';
import type { Spectrum } from '../games/wavelength/wavelengthData';

interface UseWavelengthSyncOptions {
  roomCode: string | null;
  playerId: string | null;
  isHost: boolean;
}

export function useWavelengthSync({ roomCode, playerId, isHost }: UseWavelengthSyncOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isReady, setIsReady] = useState(false);
  const store = useWavelengthStore;

  useEffect(() => {
    if (!roomCode || !playerId) return;

    setIsReady(false);

    const channel = supabase.channel(`game:wavelength:${roomCode}`, {
      config: {
        broadcast: { self: false },
      },
    });

    if (!isHost) {
      // === NON-HOST LISTENERS ===

      // Full game state sync
      channel.on('broadcast', { event: 'wl_game_state' }, ({ payload }) => {
        if (!payload) return;
        const {
          phase, spectrum, targetPosition, currentClue, teamGuessPosition,
          counterGuess, currentTeam, psychicIndex,
          pinkScore, blueScore, pointsToWin,
          lastRoundPoints, lastCounterCorrect,
          winner, roundDistance, roundAccuracy,
          players,
        } = payload as {
          phase: WavelengthPhase;
          spectrum: Spectrum | null;
          targetPosition: number;
          currentClue: string;
          teamGuessPosition: number;
          counterGuess: 'higher' | 'lower' | null;
          currentTeam: 'pink' | 'blue';
          psychicIndex: { pink: number; blue: number };
          pinkScore: number;
          blueScore: number;
          pointsToWin: number;
          lastRoundPoints: number;
          lastCounterCorrect: boolean | null;
          winner: 'pink' | 'blue' | null;
          roundDistance: number;
          roundAccuracy: 'bullseye' | 'close' | 'near' | 'miss' | null;
          players: WavelengthPlayer[];
        };

        store.setState({
          phase,
          spectrum,
          targetPosition,
          currentClue,
          teamGuessPosition,
          counterGuess,
          currentTeam,
          psychicIndex,
          pinkScore,
          blueScore,
          pointsToWin,
          lastRoundPoints,
          lastCounterCorrect,
          winner,
          roundDistance,
          roundAccuracy,
          players,
        });
      });

      // Team update during setup
      channel.on('broadcast', { event: 'wl_team_update' }, ({ payload }) => {
        if (!payload) return;
        const { players } = payload as { players: WavelengthPlayer[] };
        store.setState({ players });
      });

      // Clue submitted
      channel.on('broadcast', { event: 'wl_clue_submitted' }, ({ payload }) => {
        if (!payload) return;
        const { currentClue, phase } = payload as { currentClue: string; phase: WavelengthPhase };
        store.setState({ currentClue, phase });
      });

      // Team guess submitted
      channel.on('broadcast', { event: 'wl_team_guess' }, ({ payload }) => {
        if (!payload) return;
        const {
          teamGuessPosition, phase, pinkScore, blueScore,
          lastRoundPoints, roundDistance, roundAccuracy, winner,
        } = payload as {
          teamGuessPosition: number;
          phase: WavelengthPhase;
          pinkScore: number;
          blueScore: number;
          lastRoundPoints: number;
          roundDistance: number;
          roundAccuracy: 'bullseye' | 'close' | 'near' | 'miss' | null;
          winner: 'pink' | 'blue' | null;
        };
        store.setState({
          teamGuessPosition,
          phase,
          pinkScore,
          blueScore,
          lastRoundPoints,
          roundDistance,
          roundAccuracy,
          winner,
        });
      });

      // Counter guess submitted
      channel.on('broadcast', { event: 'wl_counter_guess' }, ({ payload }) => {
        if (!payload) return;
        const {
          counterGuess, phase, pinkScore, blueScore,
          lastCounterCorrect, winner,
        } = payload as {
          counterGuess: 'higher' | 'lower';
          phase: WavelengthPhase;
          pinkScore: number;
          blueScore: number;
          lastCounterCorrect: boolean;
          winner: 'pink' | 'blue' | null;
        };
        store.setState({
          counterGuess,
          phase,
          pinkScore,
          blueScore,
          lastCounterCorrect,
          winner,
        });
      });

      // Round advanced
      channel.on('broadcast', { event: 'wl_round_advance' }, ({ payload }) => {
        if (!payload) return;
        const {
          phase, currentTeam, spectrum, targetPosition,
          psychicIndex, currentClue, teamGuessPosition,
          counterGuess, lastRoundPoints, lastCounterCorrect,
          roundDistance, roundAccuracy,
        } = payload as {
          phase: WavelengthPhase;
          currentTeam: 'pink' | 'blue';
          spectrum: Spectrum | null;
          targetPosition: number;
          psychicIndex: { pink: number; blue: number };
          currentClue: string;
          teamGuessPosition: number;
          counterGuess: 'higher' | 'lower' | null;
          lastRoundPoints: number;
          lastCounterCorrect: boolean | null;
          roundDistance: number;
          roundAccuracy: 'bullseye' | 'close' | 'near' | 'miss' | null;
        };
        store.setState({
          phase,
          currentTeam,
          spectrum,
          targetPosition,
          psychicIndex,
          currentClue,
          teamGuessPosition,
          counterGuess,
          lastRoundPoints,
          lastCounterCorrect,
          roundDistance,
          roundAccuracy,
        });
      });

      // Game over
      channel.on('broadcast', { event: 'wl_game_over' }, ({ payload }) => {
        if (!payload) return;
        const { phase, winner } = payload as {
          phase: WavelengthPhase;
          winner: 'pink' | 'blue';
        };
        store.setState({ phase, winner });
      });

    } else {
      // === HOST LISTENERS ===

      // Player joins team
      channel.on('broadcast', { event: 'wl_join_team' }, ({ payload }) => {
        if (!payload) return;
        const { playerId: pid, team } = payload as {
          playerId: string;
          team: 'pink' | 'blue';
        };
        store.getState().setPlayerTeam(pid, team);
        // Broadcast updated player list
        const s = store.getState();
        channel.send({
          type: 'broadcast',
          event: 'wl_team_update',
          payload: { players: s.players },
        });
      });

      // Player leaves team
      channel.on('broadcast', { event: 'wl_leave_team' }, ({ payload }) => {
        if (!payload) return;
        const { playerId: pid } = payload as { playerId: string };
        store.getState().clearPlayerTeam(pid);
        const s = store.getState();
        channel.send({
          type: 'broadcast',
          event: 'wl_team_update',
          payload: { players: s.players },
        });
      });

      // Psychic submits clue
      channel.on('broadcast', { event: 'wl_submit_clue' }, ({ payload }) => {
        if (!payload) return;
        const { clue } = payload as { clue: string };
        store.getState().submitClue(clue);
        const s = store.getState();
        channel.send({
          type: 'broadcast',
          event: 'wl_clue_submitted',
          payload: {
            currentClue: s.currentClue,
            phase: s.phase,
          },
        });
      });

      // Team submits guess
      channel.on('broadcast', { event: 'wl_submit_team_guess' }, ({ payload }) => {
        if (!payload) return;
        const { position } = payload as { position: number };
        store.getState().submitTeamGuess(position);
        const s = store.getState();
        channel.send({
          type: 'broadcast',
          event: 'wl_team_guess',
          payload: {
            teamGuessPosition: s.teamGuessPosition,
            phase: s.phase,
            pinkScore: s.pinkScore,
            blueScore: s.blueScore,
            lastRoundPoints: s.lastRoundPoints,
            roundDistance: s.roundDistance,
            roundAccuracy: s.roundAccuracy,
            winner: s.winner,
          },
        });
      });

      // Opposing team submits counter guess
      channel.on('broadcast', { event: 'wl_submit_counter_guess' }, ({ payload }) => {
        if (!payload) return;
        const { guess } = payload as { guess: 'higher' | 'lower' };
        store.getState().submitCounterGuess(guess);
        const s = store.getState();
        channel.send({
          type: 'broadcast',
          event: 'wl_counter_guess',
          payload: {
            counterGuess: s.counterGuess,
            phase: s.phase,
            pinkScore: s.pinkScore,
            blueScore: s.blueScore,
            lastCounterCorrect: s.lastCounterCorrect,
            winner: s.winner,
          },
        });
      });

      // Advance to next round
      channel.on('broadcast', { event: 'wl_advance_round' }, () => {
        store.getState().advanceRound();
        const s = store.getState();
        channel.send({
          type: 'broadcast',
          event: 'wl_round_advance',
          payload: {
            phase: s.phase,
            currentTeam: s.currentTeam,
            spectrum: s.spectrum,
            targetPosition: s.targetPosition,
            psychicIndex: s.psychicIndex,
            currentClue: s.currentClue,
            teamGuessPosition: s.teamGuessPosition,
            counterGuess: s.counterGuess,
            lastRoundPoints: s.lastRoundPoints,
            lastCounterCorrect: s.lastCounterCorrect,
            roundDistance: s.roundDistance,
            roundAccuracy: s.roundAccuracy,
          },
        });
      });

      // State request from late joiners
      channel.on('broadcast', { event: 'wl_request_state' }, () => {
        const s = store.getState();
        channel.send({
          type: 'broadcast',
          event: 'wl_game_state',
          payload: {
            phase: s.phase,
            spectrum: s.spectrum,
            targetPosition: s.targetPosition,
            currentClue: s.currentClue,
            teamGuessPosition: s.teamGuessPosition,
            counterGuess: s.counterGuess,
            currentTeam: s.currentTeam,
            psychicIndex: s.psychicIndex,
            pinkScore: s.pinkScore,
            blueScore: s.blueScore,
            pointsToWin: s.pointsToWin,
            lastRoundPoints: s.lastRoundPoints,
            lastCounterCorrect: s.lastCounterCorrect,
            winner: s.winner,
            roundDistance: s.roundDistance,
            roundAccuracy: s.roundAccuracy,
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
      event: 'wl_game_state',
      payload: {
        phase: s.phase,
        spectrum: s.spectrum,
        targetPosition: s.targetPosition,
        currentClue: s.currentClue,
        teamGuessPosition: s.teamGuessPosition,
        counterGuess: s.counterGuess,
        currentTeam: s.currentTeam,
        psychicIndex: s.psychicIndex,
        pinkScore: s.pinkScore,
        blueScore: s.blueScore,
        pointsToWin: s.pointsToWin,
        lastRoundPoints: s.lastRoundPoints,
        lastCounterCorrect: s.lastCounterCorrect,
        winner: s.winner,
        roundDistance: s.roundDistance,
        roundAccuracy: s.roundAccuracy,
        players: s.players,
      },
    });
  }, [isHost]);

  const sendJoinTeam = useCallback((team: 'pink' | 'blue') => {
    if (!channelRef.current || !playerId) return;
    if (isHost) {
      store.getState().setPlayerTeam(playerId, team);
      broadcastGameState();
    } else {
      channelRef.current.send({
        type: 'broadcast',
        event: 'wl_join_team',
        payload: { playerId, team },
      });
    }
  }, [isHost, playerId, broadcastGameState]);

  const sendLeaveTeam = useCallback(() => {
    if (!channelRef.current || !playerId) return;
    if (isHost) {
      store.getState().clearPlayerTeam(playerId);
      broadcastGameState();
    } else {
      channelRef.current.send({
        type: 'broadcast',
        event: 'wl_leave_team',
        payload: { playerId },
      });
    }
  }, [isHost, playerId, broadcastGameState]);

  const sendSubmitClue = useCallback((clue: string) => {
    if (!channelRef.current) return;
    if (isHost) {
      store.getState().submitClue(clue);
      const s = store.getState();
      channelRef.current.send({
        type: 'broadcast',
        event: 'wl_clue_submitted',
        payload: {
          currentClue: s.currentClue,
          phase: s.phase,
        },
      });
    } else {
      channelRef.current.send({
        type: 'broadcast',
        event: 'wl_submit_clue',
        payload: { clue },
      });
    }
  }, [isHost]);

  const sendSubmitTeamGuess = useCallback((position: number) => {
    if (!channelRef.current) return;
    if (isHost) {
      store.getState().submitTeamGuess(position);
      const s = store.getState();
      channelRef.current.send({
        type: 'broadcast',
        event: 'wl_team_guess',
        payload: {
          teamGuessPosition: s.teamGuessPosition,
          phase: s.phase,
          pinkScore: s.pinkScore,
          blueScore: s.blueScore,
          lastRoundPoints: s.lastRoundPoints,
          roundDistance: s.roundDistance,
          roundAccuracy: s.roundAccuracy,
          winner: s.winner,
        },
      });
    } else {
      channelRef.current.send({
        type: 'broadcast',
        event: 'wl_submit_team_guess',
        payload: { position },
      });
    }
  }, [isHost]);

  const sendSubmitCounterGuess = useCallback((guess: 'higher' | 'lower') => {
    if (!channelRef.current) return;
    if (isHost) {
      store.getState().submitCounterGuess(guess);
      const s = store.getState();
      channelRef.current.send({
        type: 'broadcast',
        event: 'wl_counter_guess',
        payload: {
          counterGuess: s.counterGuess,
          phase: s.phase,
          pinkScore: s.pinkScore,
          blueScore: s.blueScore,
          lastCounterCorrect: s.lastCounterCorrect,
          winner: s.winner,
        },
      });
    } else {
      channelRef.current.send({
        type: 'broadcast',
        event: 'wl_submit_counter_guess',
        payload: { guess },
      });
    }
  }, [isHost]);

  const sendAdvanceRound = useCallback(() => {
    if (!channelRef.current) return;
    if (isHost) {
      store.getState().advanceRound();
      const s = store.getState();
      channelRef.current.send({
        type: 'broadcast',
        event: 'wl_round_advance',
        payload: {
          phase: s.phase,
          currentTeam: s.currentTeam,
          spectrum: s.spectrum,
          targetPosition: s.targetPosition,
          psychicIndex: s.psychicIndex,
          currentClue: s.currentClue,
          teamGuessPosition: s.teamGuessPosition,
          counterGuess: s.counterGuess,
          lastRoundPoints: s.lastRoundPoints,
          lastCounterCorrect: s.lastCounterCorrect,
          roundDistance: s.roundDistance,
          roundAccuracy: s.roundAccuracy,
        },
      });
    } else {
      channelRef.current.send({
        type: 'broadcast',
        event: 'wl_advance_round',
        payload: {},
      });
    }
  }, [isHost]);

  return {
    isReady,
    broadcastGameState,
    sendJoinTeam,
    sendLeaveTeam,
    sendSubmitClue,
    sendSubmitTeamGuess,
    sendSubmitCounterGuess,
    sendAdvanceRound,
  };
}
