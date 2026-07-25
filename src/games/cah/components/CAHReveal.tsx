// CAH Reveal Component - Shows the round winner
import { useState } from 'react';
import useCAHStore from '../cahStore';
import type { CardRating } from '../cardFeedback';
import { getPersonalCardRating } from '../cardFeedback';

interface CAHRevealProps {
  onLeave?: () => void;
  onRateCard?: (rating: CardRating | null) => void;
}

export default function CAHReveal({ onLeave, onRateCard }: CAHRevealProps) {
  const {
    currentBlackCard,
    submissions,
    players,
  } = useCAHStore();

  const winningSubmission = submissions.find(s => s.isWinner);
  const winner = players.find(p => p.id === winningSubmission?.playerId);
  const [rating, setRating] = useState<CardRating | null>(
    currentBlackCard ? getPersonalCardRating(currentBlackCard.id) : null,
  );

  const toggleRating = (next: CardRating) => {
    const updated = rating === next ? null : next;
    setRating(updated);
    onRateCard?.(updated);
  };

  // Format black card with winning answer
  const formatWinningCard = () => {
    if (!currentBlackCard || !winningSubmission) return null;
    
    const parts = currentBlackCard.text.split('_');
    return parts.map((part, idx) => (
      <span key={idx}>
        {part}
        {idx < parts.length - 1 && winningSubmission.cards[idx] && (
          <span className="cah-winning-answer">
            {winningSubmission.cards[idx].text}
          </span>
        )}
      </span>
    ));
  };

  return (
    <div className="cah-layout cah-reveal">
      <div className="cah-reveal-content">
        {/* Winner announcement */}
        <div className="cah-winner-header">
          <div className="cah-winner-avatar">
            <img 
              src={`/avatars/${winner?.avatarFilename}`} 
              alt={winner?.name}
            />
          </div>
          <h2>{winner?.name} wins the round!</h2>
        </div>

        {/* Winning combination */}
        <div className="cah-winning-combo">
          <div className="cah-black-card large">
            <div className="cah-card-text">
              {formatWinningCard()}
            </div>
          </div>
        </div>

        <div className="cah-card-feedback" aria-label="Rate this prompt">
          <button
            type="button"
            className={rating === 'favorite' ? 'active favorite' : ''}
            onClick={() => toggleRating('favorite')}
            aria-pressed={rating === 'favorite'}
          >
            {rating === 'favorite' ? '♥ Saved' : '♡ Favourite'}
          </button>
          <button
            type="button"
            className={rating === 'veto' ? 'active veto' : ''}
            onClick={() => toggleRating('veto')}
            aria-pressed={rating === 'veto'}
          >
            {rating === 'veto' ? '🚫 Vetoed' : '🚫 Quiet veto'}
          </button>
        </div>

        {/* Scoreboard preview */}
        <div className="cah-mini-scores">
          {players
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map((p, idx) => (
              <div 
                key={p.id} 
                className={`cah-mini-score ${p.id === winner?.id ? 'winner' : ''}`}
              >
                <span className="rank">{idx + 1}</span>
                <span className="name">{p.name}</span>
                <span className="score">{p.score}</span>
              </div>
            ))}
        </div>

        <div className="cah-next-round-text">
          Next round starting...
        </div>

        {/* Leave button */}
        {onLeave && (
          <div className="cah-leave-container">
            <button className="btn btn-ghost btn-small" onClick={onLeave} style={{ opacity: 0.7 }}>
              ← Return to Lobby
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
