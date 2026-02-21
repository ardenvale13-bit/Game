// fAImily Feud - Game Wrapper (Orchestrator)
// Host-authoritative: host runs timers and game flow
// Flow: team-setup → face-off → board-play → [steal-attempt] → round-results → (repeat) → game-over
import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useLobbyStore from '../../store/lobbyStore';
import useFamilyFeudStore from './familyFeudStore';
import { useFamilyFeudSync } from '../../hooks/useFamilyFeudSync';
import { resetUsedQuestions } from './familyFeudData';
import FFTeamSetup from './components/FFTeamSetup';
import FFFaceOff from './components/FFFaceOff';
import FFBoardPlay from './components/FFBoardPlay';
import FFStealAttempt from './components/FFStealAttempt';
import FFRoundResults from './components/FFRoundResults';
import FFGameOver from './components/FFGameOver';
import './familyFeud.css';

const ffStore = useFamilyFeudStore;

export default function FamilyFeudGameWrapper() {
  const navigate = useNavigate();
  const { roomCode } = useParams();
  const lobbyStore = useLobbyStore();
  const { phase, timeRemaining } = useFamilyFeudStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameStartedRef = useRef(false);

  const currentPlayerId = lobbyStore.currentPlayerId;
  const hostPlayer = lobbyStore.isHost();

  const {
    isReady,
    broadcastPhaseState,
    broadcastTeamUpdate,
    broadcastBoardState,
    broadcastTimerSync,
    sendAssignTeam,
    sendTeamName,
    sendBuzz,
    sendGuess,
    sendSteal,
  } = useFamilyFeudSync({
    roomCode: roomCode || null,
    playerId: currentPlayerId,
    isHost: hostPlayer,
  });

  // Initialize store from lobby
  useEffect(() => {
    resetUsedQuestions();
    ffStore.getState().resetGame();
    ffStore.getState().setRoomCode(roomCode || '');
    ffStore.getState().setCurrentPlayer(currentPlayerId || '');
    ffStore.getState().setMaxRounds(lobbyStore.roundCount || 15);

    // Add all lobby players to the FF store
    lobbyStore.players.forEach((p) => {
      ffStore.getState().addPlayer({
        id: p.id,
        name: p.name,
        avatarId: p.avatarId || '',
        avatarFilename: p.avatarFilename || '',
        isHost: p.isHost || false,
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Start game when channel is ready (host only)
  useEffect(() => {
    if (!isReady || !hostPlayer || gameStartedRef.current) return;
    gameStartedRef.current = true;

    // Move to team setup
    setTimeout(() => {
      ffStore.setState({
        phase: 'team-setup',
        timeRemaining: 60,
      });
      broadcastPhaseState('ff_team_setup');
    }, 500);
  }, [isReady, hostPlayer]); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer management (host only)
  useEffect(() => {
    if (!hostPlayer) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (phase === 'game-over' || phase === 'lobby') return;

    timerRef.current = setInterval(() => {
      const state = ffStore.getState();
      const remaining = state.timeRemaining - 1;
      ffStore.setState({ timeRemaining: remaining });

      // Sync timer every 2 seconds
      if (remaining % 2 === 0) {
        broadcastTimerSync();
      }

      if (remaining <= 0) {
        handlePhaseTimeout(state.phase);
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [hostPlayer, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle phase timeout
  const handlePhaseTimeout = useCallback((currentPhase: string) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (currentPhase === 'team-setup') {
      // Auto-assign any unassigned players, then start
      handleStartGame();
    } else if (currentPhase === 'face-off') {
      // Resolve face-off with whatever we have
      handleResolveFaceOff();
    } else if (currentPhase === 'board-play') {
      // Time's up, add strike
      const state = ffStore.getState();
      if (state.strikes < 2) {
        ffStore.getState().addStrike();
        broadcastBoardState();
      } else {
        ffStore.getState().addStrike(); // Will auto-transition to steal
        broadcastPhaseState('ff_steal_attempt');
      }
    } else if (currentPhase === 'steal-attempt') {
      // No steal — award points to controlling team
      ffStore.getState().awardRoundPoints();
      broadcastPhaseState('ff_round_results');
    } else if (currentPhase === 'round-results') {
      handleNextRound();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Host: Start game from team setup
  const handleStartGame = useCallback(() => {
    if (!hostPlayer) return;
    const state = ffStore.getState();

    // Auto-assign unassigned players alternating
    const unassigned = state.players.filter((p) => !p.team);
    unassigned.forEach((p, i) => {
      ffStore.getState().assignTeam(p.id, i % 2 === 0 ? 'pink' : 'purple');
    });

    broadcastTeamUpdate();

    // Start first face-off
    setTimeout(() => {
      ffStore.getState().startFaceOff();
      broadcastPhaseState('ff_face_off');
    }, 500);
  }, [hostPlayer, broadcastTeamUpdate, broadcastPhaseState]);

  // Host: Resolve face-off
  const handleResolveFaceOff = useCallback(() => {
    if (!hostPlayer) return;
    ffStore.getState().resolveFaceOff();
    const state = ffStore.getState();

    if (state.faceOffWinner) {
      // Transition to board play
      setTimeout(() => {
        ffStore.getState().startBoardPlay(state.faceOffWinner!);
        broadcastPhaseState('ff_board_play');
      }, 2000);
    } else {
      // No winner — skip to next round
      setTimeout(() => {
        handleNextRound();
      }, 2000);
    }
  }, [hostPlayer, broadcastPhaseState]); // eslint-disable-line react-hooks/exhaustive-deps

  // Host: Next round
  const handleNextRound = useCallback(() => {
    if (!hostPlayer) return;
    const state = ffStore.getState();
    if (state.currentRound >= state.maxRounds) {
      ffStore.getState().endGame();
      broadcastPhaseState('ff_game_over');
      // Update lobby scores
      ffStore.getState().players.forEach((p) => {
        const team = p.team;
        if (team) {
          const score = team === 'pink' ? ffStore.getState().pinkScore : ffStore.getState().purpleScore;
          if (score > 0) {
            lobbyStore.updatePlayerScore(p.id, Math.round(score / ffStore.getState().players.filter((pp) => pp.team === team).length));
          }
        }
      });
    } else {
      ffStore.getState().nextRound();
      ffStore.getState().startFaceOff();
      broadcastPhaseState('ff_face_off');
    }
  }, [hostPlayer, broadcastPhaseState, lobbyStore]);

  // Host: Handle both buzzes in
  const handleBothBuzzed = useCallback(() => {
    if (!hostPlayer) return;
    setTimeout(() => {
      handleResolveFaceOff();
    }, 1000);
  }, [hostPlayer, handleResolveFaceOff]);

  // Host: Award round points and go to results
  const handleAwardPoints = useCallback(() => {
    if (!hostPlayer) return;
    ffStore.getState().awardRoundPoints();
    broadcastPhaseState('ff_round_results');
  }, [hostPlayer, broadcastPhaseState]);

  // Play again
  const handlePlayAgain = useCallback(() => {
    if (!hostPlayer) return;
    resetUsedQuestions();
    ffStore.getState().resetGame();
    ffStore.getState().setRoomCode(roomCode || '');
    ffStore.getState().setCurrentPlayer(currentPlayerId || '');
    ffStore.getState().setMaxRounds(lobbyStore.roundCount || 15);
    lobbyStore.players.forEach((p) => {
      ffStore.getState().addPlayer({
        id: p.id,
        name: p.name,
        avatarId: p.avatarId || '',
        avatarFilename: p.avatarFilename || '',
        isHost: p.isHost || false,
      });
    });
    gameStartedRef.current = false;

    setTimeout(() => {
      gameStartedRef.current = true;
      ffStore.setState({ phase: 'team-setup', timeRemaining: 60 });
      broadcastPhaseState('ff_team_setup');
    }, 300);
  }, [hostPlayer, lobbyStore.players, lobbyStore.roundCount, broadcastPhaseState]);

  // Back to lobby
  const handleBackToLobby = useCallback(() => {
    ffStore.getState().resetGame();
    lobbyStore.endGame();
    navigate(`/lobby/${roomCode}`);
  }, [roomCode, navigate, lobbyStore]);

  // Loading state
  if (!isReady) {
    return (
      <div className="ff-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner" />
        <div className="text-muted mt-2">Connecting...</div>
      </div>
    );
  }

  return (
    <div className="ff-layout">
      {phase === 'team-setup' && (
        <FFTeamSetup
          currentPlayerId={currentPlayerId || ''}
          isHost={hostPlayer}
          onAssignTeam={sendAssignTeam}
          onTeamName={sendTeamName}
          onStartGame={handleStartGame}
        />
      )}
      {phase === 'face-off' && (
        <FFFaceOff
          currentPlayerId={currentPlayerId || ''}
          isHost={hostPlayer}
          onBuzz={sendBuzz}
          onBothBuzzed={handleBothBuzzed}
          onResolve={handleResolveFaceOff}
        />
      )}
      {phase === 'board-play' && (
        <FFBoardPlay
          currentPlayerId={currentPlayerId || ''}
          isHost={hostPlayer}
          onGuess={sendGuess}
          onAwardPoints={handleAwardPoints}
        />
      )}
      {phase === 'steal-attempt' && (
        <FFStealAttempt
          currentPlayerId={currentPlayerId || ''}
          isHost={hostPlayer}
          onSteal={sendSteal}
          onAwardPoints={handleAwardPoints}
        />
      )}
      {phase === 'round-results' && (
        <FFRoundResults
          isHost={hostPlayer}
          onNextRound={handleNextRound}
        />
      )}
      {phase === 'game-over' && (
        <FFGameOver
          onPlayAgain={handlePlayAgain}
          onBackToLobby={handleBackToLobby}
        />
      )}
    </div>
  );
}
