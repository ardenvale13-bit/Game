// fAImily Feud - Board Play Component
// Team guesses answers on the board, 3 strikes = steal
import { useState, useRef, useEffect } from 'react';
import useFamilyFeudStore from '../familyFeudStore';

interface FFBoardPlayProps {
  currentPlayerId: string;
  isHost: boolean;
  onGuess: (answer: string) => void;
  onAwardPoints: () => void;
}

export default function FFBoardPlay({
  currentPlayerId,
  isHost,
  onGuess,
  onAwardPoints,
}: FFBoardPlayProps) {
  const {
    currentQuestion,
    boardAnswers,
    controllingTeam,
    strikes,
    currentTurnPlayerId,
    lastGuess,
    lastGuessResult,
    players,
    pinkTeamName,
    purpleTeamName,
    pinkScore,
    purpleScore,
    currentRound,
    maxRounds,
    timeRemaining,
  } = useFamilyFeudStore();

  const [guess, setGuess] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [showStrikeAnim, setShowStrikeAnim] = useState(false);
  const [showCorrectAnim, setShowCorrectAnim] = useState(false);
  const prevStrikesRef = useRef(strikes);
  const prevRevealedRef = useRef(boardAnswers.filter((a) => a.revealed).length);

  const isMyTurn = currentPlayerId === currentTurnPlayerId;
  const currentPlayer = players.find((p) => p.id === currentTurnPlayerId);
  const allRevealed = boardAnswers.every((a) => a.revealed);

  // Strike animation
  useEffect(() => {
    if (strikes > prevStrikesRef.current) {
      setShowStrikeAnim(true);
      setTimeout(() => setShowStrikeAnim(false), 800);
    }
    prevStrikesRef.current = strikes;
  }, [strikes]);

  // Correct answer animation
  useEffect(() => {
    const revealed = boardAnswers.filter((a) => a.revealed).length;
    if (revealed > prevRevealedRef.current) {
      setShowCorrectAnim(true);
      setTimeout(() => setShowCorrectAnim(false), 600);
    }
    prevRevealedRef.current = revealed;
  }, [boardAnswers]);

  // Auto-award if board cleared (host)
  useEffect(() => {
    if (isHost && allRevealed) {
      setTimeout(() => onAwardPoints(), 1500);
    }
  }, [allRevealed, isHost, onAwardPoints]);

  // Focus input when it's my turn
  useEffect(() => {
    if (isMyTurn && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMyTurn, currentTurnPlayerId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || !isMyTurn) return;
    onGuess(guess.trim());
    setGuess('');
  };

  return (
    <div className="ff-board-play">
      {/* Scoreboard */}
      <div className="ff-scoreboard">
        <div className={`ff-score-team ff-score-pink ${controllingTeam === 'pink' ? 'ff-controlling' : ''}`}>
          <div className="ff-score-name">{pinkTeamName}</div>
          <div className="ff-score-value">{pinkScore}</div>
        </div>
        <div className="ff-round-badge">
          Round {currentRound}/{maxRounds}
        </div>
        <div className={`ff-score-team ff-score-purple ${controllingTeam === 'purple' ? 'ff-controlling' : ''}`}>
          <div className="ff-score-name">{purpleTeamName}</div>
          <div className="ff-score-value">{purpleScore}</div>
        </div>
      </div>

      {/* Question */}
      <div className="ff-question-card">
        <div className="ff-question-text">{currentQuestion?.question || '...'}</div>
      </div>

      {/* Board */}
      <div className="ff-board">
        {boardAnswers.map((answer, i) => (
          <div
            key={i}
            className={`ff-board-answer ${answer.revealed ? 'ff-revealed' : 'ff-hidden'} ${
              answer.revealed && showCorrectAnim && i === boardAnswers.findIndex((a, idx) => a.revealed && idx >= prevRevealedRef.current - 1)
                ? 'ff-flip'
                : ''
            }`}
          >
            <div className="ff-answer-rank">{i + 1}</div>
            <div className="ff-answer-text">
              {answer.revealed ? answer.text : '???'}
            </div>
            <div className="ff-answer-points">
              {answer.revealed ? answer.points : ''}
            </div>
          </div>
        ))}
      </div>

      {/* Strikes */}
      <div className={`ff-strikes ${showStrikeAnim ? 'ff-strike-flash' : ''}`}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`ff-strike-x ${i < strikes ? 'ff-struck' : ''}`}
          >
            ✕
          </div>
        ))}
      </div>

      {/* Turn indicator */}
      <div className="ff-turn-indicator">
        {currentPlayer && (
          <>
            <img
              src={`/avatars/${currentPlayer.avatarFilename}`}
              alt=""
              className="ff-turn-avatar"
            />
            <span>
              {isMyTurn ? 'Your turn!' : `${currentPlayer.name}'s turn`}
            </span>
            <span className="ff-turn-timer">{timeRemaining}s</span>
          </>
        )}
      </div>

      {/* Last guess feedback */}
      {lastGuess && (
        <div className={`ff-last-guess ${lastGuessResult === 'correct' ? 'ff-guess-correct' : 'ff-guess-wrong'}`}>
          "{lastGuess}" — {lastGuessResult === 'correct' ? '✓ Correct!' : '✕ Not on the board'}
        </div>
      )}

      {/* Input area */}
      {isMyTurn && (
        <form className="ff-guess-form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            className="ff-guess-input"
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Type your answer..."
            maxLength={50}
          />
          <button
            className="ff-guess-btn"
            type="submit"
            disabled={!guess.trim()}
          >
            Submit
          </button>
        </form>
      )}

      {!isMyTurn && (
        <div className="ff-spectator-msg">
          Waiting for {currentPlayer?.name || 'player'} to guess...
        </div>
      )}
    </div>
  );
}
