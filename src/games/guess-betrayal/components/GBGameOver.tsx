// Guess Betrayal - Game Over Component
import useGuessBetrayalStore from '../guessBetrayalStore';

interface GBGameOverProps {
  onPlayAgain: () => void;
  onLeave?: () => void;
}

export default function GBGameOver({ onPlayAgain, onLeave }: GBGameOverProps) {
  const { getLeaderboard, maxRounds } = useGuessBetrayalStore();

  const leaderboard = getLeaderboard();
  const winner = leaderboard[0];

  const getMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <div className="gb-layout gb-game-over">
      {/* Winner announcement */}
      <div className="gb-winner-section">
        <div className="gb-winner-crown">👑</div>
        <div className="gb-winner-title">Game Over!</div>
        {winner && (
          <div className="gb-winner-card">
            <img
              src={`/avatars/${winner.avatarFilename}`}
              alt={winner.name}
              className="gb-winner-avatar"
            />
            <div className="gb-winner-name">{winner.name}</div>
            <div className="gb-winner-score">{winner.score} points</div>
            <div className="gb-winner-subtitle">
              {maxRounds} rounds of betrayal
            </div>
          </div>
        )}
      </div>

      {/* Full leaderboard */}
      <div className="gb-leaderboard">
        <h3 className="gb-leaderboard-title">Final Standings</h3>
        {leaderboard.map((player, idx) => (
          <div
            key={player.id}
            className={`gb-leaderboard-row ${idx === 0 ? 'first' : ''} ${idx === 1 ? 'second' : ''} ${idx === 2 ? 'third' : ''}`}
          >
            <span className="gb-lb-rank">{getMedal(idx)}</span>
            <img
              src={`/avatars/${player.avatarFilename}`}
              alt={player.name}
              className="gb-lb-avatar"
            />
            <span className="gb-lb-name">{player.name}</span>
            <span className="gb-lb-score">{player.score} pts</span>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="gb-gameover-actions">
        <button className="btn btn-primary btn-large" onClick={onPlayAgain}>
          Back to Lobby
        </button>
        {onLeave && (
          <button className="btn btn-ghost" onClick={onLeave} style={{ opacity: 0.7 }}>
            Leave Room
          </button>
        )}
      </div>
    </div>
  );
}
