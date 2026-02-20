// CAH Judging Component - Czar picks the winner
import { useState } from 'react';
import useCAHStore from '../cahStore';

interface CAHJudgingProps {
  onPickWinner?: (winnerId: string) => void;
  isHost?: boolean;
  onReadAloud?: (text: string) => Promise<void> | void;
  onLeave?: () => void;
}

export default function CAHJudging({ onPickWinner, onReadAloud, onLeave }: CAHJudgingProps) {
  const {
    currentBlackCard,
    currentRound,
    maxRounds,
    timeRemaining,
    submissions,
    selectWinner,
    isCurrentPlayerCzar,
    getCurrentCzar,
  } = useCAHStore();

  const czar = getCurrentCzar();
  const isCzar = isCurrentPlayerCzar();
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);

  // Format black card text with answers filled in (JSX version for display)
  const formatBlackCardWithAnswers = (text: string, answers: string[]) => {
    const parts = text.split('_');
    return parts.map((part, idx) => (
      <span key={idx}>
        {part}
        {idx < parts.length - 1 && answers[idx] && (
          <span className="cah-filled-answer">
            {answers[idx]}
          </span>
        )}
      </span>
    ));
  };

  // Build plain text version for TTS
  const buildFilledText = (text: string, answers: string[]): string => {
    const parts = text.split('_');
    let result = '';
    parts.forEach((part, idx) => {
      result += part;
      if (idx < parts.length - 1 && answers[idx]) {
        result += answers[idx];
      }
    });
    return result;
  };

  const handleSelectWinner = (playerId: string) => {
    if (!isCzar) return;

    if (onPickWinner) {
      onPickWinner(playerId);
    } else {
      selectWinner(playerId);
    }
  };

  const handleReadAloud = async (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onReadAloud || !currentBlackCard || loadingIdx !== null) return;

    const submission = submissions[idx];
    const filledText = buildFilledText(
      currentBlackCard.text,
      submission.cards.map(c => c.text)
    );

    setLoadingIdx(idx);
    try {
      await onReadAloud(filledText);
    } finally {
      setLoadingIdx(null);
    }
    setSpeakingIdx(idx);
    setTimeout(() => setSpeakingIdx(null), 3000);
  };

  return (
    <div className="cah-layout">
      {/* Header */}
      <div className="cah-header">
        <div className="cah-round">Round {currentRound} / {maxRounds}</div>
        <div className="cah-timer" style={{ color: timeRemaining <= 10 ? 'var(--accent-secondary)' : 'var(--text-primary)' }}>
          {timeRemaining}s
        </div>
        <div className="cah-status">
          {isCzar ? 'Pick your favorite!' : `${czar?.name} is judging...`}
        </div>
      </div>

      {/* Black Card */}
      <div className="cah-black-card-container">
        <div className="cah-black-card small">
          <div className="cah-card-text" style={{ fontSize: '1rem' }}>
            {currentBlackCard?.text}
          </div>
        </div>
      </div>

      {/* Submissions */}
      <div className="cah-submissions">
        {submissions.map((submission, idx) => (
          <div
            key={idx}
            className={`cah-submission ${isCzar ? 'clickable' : ''}`}
            onClick={() => isCzar && handleSelectWinner(submission.playerId)}
          >
            <div className="cah-submission-cards">
              {submission.cards.map((card) => (
                <div key={card.id} className="cah-white-card in-submission">
                  <div className="cah-card-text">{card.text}</div>
                </div>
              ))}
            </div>

            {/* Show as filled sentence */}
            <div className="cah-filled-sentence">
              {formatBlackCardWithAnswers(
                currentBlackCard?.text || '',
                submission.cards.map(c => c.text)
              )}

              {/* TTS mic button - czar only */}
              {isCzar && onReadAloud && (
                <button
                  className={`cah-tts-btn ${speakingIdx === idx ? 'speaking' : ''} ${loadingIdx === idx ? 'loading' : ''}`}
                  onClick={(e) => handleReadAloud(idx, e)}
                  title="Read aloud"
                  disabled={loadingIdx !== null}
                >
                  {loadingIdx === idx ? '⏳' : speakingIdx === idx ? '🔊' : '🎤'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Czar prompt */}
      {isCzar && (
        <div className="cah-czar-prompt">
          <span>👑 Tap on your favorite to pick the winner!</span>
        </div>
      )}

      {/* Non-czar waiting */}
      {!isCzar && (
        <div className="cah-waiting-text">
          Waiting for {czar?.name} to pick...
        </div>
      )}

      {/* Leave button */}
      {onLeave && (
        <div className="cah-leave-container">
          <button className="btn btn-ghost btn-small" onClick={onLeave} style={{ opacity: 0.7 }}>
            ← Return to Lobby
          </button>
        </div>
      )}
    </div>
  );
}
