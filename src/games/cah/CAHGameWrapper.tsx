// CAH Game Wrapper - Integrates with unified lobby
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useLobbyStore from '../../store/lobbyStore';
import useCAHStore from './cahStore';
import CAHPlaying from './components/CAHPlaying';
import CAHJudging from './components/CAHJudging';
import CAHReveal from './components/CAHReveal';
import CAHGameOver from './components/CAHGameOver';

export default function CAHGameWrapper() {
  const navigate = useNavigate();
  const { roomCode } = useParams();
  
  const lobbyPlayers = useLobbyStore((state) => state.players);
  const endLobbyGame = useLobbyStore((state) => state.endGame);
  
  const {
    phase,
    players: cahPlayers,
    addPlayer,
    startGame,
    resetGame,
  } = useCAHStore();

  // Initialize CAH game with lobby players on mount
  useEffect(() => {
    if (phase === 'lobby' && lobbyPlayers.length > 0 && cahPlayers.length === 0) {
      // Add all lobby players to CAH
      lobbyPlayers.forEach((p) => {
        addPlayer({
          id: p.id,
          name: p.name,
          avatarId: p.avatarId,
          avatarFilename: p.avatarFilename,
          isHost: p.isHost,
        });
      });
    }
  }, [lobbyPlayers, phase, cahPlayers.length, addPlayer]);

  // Auto-start game once players are added
  useEffect(() => {
    if (phase === 'lobby' && cahPlayers.length >= 3) {
      startGame();
    }
  }, [phase, cahPlayers.length, startGame]);

  const handlePlayAgain = () => {
    resetGame();
    endLobbyGame();
    navigate(`/lobby/${roomCode}`);
  };

  const handleLeave = () => {
    resetGame();
    endLobbyGame();
    navigate(`/lobby/${roomCode}`);
  };

  // Render based on phase
  switch (phase) {
    case 'lobby':
      return (
        <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
          <div className="spinner" />
          <span className="ml-2">Starting game...</span>
        </div>
      );
    case 'playing':
      return <CAHPlaying />;
    case 'judging':
      return <CAHJudging />;
    case 'reveal':
      return <CAHReveal />;
    case 'game-over':
      return <CAHGameOver onPlayAgain={handlePlayAgain} onLeave={handleLeave} />;
    default:
      return <CAHPlaying />;
  }
}
