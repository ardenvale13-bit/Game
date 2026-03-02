// Would You Rather - Results Phase
import useWYRStore from '../wyrStore';

export default function WYRResults() {
  const { players, currentPrompt, currentRound, maxRounds, timeRemaining, roundResults } = useWYRStore();

  const latestResult = roundResults[roundResults.length - 1];
  if (!latestResult || !currentPrompt) return null;

  const totalVotes = latestResult.votesA.length + latestResult.votesB.length;
  const percentA = totalVotes > 0 ? Math.round((latestResult.votesA.length / totalVotes) * 100) : 0;
  const percentB = totalVotes > 0 ? Math.round((latestResult.votesB.length / totalVotes) * 100) : 0;

  const votedForA = latestResult.votesA.map(id => players.find(p => p.id === id)).filter(Boolean);
  const votedForB = latestResult.votesB.map(id => players.find(p => p.id === id)).filter(Boolean);

  return (
    <div className="wyr-results">
      {/* Header */}
      <div className="wyr-header">
        <span className="wyr-round-badge">
          Round {currentRound} / {maxRounds}
        </span>
        <span className="wyr-timer">
          {timeRemaining}s
        </span>
      </div>

      {/* Results title */}
      <div className="wyr-results-title">Results!</div>

      {/* Split display */}
      <div className="wyr-results-split">
        <div className={`wyr-results-option option-a ${latestResult.majorityOption === 'A' ? 'majority' : ''}`}>
          <div className="wyr-results-option-label">Option A</div>
          <div className="wyr-results-option-text">{currentPrompt.optionA}</div>
          <div className="wyr-results-option-percent">{percentA}%</div>
          <div className="wyr-results-option-votes">{latestResult.votesA.length} vote{latestResult.votesA.length !== 1 ? 's' : ''}</div>
          {latestResult.majorityOption === 'A' && (
            <div className="wyr-results-majority-badge">Majority!</div>
          )}
        </div>

        <div className={`wyr-results-option option-b ${latestResult.majorityOption === 'B' ? 'majority' : ''}`}>
          <div className="wyr-results-option-label">Option B</div>
          <div className="wyr-results-option-text">{currentPrompt.optionB}</div>
          <div className="wyr-results-option-percent">{percentB}%</div>
          <div className="wyr-results-option-votes">{latestResult.votesB.length} vote{latestResult.votesB.length !== 1 ? 's' : ''}</div>
          {latestResult.majorityOption === 'B' && (
            <div className="wyr-results-majority-badge">Majority!</div>
          )}
        </div>
      </div>

      {/* Vote breakdown */}
      <div className="wyr-results-breakdown">
        <div className="wyr-breakdown-section">
          <div className="wyr-breakdown-label">
            Option A ({latestResult.votesA.length})
          </div>
          <div className="wyr-breakdown-voters">
            {votedForA.map((player) => (
              <div key={player!.id} className="wyr-voter-badge">
                <img src={`/avatars/${player!.avatarFilename}`} alt={player!.name} />
                <span>{player!.name}</span>
                {latestResult.majorityOption === 'A' && <span className="wyr-point-badge">+1</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="wyr-breakdown-section">
          <div className="wyr-breakdown-label">
            Option B ({latestResult.votesB.length})
          </div>
          <div className="wyr-breakdown-voters">
            {votedForB.map((player) => (
              <div key={player!.id} className="wyr-voter-badge">
                <img src={`/avatars/${player!.avatarFilename}`} alt={player!.name} />
                <span>{player!.name}</span>
                {latestResult.majorityOption === 'B' && <span className="wyr-point-badge">+1</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
