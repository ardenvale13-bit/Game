// Codenames — Game Over screen with full board reveal
import useCodenamesStore from '../codenamesStore';

interface CodenamesGameOverProps {
  onPlayAgain: () => void;
  onBackToLobby: () => void;
}

export default function CodenamesGameOver({ onPlayAgain, onBackToLobby }: CodenamesGameOverProps) {
  const { board, winner, winReason, pinkTeamName, blueTeamName } = useCodenamesStore();

  const winnerLabel = winner === 'pink' ? pinkTeamName : blueTeamName;
  const loserLabel = winner === 'pink' ? blueTeamName : pinkTeamName;
  const reasonText = winReason === 'assassin'
    ? `${loserLabel} hit the assassin!`
    : `${winnerLabel} found all their cards!`;

  return (
    <div className="cn-game-over">
      <div className="cn-game-over-content">
        <div className={`cn-winner-banner ${winner}`}>
          {winnerLabel} Wins!
        </div>
        <div className="cn-win-reason">{reasonText}</div>

        {/* Full board reveal */}
        <div className="cn-game-over-board">
          {board.map((card) => (
            <div
              key={card.index}
              className={`cn-game-over-card ${card.type} ${card.isRevealed ? 'revealed' : ''}`}
            >
              {card.word}
            </div>
          ))}
        </div>

        <div className="cn-game-over-actions">
          <button className="btn btn-primary" onClick={onPlayAgain}>
            Play Again
          </button>
          <button className="btn btn-secondary" onClick={onBackToLobby}>
            Back to Lobby
          </button>
        </div>
      </div>
    </div>
  );
}
