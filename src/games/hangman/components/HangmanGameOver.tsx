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
              <div key={player.id} className="hangman-leaderboard-item" style={
                idx === 0 ? { borderColor: '#FFD700', boxShadow: '0 0 12px rgba(255, 215, 0, 0.4)' }
                : idx === 1 ? { borderColor: '#C0C0C0', boxShadow: '0 0 12px rgba(192, 192, 192, 0.4)' }
                : idx === 2 ? { borderColor: '#CD7F32', boxShadow: '0 0 12px rgba(205, 127, 50, 0.4)' }
                : {}
              }>
                <div className="hangman-leaderboard-rank" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {idx === 0 ? <img src="/first-icon.png" alt="1st" style={{ width: '28px', height: '28px' }} />
                    : idx === 1 ? <img src="/second-icon.png" alt="2nd" style={{ width: '28px', height: '28px' }} />
                    : idx === 2 ? <img src="/third-icon.png" alt="3rd" style={{ width: '28px', height: '28px' }} />
                    : `#${idx + 1}`}
                </div>
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
