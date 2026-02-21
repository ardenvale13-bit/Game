// Make It Meme - Results Phase
// Shows winning caption on the meme + vote breakdown
import useMemeStore from '../memeStore';

export default function MemeResults() {
  const { players, currentRound, maxRounds, currentTemplateSrc, currentTemplateIsGif, timeRemaining, roundResults } = useMemeStore();

  const latestResult = roundResults[roundResults.length - 1];
  if (!latestResult) return null;

  const winner = players.find(p => p.id === latestResult.winnerId);

  // Sort by votes received
  const sorted = [...players]
    .filter(p => latestResult.captions[p.id])
    .sort((a, b) => {
      const aVotes = latestResult.votes[a.id]?.length ?? 0;
      const bVotes = latestResult.votes[b.id]?.length ?? 0;
      return bVotes - aVotes;
    });

  return (
    <div className="meme-results">
      {/* Header */}
      <div className="meme-header">
        <span className="meme-round-badge">
          Round {currentRound} / {maxRounds}
        </span>
        <span className="meme-phase-label">Results</span>
        <span className="meme-timer">
          {timeRemaining}s
        </span>
      </div>

      {/* Winning meme with caption */}
      <div className="meme-winner-showcase">
        <div className="meme-image-container">
          <img
            src={currentTemplateSrc}
            alt="Meme"
            className={`meme-image ${currentTemplateIsGif ? 'meme-gif' : ''}`}
          />
          {/* Winning caption overlay */}
          {winner && latestResult.winnerCaption && (
            <div className="meme-caption-overlay">
              <div className="meme-caption-overlay-text">
                {latestResult.winnerCaption}
              </div>
            </div>
          )}
        </div>

        {/* Winner info */}
        {winner && (
          <div className="meme-winner-info">
            <div className="meme-winner-avatar">
              <img src={`/avatars/${winner.avatarFilename}`} alt={winner.name} />
            </div>
            <div className="meme-winner-details">
              <div className="meme-winner-name">{winner.name}</div>
              <div className="meme-winner-votes">
                {latestResult.winnerVotes} vote{latestResult.winnerVotes !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* All captions breakdown */}
      <div className="meme-captions-breakdown">
        {sorted.map((player, i) => {
          const caption = latestResult.captions[player.id] || '';
          const voteCount = latestResult.votes[player.id]?.length ?? 0;
          const voterNames = (latestResult.votes[player.id] ?? [])
            .map(vid => players.find(p => p.id === vid)?.name ?? '?')
            .join(', ');
          const isWinner = player.id === latestResult.winnerId;

          return (
            <div
              key={player.id}
              className={`meme-caption-row ${isWinner ? 'winner' : ''}`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="meme-caption-row-avatar">
                <img src={`/avatars/${player.avatarFilename}`} alt={player.name} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="meme-caption-row-header">
                  <span className="meme-caption-row-name">{player.name}</span>
                  <span className="meme-caption-row-count">
                    {voteCount} vote{voteCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="meme-caption-row-text">"{caption}"</div>
                {voterNames && (
                  <div className="meme-caption-row-voters">
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
