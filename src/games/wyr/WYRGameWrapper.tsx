// Would You Rather - Game Wrapper (Orchestrator)
// Host-authoritative: host runs timers, prompts, and game flow
import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useLobbyStore from '../../store/lobbyStore';
import useWYRStore from './wyrStore';
import { useWYRSync } from '../../hooks/useWYRSync';
import { getRandomPrompts } from './wyrData';
import WYRVoting from './components/WYRVoting';
import WYRResults from './components/WYRResults';
import WYRGameOver from './components/WYRGameOver';
import './wyr.css';

// Raw store reference for imperative access (getState/setState)
const wyrStore = useWYRStore;

export default function WYRGameWrapper() {
  const navigate = useNavigate();
  const { roomCode } = useParams();
  const lobbyStore = useLobbyStore();
  // Hook for reactive rendering (phase changes, etc.)
  const { phase } = useWYRStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameStartedRef = useRef(false);

  const currentPlayerId = lobbyStore.currentPlayerId;
  const hostPlayer = lobbyStore.isHost();

  const handleForceEnd = useCallback(() => {
    wyrStore.getState().reset();
    lobbyStore.endGame();
    navigate(`/lobby/${roomCode}`);
  }, [roomCode, navigate, lobbyStore]);

  const {
    isReady,
    broadcastRoundStart,
    broadcastResults,
    broadcastTimerSync,
    broadcastGameOver,
    broadcastForceEnd,
    sendVote,
  } = useWYRSync({
    roomCode: roomCode || null,
    playerId: currentPlayerId,
    isHost: hostPlayer,
    onForceEnd: handleForceEnd,
  });

  // Initialize store from lobby
  useEffect(() => {
    wyrStore.getState().initFromLobby(lobbyStore.players);
    // Use lobby round count for max rounds (default 10 if not set for wyr)
    const rounds = lobbyStore.roundCount || 10;
    wyrStore.getState().setMaxRounds(rounds);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Start game when channel is ready (host only)
  useEffect(() => {
    if (!isReady || !hostPlayer || gameStartedRef.current) return;
    gameStartedRef.current = true;

    // Start first round after a short delay
    setTimeout(() => {
      startNewRound();
    }, 500);
  }, [isReady, hostPlayer]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start a new round (host only)
  const startNewRound = useCallback(() => {
    const state = wyrStore.getState();
    const { prompts, indices } = getRandomPrompts(1, state.usedPromptIndices);
    if (prompts.length === 0) return;

    wyrStore.getState().startRound(prompts[0], indices[0]);

    // Small delay to ensure state is committed
    setTimeout(() => {
      broadcastRoundStart(prompts[0], indices[0]);
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
      const state = wyrStore.getState();
      const remaining = state.tickTimer();

      // Sync timer every 2 seconds
      if (remaining % 2 === 0) {
        broadcastTimerSync();
      }

      // Check if all votes are in during voting phase → reveal early
      if (state.phase === 'voting' && remaining > 0 && wyrStore.getState().allVotesIn()) {
        wyrStore.setState({ timeRemaining: 0 });
        handlePhaseEnd('voting');
        return;
      }

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

    if (currentPhase === 'voting') {
      // Reveal results
      wyrStore.getState().revealResults();
      setTimeout(() => {
        broadcastResults();
      }, 100);
    } else if (currentPhase === 'results') {
      // Check if game is over
      const state = wyrStore.getState();
      if (state.currentRound >= state.maxRounds) {
        wyrStore.getState().endGame();
        setTimeout(() => {
          broadcastGameOver();
          // Update lobby scores
          wyrStore.getState().players.forEach((p: { id: string; score: number }) => {
            if (p.score > 0) {
              lobbyStore.updatePlayerScore(p.id, p.score);
            }
          });
        }, 100);
      } else {
        // Next round
        setTimeout(() => {
          startNewRound();
        }, 300);
      }
    }
  }, [broadcastResults, broadcastGameOver, startNewRound, lobbyStore]);

  // Handle vote
  const handleVote = useCallback((option: 'A' | 'B') => {
    sendVote(option);
  }, [sendVote]);

  // End game (host only)
  const handleEndGame = useCallback(() => {
    broadcastForceEnd();
    handleForceEnd();
  }, [broadcastForceEnd, handleForceEnd]);

  // Play again
  const handlePlayAgain = useCallback(() => {
    if (hostPlayer) {
      wyrStore.getState().reset();
      wyrStore.getState().initFromLobby(lobbyStore.players);
      gameStartedRef.current = false;

      // Will re-trigger the start effect
      setTimeout(() => {
        gameStartedRef.current = true;
        startNewRound();
      }, 300);
    }
  }, [hostPlayer, lobbyStore.players, startNewRound]);

  // Back to lobby
  const handleBackToLobby = useCallback(() => {
    wyrStore.getState().reset();
    lobbyStore.endGame();
    navigate(`/lobby/${roomCode}`);
  }, [roomCode, navigate, lobbyStore]);

  // Loading state
  if (!isReady) {
    return (
      <div className="wyr-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner" />
        <div className="text-muted mt-2">Connecting...</div>
      </div>
    );
  }

  return (
    <div className="wyr-layout">
      {/* Game Controls */}
      <div style={{
        position: 'fixed', top: '8px', right: '8px', zIndex: 1000,
        display: 'flex', gap: '6px'
      }}>
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
            style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'var(--accent-secondary)', color: '#fff' }}
          >
            End Game
          </button>
        )}
      </div>

      {phase === 'voting' && (
        <WYRVoting
          currentPlayerId={currentPlayerId || ''}
          onVote={handleVote}
        />
      )}
      {phase === 'results' && (
        <WYRResults />
      )}
      {phase === 'game-over' && (
        <WYRGameOver
          onPlayAgain={handlePlayAgain}
          onBackToLobby={handleBackToLobby}
        />
      )}
    </div>
  );
}
