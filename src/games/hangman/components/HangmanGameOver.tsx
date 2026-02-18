// Hangman Game Over - Final scores and play again / leave options
import useHangmanStore from '../hangmanStore';
import '../hangman.css';

interface HangmanGameOverProps {
  onPlayAgain: () => void;
  onLeave: () => void;
}

export default function HangmanGameOver({ onPlayAgain, onLeave }: HangmanGameOverProps) {
  const { getLeaderboard } = useHangmanStore();
  const leaderboard = getLeaderboard();

  return (
    <div className="hangman-layout">
      <div className="hangman-game-over-container">
        <div className="hangman-game-over-title">Game Over!</div>

        <div className="hangman-leaderboard">
          <h2>Final Scores</h2>
          <div className="hangman-leaderboard-list">
            {leaderboard.map((player, idx) => (
              <div key={player.id} className="hangman-leaderboard-item">
                <div className="hangman-leaderboard-rank">#{idx + 1}</div>
                <div className="hangman-leaderboard-player">
                  <img src={`/avatars/${player.avatarFilename}`} alt={player.name} />
                  <div className="hangman-leaderboard-name">{player.name}</div>
                </div>
                <div className="hangman-leaderboard-score">{player.score}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="hangman-game-over-actions">
          <button className="hangman-play-again-btn" onClick={onPlayAgain}>
            Play Again
          </button>
          <button className="hangman-leave-btn" onClick={onLeave}>
            Leave Game
          </button>
        </div>
      </div>
    </div>
  );
}
