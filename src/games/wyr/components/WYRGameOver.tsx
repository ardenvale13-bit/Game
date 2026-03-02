// Would You Rather - Game Over Screen
import useWYRStore from '../wyrStore';

interface WYRGameOverProps {
  onPlayAgain: () => void;
  onBackToLobby: () => void;
}

export default function WYRGameOver({ onPlayAgain, onBackToLobby }: WYRGameOverProps) {
  const { getFinalLeaderboard, roundResults } = useWYRStore();
  const leaderboard = getFinalLeaderboard();

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  // Find most controversial rounds (closest to 50/50 split)
  const controversialRounds = [...roundResults]
    .map(r => ({
      round: r.round,
      prompt: r.prompt,
      diff: Math.abs(r.votesA.length - r.votesB.length),
      votesA: r.votesA.length,
      votesB: r.votesB.length,
    }))
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 3);

  return (
    <div className="wyr-game-over">
      <h1>Game Over!</h1>
      <div className="wyr-game-over-subtitle">
        The votes are in! Here's the final breakdown.
      </div>

      {/* Podium */}
      <div className="wyr-podium">
        {top3.map((player, i) => {
          const rank = i === 0 ? 'first' : i === 1 ? 'second' : 'third';
          const medalSrc = i === 0 ? '/first-icon.png' : i === 1 ? '/second-icon.png' : '/third-icon.png';
          const glowColor = i === 0 ? 'rgba(255, 215, 0, 0.5)' : i === 1 ? 'rgba(192, 192, 192, 0.5)' : 'rgba(205, 127, 50, 0.5)';
          return (
            <div key={player.id} className={`wyr-podium-spot ${rank}`} style={{ boxShadow: `0 0 20px ${glowColor}` }}>
              <div className="wyr-podium-rank"><img src={medalSrc} alt={rank} style={{ width: '36px', height: '36px' }} /></div>
              <div className="wyr-podium-avatar">
                <img src={`/avatars/${player.avatarFilename}`} alt={player.name} />
              </div>
              <div className="wyr-podium-name">{player.name}</div>
              <div className="wyr-podium-score">{player.score} points</div>
            </div>
          );
        })}
      </div>

      {/* Full standings */}
      {rest.length > 0 && (
        <div className="wyr-full-standings">
          {rest.map((player, i) => (
            <div key={player.id} className="wyr-standing-row">
              <div className="wyr-standing-rank">{i + 4}</div>
              <div className="wyr-standing-avatar">
                <img src={`/avatars/${player.avatarFilename}`} alt={player.name} />
              </div>
              <div className="wyr-standing-name">{player.name}</div>
              <div className="wyr-standing-score">{player.score} points</div>
            </div>
          ))}
        </div>
      )}

      {/* Round highlights */}
      {controversialRounds.length > 0 && (
        <div className="wyr-highlights">
          <h3>Most Controversial Choices</h3>
          <div className="wyr-highlights-list">
            {controversialRounds.map((r) => (
              <div key={r.round} className="wyr-highlight-item">
                <div className="wyr-highlight-round">Round {r.round}</div>
                <div className="wyr-highlight-question">
                  {r.votesA > r.votesB
                    ? `${r.votesA}% chose first option`
                    : r.votesB > r.votesA
                    ? `${r.votesB}% chose second option`
                    : "Perfect 50/50 split!"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="wyr-actions">
        <button className="btn btn-primary btn-large" onClick={onPlayAgain}>
          Play Again
        </button>
        <button className="btn btn-secondary btn-large" onClick={onBackToLobby}>
          Back to Lobby
        </button>
      </div>
    </div>
  );
}
