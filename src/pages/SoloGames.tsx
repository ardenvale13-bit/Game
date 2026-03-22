// Solo Games - Quick-play selection for 1-2 player games
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type SoloGameType = 'tictactoe' | 'connect4' | 'checkers' | 'chess' | 'sudoku';
type Difficulty = 'easy' | 'medium' | 'hard';
type CheckersColor = 'pink' | 'blue' | 'purple';

interface GameInfo {
  id: SoloGameType;
  name: string;
  icon: string;
  description: string;
  supportsMultiplayer: boolean;
}

const SOLO_GAMES: GameInfo[] = [
  { id: 'tictactoe', name: 'Noughts & Crosses', icon: '/tictactoe-icon.png', description: 'Classic 3×3 grid', supportsMultiplayer: true },
  { id: 'connect4', name: 'Connect Four', icon: '/connect4-icon.png', description: 'Drop to connect', supportsMultiplayer: true },
  { id: 'checkers', name: 'Checkers', icon: '/checkers-icon.png', description: 'Jump & capture', supportsMultiplayer: true },
  { id: 'chess', name: 'Chess', icon: '/chess-icon.png', description: 'The classic', supportsMultiplayer: true },
  { id: 'sudoku', name: 'Sudoku', icon: '/sudoku-icon.png', description: 'Number puzzle', supportsMultiplayer: false },
];

const CHECKERS_COLORS: { id: CheckersColor; label: string; img: string }[] = [
  { id: 'pink', label: 'Pink', img: '/checkers-pink.png' },
  { id: 'blue', label: 'Blue', img: '/checkers-blue.png' },
  { id: 'purple', label: 'Purple', img: '/checkers-purple.png' },
];

export default function SoloGames() {
  const navigate = useNavigate();
  const [selectedGame, setSelectedGame] = useState<SoloGameType | null>(null);
  const [mode, setMode] = useState<'ai' | 'local'>('ai');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [checkersColor, setCheckersColor] = useState<CheckersColor>('pink');
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handlePlay = () => {
    if (!selectedGame) return;
    const params = new URLSearchParams();
    params.set('mode', mode);
    if (mode === 'ai' || selectedGame === 'sudoku') params.set('diff', difficulty);
    if (selectedGame === 'checkers') params.set('color', checkersColor);
    navigate(`/solo/${selectedGame}?${params.toString()}`);
  };

  const selectedInfo = SOLO_GAMES.find(g => g.id === selectedGame);

  return (
    <div className="home-layout" style={{ gap: '16px' }}>
      <button
        className="btn btn-ghost"
        onClick={() => navigate('/')}
        style={{ alignSelf: 'flex-start', marginBottom: '-8px' }}
      >
        ← Back
      </button>

      <h1 className={`text-glow ${entered ? 'actions-entered' : ''}`} style={{ fontSize: '1.8rem', margin: 0 }}>
        Quick Play
      </h1>
      <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '-8px' }}>
        Solo or pass-and-play • No room needed
      </p>

      {/* Game Grid */}
      <div className="game-grid" style={{ gap: '10px' }}>
        {SOLO_GAMES.map(game => (
          <button
            key={game.id}
            className={`game-select-btn ${selectedGame === game.id ? 'selected' : ''}`}
            onClick={() => setSelectedGame(game.id)}
          >
            <img src={game.icon} alt={game.name} className="game-icon-img" />
          </button>
        ))}
      </div>

      {/* Settings */}
      {selectedGame && (
        <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '16px' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '12px', textAlign: 'center' }}>{selectedInfo?.name}</h3>

          {/* Mode Toggle (skip for sudoku - solo only) */}
          {selectedInfo?.supportsMultiplayer && (
            <div style={{ marginBottom: '14px' }}>
              <div className="text-muted mb-1" style={{ fontSize: '0.8rem' }}>Mode</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className={`btn btn-small ${mode === 'ai' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setMode('ai')}
                  style={{ flex: 1 }}
                >
                  vs Computer
                </button>
                <button
                  className={`btn btn-small ${mode === 'local' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setMode('local')}
                  style={{ flex: 1 }}
                >
                  vs Friend (local)
                </button>
              </div>
            </div>
          )}

          {/* Difficulty */}
          {(mode === 'ai' || selectedGame === 'sudoku') && (
            <div style={{ marginBottom: '14px' }}>
              <div className="text-muted mb-1" style={{ fontSize: '0.8rem' }}>Difficulty</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                  <button
                    key={d}
                    className={`btn btn-small ${difficulty === d ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setDifficulty(d)}
                    style={{ flex: 1, textTransform: 'capitalize' }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Checkers Color Picker */}
          {selectedGame === 'checkers' && (
            <div style={{ marginBottom: '14px' }}>
              <div className="text-muted mb-1" style={{ fontSize: '0.8rem' }}>Your Piece Colour</div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                {CHECKERS_COLORS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCheckersColor(c.id)}
                    style={{
                      background: checkersColor === c.id ? 'rgba(0, 240, 255, 0.12)' : 'var(--bg-elevated)',
                      border: checkersColor === c.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
                      borderRadius: 'var(--radius-md)',
                      padding: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <img src={c.img} alt={c.label} style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                    <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            className="btn btn-primary w-full"
            onClick={handlePlay}
            style={{ marginTop: '4px' }}
          >
            Play {selectedInfo?.name}
          </button>
        </div>
      )}
    </div>
  );
}
