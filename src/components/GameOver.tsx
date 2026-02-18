import useGameStore from '../store/gameStore';

interface GameOverProps {
  onPlayAgain: () => void;
  onLeave: () => void;
}

export default function GameOver({ onPlayAgain, onLeave }: GameOverProps) {
  const { getLeaderboard, currentPlayerId } = useGameStore();
  const leaderboard = getLeaderboard();
  const winner = leaderboard[0];

  const getMedalIcon = (index: number) => {
    switch (index) {
      case 0: return <img src="/first-icon.png" alt="1st" style={{ width: '28px', height: '28px' }} />;
      case 1: return <img src="/second-icon.png" alt="2nd" style={{ width: '28px', height: '28px' }} />;
      case 2: return <img src="/third-icon.png" alt="3rd" style={{ width: '28px', height: '28px' }} />;
      default: return `${index + 1}.`;
    }
  };

  const getPlaceGlow = (index: number): React.CSSProperties => {
    switch (index) {
      case 0: return { borderColor: '#FFD700', boxShadow: '0 0 12px rgba(255, 215, 0, 0.4)' };
      case 1: return { borderColor: '#C0C0C0', boxShadow: '0 0 12px rgba(192, 192, 192, 0.4)' };
      case 2: return { borderColor: '#CD7F32', boxShadow: '0 0 12px rgba(205, 127, 50, 0.4)' };
      default: return {};
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <div className="card game-over" style={{ maxWidth: '500px', width: '100%' }}>
        <h1>Game Over!</h1>

        {/* Winner display */}
        {winner && (
          <div className="winner-display">
            <div className="winner-avatar">
              <img 
                src={`/avatars/${winner.avatar.filename}`} 
                alt={winner.avatar.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              />
            </div>
            <h2 style={{ marginBottom: '4px' }}>
              {winner.name} {winner.id === currentPlayerId && '(You!)'}
            </h2>
            <div style={{ 
              fontSize: '2rem', 
              fontWeight: 700, 
              color: 'var(--accent-primary)',
              fontFamily: 'var(--font-display)',
            }}>
              {winner.score} points
            </div>
            <div style={{ fontSize: '3rem', marginTop: '8px' }}>🎉</div>
          </div>
        )}

        {/* Full leaderboard */}
        <div style={{ textAlign: 'left', marginTop: '32px' }}>
          <h3 className="mb-2">Final Standings</h3>
          <div className="flex flex-col gap-1">
            {leaderboard.map((player, index) => (
              <div
                key={player.id}
                className="player-card"
                style={{
                  ...(player.id === currentPlayerId ? {
                    borderColor: 'var(--accent-tertiary)',
                    borderWidth: '2px',
                  } : {}),
                  ...getPlaceGlow(index),
                }}
              >
                <div style={{
                  width: '32px',
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: index < 3 ? '1.2rem' : '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {getMedalIcon(index)}
                </div>
                <div className="avatar">
                  <img 
                    src={`/avatars/${player.avatar.filename}`} 
                    alt={player.avatar.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  />
                </div>
                <span className="name">
                  {player.name}
                  {player.id === currentPlayerId && ' (you)'}
                </span>
                <span className="score">{player.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <button className="btn btn-primary" onClick={onPlayAgain} style={{ flex: 1 }}>
            🔄 Play Again
          </button>
          <button className="btn btn-secondary" onClick={onLeave} style={{ flex: 1 }}>
            🚪 Leave
          </button>
        </div>
      </div>
    </div>
  );
}
