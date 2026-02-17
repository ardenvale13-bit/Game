// Codenames — Clue bar: spymaster input OR operative clue display
import { useState } from 'react';
import useCodenamesStore from '../codenamesStore';

interface CodenamesClueBarProps {
  onSubmitClue: (word: string, number: number) => void;
  onEndTurn: () => void;
}

export default function CodenamesClueBar({ onSubmitClue, onEndTurn }: CodenamesClueBarProps) {
  const {
    phase,
    currentTeam,
    currentClue,
    guessesRemaining,
    timerEnabled,
    timeRemaining,
  } = useCodenamesStore();

  const currentPlayer = useCodenamesStore.getState().getCurrentPlayer();
  const iAmSpymaster = currentPlayer?.role === 'spymaster';
  const isMyTeamTurn = currentPlayer?.team === currentTeam;

  const [clueWord, setClueWord] = useState('');
  const [clueNumber, setClueNumber] = useState(1);

  const handleSubmit = () => {
    if (!clueWord.trim()) return;
    onSubmitClue(clueWord.trim(), clueNumber);
    setClueWord('');
    setClueNumber(1);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Spymaster giving clue
  if (phase === 'spymaster-clue' && iAmSpymaster && isMyTeamTurn) {
    return (
      <div className="cn-clue-bar">
        <div className="cn-clue-input-row">
          <input
            type="text"
            className="cn-clue-input"
            placeholder="Enter clue word..."
            value={clueWord}
            onChange={(e) => setClueWord(e.target.value.replace(/\s+/g, ''))}
            maxLength={30}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <select
            className="cn-number-select"
            value={clueNumber}
            onChange={(e) => setClueNumber(Number(e.target.value))}
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <option key={n} value={n}>{n === 0 ? '∞' : n}</option>
            ))}
          </select>
          <button
            className="btn btn-primary btn-small"
            onClick={handleSubmit}
            disabled={!clueWord.trim()}
          >
            Give Clue
          </button>
        </div>
        {timerEnabled && timeRemaining > 0 && (
          <div className="cn-timer">{formatTime(timeRemaining)}</div>
        )}
      </div>
    );
  }

  // Waiting for spymaster clue
  if (phase === 'spymaster-clue') {
    return (
      <div className="cn-clue-bar">
        <div className="cn-waiting">
          Waiting for <span className={currentTeam}>{currentTeam}</span> spymaster to give a clue...
        </div>
        {timerEnabled && timeRemaining > 0 && (
          <div className="cn-timer">{formatTime(timeRemaining)}</div>
        )}
      </div>
    );
  }

  // Operative guessing phase — show clue
  if (phase === 'operative-guess' && currentClue) {
    const isMyTeamGuessing = currentPlayer?.team === currentTeam;
    const isOperative = currentPlayer?.role === 'operative';

    return (
      <div className="cn-clue-bar">
        <div className="cn-clue-display">
          <span className={`cn-clue-word ${currentClue.team}`}>
            {currentClue.word}
          </span>
          <span className="cn-clue-number">
            {currentClue.number === 0 ? '∞' : currentClue.number}
          </span>
          <span className="cn-guesses-left">
            {guessesRemaining} guess{guessesRemaining !== 1 ? 'es' : ''} left
          </span>
        </div>

        {isMyTeamGuessing && isOperative && (
          <button
            className="cn-end-turn-btn btn btn-secondary btn-small"
            onClick={onEndTurn}
          >
            End Turn
          </button>
        )}

        {timerEnabled && timeRemaining > 0 && (
          <div className="cn-timer">{formatTime(timeRemaining)}</div>
        )}
      </div>
    );
  }

  return null;
}
