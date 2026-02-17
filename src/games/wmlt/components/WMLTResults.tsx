// WMLT Results Phase - Show vote breakdown after each round
import useWMLTStore from '../wmltStore';

export default function WMLTResults() {
  const { players, currentPrompt, currentRound, maxRounds, timeRemaining, roundResults } = useWMLTStore();

  const latestResult = roundResults[roundResults.length - 1];
  if (!latestResult) return null;

  const winner = players.find(p => p.id === latestResult.winnerId);

  // Sort players by votes received this round
  const sorted = [...players].sort((a, b) => {
    const aVotes = latestResult.votes[a.id]?.length ?? 0;
    const bVotes = latestResult.votes[b.id]?.length ?? 0;
    return bVotes - aVotes;
  });

  const maxVotes = latestResult.winnerVotes;

  return (
    <div className="wmlt-results">
      {/* Header */}
      <div className="wmlt-header">
        <span className="wmlt-round-badge">
          Round {currentRound} / {maxRounds}
        </span>
        <span className="wmlt-timer">
          {timeRemaining}s
        </span>
      </div>

      {/* Prompt reminder */}
      <div className="wmlt-results-prompt">
        Most likely to <strong>{currentPrompt}</strong>?
      </div>

      {/* Winner spotlight */}
      {winner && (
        <div className="wmlt-winner-card">
          <div className="wmlt-winner-avatar">
            <img src={`/avatars/${winner.avatarFilename}`} alt={winner.name} />
          </div>
          <div className="wmlt-winner-name">{winner.name}</div>
          <div className="wmlt-winner-votes">
            {latestResult.winnerVotes} vote{latestResult.winnerVotes !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Full breakdown */}
      <div className="wmlt-vote-breakdown">
        {sorted.map((player, i) => {
          const voteCount = latestResult.votes[player.id]?.length ?? 0;
          const voterNames = (latestResult.votes[player.id] ?? [])
            .map(vid => players.find(p => p.id === vid)?.name ?? '?')
            .join(', ');
          const barWidth = maxVotes > 0 ? (voteCount / maxVotes) * 100 : 0;

          return (
            <div
              key={player.id}
              className="wmlt-vote-row"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="wmlt-vote-row-avatar">
                <img src={`/avatars/${player.avatarFilename}`} alt={player.name} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span className="wmlt-vote-row-name">{player.name}</span>
                  <span className="wmlt-vote-row-count">
                    {voteCount} vote{voteCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '3px', height: '6px' }}>
                  <div className="wmlt-vote-row-bar" style={{ width: `${barWidth}%` }} />
                </div>
                {voterNames && (
                  <div className="wmlt-vote-row-voters">
                    Voted by: {voterNames}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
