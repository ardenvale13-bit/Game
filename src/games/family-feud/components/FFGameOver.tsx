// fAImily Feud - Game Over Component
import useFamilyFeudStore from '../familyFeudStore';

interface FFGameOverProps {
  onPlayAgain: () => void;
  onBackToLobby: () => void;
}

export default function FFGameOver({ onPlayAgain, onBackToLobby }: FFGameOverProps) {
  const {
    pinkTeamName,
    purpleTeamName,
    pinkScore,
    purpleScore,
    winnerTeam,
    players,
  } = useFamilyFeudStore();

  const isTie = pinkScore === purpleScore;
  const winnerName = winnerTeam === 'pink' ? pinkTeamName : purpleTeamName;
  const loserName = winnerTeam === 'pink' ? purpleTeamName : pinkTeamName;
  const winnerScore = winnerTeam === 'pink' ? pinkScore : purpleScore;
  const loserScore = winnerTeam === 'pink' ? purpleScore : pinkScore;

  const winnerPlayers = players.filter((p) => p.team === winnerTeam);
  const loserPlayers = players.filter((p) => p.team !== winnerTeam && p.team !== null);

  return (
    <div className="ff-game-over">
      <div className="ff-game-over-header">
        <img src="/ff-icon.png" alt="" className="ff-icon-large" />
        <h2>Game Over!</h2>
      </div>

      {isTie ? (
        <div className="ff-tie-banner">
          <div className="ff-tie-text">It's a TIE!</div>
          <div className="ff-tie-score">{pinkScore} - {purpleScore}</div>
        </div>
      ) : (
        <div className={`ff-winner-section ff-winner-${winnerTeam}`}>
          <div className="ff-winner-crown">👑</div>
          <div className="ff-winner-team-name">{winnerName}</div>
          <div className="ff-winner-score-final">{winnerScore} pts</div>
          <div className="ff-winner-players">
            {winnerPlayers.map((p) => (
              <div key={p.id} className="ff-winner-player">
                <img
                  src={`/avatars/${p.avatarFilename}`}
                  alt=""
                  className="ff-go-avatar"
                />
                <span>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="ff-loser-section">
        <div className="ff-loser-team-name">{loserName}</div>
        <div className="ff-loser-score">{loserScore} pts</div>
        <div className="ff-loser-players">
          {loserPlayers.map((p) => (
            <div key={p.id} className="ff-loser-player">
              <img
                src={`/avatars/${p.avatarFilename}`}
                alt=""
                className="ff-go-avatar"
              />
              <span>{p.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="ff-game-over-actions">
        <button className="ff-play-again-btn" onClick={onPlayAgain}>
          Play Again
        </button>
        <button className="ff-lobby-btn" onClick={onBackToLobby}>
          Back to Lobby
        </button>
      </div>
    </div>
  );
}
