// Guess Betrayal - Answering Phase Component
import { useState } from 'react';
import useGuessBetrayalStore from '../guessBetrayalStore';

interface GBAnsweringProps {
  onSubmitAnswer: (answer: string) => void;
  onLeave?: () => void;
}

export default function GBAnswering({ onSubmitAnswer, onLeave }: GBAnsweringProps) {
  const {
    players,
    currentPlayerId,
    currentRound,
    maxRounds,
    currentQuestion,
    timeRemaining,
  } = useGuessBetrayalStore();

  const [answer, setAnswer] = useState('');
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const hasAnswered = currentPlayer?.hasAnswered ?? false;
  const answeredCount = players.filter(p => p.hasAnswered).length;

  const handleSubmit = () => {
    if (!answer.trim() || hasAnswered) return;
    onSubmitAnswer(answer.trim());
    setAnswer('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="gb-layout">
      {/* Header */}
      <div className="gb-header">
        <div className="gb-round">Round {currentRound} / {maxRounds}</div>
        <div className="gb-timer" style={{ color: timeRemaining <= 10 ? 'var(--accent-secondary)' : 'var(--text-primary)' }}>
          {timeRemaining}s
        </div>
        <div className="gb-status">
          {answeredCount} / {players.length} answered
        </div>
      </div>

      {/* Question Card */}
      <div className="gb-question-container">
        <div className="gb-question-card">
          <div className="gb-question-label">Question</div>
          <div className="gb-question-text">{currentQuestion}</div>
        </div>
      </div>

      {/* Answer Input or Waiting */}
      {hasAnswered ? (
        <div className="gb-submitted-waiting">
          <div className="gb-waiting-icon">✓</div>
          <h3>Answer Submitted!</h3>
          <p>Waiting for other players...</p>
          <div className="gb-waiting-progress">
            {answeredCount} / {players.length} players ready
          </div>
        </div>
      ) : (
        <div className="gb-answer-section">
          <div className="gb-answer-prompt">Type your answer — be yourself, or betray them all.</div>
          <textarea
            className="gb-answer-input"
            value={answer}
            onChange={(e) => setAnswer(e.target.value.slice(0, 200))}
            onKeyDown={handleKeyDown}
            placeholder="Your answer..."
            maxLength={200}
            autoFocus
            disabled={hasAnswered}
          />
          <div className="gb-answer-footer">
            <span className="gb-char-count">{answer.length}/200</span>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!answer.trim() || hasAnswered}
            >
              Submit Answer
            </button>
          </div>
        </div>
      )}

      {/* Leave button */}
      {onLeave && (
        <div className="gb-leave-container">
          <button className="btn btn-ghost btn-small" onClick={onLeave} style={{ opacity: 0.7 }}>
            ← Return to Lobby
          </button>
        </div>
      )}
    </div>
  );
}
