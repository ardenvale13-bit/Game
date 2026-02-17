import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useGameStore from '../store/gameStore';
import useCAHStore from '../games/cah/cahStore';

type GameType = 'pictionary' | 'cah';

export default function Home() {
  const navigate = useNavigate();
  const resetPictionaryGame = useGameStore((state) => state.resetGame);
  const resetCAHGame = useCAHStore((state) => state.resetGame);
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);

  // Clear any lingering game state when landing on home
  useEffect(() => {
    resetPictionaryGame();
    resetCAHGame();
  }, [resetPictionaryGame, resetCAHGame]);

  const handleCreate = () => {
    if (selectedGame === 'pictionary') {
      navigate('/create');
    } else if (selectedGame === 'cah') {
      navigate('/cah/create');
    }
  };

  const handleJoin = () => {
    if (selectedGame === 'pictionary') {
      navigate('/join');
    } else if (selectedGame === 'cah') {
      navigate('/cah/join');
    }
  };

  return (
    <div className="home-layout">
      <div className="logo">
        <img 
          src="/controller.png" 
          alt="Game Time"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
      <h1 className="game-title">Game Time</h1>
      <p className="tagline">Party games for the digitally unhinged</p>
      
      {/* Game Selection */}
      <div className="game-selection">
        <p className="text-muted mb-2" style={{ fontSize: '0.9rem' }}>Choose a game:</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className={`game-select-btn ${selectedGame === 'pictionary' ? 'selected' : ''}`}
            onClick={() => setSelectedGame('pictionary')}
          >
            <span className="game-icon">🎨</span>
            <span className="game-name">Pictionary</span>
          </button>
          <button
            className={`game-select-btn ${selectedGame === 'cah' ? 'selected' : ''}`}
            onClick={() => setSelectedGame('cah')}
          >
            <span className="game-icon">🃏</span>
            <span className="game-name">Cards Against<br/>Humanity</span>
          </button>
        </div>
      </div>

      <div className="home-actions">
        <button 
          className="btn btn-primary btn-large w-full"
          onClick={handleCreate}
          disabled={!selectedGame}
        >
          Create Room
        </button>
        
        <button 
          className="btn btn-secondary btn-large w-full"
          onClick={handleJoin}
          disabled={!selectedGame}
        >
          Join Room
        </button>
      </div>

      <p className="text-muted mt-4" style={{ fontSize: '0.9rem' }}>
        No account needed • Just jump in and play
      </p>
    </div>
  );
}
