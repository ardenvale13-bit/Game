// Guess Who - Questioning Phase (Main gameplay)
import { useState, useRef, useEffect } from 'react';
import useGuesswhoStore from '../guesswhoStore';

interface GWQuestioningProps {
  currentPlayerId: string;
  onAskQuestion: (question: string) => void;
  onAnswerQuestion: (answer: 'yes' | 'no') => void;
  onMakeGuess: (charId: string) => void;
}

export default function GWQuestioning({
  currentPlayerId,
  onAskQuestion,
  onAnswerQuestion,
  onMakeGuess,
}: GWQuestioningProps) {
  const {
    characters,
    chooserIndex,
    players,
    eliminatedCharIds,
    questions,
    currentQuestion,
    currentAsker,
    timeRemaining,
    currentRound,
    maxRounds,
  } = useGuesswhoStore();

  const [questionInput, setQuestionInput] = useState('');
  const [showGuessView, setShowGuessView] = useState(false);
  const questionListRef = useRef<HTMLDivElement>(null);

  const chooser = players[chooserIndex];
  const isChooser = currentPlayerId === chooser?.id;
  const currentAskerObj = players.find(p => p.id === currentAsker);

  // Auto-scroll questions to bottom
  useEffect(() => {
    if (questionListRef.current) {
      setTimeout(() => {
        questionListRef.current?.scrollTo({
          top: questionListRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 100);
    }
  }, [questions]);

  const handleSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (questionInput.trim() && !currentQuestion) {
      onAskQuestion(questionInput.trim());
      setQuestionInput('');
    }
  };

  const timerClass =
    timeRemaining <= 5
      ? 'danger'
      : timeRemaining <= 15
        ? 'warning'
        : '';

  const remainingCharacters = characters.filter(c => !eliminatedCharIds.includes(c.id));

  return (
    <div className="gw-layout">
      {/* Header */}
      <div className="gw-header">
        <span className="gw-round-badge">
          Round {currentRound} / {maxRounds}
        </span>
        <span className={`gw-timer ${timerClass}`}>
          {timeRemaining}s
        </span>
      </div>

      {/* Top section: Character board OR Guess mode */}
      {!showGuessView ? (
        <>
          {/* Character Grid */}
          <div className="gw-board-title">
            Characters: {remainingCharacters.length} / {characters.length}
          </div>
          <div className="gw-character-grid">
            {characters.map((char) => {
              const isEliminated = eliminatedCharIds.includes(char.id);
              return (
                <button
                  key={char.id}
                  className={`gw-char-card ${isEliminated ? 'eliminated' : ''}`}
                  onClick={() => {
                    useGuesswhoStore.getState().eliminateCharacter(char.id);
                  }}
                >
                  <div className={`gw-char-image ${isEliminated ? 'grayed' : ''}`}>
                    <img src={char.imagePath} alt={char.name} />
                  </div>
                  <div className="gw-char-name">{char.name}</div>
                </button>
              );
            })}
          </div>

          {/* Switch to Guess button */}
          {!isChooser && (
            <button
              className="btn btn-primary btn-large w-full"
              onClick={() => setShowGuessView(true)}
              style={{ marginTop: '12px' }}
            >
              Make a Guess
            </button>
          )}
        </>
      ) : (
        <>
          {/* Guess View */}
          <div className="gw-board-title">Who are they?</div>
          <div className="gw-character-grid">
            {remainingCharacters.map((char) => (
              <button
                key={char.id}
                className="gw-char-card gw-guess-card"
                onClick={() => {
                  onMakeGuess(char.id);
                  setShowGuessView(false);
                }}
              >
                <div className="gw-char-image">
                  <img src={char.imagePath} alt={char.name} />
                </div>
                <div className="gw-char-name">{char.name}</div>
              </button>
            ))}
          </div>

          {/* Back to board button */}
          <button
            className="btn btn-secondary btn-large w-full"
            onClick={() => setShowGuessView(false)}
            style={{ marginTop: '12px' }}
          >
            Back to Board
          </button>
        </>
      )}

      {/* Question section */}
      <div className="gw-question-section">
        <div className="gw-question-header">Questions</div>

        {/* Question list */}
        <div className="gw-question-list" ref={questionListRef}>
          {questions.length === 0 ? (
            <div className="text-muted" style={{ padding: '12px', textAlign: 'center', fontSize: '0.9rem' }}>
              No questions yet
            </div>
          ) : (
            questions.map((q, idx) => (
              <div key={idx} className="gw-question-item">
                <div className="gw-question-asker">{q.askerName}:</div>
                <div className="gw-question-text">{q.question}</div>
                {q.answer ? (
                  <div className={`gw-question-answer ${q.answer}`}>
                    {q.answer.toUpperCase()}
                  </div>
                ) : (
                  <div className="gw-question-answer waiting">Waiting...</div>
                )}
              </div>
            ))
          )}

          {/* Current pending question */}
          {currentQuestion && (
            <div className="gw-question-item gw-question-current">
              <div className="gw-question-asker">{currentAskerObj?.name || 'Player'}:</div>
              <div className="gw-question-text">{currentQuestion}</div>
              {isChooser ? (
                <div className="gw-question-answer-buttons">
                  <button
                    className="btn btn-success"
                    onClick={() => onAnswerQuestion('yes')}
                  >
                    YES
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => onAnswerQuestion('no')}
                  >
                    NO
                  </button>
                </div>
              ) : (
                <div className="gw-question-answer waiting">Waiting for {chooser?.name}'s answer...</div>
              )}
            </div>
          )}
        </div>

        {/* Question input (for non-choosers only) */}
        {!isChooser && !currentQuestion && !showGuessView && (
          <form onSubmit={handleSubmitQuestion} className="gw-question-input-form">
            <input
              type="text"
              value={questionInput}
              onChange={(e) => setQuestionInput(e.target.value)}
              placeholder="Ask a yes/no question..."
              maxLength={100}
              className="gw-question-input"
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!questionInput.trim()}
            >
              Ask
            </button>
          </form>
        )}
      </div>

      {/* Eliminated players indicator */}
      {players.some(p => p.eliminated) && (
        <div className="gw-eliminated-players">
          <div className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '6px' }}>
            Out:
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {players
              .filter(p => p.eliminated)
              .map(p => (
                <div
                  key={p.id}
                  className="gw-eliminated-badge"
                  title={p.name}
                >
                  {p.name}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
