// Guess Who - Game Over Screen
import useGuesswhoStore from '../guesswhoStore';

interface GWGameOverProps {
  onPlayAgain: () => void;
  onBackToLobby: () => void;
}

export default function GWGameOver({ onPlayAgain, onBackToLobby }: GWGameOverProps) {
  const { players, roundResults } = useGuesswhoStore();
  const leaderboard = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="gw-layout">
      {/* Game Over Header */}
      <div className="gw-header">
        <span className="gw-round-badge">Game Over!</span>
      </div>

      {/* Podium */}
      <div className="gw-podium">
        {leaderboard.slice(0, 3).map((player, idx) => {
          const medals = ['🥇', '🥈', '🥉'];
          const positions = ['1st', '2nd', '3rd'];
          return (
            <div
              key={player.id}
              className={`gw-podium-position gw-podium-${idx}`}
            >
              <div className="gw-podium-medal">{medals[idx]}</div>
              <div className="gw-podium-rank">{positions[idx]}</div>
              <div className="gw-podium-avatar">
                <img
                  src={`/avatars/${player.avatarFilename}`}
                  alt={player.name}
                />
              </div>
              <div className="gw-podium-name">{player.name}</div>
              <div className="gw-podium-score">{player.score} pts</div>
            </div>
          );
        })}
      </div>

      {/* Full Leaderboard */}
      <div className="card mb-3">
        <h3 className="mb-2">Final Scores</h3>
        <div className="flex flex-col gap-2">
          {leaderboard.map((player, idx) => (
            <div
              key={player.id}
              className="player-card"
              style={{
                opacity: idx < 3 ? 1 : 0.8,
              }}
            >
              <div className="avatar">
                <img
                  src={`/avatars/${player.avatarFilename}`}
                  alt={player.name}
                />
              </div>
              <span className="name" style={{ fontWeight: idx < 3 ? 700 : 400 }}>
                {idx + 1}. {player.name}
              </span>
              <span className="score">{player.score} pts</span>
            </div>
          ))}
        </div>
      </div>

      {/* Round Results */}
      {roundResults.length > 0 && (
        <div className="card mb-3">
          <h3 className="mb-2">Round Results</h3>
          <div className="flex flex-col gap-2">
            {roundResults.map((result, idx) => (
              <div
                key={idx}
                className="card"
                style={{
                  background: 'var(--bg-secondary)',
                  padding: '12px',
                  fontSize: '0.9rem',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: '6px' }}>
                  Round {result.round}
                </div>
                <div style={{ fontSize: '0.85rem', marginBottom: '4px' }}>
                  Chooser: <strong>{result.chooserName}</strong>
                </div>
                <div style={{ fontSize: '0.85rem', marginBottom: '4px' }}>
                  Character: <strong>{result.chosenCharacterName}</strong>
                </div>
                {result.winner ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)' }}>
                    Winner: <strong>{result.winner.playerName}</strong> (Guessed correctly!)
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: 'var(--accent-secondary)' }}>
                    No one guessed correctly (Time up)
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          className="btn btn-primary btn-large"
          onClick={onPlayAgain}
          style={{ flex: 1 }}
        >
          Play Again
        </button>
        <button
          className="btn btn-secondary btn-large"
          onClick={onBackToLobby}
          style={{ flex: 1 }}
        >
          Back to Lobby
        </button>
      </div>
    </div>
  );
}
