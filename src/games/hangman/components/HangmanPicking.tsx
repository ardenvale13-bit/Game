// Hangman Picking Phase - Word picker selects or enters a word
import useHangmanStore from '../hangmanStore';
import HangmanWordPicker from './HangmanWordPicker';
import '../hangman.css';

interface HangmanPickingProps {
  onSetWord: (word: string, category: string) => void;
}

export default function HangmanPicking({ onSetWord }: HangmanPickingProps) {
  const { players, currentPickerIndex, currentRound, maxRounds, currentPlayerId } = useHangmanStore();
  const picker = players[currentPickerIndex];
  const isCurrentPlayerPicker = currentPlayerId === picker?.id;

  return (
    <div className="hangman-layout">
      <div className="hangman-header">
        <div className="hangman-round">
          Round {currentRound}/{maxRounds}
        </div>
      </div>

      <div className="hangman-container">
        <div className="hangman-picker-status">
          <div className="hangman-picker-label">
            {isCurrentPlayerPicker ? "You're the Word Picker" : `${picker?.name} is picking...`}
          </div>
        </div>

        {isCurrentPlayerPicker ? (
          <HangmanWordPicker onSetWord={onSetWord} />
        ) : (
          <div className="hangman-waiting-picker">
            <div className="hangman-spinner" />
            <p>Waiting for {picker?.name} to pick a word...</p>
          </div>
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
