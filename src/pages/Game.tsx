import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useGameStore from '../store/gameStore';
import DrawingCanvas from '../components/DrawingCanvas';
import WordSelection from '../components/WordSelection';
import ChatPanel from '../components/ChatPanel';
import PlayerList from '../components/PlayerList';
import GameOver from '../components/GameOver';

export default function Game() {
  const navigate = useNavigate();
  const { roomCode } = useParams();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
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
  } = useGameStore();

  const currentDrawer = getCurrentDrawer();
  const isDrawing = isCurrentPlayerDrawing();
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const isHost = currentPlayer?.isHost ?? false;

  // Timer effect
  useEffect(() => {
    if (phase === 'word-selection' || phase === 'drawing') {
      timerRef.current = setInterval(() => {
        decrementTime();
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [phase, decrementTime]);

  // Handle round end transition
  useEffect(() => {
    if (phase === 'round-end') {
      const timeout = setTimeout(() => {
        nextRound();
      }, 4000); // Show results for 4 seconds

      return () => clearTimeout(timeout);
    }
  }, [phase, nextRound]);

  const handlePlayAgain = () => {
    resetGame();
    navigate(`/lobby/${roomCode}`);
  };

  const handleLeave = () => {
    navigate('/');
  };

  // Get timer class for styling
  const getTimerClass = () => {
    if (timeRemaining <= 10) return 'timer danger';
    if (timeRemaining <= 20) return 'timer warning';
    return 'timer';
  };

  // Format time display
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
            Round {currentRound + 1} / {settings.rounds}
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
          <WordSelection />
        ) : (
          <DrawingCanvas />
        )}
      </div>

      {/* Right Sidebar - Chat */}
      <div className="sidebar-right">
        <ChatPanel />
      </div>
    </div>
  );
}
