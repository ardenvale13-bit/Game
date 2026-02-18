// Hangman Round End - Shows result and auto-advances
import useHangmanStore from '../hangmanStore';
import HangmanWord from './HangmanWord';
import '../hangman.css';

export default function HangmanRoundEnd() {
  const {
    phase,
    players,
    currentPickerIndex,
    winner,
    secretWord,
  } = useHangmanStore();

  const picker = players[currentPickerIndex];
  const winnerPlayer = players.find((p) => p.id === winner);
  const isWon = phase === 'won';

  return (
    <div className="hangman-layout">
      <div className="hangman-round-end">
        <div className={`hangman-result ${isWon ? 'won' : 'lost'}`}>
          {isWon ? '✓ Word Guessed!' : '✗ Word Not Guessed!'}
        </div>

        <div className="hangman-result-details">
          <HangmanWord />
          <div className="hangman-secret-reveal">
            The word was: <strong>{secretWord}</strong>
          </div>
        </div>

        <div className="hangman-round-winner">
          {isWon ? (
            <>
              <p className="hangman-winner-text">{winnerPlayer?.name} wins!</p>
              <p className="hangman-winner-score">+15 points</p>
            </>
          ) : (
            <>
              <p className="hangman-winner-text">{picker?.name} wins!</p>
              <p className="hangman-winner-score">+15 points</p>
            </>
          )}
        </div>

        <div className="hangman-next-round-info">
          <p>Next round starting in 5 seconds...</p>
        </div>
      </div>

      <div className="hangman-players-list">
        <h3>Scores</h3>
        <div className="hangman-players">
          {players.map((p) => (
            <div key={p.id} className={`hangman-player-item ${p.id === winner ? 'winner' : ''}`}>
              <div className="hangman-player-avatar">
                <img src={`/avatars/${p.avatarFilename}`} alt={p.name} />
              </div>
              <div className="hangman-player-info">
                <div className="hangman-player-name">{p.name}</div>
                <div className="hangman-player-score">{p.score} pts</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
