// Uno - Main Game Playing Area
import { useState, useMemo } from 'react';
import useUnoStore from '../unoStore';
import type { UnoColor } from '../unoData';
import { getCardDisplayValue, cardEquals } from '../unoData';

interface UnoPlayingProps {
  currentPlayerId: string;
  onPlayCard: (cardId: string, chosenColor?: UnoColor) => void;
  onDrawCard: () => void;
  onCallUno: () => void;
  onCatchUno: (targetId: string) => void;
  onJumpIn: (cardId: string) => void;
  onSwapHands: (targetId: string) => void;
}

export default function UnoPlaying({
  currentPlayerId,
  onPlayCard,
  onDrawCard,
  onCallUno,
  onCatchUno,
  onJumpIn,
  onSwapHands,
}: UnoPlayingProps) {
  const {
    players,
    currentTurnIndex,
    direction,
    currentColor,
    discardPile,
    drawPile,
    phase,
    mode,
    timeRemaining,
    unoVulnerable,
  } = useUnoStore();

  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [pendingCardId, setPendingCardId] = useState<string | null>(null);
  const [swapMode, setSwapMode] = useState(false);

  const currentPlayer = players[currentTurnIndex];
  const playerIndex = players.findIndex((p) => p.id === currentPlayerId);
  const player = players[playerIndex];

  const topCard = discardPile[discardPile.length - 1];
  const playableCards = useMemo(() => {
    if (!player) return [];
    return useUnoStore.getState().getPlayableCards(currentPlayerId);
  }, [player, currentPlayerId]);

  const jumpInCards = useMemo(() => {
    if (!player || !topCard || mode !== 'chaos') return [];
    return player.hand.filter((c) => cardEquals(c, topCard));
  }, [player, topCard, mode]);

  const handlePlayCard = (cardId: string) => {
    if (phase !== 'playing') return;
    if (currentPlayerId !== currentPlayer?.id) return;

    const card = player?.hand.find((c) => c.id === cardId);
    if (!card) return;

    // Check if it's a wild card that needs color selection
    if (card.value === 'wild' || card.value === 'wild4') {
      setPendingCardId(cardId);
      setColorPickerOpen(true);
      return;
    }

    // Check if it's a 7 card in chaos mode (needs swap target)
    if (card.value === '7' && mode === 'chaos') {
      setSwapMode(true);
      setPendingCardId(cardId);
      return;
    }

    onPlayCard(cardId);
  };

  const handleColorChosen = (color: UnoColor) => {
    if (pendingCardId) {
      onPlayCard(pendingCardId, color);
      setPendingCardId(null);
    }
    setColorPickerOpen(false);
  };

  const handleSwapChosen = (targetId: string) => {
    if (pendingCardId) {
      // First play the card
      onPlayCard(pendingCardId);
      // Then swap hands
      onSwapHands(targetId);
      setPendingCardId(null);
    }
    setSwapMode(false);
  };

  const handleJumpIn = (cardId: string) => {
    if (mode !== 'chaos') return;
    onJumpIn(cardId);
  };

  const handleCatchUno = () => {
    if (!unoVulnerable || unoVulnerable === currentPlayerId) return;
    onCatchUno(unoVulnerable);
  };

  const isMyTurn = currentPlayerId === currentPlayer?.id;
  const canPlay = isMyTurn && playableCards.length > 0;

  return (
    <div className="uno-playing-area">
      {/* Top Area - Other Players */}
      <div className="uno-players-top">
        {players.map((p, idx) => {
          if (p.id === currentPlayerId) return null;

          const isCurrentTurn = idx === currentTurnIndex;

          return (
            <div
              key={p.id}
              className={`uno-player-card ${isCurrentTurn ? 'current-turn' : ''}`}
            >
              <img
                src={`/avatars/${p.avatarFilename}`}
                alt={p.name}
                className="uno-player-avatar"
              />
              <div className="uno-player-info">{p.name}</div>
              <div className="uno-player-hand-count">
                {p.hand.length} {p.hand.length === 1 ? 'card' : 'cards'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Area - Discard & Draw Piles */}
      <div className="uno-center-area">
        {/* Discard Pile */}
        <div className="uno-pile">
          <div className="uno-pile-label">Discard</div>
          {topCard && (
            <div className="uno-discard-pile">
              <div
                className={`uno-card ${topCard.color || 'wild'}`}
                style={{
                  background:
                    topCard.color === null
                      ? 'linear-gradient(135deg, #ff0000 0%, #ffff00 25%, #00ff00 50%, #0000ff 75%, #ff0000 100%)'
                      : undefined,
                }}
              >
                <div className="uno-card-top">
                  {getCardDisplayValue(topCard.value)}
                </div>
                <div className="uno-card-center">
                  {topCard.value === 'skip'
                    ? '⏭'
                    : topCard.value === 'reverse'
                    ? '↩'
                    : topCard.value === 'draw2'
                    ? '+2'
                    : topCard.value === 'wild'
                    ? 'W'
                    : topCard.value === 'wild4'
                    ? 'W4'
                    : topCard.value}
                </div>
                <div className="uno-card-bottom">
                  {getCardDisplayValue(topCard.value)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Draw Pile */}
        <div className="uno-pile">
          <div className="uno-pile-label">Draw</div>
          <div
            className="uno-draw-pile"
            onClick={() => {
              if (isMyTurn && !canPlay) {
                onDrawCard();
              }
            }}
            style={{
              cursor: isMyTurn && !canPlay ? 'pointer' : 'default',
              opacity: isMyTurn && !canPlay ? 1 : 0.7,
            }}
          >
            <div className="uno-card card-back">
              <div className="uno-card-top">?</div>
              <div className="uno-card-center">⬚</div>
              <div className="uno-card-bottom">?</div>
            </div>
            {drawPile.length > 1 && <div className="uno-draw-pile-back" />}
          </div>
          <div className="uno-pile-count">{drawPile.length} cards</div>
        </div>
      </div>

      {/* Status & Timer */}
      <div className="uno-status-bar">
        <div className="uno-status-item">
          <span className={`uno-timer ${timeRemaining < 10 ? 'warning' : ''}`}>
            {timeRemaining}s
          </span>
        </div>
        <div className="uno-status-item">
          <span>{currentPlayer?.name}'s turn</span>
        </div>
        <div className="uno-status-item">
          <div className={`uno-direction ${direction === -1 ? 'counter' : ''}`}>
            {direction === 1 ? '→' : '←'}
          </div>
        </div>
        {currentColor && (
          <div className="uno-status-item">
            <span>Color:</span>
            <div className={`uno-current-color ${currentColor}`} />
          </div>
        )}
      </div>

      {/* My Hand */}
      <div className="uno-hand-area">
        <div className="uno-hand-label">Your Hand ({player?.hand.length || 0})</div>
        <div className="uno-hand-container">
          {player?.hand.map((card) => {
            const isPlayable = playableCards.some((c) => c.id === card.id);
            const isJumpIn = jumpInCards.some((c) => c.id === card.id);

            return (
              <div
                key={card.id}
                className={`uno-card-in-hand uno-card ${card.color || 'wild'} ${
                  !isPlayable ? 'not-playable' : 'playable'
                } ${isJumpIn && !isMyTurn ? 'jump-in' : ''}`}
                onClick={() => {
                  if (isJumpIn && mode === 'chaos' && !isMyTurn) {
                    handleJumpIn(card.id);
                  } else if (isPlayable && isMyTurn) {
                    handlePlayCard(card.id);
                  }
                }}
                style={{
                  background:
                    card.color === null
                      ? 'linear-gradient(135deg, #ff0000 0%, #ffff00 25%, #00ff00 50%, #0000ff 75%, #ff0000 100%)'
                      : undefined,
                  cursor: isPlayable && isMyTurn ? 'pointer' : 'default',
                }}
              >
                <div className="uno-card-top">
                  {getCardDisplayValue(card.value)}
                </div>
                <div className="uno-card-center">
                  {card.value === 'skip'
                    ? '⏭'
                    : card.value === 'reverse'
                    ? '↩'
                    : card.value === 'draw2'
                    ? '+2'
                    : card.value === 'wild'
                    ? 'W'
                    : card.value === 'wild4'
                    ? 'W4'
                    : card.value === '0'
                    ? '↻'
                    : card.value === '7'
                    ? '⇄'
                    : card.value}
                </div>
                <div className="uno-card-bottom">
                  {getCardDisplayValue(card.value)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="uno-action-buttons">
        {isMyTurn && player && player.hand.length === 1 && !player.calledUno && (
          <button className="uno-uno-btn" onClick={onCallUno}>
            UNO!
          </button>
        )}

        {!isMyTurn && unoVulnerable && unoVulnerable !== currentPlayerId && (
          <button
            className="uno-catch-btn pulse"
            onClick={handleCatchUno}
          >
            Catch UNO!
          </button>
        )}
      </div>

      {/* Color Picker Modal */}
      {colorPickerOpen && (
        <div className="uno-color-picker-overlay" onClick={() => setColorPickerOpen(false)}>
          <div className="uno-color-picker" onClick={(e) => e.stopPropagation()}>
            <div className="uno-color-picker-title">Choose a Color</div>
            <div className="uno-color-buttons">
              {(['red', 'blue', 'green', 'yellow'] as UnoColor[]).map((color) => (
                <button
                  key={color}
                  className={`uno-color-btn ${color}`}
                  onClick={() => handleColorChosen(color)}
                >
                  {color === 'red' ? '●' : color === 'blue' ? '●' : color === 'green' ? '●' : '●'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Swap Target Modal (7 Card in Chaos) */}
      {swapMode && (
        <div
          className="uno-color-picker-overlay"
          onClick={() => setSwapMode(false)}
        >
          <div className="uno-color-picker" onClick={(e) => e.stopPropagation()}>
            <div className="uno-color-picker-title">Swap hands with:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {players
                .filter((p) => p.id !== currentPlayerId)
                .map((p) => (
                  <button
                    key={p.id}
                    className="btn btn-secondary"
                    onClick={() => handleSwapChosen(p.id)}
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <img
                      src={`/avatars/${p.avatarFilename}`}
                      alt={p.name}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                      }}
                    />
                    {p.name}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
