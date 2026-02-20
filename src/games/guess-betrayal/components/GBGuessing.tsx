// Guess Betrayal - Guessing Phase Component
import { useState } from 'react';
import useGuessBetrayalStore from '../guessBetrayalStore';

interface GBGuessingProps {
  onSubmitGuesses: (guesses: Record<string, string>) => void;
  onLeave?: () => void;
}

export default function GBGuessing({ onSubmitGuesses, onLeave }: GBGuessingProps) {
  const {
    players,
    currentPlayerId,
    currentRound,
    maxRounds,
    currentQuestion,
    shuffledAnswers,
    timeRemaining,
  } = useGuessBetrayalStore();

  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const hasGuessed = currentPlayer?.hasGuessed ?? false;
  const guessedCount = players.filter(p => p.hasGuessed).length;

  // Track guesses: answerId -> playerId
  const [guesses, setGuesses] = useState<Record<string, string>>({});
  // Track which answer card is currently being assigned
  const [activeAnswerId, setActiveAnswerId] = useState<string | null>(null);

  // Players available for guessing (excluding self)
  const otherPlayers = players.filter(p => p.id !== currentPlayerId);

  // Get how many answers are assigned to each player
  const playerAssignments = Object.values(guesses);

  const handleAssignPlayer = (answerId: string, playerId: string) => {
    setGuesses(prev => {
      const next = { ...prev };
      // If this answer already has a guess, remove it first
      // If this player is already assigned to another answer, remove that too
      Object.entries(next).forEach(([aid, pid]) => {
        if (pid === playerId && aid !== answerId) {
          delete next[aid];
        }
      });
      next[answerId] = playerId;
      return next;
    });
    setActiveAnswerId(null);
  };

  const handleRemoveGuess = (answerId: string) => {
    setGuesses(prev => {
      const next = { ...prev };
      delete next[answerId];
      return next;
    });
  };

  const handleSubmit = () => {
    if (hasGuessed) return;
    onSubmitGuesses(guesses);
  };

  // Can't guess your own answer, so we have (players.length - 1) answers from others
  // plus your own. You need to assign all OTHER players' answers.
  const othersAnswers = shuffledAnswers.filter(a => a.playerId !== currentPlayerId);
  const allGuessesPlaced = Object.keys(guesses).length >= othersAnswers.length;

  return (
    <div className="gb-layout">
      {/* Header */}
      <div className="gb-header">
        <div className="gb-round">Round {currentRound} / {maxRounds}</div>
        <div className="gb-timer" style={{ color: timeRemaining <= 10 ? 'var(--accent-secondary)' : 'var(--text-primary)' }}>
          {timeRemaining}s
        </div>
        <div className="gb-status">
          {guessedCount} / {players.length} guessed
        </div>
      </div>

      {/* Question reminder */}
      <div className="gb-question-reminder">
        <span className="gb-question-reminder-label">Q:</span> {currentQuestion}
      </div>

      {hasGuessed ? (
        <div className="gb-submitted-waiting">
          <div className="gb-waiting-icon">✓</div>
          <h3>Guesses Submitted!</h3>
          <p>Waiting for other players...</p>
          <div className="gb-waiting-progress">
            {guessedCount} / {players.length} players ready
          </div>
        </div>
      ) : (
        <>
          <div className="gb-guess-instructions">
            Tap an answer, then tap who you think wrote it.
          </div>

          {/* Shuffled Answers */}
          <div className="gb-answers-grid">
            {shuffledAnswers.map((answer) => {
              const assignedPlayerId = guesses[answer.id];
              const assignedPlayer = assignedPlayerId ? players.find(p => p.id === assignedPlayerId) : null;
              const isOwnAnswer = answer.playerId === currentPlayerId;
              const isActive = activeAnswerId === answer.id;

              return (
                <div
                  key={answer.id}
                  className={`gb-answer-card ${isActive ? 'active' : ''} ${assignedPlayer ? 'assigned' : ''} ${isOwnAnswer ? 'own' : ''}`}
                  onClick={() => {
                    if (isOwnAnswer) return; // Can't guess your own
                    if (assignedPlayer) {
                      handleRemoveGuess(answer.id);
                    } else {
                      setActiveAnswerId(isActive ? null : answer.id);
                    }
                  }}
                >
                  <div className="gb-answer-text">{answer.text}</div>
                  {assignedPlayer && (
                    <div className="gb-answer-assigned">
                      <img
                        src={`/avatars/${assignedPlayer.avatarFilename}`}
                        alt={assignedPlayer.name}
                        className="gb-mini-avatar"
                      />
                      <span>{assignedPlayer.name}</span>
                      <span className="gb-remove-guess">✕</span>
                    </div>
                  )}
                  {isOwnAnswer && (
                    <div className="gb-answer-own-tag">Yours</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Player selector dropdown (when an answer is active) */}
          {activeAnswerId && (
            <div className="gb-player-selector">
              <div className="gb-selector-label">Who wrote this?</div>
              <div className="gb-selector-grid">
                {otherPlayers.map((player) => {
                  const alreadyAssigned = playerAssignments.includes(player.id);
                  return (
                    <button
                      key={player.id}
                      className={`gb-selector-player ${alreadyAssigned ? 'used' : ''}`}
                      onClick={() => handleAssignPlayer(activeAnswerId, player.id)}
                      disabled={alreadyAssigned}
                    >
                      <img
                        src={`/avatars/${player.avatarFilename}`}
                        alt={player.name}
                        className="gb-selector-avatar"
                      />
                      <span>{player.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submit button */}
          <div className="gb-guess-footer">
            <button
              className="btn btn-primary btn-large"
              onClick={handleSubmit}
              disabled={!allGuessesPlaced || hasGuessed}
            >
              {allGuessesPlaced ? 'Lock In Guesses' : `Assign ${othersAnswers.length - Object.keys(guesses).length} more`}
            </button>
          </div>
        </>
      )}

      {/* Leave button */}
      {onLeave && (
        <div className="gb-leave-container">
          <button className="btn btn-ghost btn-small" onClick={onLeave} style={{ opacity: 0.7 }}>
            ← Return to Lobby
          </button>
        </div>
      )}
    </div>
  );
}
