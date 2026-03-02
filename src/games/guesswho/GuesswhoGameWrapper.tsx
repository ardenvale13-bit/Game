// Guess Who - Game Wrapper (Orchestrator)
// Host-authoritative: host runs timers, questions, and game flow
import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useLobbyStore from '../../store/lobbyStore';
import useGuesswhoStore from './guesswhoStore';
import { useGuesswhoSync } from '../../hooks/useGuesswhoSync';
import GWChoosing from './components/GWChoosing';
import GWQuestioning from './components/GWQuestioning';
import GWGameOver from './components/GWGameOver';
import './guesswho.css';

// Raw store reference for imperative access
const gwStore = useGuesswhoStore;

export default function GuesswhoGameWrapper() {
  const navigate = useNavigate();
  const { roomCode } = useParams();
  const lobbyStore = useLobbyStore();
  // Hook for reactive rendering
  const { phase } = useGuesswhoStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameStartedRef = useRef(false);

  const currentPlayerId = lobbyStore.currentPlayerId;
  const hostPlayer = lobbyStore.isHost();

  const handleForceEnd = useCallback(() => {
    gwStore.getState().reset();
    lobbyStore.endGame();
    navigate(`/lobby/${roomCode}`);
  }, [roomCode, navigate, lobbyStore]);

  const {
    isReady,
    broadcastRoundStart,
    broadcastQuestioningPhase,
    broadcastAnswerQuestion,
    broadcastRoundEnd,
    broadcastTimerSync,
    broadcastGameOver,
    broadcastForceEnd,
    sendQuestion,
    sendGuess,
  } = useGuesswhoSync({
    roomCode: roomCode || null,
    playerId: currentPlayerId,
    isHost: hostPlayer,
    onForceEnd: handleForceEnd,
  });

  // Initialize store from lobby
  useEffect(() => {
    gwStore.getState().initFromLobby(lobbyStore.players);
    const rounds = lobbyStore.roundCount || 3;
    gwStore.getState().setMaxRounds(rounds);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Start game when channel is ready (host only)
  useEffect(() => {
    if (!isReady || !hostPlayer || gameStartedRef.current) return;
    gameStartedRef.current = true;

    setTimeout(() => {
      startNewRound();
    }, 500);
  }, [isReady, hostPlayer]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start a new round (host only)
  const startNewRound = useCallback(() => {
    const state = gwStore.getState();
    gwStore.getState().startRound();

    setTimeout(() => {
      const chooser = gwStore.getState().getChooser();
      if (chooser) {
        broadcastRoundStart(chooser.id);
      }
    }, 100);
  }, [broadcastRoundStart]);

  // Timer management (host only)
  useEffect(() => {
    if (!hostPlayer) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (phase === 'game-over') return;

    timerRef.current = setInterval(() => {
      const state = gwStore.getState();
      const remaining = state.tickTimer();

      // Sync timer every 2 seconds
      if (remaining % 2 === 0) {
        broadcastTimerSync();
      }

      // Check if time is up
      if (remaining <= 0) {
        handlePhaseEnd(state.phase);
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [hostPlayer, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePhaseEnd = useCallback((currentPhase: string) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const state = gwStore.getState();

    if (currentPhase === 'choosing') {
      // If no character was chosen, pick randomly
      if (!state.chosenCharacterId) {
        const randomChar =
          state.characters[Math.floor(Math.random() * state.characters.length)];
        gwStore.getState().confirmChoice(randomChar.id);
      }
      // Transition to questioning
      gwStore.setState({ phase: 'questioning' as const });
      setTimeout(() => {
        broadcastQuestioningPhase();
      }, 100);
    } else if (currentPhase === 'questioning') {
      // Round ends - no one guessed correctly in time
      gwStore.getState().endRound(null);
      setTimeout(() => {
        broadcastRoundEnd();
      }, 100);

      // Check if game should end
      const newState = gwStore.getState();
      if (newState.phase === 'game-over') {
        setTimeout(() => {
          broadcastGameOver();
          newState.players.forEach((p: { id: string; score: number }) => {
            if (p.score > 0) {
              lobbyStore.updatePlayerScore(p.id, p.score);
            }
          });
        }, 100);
      } else {
        // Next round
        setTimeout(() => {
          startNewRound();
        }, 2000);
      }
    }
  }, [broadcastQuestioningPhase, broadcastRoundEnd, broadcastGameOver, startNewRound, lobbyStore]);

  // Handle character choice (host only, broadcasting to non-choosers)
  const handleChooseCharacter = useCallback((charId: string) => {
    gwStore.getState().confirmChoice(charId);

    if (hostPlayer) {
      setTimeout(() => {
        broadcastQuestioningPhase();
      }, 100);
    }
  }, [hostPlayer, broadcastQuestioningPhase]);

  // Handle question
  const handleAskQuestion = useCallback((question: string) => {
    sendQuestion(question);
  }, [sendQuestion]);

  // Handle answer (host/chooser only)
  const handleAnswerQuestion = useCallback((answer: 'yes' | 'no') => {
    gwStore.getState().answerQuestion(answer);

    if (hostPlayer) {
      setTimeout(() => {
        broadcastAnswerQuestion(answer);
      }, 100);
    }
  }, [hostPlayer, broadcastAnswerQuestion]);

  // Handle guess
  const handleMakeGuess = useCallback((charId: string) => {
    sendGuess(charId);
  }, [sendGuess]);

  // End game
  const handleEndGame = useCallback(() => {
    broadcastForceEnd();
    handleForceEnd();
  }, [broadcastForceEnd, handleForceEnd]);

  // Play again
  const handlePlayAgain = useCallback(() => {
    if (hostPlayer) {
      gwStore.getState().reset();
      gwStore.getState().initFromLobby(lobbyStore.players);
      gameStartedRef.current = false;

      setTimeout(() => {
        gameStartedRef.current = true;
        startNewRound();
      }, 300);
    }
  }, [hostPlayer, lobbyStore.players, startNewRound]);

  // Back to lobby
  const handleBackToLobby = useCallback(() => {
    gwStore.getState().reset();
    lobbyStore.endGame();
    navigate(`/lobby/${roomCode}`);
  }, [roomCode, navigate, lobbyStore]);

  if (!isReady) {
    return (
      <div className="gw-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner" />
        <div className="text-muted mt-2">Connecting...</div>
      </div>
    );
  }

  return (
    <div className="gw-layout">
      {/* Game Controls */}
      <div
        style={{
          position: 'fixed',
          top: '8px',
          right: '8px',
          zIndex: 1000,
          display: 'flex',
          gap: '6px',
        }}
      >
        <button
          className="btn btn-ghost btn-small"
          onClick={handleBackToLobby}
          style={{ fontSize: '0.75rem', padding: '4px 8px', opacity: 0.7 }}
        >
          ← Lobby
        </button>
        {hostPlayer && (
          <button
            className="btn btn-small"
            onClick={handleEndGame}
            style={{
              fontSize: '0.75rem',
              padding: '4px 8px',
              background: 'var(--accent-secondary)',
              color: '#fff',
            }}
          >
            End Game
          </button>
        )}
      </div>

      {phase === 'choosing' && (
        <GWChoosing
          currentPlayerId={currentPlayerId || ''}
          onChoose={handleChooseCharacter}
        />
      )}
      {phase === 'questioning' && (
        <GWQuestioning
          currentPlayerId={currentPlayerId || ''}
          onAskQuestion={handleAskQuestion}
          onAnswerQuestion={handleAnswerQuestion}
          onMakeGuess={handleMakeGuess}
        />
      )}
      {phase === 'game-over' && (
        <GWGameOver
          onPlayAgain={handlePlayAgain}
          onBackToLobby={handleBackToLobby}
        />
      )}
    </div>
  );
}
