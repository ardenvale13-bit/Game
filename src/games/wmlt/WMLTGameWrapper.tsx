// Who's Most Likely To - Game Wrapper (Orchestrator)
// Host-authoritative: host runs timers, prompts, and game flow
import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useLobbyStore from '../../store/lobbyStore';
import useWMLTStore from './wmltStore';
import { useWMLTSync } from '../../hooks/useWMLTSync';
import { getRandomPrompts } from './wmltData';
import WMLTVoting from './components/WMLTVoting';
import WMLTResults from './components/WMLTResults';
import WMLTGameOver from './components/WMLTGameOver';
import './wmlt.css';

export default function WMLTGameWrapper() {
  const navigate = useNavigate();
  const { roomCode } = useParams();
  const lobbyStore = useLobbyStore();
  const store = useWMLTStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameStartedRef = useRef(false);

  const currentPlayerId = lobbyStore.currentPlayerId;
  const hostPlayer = lobbyStore.isHost();

  const {
    isReady,
    broadcastRoundStart,
    broadcastResults,
    broadcastTimerSync,
    broadcastGameOver,
    sendVote,
  } = useWMLTSync({
    roomCode: roomCode || null,
    playerId: currentPlayerId,
    isHost: hostPlayer,
  });

  // Initialize store from lobby
  useEffect(() => {
    store.initFromLobby(lobbyStore.players);
    // Use lobby round count for max rounds (default 10 if not set for wmlt)
    const rounds = lobbyStore.roundCount || 10;
    store.setMaxRounds(rounds);
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
    const state = store.getState();
    const { prompts, indices } = getRandomPrompts(1, state.usedPromptIndices);
    if (prompts.length === 0) return;

    store.startRound(prompts[0], indices[0]);

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

    const { phase } = store;
    if (phase === 'game-over') return;

    timerRef.current = setInterval(() => {
      const state = store.getState();
      const remaining = store.tickTimer();

      // Sync timer every 2 seconds
      if (remaining % 2 === 0) {
        broadcastTimerSync();
      }

      // Check if all votes are in during voting phase → reveal early
      if (state.phase === 'voting' && remaining > 0 && store.allVotesIn()) {
        store.setState({ timeRemaining: 0 });
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
  }, [hostPlayer, store.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePhaseEnd = useCallback((phase: string) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (phase === 'voting') {
      // Reveal results
      store.revealResults();
      setTimeout(() => {
        broadcastResults();
      }, 100);
    } else if (phase === 'results') {
      // Check if game is over
      const state = store.getState();
      if (state.currentRound >= state.maxRounds) {
        store.endGame();
        setTimeout(() => {
          broadcastGameOver();
          // Update lobby scores
          state.players.forEach(p => {
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
  const handleVote = useCallback((targetId: string) => {
    sendVote(targetId);
  }, [sendVote]);

  // Play again
  const handlePlayAgain = useCallback(() => {
    if (hostPlayer) {
      store.reset();
      store.initFromLobby(lobbyStore.players);
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
    store.reset();
    lobbyStore.endGame();
    navigate(`/lobby/${roomCode}`);
  }, [roomCode, navigate, lobbyStore]);

  // Loading state
  if (!isReady) {
    return (
      <div className="wmlt-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner" />
        <div className="text-muted mt-2">Connecting...</div>
      </div>
    );
  }

  return (
    <div className="wmlt-layout">
      {store.phase === 'voting' && (
        <WMLTVoting
          currentPlayerId={currentPlayerId || ''}
          onVote={handleVote}
        />
      )}
      {store.phase === 'results' && (
        <WMLTResults />
      )}
      {store.phase === 'game-over' && (
        <WMLTGameOver
          onPlayAgain={handlePlayAgain}
          onBackToLobby={handleBackToLobby}
        />
      )}
    </div>
  );
}
