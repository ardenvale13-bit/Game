// Game Router - Routes to the correct game based on URL
import { useParams, Navigate } from 'react-router-dom';
import useLobbyStore from '../store/lobbyStore';

// Game components
import PictionaryGame from './PictionaryGame';
import CAHGameWrapper from '../games/cah/CAHGameWrapper';
import CodenamesGameWrapper from '../games/codenames/CodenamesGameWrapper';
import WMLTGameWrapper from '../games/wmlt/WMLTGameWrapper';

export default function GameRouter() {
  const { game, roomCode } = useParams();
  const { isInGame } = useLobbyStore();

  // If not in a game, redirect to lobby
  if (!isInGame) {
    return <Navigate to={`/lobby/${roomCode}`} replace />;
  }

  // Route to the correct game
  switch (game) {
    case 'pictionary':
      return <PictionaryGame />;
    case 'cah':
      return <CAHGameWrapper />;
    case 'codenames':
      return <CodenamesGameWrapper />;
    case 'wmlt':
      return <WMLTGameWrapper />;
    default:
      return <Navigate to={`/lobby/${roomCode}`} replace />;
  }
}
