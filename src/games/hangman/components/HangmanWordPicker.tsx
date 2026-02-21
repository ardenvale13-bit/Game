// Hangman Word Picker - UI for word picker to enter word or use random
import { useState } from 'react';
import { getRandomWord, CATEGORIES } from '../hangmanData';

interface HangmanWordPickerProps {
  onSetWord: (word: string, category: string) => void;
}

export default function HangmanWordPicker({ onSetWord }: HangmanWordPickerProps) {
  const [customWord, setCustomWord] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [submitted, setSubmitted] = useState(false);

  const handleRandomWord = () => {
    const randomWord = getRandomWord();
    onSetWord(randomWord.word, randomWord.category);
    setSubmitted(true);
  };

  const handleSubmitCustom = () => {
    if (!customWord.trim()) return;

    // Normalize: trim, uppercase, collapse multiple spaces
    const word = customWord.trim().toUpperCase().replace(/\s+/g, ' ');
    // Validate: letters and spaces only, must contain at least one letter
    if (!/^[A-Z][A-Z ]*[A-Z]$/.test(word) && !/^[A-Z]$/.test(word)) {
      alert('Word must contain only letters (spaces allowed for phrases)');
      return;
    }

    onSetWord(word, selectedCategory);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="hangman-waiting">
        <div className="hangman-spinner" />
        <p>Waiting for guesses...</p>
      </div>
    );
  }

  return (
    <div className="hangman-word-picker">
      <h2>Pick a Word</h2>
      <p className="hangman-subtitle">Choose or enter a word for others to guess</p>

      <div className="hangman-picker-section">
        <h3>Random Word</h3>
        <button
          className="hangman-random-btn"
          onClick={handleRandomWord}
        >
          Generate Random Word
        </button>
      </div>

      <div className="hangman-divider">or</div>

      <div className="hangman-picker-section">
        <h3>Custom Word</h3>

        <div className="hangman-form-group">
          <label htmlFor="custom-word">Word</label>
          <input
            id="custom-word"
            type="text"
            placeholder="Enter a word or phrase..."
            value={customWord}
            onChange={(e) => setCustomWord(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmitCustom()}
            maxLength={40}
          />
        </div>

        <div className="hangman-form-group">
          <label htmlFor="category-select">Category</label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <button
          className="hangman-submit-btn"
          onClick={handleSubmitCustom}
          disabled={!customWord.trim()}
        >
          Submit Word
        </button>
      </div>
    </div>
  );
}
