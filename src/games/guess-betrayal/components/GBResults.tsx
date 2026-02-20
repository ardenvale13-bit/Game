// Guess Betrayal - Results Phase Component
import useGuessBetrayalStore from '../guessBetrayalStore';

interface GBResultsProps {
  onLeave?: () => void;
}

export default function GBResults({ onLeave }: GBResultsProps) {
  const {
    players,
    currentPlayerId,
    currentRound,
    maxRounds,
    shuffledAnswers,
    currentQuestion,
  } = useGuessBetrayalStore();

  // Build reveal data: for each answer, show who wrote it and who guessed correctly
  const answerReveals = shuffledAnswers.map(answer => {
    const author = players.find(p => p.id === answer.playerId);
    const correctGuessers = players.filter(p => {
      if (p.id === answer.playerId) return false; // Can't guess yourself
      return p.guesses[answer.id] === answer.playerId;
    });
    const nobodyGuessed = correctGuessers.length === 0;

    return {
      ...answer,
      author,
      correctGuessers,
      nobodyGuessed,
    };
  });

  // Current player's correct guess count
  const currentPlayerData = players.find(p => p.id === currentPlayerId);
  const myCorrectGuesses = currentPlayerData
    ? Object.entries(currentPlayerData.guesses).filter(([answerId, guessedPlayerId]) => {
        const answer = shuffledAnswers.find(a => a.id === answerId);
        return answer && answer.playerId === guessedPlayerId;
      }).length
    : 0;

  // Did current player get betrayal bonus?
  const myAnswer = shuffledAnswers.find(a => a.playerId === currentPlayerId);
  const gotBetrayalBonus = myAnswer
    ? !players.some(p => {
        if (p.id === currentPlayerId) return false;
        return p.guesses[myAnswer.id] === currentPlayerId;
      })
    : false;

  return (
    <div className="gb-layout">
      {/* Header */}
      <div className="gb-header">
        <div className="gb-round">Round {currentRound} / {maxRounds}</div>
        <div className="gb-timer">Results</div>
        <div className="gb-status">Next round soon...</div>
      </div>

      {/* Question reminder */}
      <div className="gb-question-reminder">
        <span className="gb-question-reminder-label">Q:</span> {currentQuestion}
      </div>

      {/* Your score this round */}
      <div className="gb-round-score">
        <div className="gb-score-breakdown">
          <span className="gb-score-correct">🎯 {myCorrectGuesses} correct guess{myCorrectGuesses !== 1 ? 'es' : ''}</span>
          {gotBetrayalBonus && (
            <span className="gb-score-betrayal">🗡️ +2 Betrayal Bonus!</span>
          )}
        </div>
      </div>

      {/* Answer reveals */}
      <div className="gb-reveals">
        {answerReveals.map((reveal) => (
          <div key={reveal.id} className={`gb-reveal-card ${reveal.nobodyGuessed ? 'betrayal' : ''}`}>
            <div className="gb-reveal-answer">"{reveal.text}"</div>
            <div className="gb-reveal-author">
              <img
                src={`/avatars/${reveal.author?.avatarFilename}`}
                alt={reveal.author?.name}
                className="gb-mini-avatar"
              />
              <span className="gb-reveal-name">{reveal.author?.name}</span>
              {reveal.nobodyGuessed && (
                <span className="gb-betrayal-badge">🗡️ Betrayal!</span>
              )}
            </div>
            {reveal.correctGuessers.length > 0 && (
              <div className="gb-reveal-guessers">
                Guessed by: {reveal.correctGuessers.map(p => p.name).join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Leave button */}
      {onLeave && (
        <div className="gb-leave-container">
          <button className="btn btn-ghost btn-small" onClick={onLeave} style={{ opacity: 0.7 }}>
            ← Return to Lobby
          </button>
        </div>
      )}
    </div>
  );
}
