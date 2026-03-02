// Game Router - Routes to the correct game based on URL
import { useParams, Navigate } from 'react-router-dom';
import useLobbyStore from '../store/lobbyStore';

// Game components
import PictionaryGame from './PictionaryGame';
import CAHGameWrapper from '../games/cah/CAHGameWrapper';
import CodenamesGameWrapper from '../games/codenames/CodenamesGameWrapper';
import WMLTGameWrapper from '../games/wmlt/WMLTGameWrapper';
import WYRGameWrapper from '../games/wyr/WYRGameWrapper';
import HangmanGameWrapper from '../games/hangman/HangmanGameWrapper';

import GuessBetrayalGameWrapper from '../games/guess-betrayal/GuessBetrayalGameWrapper';
import MakeItMemeGameWrapper from '../games/meme/MakeItMemeGameWrapper';
import FamilyFeudGameWrapper from '../games/family-feud/FamilyFeudGameWrapper';
import GuesswhoGameWrapper from '../games/guesswho/GuesswhoGameWrapper';
import UnoGameWrapper from '../games/uno/UnoGameWrapper';

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
    case 'wyr':
      return <WYRGameWrapper />;
    case 'hangman':
      return <HangmanGameWrapper />;

    case 'guess-betrayal':
      return <GuessBetrayalGameWrapper />;
    case 'meme':
      return <MakeItMemeGameWrapper />;
    case 'familyfeud':
      return <FamilyFeudGameWrapper />;
    case 'guesswho':
      return <GuesswhoGameWrapper />;
    case 'uno':
      return <UnoGameWrapper />;
    default:
      return <Navigate to={`/lobby/${roomCode}`} replace />;
  }
}
