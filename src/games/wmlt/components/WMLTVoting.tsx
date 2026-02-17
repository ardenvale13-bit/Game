// WMLT Voting Phase - Players vote for who's most likely to...
import useWMLTStore from '../wmltStore';

interface WMLTVotingProps {
  currentPlayerId: string;
  onVote: (targetId: string) => void;
}

export default function WMLTVoting({ currentPlayerId, onVote }: WMLTVotingProps) {
  const { players, currentPrompt, currentRound, maxRounds, timeRemaining } = useWMLTStore();

  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const hasVoted = currentPlayer?.votedFor !== null;
  const votedCount = players.filter(p => p.votedFor !== null).length;

  const timerClass = timeRemaining <= 5 ? 'danger' : timeRemaining <= 10 ? 'warning' : '';

  return (
    <>
      {/* Header */}
      <div className="wmlt-header">
        <span className="wmlt-round-badge">
          Round {currentRound} / {maxRounds}
        </span>
        <span className={`wmlt-timer ${timerClass}`}>
          {timeRemaining}s
        </span>
      </div>

      {/* Prompt */}
      <div className="wmlt-prompt-card">
        <div className="wmlt-prompt-label">Who's most likely to...</div>
        <div className="wmlt-prompt-text">{currentPrompt}?</div>
      </div>

      {/* Vote grid */}
      <div className="wmlt-vote-grid">
        {players.map((player) => (
          <button
            key={player.id}
            className={`wmlt-vote-btn ${
              currentPlayer?.votedFor === player.id ? 'selected' : ''
            } ${hasVoted && currentPlayer?.votedFor !== player.id ? 'disabled' : ''}`}
            onClick={() => !hasVoted && onVote(player.id)}
          >
            <div className="wmlt-vote-avatar">
              <img src={`/avatars/${player.avatarFilename}`} alt={player.name} />
            </div>
            <div className="wmlt-vote-name">{player.name}</div>
            {currentPlayer?.votedFor === player.id && (
              <div className="wmlt-vote-status">Voted!</div>
            )}
          </button>
        ))}
      </div>

      {/* Progress */}
      <div className="wmlt-submit-bar">
        {hasVoted ? (
          <div className="text-muted" style={{ fontSize: '0.95rem' }}>
            Waiting for others...
          </div>
        ) : (
          <div className="text-muted" style={{ fontSize: '0.95rem' }}>
            Tap someone to vote!
          </div>
        )}
        <div className="wmlt-votes-progress">
          {votedCount} / {players.length} votes in
        </div>
      </div>
    </>
  );
}
