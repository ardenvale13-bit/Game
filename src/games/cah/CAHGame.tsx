// Cards Against Humanity - Main Game Component
import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useCAHStore from './cahStore';
import CAHLobby from './components/CAHLobby';
import CAHPlaying from './components/CAHPlaying';
import CAHJudging from './components/CAHJudging';
import CAHReveal from './components/CAHReveal';
import CAHGameOver from './components/CAHGameOver';

export default function CAHGame() {
  const navigate = useNavigate();
  const { roomCode } = useParams();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const {
    phase,
    timeRemaining,
    decrementTime,
    nextRound,
    allPlayersSubmitted,
    players,
    currentPlayerId,
  } = useCAHStore();

  // Timer effect
  useEffect(() => {
    if (phase === 'playing' || phase === 'judging') {
      timerRef.current = setInterval(() => {
        decrementTime();
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [phase, decrementTime]);

  // Handle timer running out
  useEffect(() => {
    if (timeRemaining === 0) {
      if (phase === 'playing') {
        // Auto-submit for players who haven't
        const currentPlayer = players.find(p => p.id === currentPlayerId);
        if (currentPlayer && !currentPlayer.hasSubmitted && !currentPlayer.isCzar) {
          // Could auto-submit random cards here
        }
        // Move to judging if all submitted, otherwise force it
        if (!allPlayersSubmitted()) {
          // Force move to judging with whoever submitted
        }
      }
    }
  }, [timeRemaining, phase]);

  // Handle reveal -> next round transition
  useEffect(() => {
    if (phase === 'reveal') {
      const timeout = setTimeout(() => {
        nextRound();
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [phase, nextRound]);

  const handleLeave = () => {
    navigate('/');
  };

  // Render based on phase
  switch (phase) {
    case 'lobby':
      return <CAHLobby />;
    case 'playing':
      return <CAHPlaying />;
    case 'judging':
      return <CAHJudging />;
    case 'reveal':
      return <CAHReveal />;
    case 'game-over':
      return <CAHGameOver onPlayAgain={() => navigate(`/cah/lobby/${roomCode}`)} onLeave={handleLeave} />;
    default:
      return <CAHLobby />;
  }
}
