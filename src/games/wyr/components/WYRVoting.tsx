// Would You Rather - Voting Phase
import useWYRStore from '../wyrStore';

interface WYRVotingProps {
  currentPlayerId: string;
  onVote: (option: 'A' | 'B') => void;
}

export default function WYRVoting({ currentPlayerId, onVote }: WYRVotingProps) {
  const { players, currentPrompt, currentRound, maxRounds, timeRemaining } = useWYRStore();

  if (!currentPrompt) return null;

  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const hasVoted = currentPlayer?.vote !== null;
  const voteCounts = { A: 0, B: 0 };

  players.forEach(p => {
    if (p.vote === 'A') voteCounts.A++;
    else if (p.vote === 'B') voteCounts.B++;
  });

  const timerClass = timeRemaining <= 5 ? 'danger' : timeRemaining <= 10 ? 'warning' : '';

  return (
    <>
      {/* Header */}
      <div className="wyr-header">
        <span className="wyr-round-badge">
          Round {currentRound} / {maxRounds}
        </span>
        <span className={`wyr-timer ${timerClass}`}>
          {timeRemaining}s
        </span>
      </div>

      {/* Prompt */}
      <div className="wyr-prompt-card">
        <div className="wyr-prompt-label">Would You Rather...</div>
        <div className="wyr-prompt-text">{currentPrompt.optionA}</div>
        <div className="wyr-prompt-or">OR</div>
        <div className="wyr-prompt-text">{currentPrompt.optionB}</div>
      </div>

      {/* Vote buttons */}
      <div className="wyr-vote-container">
        <button
          className={`wyr-vote-btn option-a ${
            currentPlayer?.vote === 'A' ? 'selected' : ''
          } ${hasVoted && currentPlayer?.vote !== 'A' ? 'disabled' : ''}`}
          onClick={() => !hasVoted && onVote('A')}
        >
          <div className="wyr-option-label">A</div>
          <div className="wyr-option-text">{currentPrompt.optionA}</div>
          {currentPlayer?.vote === 'A' && (
            <div className="wyr-vote-checkmark">✓</div>
          )}
        </button>

        <button
          className={`wyr-vote-btn option-b ${
            currentPlayer?.vote === 'B' ? 'selected' : ''
          } ${hasVoted && currentPlayer?.vote !== 'B' ? 'disabled' : ''}`}
          onClick={() => !hasVoted && onVote('B')}
        >
          <div className="wyr-option-label">B</div>
          <div className="wyr-option-text">{currentPrompt.optionB}</div>
          {currentPlayer?.vote === 'B' && (
            <div className="wyr-vote-checkmark">✓</div>
          )}
        </button>
      </div>

      {/* Progress */}
      <div className="wyr-vote-progress">
        {hasVoted ? (
          <div className="text-muted">
            Waiting for others...
          </div>
        ) : (
          <div className="text-muted">
            Choose wisely!
          </div>
        )}
        <div className="wyr-votes-counter">
          {voteCounts.A + voteCounts.B} / {players.length} voted
        </div>
      </div>

      {/* Vote count bars */}
      <div className="wyr-vote-bars">
        <div className="wyr-vote-bar-item">
          <div className="wyr-vote-bar-label">Option A</div>
          <div className="wyr-vote-bar-container">
            <div
              className="wyr-vote-bar-fill option-a"
              style={{
                width: `${players.length > 0 ? (voteCounts.A / players.length) * 100 : 0}%`
              }}
            />
          </div>
          <div className="wyr-vote-bar-count">{voteCounts.A}</div>
        </div>

        <div className="wyr-vote-bar-item">
          <div className="wyr-vote-bar-label">Option B</div>
          <div className="wyr-vote-bar-container">
            <div
              className="wyr-vote-bar-fill option-b"
              style={{
                width: `${players.length > 0 ? (voteCounts.B / players.length) * 100 : 0}%`
              }}
            />
          </div>
          <div className="wyr-vote-bar-count">{voteCounts.B}</div>
        </div>
      </div>
    </>
  );
}
