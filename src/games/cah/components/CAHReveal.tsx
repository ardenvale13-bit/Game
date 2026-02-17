// CAH Reveal Component - Shows the round winner
import useCAHStore from '../cahStore';

export default function CAHReveal() {
  const {
    currentBlackCard,
    submissions,
    players,
  } = useCAHStore();

  const winningSubmission = submissions.find(s => s.isWinner);
  const winner = players.find(p => p.id === winningSubmission?.playerId);

  // Format black card with winning answer
  const formatWinningCard = () => {
    if (!currentBlackCard || !winningSubmission) return null;
    
    const parts = currentBlackCard.text.split('_');
    return parts.map((part, idx) => (
      <span key={idx}>
        {part}
        {idx < parts.length - 1 && winningSubmission.cards[idx] && (
          <span className="cah-winning-answer">
            {winningSubmission.cards[idx].text}
          </span>
        )}
      </span>
    ));
  };

  return (
    <div className="cah-layout cah-reveal">
      <div className="cah-reveal-content">
        {/* Winner announcement */}
        <div className="cah-winner-header">
          <div className="cah-winner-avatar">
            <img 
              src={`/avatars/${winner?.avatarFilename}`} 
              alt={winner?.name}
            />
          </div>
          <h2>{winner?.name} wins the round!</h2>
        </div>

        {/* Winning combination */}
        <div className="cah-winning-combo">
          <div className="cah-black-card large">
            <div className="cah-card-text">
              {formatWinningCard()}
            </div>
          </div>
        </div>

        {/* Scoreboard preview */}
        <div className="cah-mini-scores">
          {players
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map((p, idx) => (
              <div 
                key={p.id} 
                className={`cah-mini-score ${p.id === winner?.id ? 'winner' : ''}`}
              >
                <span className="rank">{idx + 1}</span>
                <span className="name">{p.name}</span>
                <span className="score">{p.score}</span>
              </div>
            ))}
        </div>

        <div className="cah-next-round-text">
          Next round starting...
        </div>
      </div>
    </div>
  );
}
