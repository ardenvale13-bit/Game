// WMLT Game Over - Final standings and play again
import useWMLTStore from '../wmltStore';

interface WMLTGameOverProps {
  onPlayAgain: () => void;
  onBackToLobby: () => void;
}

export default function WMLTGameOver({ onPlayAgain, onBackToLobby }: WMLTGameOverProps) {
  const { getFinalLeaderboard, roundResults } = useWMLTStore();
  const leaderboard = getFinalLeaderboard();

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  // Find the player who "won" the most rounds
  const roundWins: Record<string, number> = {};
  roundResults.forEach(r => {
    if (r.winnerId) {
      roundWins[r.winnerId] = (roundWins[r.winnerId] || 0) + 1;
    }
  });

  return (
    <div className="wmlt-game-over">
      <h1>Game Over!</h1>
      <div className="wmlt-game-over-subtitle">
        The votes have spoken. Here's who the group thinks is most likely to... everything.
      </div>

      {/* Podium */}
      <div className="wmlt-podium">
        {top3.map((player, i) => {
          const rank = i === 0 ? 'first' : i === 1 ? 'second' : 'third';
          const emoji = i === 0 ? '👑' : i === 1 ? '🥈' : '🥉';
          return (
            <div key={player.id} className={`wmlt-podium-spot ${rank}`}>
              <div className="wmlt-podium-rank">{emoji}</div>
              <div className="wmlt-podium-avatar">
                <img src={`/avatars/${player.avatarFilename}`} alt={player.name} />
              </div>
              <div className="wmlt-podium-name">{player.name}</div>
              <div className="wmlt-podium-score">{player.score} votes</div>
            </div>
          );
        })}
      </div>

      {/* Full standings */}
      {rest.length > 0 && (
        <div className="wmlt-full-standings">
          {rest.map((player, i) => (
            <div key={player.id} className="wmlt-standing-row">
              <div className="wmlt-standing-rank">{i + 4}</div>
              <div className="wmlt-standing-avatar">
                <img src={`/avatars/${player.avatarFilename}`} alt={player.name} />
              </div>
              <div className="wmlt-standing-name">{player.name}</div>
              <div className="wmlt-standing-score">{player.score} votes</div>
            </div>
          ))}
        </div>
      )}

      {/* Round highlights */}
      {roundResults.length > 0 && (
        <div style={{ marginBottom: '32px', textAlign: 'left', maxWidth: '500px', margin: '0 auto 32px' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '12px', fontSize: '1rem' }}>Round Highlights</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {roundResults.slice(-5).map((r) => {
              const winner = leaderboard.find(p => p.id === r.winnerId);
              return (
                <div
                  key={r.round}
                  style={{
                    background: 'var(--bg-card)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>R{r.round}:</span>{' '}
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                    {winner?.name ?? '?'}
                  </span>{' '}
                  <span style={{ color: 'var(--text-secondary)' }}>
                    — most likely to {r.prompt}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="wmlt-actions">
        <button className="btn btn-primary btn-large" onClick={onPlayAgain}>
          Play Again
        </button>
        <button className="btn btn-secondary btn-large" onClick={onBackToLobby}>
          Back to Lobby
        </button>
      </div>
    </div>
  );
}
