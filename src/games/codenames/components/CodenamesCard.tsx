// Codenames — Individual card component with flip animation + vote bubbles
import type { CodenamesCard as CardData } from '../codenamesData';
import { getCardRevealImage } from '../codenamesData';

interface CodenamesCardProps {
  card: CardData;
  isSpymaster: boolean;
  isMyTurn: boolean;
  myVote: boolean; // did current player vote on this card
  onVote: () => void;
  onLock: () => void;
  disabled: boolean;
}

export default function CodenamesCard({
  card,
  isSpymaster,
  isMyTurn,
  myVote,
  onVote,
  onLock,
  disabled,
}: CodenamesCardProps) {
  const isRevealed = card.isRevealed;

  // Determine front face class based on role
  const getFrontClass = () => {
    if (!isSpymaster) return 'cn-card-front operative';
    switch (card.type) {
      case 'pink': return 'cn-card-front spymaster-pink';
      case 'blue': return 'cn-card-front spymaster-blue';
      case 'neutral': return 'cn-card-front spymaster-neutral';
      case 'assassin': return 'cn-card-front spymaster-assassin';
    }
  };

  const handleClick = () => {
    if (isRevealed || disabled || isSpymaster) return;
    if (!isMyTurn) return;
    onVote();
  };

  return (
    <div
      className={`cn-card-wrapper ${isRevealed ? 'revealed' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={handleClick}
    >
      <div className={`cn-card ${isRevealed ? 'flipped' : ''}`}>
        {/* FRONT — word */}
        <div className={getFrontClass()}>
          {/* Avatar vote bubbles */}
          {!isRevealed && card.votes.length > 0 && (
            <div className="cn-vote-bubbles">
              {card.votes.map(v => (
                <div key={v.playerId} className="cn-vote-bubble">
                  <img src={`/avatars/${v.avatarFilename}`} alt="" />
                </div>
              ))}
            </div>
          )}

          {/* Lock-in check button */}
          {!isRevealed && myVote && isMyTurn && !isSpymaster && (
            <button
              className="cn-lock-btn"
              onClick={(e) => {
                e.stopPropagation();
                onLock();
              }}
              title="Lock in guess"
            >
              ✓
            </button>
          )}

          <span className="cn-card-word">{card.word}</span>
        </div>

        {/* BACK — revealed icon */}
        <div className="cn-card-back">
          <img src={getCardRevealImage(card.type)} alt={card.type} />
        </div>
      </div>
    </div>
  );
}
