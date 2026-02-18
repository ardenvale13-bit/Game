// Wavelength — Clue Input (for the psychic)
import { useState } from 'react';
import useWavelengthStore from '../wavelengthStore';
import WavelengthDial from './WavelengthDial';

interface WavelengthClueInputProps {
  onSubmitClue?: (clue: string) => void;
}

export default function WavelengthClueInput({ onSubmitClue }: WavelengthClueInputProps) {
  const { spectrum, targetPosition } = useWavelengthStore();
  const [clue, setClue] = useState('');

  const handleSubmit = () => {
    const trimmed = clue.trim().toLowerCase();
    if (!trimmed) return;

    if (onSubmitClue) {
      onSubmitClue(trimmed);
    } else {
      useWavelengthStore.getState().submitClue(trimmed);
    }

    setClue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  if (!spectrum) return null;

  return (
    <div className="wl-clue-input-container">
      <div className="wl-clue-role-badge">🎭 You are the Psychic</div>

      <div className="wl-clue-spectrum-section">
        <p className="wl-clue-spectrum-label">This Spectrum:</p>
        <WavelengthDial
          leftLabel={spectrum.left}
          rightLabel={spectrum.right}
          targetPosition={targetPosition}
          showTarget={true}
          isInteractive={false}
        />
      </div>

      <div className="wl-clue-target-info">
        <p className="wl-clue-target-label">Target position: <span className="wl-target-badge">{targetPosition}%</span></p>
        <p className="wl-clue-helper-text">Give a one-word clue to hint where the target is on the spectrum</p>
      </div>

      <div className="wl-clue-input-group">
        <input
          type="text"
          className="wl-clue-input"
          placeholder="Enter one-word clue..."
          value={clue}
          onChange={(e) => setClue(e.target.value.replace(/\s+/g, ''))} // Single word
          onKeyPress={handleKeyPress}
          maxLength={20}
          autoFocus
        />
        <button
          className="wl-clue-submit"
          onClick={handleSubmit}
          disabled={clue.trim().length === 0}
        >
          Submit Clue
        </button>
      </div>

      <p className="wl-clue-rules">Remember: Only one word! Make it clever!</p>
    </div>
  );
}
