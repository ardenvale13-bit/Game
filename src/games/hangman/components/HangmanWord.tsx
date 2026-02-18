// Hangman Word Display - Shows word with blanks and revealed letters
import useHangmanStore from '../hangmanStore';

export default function HangmanWord() {
  const { secretWord, guessedLetters, category } = useHangmanStore();

  const wordDisplay = secretWord
    .split('')
    .map((letter) => (guessedLetters.includes(letter) ? letter : '_'));

  return (
    <div className="hangman-word-container">
      <div className="hangman-category">{category}</div>
      <div className="hangman-word">
        {wordDisplay.map((letter, idx) => (
          <div key={idx} className="hangman-letter">
            {letter}
          </div>
        ))}
      </div>
      <div className="hangman-word-length">
        {guessedLetters.length > 0 && `${secretWord.split('').filter(l => guessedLetters.includes(l)).length}/${secretWord.length} letters`}
      </div>
    </div>
  );
}
