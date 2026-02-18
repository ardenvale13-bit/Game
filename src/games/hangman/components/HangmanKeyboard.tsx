// Hangman Keyboard - A-Z button grid for guessing letters
import useHangmanStore from '../hangmanStore';

interface HangmanKeyboardProps {
  onGuessLetter: (letter: string) => void;
  disabled: boolean;
}

export default function HangmanKeyboard({ onGuessLetter, disabled }: HangmanKeyboardProps) {
  const { guessedLetters } = useHangmanStore();

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <div className="hangman-keyboard">
      {alphabet.map((letter) => {
        const isGuessed = guessedLetters.includes(letter);
        const isDisabled = disabled || isGuessed;

        return (
          <button
            key={letter}
            className={`hangman-key ${isGuessed ? 'guessed' : 'available'}`}
            onClick={() => !isDisabled && onGuessLetter(letter)}
            disabled={isDisabled}
          >
            {letter}
          </button>
        );
      })}
    </div>
  );
}
