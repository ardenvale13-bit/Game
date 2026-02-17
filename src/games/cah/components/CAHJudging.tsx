// CAH Judging Component - Czar picks the winner
import useCAHStore from '../cahStore';

export default function CAHJudging() {
  const {
    currentBlackCard,
    currentRound,
    maxRounds,
    timeRemaining,
    submissions,
    selectWinner,
    isCurrentPlayerCzar,
    getCurrentCzar,
  } = useCAHStore();

  const czar = getCurrentCzar();
  const isCzar = isCurrentPlayerCzar();

  // Format black card text with answers filled in
  const formatBlackCardWithAnswers = (text: string, answers: string[]) => {
    const parts = text.split('_');
    return parts.map((part, idx) => (
      <span key={idx}>
        {part}
        {idx < parts.length - 1 && answers[idx] && (
          <span className="cah-filled-answer">
            {answers[idx]}
          </span>
        )}
      </span>
    ));
  };

  const handleSelectWinner = (playerId: string) => {
    if (isCzar) {
      selectWinner(playerId);
    }
  };

  return (
    <div className="cah-layout">
      {/* Header */}
      <div className="cah-header">
        <div className="cah-round">Round {currentRound} / {maxRounds}</div>
        <div className="cah-timer" style={{ color: timeRemaining <= 10 ? 'var(--accent-secondary)' : 'var(--text-primary)' }}>
          {timeRemaining}s
        </div>
        <div className="cah-status">
          {isCzar ? 'Pick your favorite!' : `${czar?.name} is judging...`}
        </div>
      </div>

      {/* Black Card */}
      <div className="cah-black-card-container">
        <div className="cah-black-card small">
          <div className="cah-card-text" style={{ fontSize: '1rem' }}>
            {currentBlackCard?.text}
          </div>
        </div>
      </div>

      {/* Submissions */}
      <div className="cah-submissions">
        {submissions.map((submission, idx) => (
          <div
            key={idx}
            className={`cah-submission ${isCzar ? 'clickable' : ''}`}
            onClick={() => isCzar && handleSelectWinner(submission.playerId)}
          >
            <div className="cah-submission-cards">
              {submission.cards.map((card) => (
                <div key={card.id} className="cah-white-card in-submission">
                  <div className="cah-card-text">{card.text}</div>
                </div>
              ))}
            </div>
            
            {/* Show as filled sentence */}
            <div className="cah-filled-sentence">
              {formatBlackCardWithAnswers(
                currentBlackCard?.text || '',
                submission.cards.map(c => c.text)
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Czar prompt */}
      {isCzar && (
        <div className="cah-czar-prompt">
          <span>👑 Tap on your favorite to pick the winner!</span>
        </div>
      )}

      {/* Non-czar waiting */}
      {!isCzar && (
        <div className="cah-waiting-text">
          Waiting for {czar?.name} to pick...
        </div>
      )}
    </div>
  );
}
