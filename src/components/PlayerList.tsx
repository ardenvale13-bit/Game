import useGameStore from '../store/gameStore';

export default function PlayerList() {
  const { players, currentPlayerId, getCurrentDrawer } = useGameStore();
  const currentDrawer = getCurrentDrawer();

  // Sort by score (highest first)
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="scoreboard">
      {sortedPlayers.map((player, index) => {
        const isCurrentPlayer = player.id === currentPlayerId;
        const isDrawing = player.id === currentDrawer?.id;
        
        return (
          <div 
            key={player.id} 
            className={`player-card ${player.isHost ? 'host' : ''} ${isDrawing ? 'drawing' : ''}`}
            style={isCurrentPlayer ? { 
              borderColor: 'var(--accent-tertiary)',
            } : {}}
          >
            {/* Rank indicator */}
            <div style={{ 
              width: '24px', 
              textAlign: 'center',
              fontWeight: 700,
              color: index === 0 ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontSize: '0.9rem',
            }}>
              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
            </div>

            {/* Avatar */}
            <div 
              className="avatar"
              style={{ 
                width: '36px',
                height: '36px',
                overflow: 'hidden',
              }}
            >
              <img 
                src={`/avatars/${player.avatar.filename}`} 
                alt={player.avatar.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              />
            </div>

            {/* Name and status */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontWeight: 600, 
                fontSize: '0.9rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {player.name}
                {isCurrentPlayer && <span className="text-muted"> (you)</span>}
              </div>
              {isDrawing && (
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>
                  ✏️ Drawing
                </div>
              )}
              {player.hasGuessedCorrectly && !isDrawing && (
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-success)' }}>
                  ✓ Guessed
                </div>
              )}
            </div>

            {/* Score */}
            <div className="score">
              {player.score}
            </div>
          </div>
        );
      })}
    </div>
  );
}
