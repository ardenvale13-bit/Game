// Make It Meme - Voting Phase
// Players see all captions on the meme and vote for the best one
// You can't vote for your own caption
// 2-reply templates display both lines separated
import { useMemo } from 'react';
import useMemeStore from '../memeStore';

interface MemeVotingProps {
  currentPlayerId: string;
  onVote: (targetPlayerId: string) => void;
}

export default function MemeVoting({ currentPlayerId, onVote }: MemeVotingProps) {
  const {
    players,
    currentRound,
    maxRounds,
    currentTemplateSrc,
    currentTemplateIsGif,
    currentTemplateCaptionCount,
    timeRemaining,
  } = useMemeStore();

  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const hasVoted = currentPlayer?.votedForPlayerId !== null;
  const votedCount = players.filter(p => p.votedForPlayerId !== null).length;
  const needsTwoCaptions = currentTemplateCaptionCount === 2;

  const timerClass = timeRemaining <= 5 ? 'danger' : timeRemaining <= 10 ? 'warning' : '';

  // Shuffle captions so position doesn't reveal identity
  const shuffledCaptions = useMemo(() => {
    const captions = players
      .filter(p => p.caption !== null)
      .map(p => ({ playerId: p.id, caption: p.caption!, caption2: p.caption2 }));
    // Fisher-Yates shuffle
    for (let i = captions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [captions[i], captions[j]] = [captions[j], captions[i]];
    }
    return captions;
  }, [players.map(p => p.caption).join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Header */}
      <div className="meme-header">
        <span className="meme-round-badge">
          Round {currentRound} / {maxRounds}
        </span>
        <span className="meme-phase-label">Vote!</span>
        <span className={`meme-timer ${timerClass}`}>
          {timeRemaining}s
        </span>
      </div>

      {/* Meme template (smaller during voting) */}
      <div className="meme-template-card meme-template-small">
        <div className="meme-image-container">
          <img
            src={currentTemplateSrc}
            alt="Meme template"
            className={`meme-image ${currentTemplateIsGif ? 'meme-gif' : ''}`}
          />
        </div>
      </div>

      {/* Caption cards to vote on */}
      <div className="meme-vote-grid">
        {shuffledCaptions.map((entry) => {
          const isOwn = entry.playerId === currentPlayerId;
          const isSelected = currentPlayer?.votedForPlayerId === entry.playerId;
          const isDisabled = hasVoted || isOwn;

          return (
            <button
              key={entry.playerId}
              className={`meme-vote-card ${isSelected ? 'selected' : ''} ${isOwn ? 'own' : ''} ${isDisabled && !isSelected ? 'disabled' : ''}`}
              onClick={() => !isDisabled && onVote(entry.playerId)}
              disabled={isDisabled}
            >
              <div className="meme-vote-caption">
                {needsTwoCaptions && entry.caption2 ? (
                  <>
                    <div className="meme-vote-reply-line">"{entry.caption}"</div>
                    <div className="meme-vote-reply-line">"{entry.caption2}"</div>
                  </>
                ) : (
                  `"${entry.caption}"`
                )}
              </div>
              {isOwn && <div className="meme-vote-own-tag">Yours</div>}
              {isSelected && <div className="meme-vote-selected-tag">Voted!</div>}
            </button>
          );
        })}
      </div>

      {/* Progress */}
      <div className="meme-progress-bar">
        <div className="meme-progress-text">
          {hasVoted ? 'Waiting for others...' : "Pick the funniest caption!"}
        </div>
        <div className="meme-votes-count">
          {votedCount} / {players.length} votes in
        </div>
      </div>
    </>
  );
}
