// CAH Game Over Component
import useCAHStore from '../cahStore';

interface CAHGameOverProps {
  onPlayAgain: () => void;
  onLeave: () => void;
}

export default function CAHGameOver({ onPlayAgain, onLeave }: CAHGameOverProps) {
  const { getLeaderboard, currentPlayerId, resetGame } = useCAHStore();
  const leaderboard = getLeaderboard();
  const winner = leaderboard[0];

  const handlePlayAgain = () => {
    resetGame();
    onPlayAgain();
  };

  return (
    <div className="cah-game-over">
      <div className="cah-game-over-content">
        <h1>Game Over!</h1>

        {/* Winner */}
        {winner && (
          <div className="cah-final-winner">
            <div className="cah-winner-crown">👑</div>
            <div className="cah-winner-avatar large">
              <img 
                src={`/avatars/${winner.avatarFilename}`} 
                alt={winner.name}
              />
            </div>
            <h2>
              {winner.name} {winner.id === currentPlayerId && '(You!)'}
            </h2>
            <div className="cah-winner-score">
              {winner.score} points
            </div>
            <div className="cah-winner-title">
              Horrible Person Champion
            </div>
          </div>
        )}

        {/* Full leaderboard */}
        <div className="cah-final-leaderboard">
          <h3>Final Standings</h3>
          {leaderboard.map((player, idx) => (
            <div 
              key={player.id} 
              className={`cah-leaderboard-row ${player.id === currentPlayerId ? 'you' : ''}`}
            >
              <span className="rank">
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
              </span>
              <img 
                src={`/avatars/${player.avatarFilename}`} 
                alt={player.name}
                className="avatar-small"
              />
              <span className="name">
                {player.name}
                {player.id === currentPlayerId && ' (you)'}
              </span>
              <span className="score">{player.score}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="cah-game-over-actions">
          <button
            className="btn btn-primary btn-large"
            onClick={handlePlayAgain}
            style={{ flex: 1 }}
          >
            Play Again
          </button>
          <button
            className="btn btn-secondary btn-large"
            onClick={onLeave}
            style={{ flex: 1 }}
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}
