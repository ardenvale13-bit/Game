// Uno - Main Game Playing Area (Table Layout with Custom Card Images)
import { useState, useMemo } from 'react';
import useUnoStore from '../unoStore';
import type { UnoColor } from '../unoData';
import { getCardImagePath, cardEquals } from '../unoData';

interface UnoPlayingProps {
  currentPlayerId: string;
  onPlayCard: (cardId: string, chosenColor?: UnoColor) => void;
  onDrawCard: () => void;
  onCallUno: () => void;
  onCatchUno: (targetId: string) => void;
  onJumpIn: (cardId: string) => void;
  onSwapHands: (targetId: string) => void;
}

// Position players around the table based on count
function getPlayerPositions(count: number): { className: string }[] {
  // Positions exclude the current player (always at bottom)
  // For N other players, distribute around top/sides
  if (count === 1) return [{ className: 'pos-top' }];
  if (count === 2) return [{ className: 'pos-left' }, { className: 'pos-right' }];
  if (count === 3) return [{ className: 'pos-left' }, { className: 'pos-top' }, { className: 'pos-right' }];
  if (count === 4) return [{ className: 'pos-top-left' }, { className: 'pos-top' }, { className: 'pos-top-right' }, { className: 'pos-right' }];
  // 5+: spread evenly
  return Array.from({ length: count }, (_, i) => {
    const positions = ['pos-left', 'pos-top-left', 'pos-top', 'pos-top-right', 'pos-right'];
    return { className: positions[i % positions.length] };
  });
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

  // Other players (everyone except current)
  const otherPlayers = players.filter((p) => p.id !== currentPlayerId);
  const positions = getPlayerPositions(otherPlayers.length);

  const handlePlayCard = (cardId: string) => {
    if (phase !== 'playing') return;
    if (currentPlayerId !== currentPlayer?.id) return;

    const card = player?.hand.find((c) => c.id === cardId);
    if (!card) return;

    if (card.value === 'wild' || card.value === 'wild4') {
      setPendingCardId(cardId);
      setColorPickerOpen(true);
      return;
    }

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
      onPlayCard(pendingCardId);
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

  // Color indicator hex values
  const colorHex: Record<string, string> = {
    pink: '#e91e9c',
    blue: '#2196f3',
    green: '#4caf50',
    purple: '#9c27b0',
  };

  return (
    <div className="uno-table-scene">
      {/* Status bar overlay */}
      <div className="uno-status-overlay">
        <div className={`uno-timer-badge ${timeRemaining < 10 ? 'warning' : ''}`}>
          {timeRemaining}s
        </div>
        <div className="uno-turn-badge">
          {isMyTurn ? 'Your turn!' : `${currentPlayer?.name}'s turn`}
        </div>
        <div className="uno-direction-badge">
          {direction === 1 ? '⟳' : '⟲'}
        </div>
        {currentColor && (
          <div
            className="uno-color-indicator"
            style={{ background: colorHex[currentColor] || '#888' }}
          />
        )}
      </div>

      {/* Table surface */}
      <div className="uno-table-container">
        <img src="/Uno/uno-table.png" alt="" className="uno-table-img" draggable={false} />

        {/* Other players around the table */}
        {otherPlayers.map((p, idx) => {
          const pos = positions[idx];
          const isCurrentTurn = players.indexOf(p) === currentTurnIndex;

          return (
            <div
              key={p.id}
              className={`uno-table-player ${pos.className} ${isCurrentTurn ? 'active-turn' : ''}`}
            >
              <div className="uno-tp-avatar-wrap">
                <img
                  src={`/avatars/${p.avatarFilename}`}
                  alt={p.name}
                  className="uno-tp-avatar"
                />
                {isCurrentTurn && <div className="uno-tp-turn-ring" />}
              </div>
              <div className="uno-tp-name">{p.name}</div>
              <div className="uno-tp-count">{p.hand.length}</div>
              {/* Show face-down cards fanned */}
              <div className="uno-tp-cards">
                {p.hand.slice(0, Math.min(p.hand.length, 7)).map((_, ci) => (
                  <div
                    key={ci}
                    className="uno-tp-card-back"
                    style={{
                      transform: `rotate(${(ci - Math.min(p.hand.length, 7) / 2) * 8}deg)`,
                      zIndex: ci,
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Center: Discard + Draw piles */}
        <div className="uno-table-center">
          {/* Discard Pile */}
          <div className="uno-center-pile discard">
            {topCard && (
              <img
                src={getCardImagePath(topCard)}
                alt="discard"
                className="uno-center-card"
                style={{ transform: 'rotate(-5deg)' }}
                draggable={false}
              />
            )}
          </div>

          {/* Draw Pile */}
          <div
            className={`uno-center-pile draw ${isMyTurn && !canPlay ? 'clickable' : ''}`}
            onClick={() => {
              if (isMyTurn && !canPlay) {
                onDrawCard();
              }
            }}
          >
            <div className="uno-draw-stack">
              <div className="uno-card-back-img" />
              {drawPile.length > 1 && <div className="uno-card-back-img shadow" />}
            </div>
            <div className="uno-draw-count">{drawPile.length}</div>
          </div>
        </div>
      </div>

      {/* My Hand (bottom) */}
      <div className="uno-my-hand-area">
        <div className="uno-hand-scroll">
          {player?.hand.map((card) => {
            const isPlayable = playableCards.some((c) => c.id === card.id);
            const isJumpIn = jumpInCards.some((c) => c.id === card.id);

            return (
              <div
                key={card.id}
                className={`uno-my-card ${isPlayable ? 'playable' : 'not-playable'} ${
                  isJumpIn && !isMyTurn ? 'jump-in' : ''
                }`}
                onClick={() => {
                  if (isJumpIn && mode === 'chaos' && !isMyTurn) {
                    handleJumpIn(card.id);
                  } else if (isPlayable && isMyTurn) {
                    handlePlayCard(card.id);
                  }
                }}
              >
                <img
                  src={getCardImagePath(card)}
                  alt={`${card.color || 'wild'} ${card.value}`}
                  className="uno-my-card-img"
                  draggable={false}
                />
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="uno-action-row">
          {isMyTurn && player && player.hand.length === 1 && !player.calledUno && (
            <button className="uno-uno-btn" onClick={onCallUno}>
              UNO!
            </button>
          )}
          {!isMyTurn && unoVulnerable && unoVulnerable !== currentPlayerId && (
            <button className="uno-catch-btn pulse" onClick={handleCatchUno}>
              Catch!
            </button>
          )}
        </div>
      </div>

      {/* Color Picker Modal */}
      {colorPickerOpen && (
        <div className="uno-modal-overlay" onClick={() => setColorPickerOpen(false)}>
          <div className="uno-modal" onClick={(e) => e.stopPropagation()}>
            <div className="uno-modal-title">Choose a Color</div>
            <div className="uno-color-grid">
              {(['pink', 'blue', 'green', 'purple'] as UnoColor[]).map((color) => (
                <button
                  key={color}
                  className="uno-color-pick"
                  style={{ background: colorHex[color] }}
                  onClick={() => handleColorChosen(color)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Swap Target Modal */}
      {swapMode && (
        <div className="uno-modal-overlay" onClick={() => setSwapMode(false)}>
          <div className="uno-modal" onClick={(e) => e.stopPropagation()}>
            <div className="uno-modal-title">Swap hands with:</div>
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
