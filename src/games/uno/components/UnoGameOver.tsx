// Uno Game Over Screen
import useUnoStore from '../unoStore';

interface UnoGameOverProps {
  onPlayAgain: () => void;
  onBackToLobby: () => void;
}

export default function UnoGameOver({ onPlayAgain, onBackToLobby }: UnoGameOverProps) {
  const { players } = useUnoStore();

  const leaderboard = [...players].sort((a, b) => b.score - a.score);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="uno-game-over">
      <div className="uno-game-title">Game Over!</div>

      <div className="uno-podium">
        {leaderboard.slice(0, 3).map((player, idx) => (
          <div key={player.id} className={`uno-podium-position uno-podium-rank-${idx + 1}`}>
            <div className="uno-podium-rank">{medals[idx]}</div>
            <img
              src={`/avatars/${player.avatarFilename}`}
              alt={player.name}
              className="uno-podium-avatar"
            />
            <div className="uno-podium-bar">
              <span>{player.score}</span>
            </div>
            <div className="uno-podium-name">{player.name}</div>
            <div className="uno-podium-score">{player.score} pts</div>
          </div>
        ))}
      </div>

      {leaderboard.length > 3 && (
        <div className="uno-running-score">
          <div className="uno-running-title">Final Scores</div>
          {leaderboard.map((p, idx) => (
            <div key={p.id} className="uno-score-item">
              <span>
                {idx + 1}. {p.name}
              </span>
              <span style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>
                {p.score}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="uno-buttons-group">
        <button className="btn btn-primary" onClick={onPlayAgain}>
          Play Again
        </button>
        <button className="btn btn-secondary" onClick={onBackToLobby}>
          Back to Lobby
        </button>
      </div>
    </div>
  );
}
