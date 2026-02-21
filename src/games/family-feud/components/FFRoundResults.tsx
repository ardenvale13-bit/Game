// fAImily Feud - Round Results Component
import useFamilyFeudStore from '../familyFeudStore';

interface FFRoundResultsProps {
  isHost: boolean;
  onNextRound: () => void;
}

export default function FFRoundResults({ isHost, onNextRound }: FFRoundResultsProps) {
  const {
    currentQuestion,
    boardAnswers,
    roundPoints,
    roundWinnerTeam,
    pinkTeamName,
    purpleTeamName,
    pinkScore,
    purpleScore,
    currentRound,
    maxRounds,
    timeRemaining,
  } = useFamilyFeudStore();

  const winnerName = roundWinnerTeam === 'pink' ? pinkTeamName : purpleTeamName;

  return (
    <div className="ff-round-results">
      {/* Scoreboard */}
      <div className="ff-scoreboard">
        <div className={`ff-score-team ff-score-pink ${roundWinnerTeam === 'pink' ? 'ff-winner-glow' : ''}`}>
          <div className="ff-score-name">{pinkTeamName}</div>
          <div className="ff-score-value">{pinkScore}</div>
        </div>
        <div className="ff-round-badge">
          Round {currentRound}/{maxRounds}
        </div>
        <div className={`ff-score-team ff-score-purple ${roundWinnerTeam === 'purple' ? 'ff-winner-glow' : ''}`}>
          <div className="ff-score-name">{purpleTeamName}</div>
          <div className="ff-score-value">{purpleScore}</div>
        </div>
      </div>

      {/* Winner banner */}
      <div className={`ff-results-banner ff-results-${roundWinnerTeam}`}>
        <div className="ff-results-points">+{roundPoints} pts</div>
        <div className="ff-results-winner">{winnerName} wins the round!</div>
      </div>

      {/* Full board reveal */}
      <div className="ff-question-card">
        <div className="ff-question-text">{currentQuestion?.question || '...'}</div>
      </div>

      <div className="ff-board ff-board-revealed">
        {boardAnswers.map((answer, i) => (
          <div key={i} className="ff-board-answer ff-revealed">
            <div className="ff-answer-rank">{i + 1}</div>
            <div className="ff-answer-text">{answer.text}</div>
            <div className="ff-answer-points">{answer.points}</div>
          </div>
        ))}
      </div>

      {/* Timer / next round */}
      <div className="ff-results-footer">
        {isHost ? (
          <button className="ff-next-btn" onClick={onNextRound}>
            {currentRound >= maxRounds ? 'See Final Results' : 'Next Round'}
          </button>
        ) : (
          <div className="ff-waiting-msg">
            Next round in {timeRemaining}s...
          </div>
        )}
      </div>
    </div>
  );
}
