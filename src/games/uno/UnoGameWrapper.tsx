// Uno Game Wrapper (Orchestrator)
// Host-authoritative: host runs game logic, timers, and game flow
import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useLobbyStore from '../../store/lobbyStore';
import useUnoStore from './unoStore';
import { useUnoSync } from '../../hooks/useUnoSync';
import UnoPlaying from './components/UnoPlaying';
import UnoRoundOver from './components/UnoRoundOver';
import UnoGameOver from './components/UnoGameOver';
import './uno.css';

// Raw store reference for imperative access
const unoStore = useUnoStore;

export default function UnoGameWrapper() {
  const navigate = useNavigate();
  const { roomCode } = useParams();
  const lobbyStore = useLobbyStore();
  const { phase } = useUnoStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameStartedRef = useRef(false);

  const currentPlayerId = lobbyStore.currentPlayerId;
  const hostPlayer = lobbyStore.isHost();
  const gameMode = lobbyStore.gbCategory || 'classic'; // Reuse gbCategory field for uno mode

  const handleForceEnd = useCallback(() => {
    unoStore.getState().reset();
    lobbyStore.endGame();
    navigate(`/lobby/${roomCode}`);
  }, [roomCode, navigate, lobbyStore]);

  const {
    isReady,
    broadcastGameState,
    broadcastTimerSync,
    broadcastGameOver,
    broadcastForceEnd,
    sendPlayCard,
    sendDrawCard,
    sendCallUno,
    sendCatchUno,
    sendJumpIn,
    sendSwapHands,
  } = useUnoSync({
    roomCode: roomCode || null,
    playerId: currentPlayerId,
    isHost: hostPlayer,
    onForceEnd: handleForceEnd,
  });

  // Initialize store from lobby
  useEffect(() => {
    const players = lobbyStore.players.map((p) => ({
      id: p.id,
      name: p.name,
      avatarId: p.avatarId,
      avatarFilename: p.avatarFilename,
      isHost: p.isHost,
    }));
    unoStore.getState().initFromLobby(players);
    unoStore.getState().setMode((gameMode === 'chaos' ? 'chaos' : 'classic') as 'classic' | 'chaos');
    unoStore.getState().setMaxRounds(lobbyStore.roundCount || 3);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Start game when channel is ready (host only)
  useEffect(() => {
    if (!isReady || !hostPlayer || gameStartedRef.current) return;
    gameStartedRef.current = true;

    setTimeout(() => {
      unoStore.getState().startGame();
      broadcastGameState();
    }, 500);
  }, [isReady, hostPlayer, broadcastGameState]); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer management (host only)
  useEffect(() => {
    if (!hostPlayer) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (phase === 'game-over') return;

    timerRef.current = setInterval(() => {
      const state = unoStore.getState();
      const remaining = state.tickTimer();

      // Sync timer every 2 seconds
      if (remaining % 2 === 0) {
        broadcastTimerSync();
      }

      // Auto-draw and advance turn if timer expires
      if (remaining <= 0 && phase === 'playing') {
        const currentPlayer = state.getCurrentPlayer();
        if (currentPlayer) {
          state.drawCard(currentPlayer.id);
          state.nextTurn();
          broadcastGameState();
        }
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [hostPlayer, phase, broadcastTimerSync, broadcastGameState]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle round and game transitions (host only)
  useEffect(() => {
    if (!hostPlayer || phase !== 'round-over') return;

    const timeout = setTimeout(() => {
      const state = unoStore.getState();
      if (state.currentRound >= state.maxRounds) {
        state.endGame();
        broadcastGameOver();
        // Update lobby scores
        state.players.forEach((p) => {
          if (p.score > 0) {
            lobbyStore.updatePlayerScore(p.id, p.score);
          }
        });
      } else {
        // Start next round
        state.startGame();
        broadcastGameState();
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [phase, hostPlayer, broadcastGameOver, broadcastGameState, lobbyStore]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle end game (host only)
  const handleEndGame = useCallback(() => {
    broadcastForceEnd();
    handleForceEnd();
  }, [broadcastForceEnd, handleForceEnd]);

  // Play again
  const handlePlayAgain = useCallback(() => {
    if (hostPlayer) {
      gameStartedRef.current = false;
      unoStore.getState().reset();
      const players = lobbyStore.players.map((p) => ({
        id: p.id,
        name: p.name,
        avatarId: p.avatarId,
        avatarFilename: p.avatarFilename,
        isHost: p.isHost,
      }));
      unoStore.getState().initFromLobby(players);
      unoStore.getState().setMode((gameMode === 'chaos' ? 'chaos' : 'classic') as 'classic' | 'chaos');
      unoStore.getState().setMaxRounds(lobbyStore.roundCount || 3);

      setTimeout(() => {
        gameStartedRef.current = true;
        unoStore.getState().startGame();
        broadcastGameState();
      }, 300);
    }
  }, [hostPlayer, gameMode, lobbyStore.roundCount, lobbyStore.players, broadcastGameState]);

  // Back to lobby
  const handleBackToLobby = useCallback(() => {
    unoStore.getState().reset();
    lobbyStore.endGame();
    navigate(`/lobby/${roomCode}`);
  }, [roomCode, navigate, lobbyStore]);

  if (!isReady) {
    return (
      <div className="uno-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner" />
        <div className="text-muted mt-2">Connecting...</div>
      </div>
    );
  }

  return (
    <div className="uno-layout">
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
          style={{
            fontSize: '0.75rem',
            padding: '4px 8px',
            opacity: 0.7,
          }}
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

      {phase === 'playing' && (
        <UnoPlaying
          currentPlayerId={currentPlayerId || ''}
          onPlayCard={sendPlayCard}
          onDrawCard={sendDrawCard}
          onCallUno={sendCallUno}
          onCatchUno={sendCatchUno}
          onJumpIn={sendJumpIn}
          onSwapHands={sendSwapHands}
        />
      )}
      {phase === 'round-over' && <UnoRoundOver />}
      {phase === 'game-over' && (
        <UnoGameOver
          onPlayAgain={handlePlayAgain}
          onBackToLobby={handleBackToLobby}
        />
      )}
    </div>
  );
}
