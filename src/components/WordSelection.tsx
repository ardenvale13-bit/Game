import useGameStore from '../store/gameStore';

export default function WordSelection() {
  const { wordOptions, selectWord, timeRemaining } = useGameStore();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'var(--accent-success)';
      case 'medium': return 'var(--accent-warning)';
      case 'hard': return 'var(--accent-secondary)';
      default: return 'var(--text-muted)';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '⭐';
      case 'medium': return '⭐⭐';
      case 'hard': return '⭐⭐⭐';
      default: return '';
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
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎨</div>
      <h2 className="mb-2">Choose a word to draw!</h2>
      <p className="text-muted mb-4">
        Pick wisely - harder words give more points when guessed!
      </p>

      <div className="word-options" style={{ maxWidth: '600px', width: '100%' }}>
        {wordOptions.map((wordObj, index) => (
          <button
            key={index}
            className="word-option"
            onClick={() => selectWord(wordObj.text)}
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
