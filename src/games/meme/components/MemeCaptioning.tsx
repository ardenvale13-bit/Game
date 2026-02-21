// Make It Meme - Captioning Phase
// Players see the meme template and write their caption
// 1-reply templates: 1 text box. 2-reply templates: 2 text boxes.
import { useState } from 'react';
import useMemeStore from '../memeStore';

interface MemeCaptioningProps {
  currentPlayerId: string;
  onSubmitCaption: (caption: string, caption2?: string) => void;
}

export default function MemeCaptioning({ currentPlayerId, onSubmitCaption }: MemeCaptioningProps) {
  const {
    players,
    currentRound,
    maxRounds,
    currentTemplateSrc,
    currentTemplateIsGif,
    currentTemplateCaptionCount,
    timeRemaining,
  } = useMemeStore();

  const [captionText, setCaptionText] = useState('');
  const [caption2Text, setCaption2Text] = useState('');
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const hasSubmitted = currentPlayer?.caption !== null;
  const submittedCount = players.filter(p => p.caption !== null).length;
  const needsTwoCaptions = currentTemplateCaptionCount === 2;

  const timerClass = timeRemaining <= 5 ? 'danger' : timeRemaining <= 10 ? 'warning' : '';

  const handleSubmit = () => {
    const trimmed = captionText.trim();
    if (!trimmed || hasSubmitted) return;

    if (needsTwoCaptions) {
      const trimmed2 = caption2Text.trim();
      if (!trimmed2) return;
      onSubmitCaption(trimmed, trimmed2);
    } else {
      onSubmitCaption(trimmed);
    }
    setCaptionText('');
    setCaption2Text('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSubmit = needsTwoCaptions
    ? captionText.trim().length > 0 && caption2Text.trim().length > 0
    : captionText.trim().length > 0;

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
          {needsTwoCaptions && (
            <div className="meme-reply-label">Reply 1</div>
          )}
          <div className="meme-caption-input-wrapper">
            <input
              type="text"
              className="meme-caption-input"
              placeholder={needsTwoCaptions ? 'First reply...' : 'Type your caption...'}
              value={captionText}
              onChange={(e) => setCaptionText(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={120}
              autoFocus
            />
            {!needsTwoCaptions && (
              <button
                className="meme-caption-submit"
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                Submit
              </button>
            )}
          </div>
          <div className="meme-char-count">
            {captionText.length}/120
          </div>

          {needsTwoCaptions && (
            <>
              <div className="meme-reply-label" style={{ marginTop: '8px' }}>Reply 2</div>
              <div className="meme-caption-input-wrapper">
                <input
                  type="text"
                  className="meme-caption-input"
                  placeholder="Second reply..."
                  value={caption2Text}
                  onChange={(e) => setCaption2Text(e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={120}
                />
                <button
                  className="meme-caption-submit"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                >
                  Submit
                </button>
              </div>
              <div className="meme-char-count">
                {caption2Text.length}/120
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="meme-waiting-card">
          <div className="meme-waiting-text">Caption submitted!</div>
          <div className="meme-waiting-caption">"{currentPlayer?.caption}"</div>
          {currentPlayer?.caption2 && (
            <div className="meme-waiting-caption">"{currentPlayer.caption2}"</div>
          )}
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
