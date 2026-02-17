// CAH Playing Component - Players select their cards
import useCAHStore from '../cahStore';
import type { WhiteCard } from '../cardData';

interface CAHPlayingProps {
  onSubmitCards?: (cardIds: string[]) => void;
  isHost?: boolean;
}

export default function CAHPlaying({ onSubmitCards }: CAHPlayingProps) {
  const {
    players,
    currentPlayerId,
    currentBlackCard,
    currentRound,
    maxRounds,
    timeRemaining,
    submissions,
    selectCard,
    deselectCard,
    submitCards,
    isCurrentPlayerCzar,
    getCurrentCzar,
  } = useCAHStore();

  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const czar = getCurrentCzar();
  const isCzar = isCurrentPlayerCzar();
  const requiredPicks = currentBlackCard?.pick || 1;
  const canSubmit = currentPlayer &&
    currentPlayer.selectedCards.length === requiredPicks &&
    !currentPlayer.hasSubmitted;

  // Format black card text with blanks
  const formatBlackCard = (text: string) => {
    return text.split('_').map((part, idx, arr) => (
      <span key={idx}>
        {part}
        {idx < arr.length - 1 && (
          <span style={{
            display: 'inline-block',
            minWidth: '80px',
            borderBottom: '3px solid #fff',
            marginLeft: '4px',
            marginRight: '4px',
          }} />
        )}
      </span>
    ));
  };

  const handleCardClick = (card: WhiteCard) => {
    if (!currentPlayer || currentPlayer.hasSubmitted || isCzar) return;

    const isSelected = currentPlayer.selectedCards.find(c => c.id === card.id);
    if (isSelected) {
      deselectCard(currentPlayerId!, card);
    } else {
      selectCard(currentPlayerId!, card);
    }
  };

  const handleSubmit = () => {
    if (!canSubmit || !currentPlayer) return;

    if (onSubmitCards) {
      // Use the broadcast callback (handles both host and non-host)
      const cardIds = currentPlayer.selectedCards.map(c => c.id);
      onSubmitCards(cardIds);
    } else {
      // Fallback: submit locally
      submitCards(currentPlayerId!);
    }
  };

  const submittedCount = submissions.length;
  const totalNonCzar = players.filter(p => !p.isCzar).length;

  return (
    <div className="cah-layout">
      {/* Header */}
      <div className="cah-header">
        <div className="cah-round">Round {currentRound} / {maxRounds}</div>
        <div className="cah-timer" style={{ color: timeRemaining <= 10 ? 'var(--accent-secondary)' : 'var(--text-primary)' }}>
          {timeRemaining}s
        </div>
        <div className="cah-status">
          {submittedCount} / {totalNonCzar} submitted
        </div>
      </div>

      {/* Black Card */}
      <div className="cah-black-card-container">
        <div className="cah-black-card">
          <div className="cah-card-text">
            {currentBlackCard && formatBlackCard(currentBlackCard.text)}
          </div>
          {requiredPicks > 1 && (
            <div className="cah-pick-indicator">
              PICK {requiredPicks}
            </div>
          )}
        </div>
        <div className="cah-czar-info">
          <img
            src={`/avatars/${czar?.avatarFilename}`}
            alt={czar?.name}
            className="cah-czar-avatar"
          />
          <span>{czar?.name} is the Card Czar</span>
        </div>
      </div>

      {/* Player's Hand or Waiting State */}
      {isCzar ? (
        <div className="cah-czar-waiting">
          <div className="cah-waiting-icon">👑</div>
          <h3>You're the Card Czar!</h3>
          <p>Wait for other players to submit their cards...</p>
          <div className="cah-waiting-progress">
            {submittedCount} / {totalNonCzar} players ready
          </div>
        </div>
      ) : currentPlayer?.hasSubmitted ? (
        <div className="cah-submitted-waiting">
          <div className="cah-waiting-icon">✓</div>
          <h3>Cards Submitted!</h3>
          <p>Waiting for other players...</p>
        </div>
      ) : (
        <>
          {/* Selection indicator */}
          {currentPlayer && currentPlayer.selectedCards.length > 0 && (
            <div className="cah-selection-bar">
              <span>Selected: {currentPlayer.selectedCards.length} / {requiredPicks}</span>
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={!canSubmit}
                style={{ background: canSubmit ? '#000' : '#333', border: '2px solid #fff' }}
              >
                Submit Cards
              </button>
            </div>
          )}

          {/* Hand */}
          <div className="cah-hand">
            {currentPlayer?.hand.map((card, idx) => {
              const isSelected = currentPlayer.selectedCards.find(c => c.id === card.id);
              const selectionOrder = currentPlayer.selectedCards.findIndex(c => c.id === card.id) + 1;

              return (
                <div
                  key={card.id}
                  className={`cah-white-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleCardClick(card)}
                  style={{
                    transform: isSelected ? 'translateY(-20px)' : 'none',
                    zIndex: isSelected ? 10 : idx,
                  }}
                >
                  <div className="cah-card-text">{card.text}</div>
                  {isSelected && requiredPicks > 1 && (
                    <div className="cah-selection-order">{selectionOrder}</div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
