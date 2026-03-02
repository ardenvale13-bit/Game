// Uno Round Over Screen
import useUnoStore from '../unoStore';

export default function UnoRoundOver() {
  const { roundResults, players, currentRound } = useUnoStore();

  const result = roundResults[roundResults.length - 1];
  if (!result) {
    return (
      <div className="uno-round-over">
        <div>Loading...</div>
      </div>
    );
  }

  const winner = players.find((p) => p.id === result.winnerId);

  return (
    <div className="uno-round-over">
      <div className="uno-round-winner">Round {currentRound} Over</div>

      {winner && (
        <>
          <img
            src={`/avatars/${winner.avatarFilename}`}
            alt={winner.name}
            className="uno-winner-avatar"
          />
          <div className="uno-round-winner">{winner.name} Wins!</div>
        </>
      )}

      <div className="uno-round-points">{result.pointsAwarded} points</div>

      <div className="uno-score-breakdown">
        <div className="uno-running-title">Points This Round</div>
        {players.map((p) => {
          const points = result.scoreBreakdown[p.id] || 0;
          return (
            <div
              key={p.id}
              className={`uno-score-row ${p.id === result.winnerId ? '' : ''}`}
              style={p.id === result.winnerId ? { background: 'rgba(59, 130, 246, 0.15)' } : {}}
            >
              <span className="uno-score-name">{p.name}</span>
              <span className="uno-score-points">{points}</span>
            </div>
          );
        })}
      </div>

      <div className="uno-running-score">
        <div className="uno-running-title">Total Score</div>
        {players
          .sort((a, b) => b.score - a.score)
          .map((p, idx) => (
            <div
              key={p.id}
              className={`uno-score-item ${idx === 0 ? 'leader' : ''}`}
            >
              <span>
                {idx + 1}. {p.name}
              </span>
              <span style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>
                {p.score}
              </span>
            </div>
          ))}
      </div>

      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '16px' }}>
        Next round starting...
      </div>
    </div>
  );
}
