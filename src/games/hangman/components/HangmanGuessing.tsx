// Hangman Guessing Phase - Players guess letters
import useHangmanStore from '../hangmanStore';
import HangmanDrawing from './HangmanDrawing';
import HangmanWord from './HangmanWord';
import HangmanKeyboard from './HangmanKeyboard';
import '../hangman.css';

interface HangmanGuessingProps {
  onGuessLetter: (letter: string) => void;
}

export default function HangmanGuessing({ onGuessLetter }: HangmanGuessingProps) {
  const {
    players,
    currentPlayerId,
    currentPickerIndex,
    currentRound,
    maxRounds,
    wrongGuesses,
    maxWrong,
  } = useHangmanStore();

  const picker = players[currentPickerIndex];
  const isCurrentPlayerPicker = currentPlayerId === picker?.id;

  return (
    <div className="hangman-layout">
      <div className="hangman-header">
        <div className="hangman-round">
          Round {currentRound}/{maxRounds}
        </div>
        <div className="hangman-wrong-count">
          Wrong: {wrongGuesses}/{maxWrong}
        </div>
      </div>

      <div className="hangman-game-container">
        <div className="hangman-drawing-section">
          <HangmanDrawing wrongGuesses={wrongGuesses} />
        </div>

        <div className="hangman-word-section">
          <HangmanWord />
        </div>
      </div>

      <div className="hangman-keyboard-section">
        {isCurrentPlayerPicker ? (
          <div className="hangman-picker-waiting">
            <p>You're the picker. Wait for others to guess...</p>
          </div>
        ) : (
          <>
            <p className="hangman-guess-prompt">Guess a letter:</p>
            <HangmanKeyboard
              onGuessLetter={onGuessLetter}
              disabled={false}
            />
          </>
        )}
      </div>

      <div className="hangman-players-list">
        <h3>Players</h3>
        <div className="hangman-players">
          {players.map((p) => (
            <div key={p.id} className={`hangman-player-item ${p.id === picker?.id ? 'picker' : ''}`}>
              <div className="hangman-player-avatar">
                <img src={`/avatars/${p.avatarFilename}`} alt={p.name} />
              </div>
              <div className="hangman-player-info">
                <div className="hangman-player-name">
                  {p.name} {p.id === picker?.id && <span className="hangman-picker-badge">Picker</span>}
                </div>
                <div className="hangman-player-score">{p.score} pts</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
