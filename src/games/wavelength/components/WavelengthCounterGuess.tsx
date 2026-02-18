// Wavelength — Counter Guess (opposing team guesses higher/lower)
import useWavelengthStore from '../wavelengthStore';
import WavelengthDial from './WavelengthDial';

interface WavelengthCounterGuessProps {
  onSubmitGuess?: (guess: 'higher' | 'lower') => void;
}

export default function WavelengthCounterGuess({ onSubmitGuess }: WavelengthCounterGuessProps) {
  const { spectrum, teamGuessPosition, currentTeam, players, currentPlayerId } = useWavelengthStore();

  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const isCurrentTeam = currentPlayer?.team === currentTeam;

  const handleGuess = (guess: 'higher' | 'lower') => {
    if (onSubmitGuess) {
      onSubmitGuess(guess);
    } else {
      useWavelengthStore.getState().submitCounterGuess(guess);
    }
  };

  if (!spectrum) return null;

  const counterTeam = currentTeam === 'pink' ? 'blue' : 'pink';
  const canGuess = !isCurrentTeam && currentPlayer?.team === counterTeam;

  return (
    <div className="wl-counter-guess-container">
      <div className="wl-counter-role-badge">
        {currentTeam === 'pink' ? '🔵' : '🔴'} {currentTeam === 'pink' ? 'Blue' : 'Pink'} Team's Turn to Counter-Guess
      </div>

      <p className="wl-counter-instruction">
        The {currentTeam === 'pink' ? 'pink' : 'blue'} team guessed <span className="wl-counter-position">{Math.round(teamGuessPosition)}%</span>
      </p>

      <div className="wl-counter-spectrum-section">
        <p className="wl-counter-spectrum-label">Can you guess if the target is HIGHER or LOWER?</p>
        <WavelengthDial
          leftLabel={spectrum.left}
          rightLabel={spectrum.right}
          guessPosition={teamGuessPosition}
          showTarget={false}
          isInteractive={false}
        />
      </div>

      {canGuess && (
        <div className="wl-counter-buttons">
          <button
            className="wl-counter-button lower"
            onClick={() => handleGuess('lower')}
          >
            ← Lower
          </button>
          <button
            className="wl-counter-button higher"
            onClick={() => handleGuess('higher')}
          >
            Higher →
          </button>
        </div>
      )}

      {!canGuess && (
        <div className="wl-counter-waiting">
          {currentPlayer?.team === currentTeam
            ? 'Your team is guessing. Wait for the other team to counter.'
            : 'Waiting for the other team to guess...'}
        </div>
      )}

      <p className="wl-counter-rules">Correct guess = 1 bonus point!</p>
    </div>
  );
}
