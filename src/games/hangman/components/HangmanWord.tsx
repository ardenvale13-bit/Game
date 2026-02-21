// Hangman Word Display - Shows word with blanks and revealed letters
import useHangmanStore from '../hangmanStore';

export default function HangmanWord() {
  const { secretWord, guessedLetters, category } = useHangmanStore();

  // Split into "words" by spaces for phrase support
  const words = secretWord.split(' ');
  const letterCount = secretWord.replace(/ /g, '').length;
  const guessedCount = secretWord.replace(/ /g, '').split('').filter(l => guessedLetters.includes(l)).length;

  return (
    <div className="hangman-word-container">
      <div className="hangman-category">{category}</div>
      <div className="hangman-word" style={{ flexWrap: 'wrap', gap: '16px' }}>
        {words.map((word, wordIdx) => (
          <div key={wordIdx} style={{ display: 'flex', gap: '4px' }}>
            {word.split('').map((letter, letterIdx) => (
              <div key={letterIdx} className="hangman-letter">
                {guessedLetters.includes(letter) ? letter : '_'}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="hangman-word-length">
        {guessedLetters.length > 0 && `${guessedCount}/${letterCount} letters`}
      </div>
    </div>
  );
}
