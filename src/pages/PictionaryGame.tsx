import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useGameStore from '../store/gameStore';
import useLobbyStore from '../store/lobbyStore';
import { usePictionarySync } from '../hooks/usePictionarySync';
import DrawingCanvas from '../components/DrawingCanvas';
import WordSelection from '../components/WordSelection';
import ChatPanel from '../components/ChatPanel';
import PlayerList from '../components/PlayerList';
import GameOver from '../components/GameOver';

export default function PictionaryGame() {
  const navigate = useNavigate();
  const { roomCode } = useParams();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerSyncRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialized = useRef(false);

  const lobbyPlayers = useLobbyStore((state) => state.players);
  const lobbyRoundCount = useLobbyStore((state) => state.roundCount);
  const endLobbyGame = useLobbyStore((state) => state.endGame);

  const {
    phase,
    players,
    currentPlayerId,
    currentRound,
    settings,
    timeRemaining,
    currentWord,
    wordHint,
    decrementTime,
    getCurrentDrawer,
    isCurrentPlayerDrawing,
    nextRound,
    resetGame,
    endGame,
    setRoomCode,
    setCurrentPlayer,
    addPlayer,
    updateSettings,
    startWordSelection,
  } = useGameStore();

  const currentDrawer = getCurrentDrawer();
  const isDrawing = isCurrentPlayerDrawing();
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const isHost = currentPlayer?.isHost ?? false;

  // --- Multiplayer sync ---
  const {
    isReady,
    broadcastGameState,
    broadcastDraw,
    broadcastClearCanvas,
    broadcastGuess,
    broadcastWordOptions,
    broadcastWordSelection,
    broadcastRoundEnd,
    broadcastChatMessage,
    broadcastSnapshot,
  } = usePictionarySync({
    roomCode: roomCode || null,
    playerId: currentPlayerId,
    isHost,
  });

  // Initialize game with lobby players (all clients)
  useEffect(() => {
    if (!initialized.current && lobbyPlayers.length > 0 && players.length === 0) {
      initialized.current = true;

      if (roomCode) setRoomCode(roomCode);

      const currentLobbyPlayer = useLobbyStore.getState().currentPlayerId;
      if (currentLobbyPlayer) setCurrentPlayer(currentLobbyPlayer);

      // Apply round count from lobby settings
      if (lobbyRoundCount) {
        updateSettings({ rounds: lobbyRoundCount });
      }

      lobbyPlayers.forEach((p, idx) => {
        addPlayer({
          id: p.id,
          name: p.name,
          avatar: {
            id: p.avatarId,
            name: p.name,
            filename: p.avatarFilename,
            category: 'misc' as const,
          },
          score: 0,
          isHost: p.isHost,
          isDrawing: idx === 0,
          hasGuessedCorrectly: false,
          joinedAt: Date.now(),
        });
      });
      // Game start is handled below — waits for sync channel to be ready
    }
  }, [lobbyPlayers, players.length, roomCode, setRoomCode, setCurrentPlayer, addPlayer, updateSettings, lobbyRoundCount]);

  // HOST: start game only AFTER the sync channel is confirmed connected
  const gameStarted = useRef(false);
  useEffect(() => {
    if (isHost && isReady && !gameStarted.current && players.length > 0 && phase === 'lobby') {
      gameStarted.current = true;
      startWordSelection();
    }
  }, [isHost, isReady, players.length, phase, startWordSelection]);

  // HOST: broadcast game state after every phase change
  useEffect(() => {
    if (!isHost) return;
    const t = setTimeout(() => {
      broadcastGameState();
      // If word selection started and drawer is non-host, send word options
      if (phase === 'word-selection') {
        const s = useGameStore.getState();
        const drawer = s.players[s.currentDrawerIndex];
        if (drawer && !drawer.isHost) {
          broadcastWordOptions(drawer.id, s.wordOptions);
        }
      }
    }, 50);
    return () => clearTimeout(t);
  }, [phase, currentRound, isHost, broadcastGameState, broadcastWordOptions]);

  // HOST ONLY: run the game timer
  useEffect(() => {
    if (!isHost) return;
    if (phase === 'word-selection' || phase === 'drawing') {
      timerRef.current = setInterval(() => decrementTime(), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, decrementTime, isHost]);

  // HOST: sync timer to non-host clients periodically
  useEffect(() => {
    if (!isHost || (phase !== 'drawing' && phase !== 'word-selection')) {
      if (timerSyncRef.current) clearInterval(timerSyncRef.current);
      return;
    }
    timerSyncRef.current = setInterval(() => broadcastGameState(), 2000);
    return () => {
      if (timerSyncRef.current) clearInterval(timerSyncRef.current);
    };
  }, [isHost, phase, broadcastGameState]);

  // HOST: handle round end → wait → next round
  useEffect(() => {
    if (phase === 'round-end' && isHost) {
      const word = useGameStore.getState().currentWord;
      if (word) broadcastRoundEnd(word);
      const t = setTimeout(() => nextRound(), 4000);
      return () => clearTimeout(t);
    }
  }, [phase, nextRound, isHost, broadcastRoundEnd]);

  const handlePlayAgain = () => {
    resetGame();
    endLobbyGame();
    navigate(`/lobby/${roomCode}`);
  };

  const handleLeave = () => {
    resetGame();
    endLobbyGame();
    navigate(`/lobby/${roomCode}`);
  };

  const getTimerClass = () => {
    if (timeRemaining <= 10) return 'timer danger';
    if (timeRemaining <= 20) return 'timer warning';
    return 'timer';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : secs.toString();
  };

  if (phase === 'game-over') {
    return <GameOver onPlayAgain={handlePlayAgain} onLeave={handleLeave} />;
  }

  return (
    <div className="game-layout">
      {/* Left Sidebar - Players */}
      <div className="sidebar-left">
        <div className="card" style={{ padding: '12px' }}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-muted" style={{ fontSize: '0.85rem' }}>Room</span>
            <span className="room-code-small">{roomCode}</span>
          </div>
          <div className="round-indicator">
            Round {Math.floor(currentRound / Math.max(players.length, 1)) + 1} / {settings.rounds}
          </div>
        </div>

        <div className="card flex-col" style={{ flex: 1, padding: '12px' }}>
          <h3 className="mb-2" style={{ fontSize: '1rem' }}>Players</h3>
          <PlayerList />
        </div>

        {isHost && (
          <button
            className="btn btn-secondary w-full"
            onClick={endGame}
            style={{ marginTop: '8px', fontSize: '0.85rem' }}
          >
            End Game
          </button>
        )}
      </div>

      {/* Main Area - Canvas */}
      <div className="main-area">
        {/* Top bar with timer and word/hint */}
        <div className="card" style={{ padding: '12px' }}>
          <div className="flex justify-between items-center">
            <div>
              {phase === 'word-selection' && (
                <span className="text-muted">
                  {isDrawing ? 'Pick a word...' : `${currentDrawer?.name} is choosing...`}
                </span>
              )}
              {phase === 'drawing' && (
                <>
                  {isDrawing ? (
                    <span style={{
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      color: 'var(--accent-primary)'
                    }}>
                      Draw: {currentWord}
                    </span>
                  ) : (
                    <div className="word-hint">{wordHint}</div>
                  )}
                </>
              )}
              {phase === 'round-end' && (
                <span style={{
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: 'var(--accent-success)'
                }}>
                  The word was: {currentWord}
                </span>
              )}
            </div>

            <div className={getTimerClass()}>
              {formatTime(timeRemaining)}
            </div>
          </div>
        </div>

        {/* Canvas or Word Selection */}
        {phase === 'word-selection' && isDrawing ? (
          <WordSelection
            onSelectWord={isHost ? undefined : broadcastWordSelection}
          />
        ) : (
          <DrawingCanvas
            onDrawBroadcast={isDrawing ? broadcastDraw : undefined}
            onClearBroadcast={isDrawing ? broadcastClearCanvas : undefined}
            onSnapshotBroadcast={isDrawing ? broadcastSnapshot : undefined}
          />
        )}
      </div>

      {/* Right Sidebar - Chat */}
      <div className="sidebar-right">
        <ChatPanel
          isHost={isHost}
          broadcastGuess={!isHost ? broadcastGuess : undefined}
          broadcastChatMessage={isHost ? broadcastChatMessage : undefined}
          broadcastGameState={isHost ? broadcastGameState : undefined}
        />
      </div>
    </div>
  );
}
