// fAImily Feud - Steal Attempt Component
// Non-controlling team gets one shot to steal
import { useState, useRef, useEffect } from 'react';
import useFamilyFeudStore from '../familyFeudStore';

interface FFStealAttemptProps {
  currentPlayerId: string;
  isHost: boolean;
  onSteal: (answer: string) => void;
  onAwardPoints: () => void;
}

export default function FFStealAttempt({
  currentPlayerId,
  isHost,
  onSteal,
  onAwardPoints,
}: FFStealAttemptProps) {
  const {
    currentQuestion,
    boardAnswers,
    controllingTeam,
    stealingTeam,
    stealAnswer,
    stealResult,
    players,
    pinkTeamName,
    purpleTeamName,
    pinkScore,
    purpleScore,
    timeRemaining,
  } = useFamilyFeudStore();

  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const stealingPlayers = players.filter((p) => p.team === stealingTeam);
  const isOnStealingTeam = players.find((p) => p.id === currentPlayerId)?.team === stealingTeam;

  // Anyone on the stealing team can type (first person to submit)
  const canSteal = isOnStealingTeam && !submitted && !stealResult;

  useEffect(() => {
    if (canSteal && inputRef.current) {
      inputRef.current.focus();
    }
  }, [canSteal]);

  // Auto-award after steal result (host)
  useEffect(() => {
    if (isHost && stealResult) {
      setTimeout(() => onAwardPoints(), 2500);
    }
  }, [stealResult, isHost, onAwardPoints]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || submitted) return;
    setSubmitted(true);
    onSteal(answer.trim());
  };

  return (
    <div className="ff-steal-attempt">
      {/* Scoreboard */}
      <div className="ff-scoreboard">
        <div className={`ff-score-team ff-score-pink ${stealingTeam === 'pink' ? 'ff-stealing' : ''}`}>
          <div className="ff-score-name">{pinkTeamName}</div>
          <div className="ff-score-value">{pinkScore}</div>
        </div>
        <div className="ff-steal-badge">STEAL!</div>
        <div className={`ff-score-team ff-score-purple ${stealingTeam === 'purple' ? 'ff-stealing' : ''}`}>
          <div className="ff-score-name">{purpleTeamName}</div>
          <div className="ff-score-value">{purpleScore}</div>
        </div>
      </div>

      {/* Question */}
      <div className="ff-question-card ff-steal-card">
        <div className="ff-steal-label">
          🎯 {stealingTeam === 'pink' ? pinkTeamName : purpleTeamName} can STEAL!
        </div>
        <div className="ff-question-text">{currentQuestion?.question || '...'}</div>
        <div className="ff-timer">{timeRemaining}s</div>
      </div>

      {/* Board - show what's revealed */}
      <div className="ff-board ff-board-small">
        {boardAnswers.map((answer, i) => (
          <div
            key={i}
            className={`ff-board-answer ${answer.revealed ? 'ff-revealed' : 'ff-hidden'}`}
          >
            <div className="ff-answer-rank">{i + 1}</div>
            <div className="ff-answer-text">
              {answer.revealed ? answer.text : '???'}
            </div>
            <div className="ff-answer-points">
              {answer.revealed ? answer.points : ''}
            </div>
          </div>
        ))}
      </div>

      {/* Steal result */}
      {stealResult && (
        <div className={`ff-steal-result ${stealResult === 'correct' ? 'ff-steal-success' : 'ff-steal-fail'}`}>
          {stealResult === 'correct'
            ? `✓ "${stealAnswer}" is correct! STOLEN!`
            : `✕ "${stealAnswer}" — Not on the board! Points go to ${controllingTeam === 'pink' ? pinkTeamName : purpleTeamName}!`}
        </div>
      )}

      {/* Input area for stealing team */}
      {canSteal && (
        <form className="ff-guess-form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            className="ff-guess-input"
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Name an answer on the board..."
            maxLength={50}
          />
          <button
            className="ff-guess-btn ff-steal-submit"
            type="submit"
            disabled={!answer.trim()}
          >
            STEAL!
          </button>
        </form>
      )}

      {/* Waiting */}
      {!isOnStealingTeam && !stealResult && (
        <div className="ff-spectator-msg">
          {stealingTeam === 'pink' ? pinkTeamName : purpleTeamName} is trying to steal...
        </div>
      )}

      {isOnStealingTeam && submitted && !stealResult && (
        <div className="ff-waiting-msg">Submitted! Waiting for result...</div>
      )}
    </div>
  );
}
