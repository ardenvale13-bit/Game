// Make It Meme - Game Over screen with final standings
import useMemeStore from '../memeStore';

interface MemeGameOverProps {
  onPlayAgain: () => void;
  onBackToLobby: () => void;
}

export default function MemeGameOver({ onPlayAgain, onBackToLobby }: MemeGameOverProps) {
  const { getFinalLeaderboard, roundResults, players } = useMemeStore();
  const leaderboard = getFinalLeaderboard();

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="meme-game-over">
      <h1>Game Over!</h1>
      <div className="meme-game-over-subtitle">
        The meme lords have spoken. Here are the final standings.
      </div>

      {/* Podium */}
      <div className="meme-podium">
        {top3.map((player, i) => {
          const rank = i === 0 ? 'first' : i === 1 ? 'second' : 'third';
          const medalSrc = i === 0 ? '/first-icon.png' : i === 1 ? '/second-icon.png' : '/third-icon.png';
          const glowColor = i === 0 ? 'rgba(255, 215, 0, 0.5)' : i === 1 ? 'rgba(192, 192, 192, 0.5)' : 'rgba(205, 127, 50, 0.5)';
          return (
            <div key={player.id} className={`meme-podium-spot ${rank}`} style={{ boxShadow: `0 0 20px ${glowColor}` }}>
              <div className="meme-podium-rank">
                <img src={medalSrc} alt={rank} style={{ width: '36px', height: '36px' }} />
              </div>
              <div className="meme-podium-avatar">
                <img src={`/avatars/${player.avatarFilename}`} alt={player.name} />
              </div>
              <div className="meme-podium-name">{player.name}</div>
              <div className="meme-podium-score">{player.score} votes</div>
            </div>
          );
        })}
      </div>

      {/* Full standings */}
      {rest.length > 0 && (
        <div className="meme-full-standings">
          {rest.map((player, i) => (
            <div key={player.id} className="meme-standing-row">
              <div className="meme-standing-rank">{i + 4}</div>
              <div className="meme-standing-avatar">
                <img src={`/avatars/${player.avatarFilename}`} alt={player.name} />
              </div>
              <div className="meme-standing-name">{player.name}</div>
              <div className="meme-standing-score">{player.score} votes</div>
            </div>
          ))}
        </div>
      )}

      {/* Best memes from each round */}
      {roundResults.length > 0 && (
        <div className="meme-highlights">
          <h3>Best Memes</h3>
          <div className="meme-highlights-grid">
            {roundResults.slice(-6).map((r) => {
              const winner = players.find(p => p.id === r.winnerId);
              return (
                <div key={r.round} className="meme-highlight-card">
                  <div className="meme-highlight-image">
                    <img src={r.templateSrc} alt="" />
                  </div>
                  <div className="meme-highlight-caption">"{r.winnerCaption}"</div>
                  <div className="meme-highlight-author">
                    — {winner?.name ?? '?'} ({r.winnerVotes} vote{r.winnerVotes !== 1 ? 's' : ''})
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="meme-actions">
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
