// Codenames — Clue bar: spymaster input OR operative clue display
import { useState } from 'react';
import useCodenamesStore from '../codenamesStore';

// Short words that are OK to use in multi-word clues (won't trigger board-word blocking)
const IGNORE_WORDS = new Set(['A', 'AN', 'THE', 'AND', 'OR', 'OF', 'TO', 'IN', 'ON', 'AT', 'IS', 'IT', 'FOR', 'BY', 'NO', 'NOT', 'BUT', 'SO', 'IF']);

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
    board,
  } = useCodenamesStore();

  const currentPlayer = useCodenamesStore.getState().getCurrentPlayer();
  const iAmSpymaster = currentPlayer?.role === 'spymaster';
  const isMyTeamTurn = currentPlayer?.team === currentTeam;

  const [clueWord, setClueWord] = useState('');
  const [clueNumber, setClueNumber] = useState(1);
  const [error, setError] = useState('');

  // Validate clue: max 3 words, can't use board words
  const validateClue = (clue: string): string | null => {
    const trimmed = clue.trim();
    if (!trimmed) return null;

    // Word count check (max 3)
    const words = trimmed.split(/\s+/);
    if (words.length > 3) {
      return 'Clue can be max 3 words!';
    }

    // Check each significant word against board words
    const boardWords = board.map(c => c.word.toUpperCase());
    for (const word of words) {
      const upper = word.toUpperCase();
      if (IGNORE_WORDS.has(upper)) continue;
      // Check if any board word matches or contains this clue word as a standalone word
      for (const bw of boardWords) {
        if (upper === bw || bw.split(/\s+/).includes(upper)) {
          return `Can't use "${word}" — it's on the board!`;
        }
      }
    }

    return null; // valid
  };

  const handleClueChange = (value: string) => {
    setClueWord(value);
    if (error) setError('');
  };

  const handleSubmit = () => {
    const trimmed = clueWord.trim();
    if (!trimmed) return;

    const validationError = validateClue(trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }

    onSubmitClue(trimmed, clueNumber);
    setClueWord('');
    setClueNumber(1);
    setError('');
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
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <input
              type="text"
              className="cn-clue-input"
              placeholder="Enter clue (max 3 words)..."
              value={clueWord}
              onChange={(e) => handleClueChange(e.target.value)}
              maxLength={40}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            {error && (
              <div style={{ color: 'var(--accent-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                {error}
              </div>
            )}
          </div>
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
