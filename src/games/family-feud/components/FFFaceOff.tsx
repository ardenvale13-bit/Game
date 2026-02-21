// fAImily Feud - Face-Off Component
// Two players race to type + buzz the correct answer
import { useState, useRef, useEffect } from 'react';
import useFamilyFeudStore from '../familyFeudStore';

interface FFFaceOffProps {
  currentPlayerId: string;
  isHost: boolean;
  onBuzz: (answer: string) => void;
  onBothBuzzed: () => void;
  onResolve: () => void;
}

export default function FFFaceOff({
  currentPlayerId,
  isHost,
  onBuzz,
  onBothBuzzed,
  onResolve,
}: FFFaceOffProps) {
  const {
    currentQuestion,
    faceOffPinkPlayerId,
    faceOffPurplePlayerId,
    faceOffBuzzes,
    faceOffWinner,
    faceOffLocked,
    players,
    pinkTeamName,
    purpleTeamName,
    currentRound,
    maxRounds,
    timeRemaining,
    pinkScore,
    purpleScore,
  } = useFamilyFeudStore();

  const [answer, setAnswer] = useState('');
  const [buzzed, setBuzzed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showDing, setShowDing] = useState(false);

  const pinkPlayer = players.find((p) => p.id === faceOffPinkPlayerId);
  const purplePlayer = players.find((p) => p.id === faceOffPurplePlayerId);
  const isParticipant =
    currentPlayerId === faceOffPinkPlayerId ||
    currentPlayerId === faceOffPurplePlayerId;
  const myTeam =
    currentPlayerId === faceOffPinkPlayerId
      ? 'pink'
      : currentPlayerId === faceOffPurplePlayerId
        ? 'purple'
        : null;

  // Auto-focus input if participant
  useEffect(() => {
    if (isParticipant && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isParticipant]);

  // Check if both have buzzed
  const pinkBuzzed = !!faceOffBuzzes[faceOffPinkPlayerId || ''];
  const purpleBuzzed = !!faceOffBuzzes[faceOffPurplePlayerId || ''];
  const bothBuzzed = pinkBuzzed && purpleBuzzed;

  // Auto-resolve when both buzzed (host)
  useEffect(() => {
    if (isHost && bothBuzzed && !faceOffWinner) {
      onBothBuzzed();
    }
  }, [bothBuzzed, isHost, faceOffWinner, onBothBuzzed]);

  const handleBuzz = () => {
    if (buzzed || !answer.trim()) return;
    setBuzzed(true);
    setShowDing(true);
    onBuzz(answer.trim());

    // Play ding sound
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.value = 0.3;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.stop(ctx.currentTime + 0.3);
    } catch {}

    setTimeout(() => setShowDing(false), 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBuzz();
    }
  };

  return (
    <div className="ff-face-off">
      {/* Scoreboard */}
      <div className="ff-scoreboard">
        <div className="ff-score-team ff-score-pink">
          <div className="ff-score-name">{pinkTeamName}</div>
          <div className="ff-score-value">{pinkScore}</div>
        </div>
        <div className="ff-round-badge">
          Round {currentRound}/{maxRounds}
        </div>
        <div className="ff-score-team ff-score-purple">
          <div className="ff-score-name">{purpleTeamName}</div>
          <div className="ff-score-value">{purpleScore}</div>
        </div>
      </div>

      {/* Question */}
      <div className="ff-question-card">
        <div className="ff-question-label">SURVEY SAYS...</div>
        <div className="ff-question-text">{currentQuestion?.question || '...'}</div>
        <div className="ff-timer">{timeRemaining}s</div>
      </div>

      {/* Face-off players */}
      <div className="ff-face-off-players">
        <div className={`ff-face-off-player ff-fo-pink ${pinkBuzzed ? 'buzzed' : ''}`}>
          <img
            src={pinkPlayer ? `/avatars/${pinkPlayer.avatarFilename}` : ''}
            alt=""
            className="ff-fo-avatar"
          />
          <div className="ff-fo-name">{pinkPlayer?.name || '?'}</div>
          {pinkBuzzed && (
            <div className="ff-fo-status ff-buzzed-indicator">BUZZED!</div>
          )}
        </div>

        <div className="ff-vs-badge">VS</div>

        <div className={`ff-face-off-player ff-fo-purple ${purpleBuzzed ? 'buzzed' : ''}`}>
          <img
            src={purplePlayer ? `/avatars/${purplePlayer.avatarFilename}` : ''}
            alt=""
            className="ff-fo-avatar"
          />
          <div className="ff-fo-name">{purplePlayer?.name || '?'}</div>
          {purpleBuzzed && (
            <div className="ff-fo-status ff-buzzed-indicator">BUZZED!</div>
          )}
        </div>
      </div>

      {/* Winner announcement */}
      {faceOffWinner && (
        <div className={`ff-winner-banner ff-winner-${faceOffWinner}`}>
          {faceOffWinner === 'pink' ? pinkTeamName : purpleTeamName} wins the face-off!
        </div>
      )}

      {/* Input area for participants */}
      {isParticipant && !buzzed && !faceOffWinner && (
        <div className="ff-buzz-area">
          <input
            ref={inputRef}
            className="ff-buzz-input"
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer..."
            maxLength={50}
          />
          <button
            className={`ff-buzz-btn ${myTeam === 'pink' ? 'ff-buzz-pink' : 'ff-buzz-purple'} ${showDing ? 'ff-ding' : ''}`}
            onClick={handleBuzz}
            disabled={!answer.trim()}
          >
            🔔 BUZZ
          </button>
        </div>
      )}

      {/* Spectator view */}
      {!isParticipant && !faceOffWinner && (
        <div className="ff-spectator-msg">
          Watching the face-off...
        </div>
      )}

      {/* Already buzzed */}
      {isParticipant && buzzed && !faceOffWinner && (
        <div className="ff-waiting-msg">
          Waiting for opponent...
        </div>
      )}
    </div>
  );
}
