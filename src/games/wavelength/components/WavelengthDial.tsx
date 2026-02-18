// Wavelength — Spectrum Dial Component
import { useRef, useEffect, useState } from 'react';
import '../wavelength.css';

interface WavelengthDialProps {
  leftLabel: string;
  rightLabel: string;
  targetPosition?: number; // 0-100, undefined if hidden
  guessPosition?: number; // 0-100, where team guessed
  onGuessChange?: (position: number) => void;
  isInteractive?: boolean;
  roundAccuracy?: 'bullseye' | 'close' | 'near' | 'miss' | null;
  showTarget?: boolean; // Whether to show target zone
}

export default function WavelengthDial({
  leftLabel,
  rightLabel,
  targetPosition,
  guessPosition = 50,
  onGuessChange,
  isInteractive = false,
  roundAccuracy,
  showTarget = false,
}: WavelengthDialProps) {
  const dialRef = useRef<HTMLDivElement>(null);
  const [localGuess, setLocalGuess] = useState(guessPosition);

  useEffect(() => {
    setLocalGuess(guessPosition);
  }, [guessPosition]);

  const handleDialClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isInteractive || !dialRef.current || !onGuessChange) return;

    const rect = dialRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));

    setLocalGuess(percentage);
    onGuessChange(percentage);
  };

  const handleDialDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isInteractive || !dialRef.current || !onGuessChange) return;
    if (e.buttons !== 1) return; // Only left mouse button

    const rect = dialRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));

    setLocalGuess(percentage);
    onGuessChange(percentage);
  };

  // Determine color of the guess marker based on accuracy
  let guessColor = 'var(--text-secondary)';
  if (showTarget && roundAccuracy) {
    switch (roundAccuracy) {
      case 'bullseye':
        guessColor = '#ffd700';
        break;
      case 'close':
        guessColor = '#00ff00';
        break;
      case 'near':
        guessColor = '#ffaa00';
        break;
      case 'miss':
        guessColor = '#ff4444';
        break;
    }
  }

  return (
    <div className="wl-dial-container">
      <div className="wl-dial-labels">
        <span className="wl-dial-label-left">{leftLabel}</span>
        <span className="wl-dial-label-right">{rightLabel}</span>
      </div>

      <div
        ref={dialRef}
        className={`wl-dial ${isInteractive ? 'interactive' : ''}`}
        onClick={handleDialClick}
        onMouseMove={handleDialDrag}
      >
        {/* Background gradient */}
        <div className="wl-dial-gradient" />

        {/* Target zone (only shown in reveal phase) */}
        {showTarget && targetPosition !== undefined && (
          <div
            className="wl-dial-target-zone"
            style={{
              left: `${targetPosition}%`,
              width: '10%',
              transform: 'translateX(-50%)',
            }}
          />
        )}

        {/* Scoring zones visual (shown in reveal) */}
        {showTarget && (
          <>
            {/* Bullseye zone (±5) */}
            <div
              className="wl-dial-score-zone bullseye"
              style={{
                left: `${Math.max(0, (targetPosition ?? 50) - 5)}%`,
                width: '10%',
              }}
              title="Bullseye (±5)"
            />
            {/* Close zone (±15) */}
            <div
              className="wl-dial-score-zone close"
              style={{
                left: `${Math.max(0, (targetPosition ?? 50) - 15)}%`,
                width: '30%',
              }}
              title="Close (±15)"
            />
            {/* Near zone (±25) */}
            <div
              className="wl-dial-score-zone near"
              style={{
                left: `${Math.max(0, (targetPosition ?? 50) - 25)}%`,
                width: '50%',
              }}
              title="Near (±25)"
            />
          </>
        )}

        {/* Guess marker */}
        <div
          className="wl-dial-marker"
          style={{
            left: `${localGuess}%`,
            backgroundColor: guessColor,
            boxShadow: showTarget && roundAccuracy ? `0 0 15px ${guessColor}` : 'none',
          }}
        />

        {/* Target marker (only visible to psychic during clue phase) */}
        {targetPosition !== undefined && !showTarget && (
          <div
            className="wl-dial-target-marker"
            style={{ left: `${targetPosition}%` }}
          />
        )}
      </div>

      {/* Position display */}
      <div className="wl-dial-position">
        <span className="wl-position-value">{Math.round(localGuess)}%</span>
      </div>
    </div>
  );
}
