// Make It Meme - Captioning Phase
// Players see the meme template and write their caption
import { useState } from 'react';
import useMemeStore from '../memeStore';

interface MemeCaptioningProps {
  currentPlayerId: string;
  onSubmitCaption: (caption: string) => void;
}

export default function MemeCaptioning({ currentPlayerId, onSubmitCaption }: MemeCaptioningProps) {
  const {
    players,
    currentRound,
    maxRounds,
    currentTemplateSrc,
    currentTemplateIsGif,
    timeRemaining,
  } = useMemeStore();

  const [captionText, setCaptionText] = useState('');
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const hasSubmitted = currentPlayer?.caption !== null;
  const submittedCount = players.filter(p => p.caption !== null).length;

  const timerClass = timeRemaining <= 5 ? 'danger' : timeRemaining <= 10 ? 'warning' : '';

  const handleSubmit = () => {
    const trimmed = captionText.trim();
    if (!trimmed || hasSubmitted) return;
    onSubmitCaption(trimmed);
    setCaptionText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      {/* Header */}
      <div className="meme-header">
        <span className="meme-round-badge">
          Round {currentRound} / {maxRounds}
        </span>
        <span className="meme-phase-label">Caption This!</span>
        <span className={`meme-timer ${timerClass}`}>
          {timeRemaining}s
        </span>
      </div>

      {/* Meme template display */}
      <div className="meme-template-card">
        <div className="meme-image-container">
          <img
            src={currentTemplateSrc}
            alt="Meme template"
            className={`meme-image ${currentTemplateIsGif ? 'meme-gif' : ''}`}
          />
        </div>
      </div>

      {/* Caption input */}
      {!hasSubmitted ? (
        <div className="meme-caption-input-area">
          <div className="meme-caption-input-wrapper">
            <input
              type="text"
              className="meme-caption-input"
              placeholder="Type your caption..."
              value={captionText}
              onChange={(e) => setCaptionText(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={120}
              autoFocus
            />
            <button
              className="meme-caption-submit"
              onClick={handleSubmit}
              disabled={!captionText.trim()}
            >
              Submit
            </button>
          </div>
          <div className="meme-char-count">
            {captionText.length}/120
          </div>
        </div>
      ) : (
        <div className="meme-waiting-card">
          <div className="meme-waiting-text">Caption submitted!</div>
          <div className="meme-waiting-caption">"{currentPlayer?.caption}"</div>
        </div>
      )}

      {/* Progress */}
      <div className="meme-progress-bar">
        <div className="meme-progress-text">
          {submittedCount} / {players.length} captions in
        </div>
        <div className="meme-progress-dots">
          {players.map((p) => (
            <div
              key={p.id}
              className={`meme-progress-dot ${p.caption !== null ? 'done' : ''}`}
              title={p.name}
            />
          ))}
        </div>
      </div>
    </>
  );
}
