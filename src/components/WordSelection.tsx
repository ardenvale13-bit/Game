import useGameStore from '../store/gameStore';

interface WordSelectionProps {
  onSelectWord?: (word: string) => void;
}

export default function WordSelection({ onSelectWord }: WordSelectionProps) {
  const { wordOptions, selectWord, timeRemaining } = useGameStore();

  const handleSelect = (word: string) => {
    if (onSelectWord) {
      // Non-host drawer: broadcast selection to host
      onSelectWord(word);
    } else {
      // Host drawer: select locally
      selectWord(word);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'var(--accent-success)';
      case 'medium': return 'var(--accent-warning)';
      case 'hard': return 'var(--accent-secondary)';
      default: return 'var(--text-muted)';
    }
  };

  const starIcon = <img src="/star-icon.png" alt="★" style={{ width: '14px', height: '14px', display: 'inline-block', verticalAlign: 'middle' }} />;

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return <>{starIcon}</>;
      case 'medium': return <>{starIcon}{starIcon}</>;
      case 'hard': return <>{starIcon}{starIcon}{starIcon}</>;
      default: return null;
    }
  };

  return (
    <div className="card" style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
    }}>
      <img src="/palette-icon.png" alt="" style={{ width: '64px', height: '64px', marginBottom: '16px' }} />
      <h2 className="mb-2">Choose a word to draw!</h2>
      <p className="text-muted mb-4">
        Pick wisely - harder words give more points when guessed!
      </p>

      <div className="word-options" style={{ maxWidth: '600px', width: '100%' }}>
        {wordOptions.map((wordObj, index) => (
          <button
            key={index}
            className="word-option"
            onClick={() => handleSelect(wordObj.text)}
            style={{ position: 'relative' }}
          >
            <span style={{
              position: 'absolute',
              top: '6px',
              right: '8px',
              fontSize: '0.7rem',
              color: getDifficultyColor(wordObj.difficulty),
            }}>
              {getDifficultyLabel(wordObj.difficulty)}
            </span>
            {wordObj.text}
          </button>
        ))}
      </div>

      <p className="text-muted mt-4" style={{ fontSize: '0.9rem' }}>
        ⏱️ Auto-selecting in {timeRemaining}s...
      </p>
    </div>
  );
}
