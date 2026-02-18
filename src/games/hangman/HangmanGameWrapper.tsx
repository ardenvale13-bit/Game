// Hangman Game Wrapper - Integrates with unified lobby + multiplayer sync
import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useLobbyStore from '../../store/lobbyStore';
import useHangmanStore from './hangmanStore';
import { useHangmanSync } from '../../hooks/useHangmanSync';
import HangmanPicking from './components/HangmanPicking';
import HangmanGuessing from './components/HangmanGuessing';
import HangmanRoundEnd from './components/HangmanRoundEnd';
import HangmanGameOver from './components/HangmanGameOver';

export default function HangmanGameWrapper() {
  const navigate = useNavigate();
  const { roomCode } = useParams();
  const initialized = useRef(false);
  const gameStarted = useRef(false);
  const prevPhaseRef = useRef<string | null>(null);

  const lobbyPlayers = useLobbyStore((state) => state.players);
  const endLobbyGame = useLobbyStore((state) => state.endGame);

  const {
    phase,
    players: hmPlayers,
    currentPlayerId,
    addPlayer,
    setCurrentPlayer,
    setRoomCode,
    startGame,
    nextRound,
    resetGame,
  } = useHangmanStore();

  const currentPlayer = hmPlayers.find((p) => p.id === currentPlayerId);
  const isHost = currentPlayer?.isHost ?? false;

  // --- Multiplayer sync ---
  const {
    isReady,
    broadcastGameState,
    broadcastSetWord,
    broadcastGuessLetter,
    broadcastRoundEnd,
    broadcastGameOver,
  } = useHangmanSync({
    roomCode: roomCode || null,
    playerId: currentPlayerId,
    isHost,
  });

  // Initialize Hangman game with lobby players (ALL clients)
  useEffect(() => {
    if (!initialized.current && lobbyPlayers.length > 0 && hmPlayers.length === 0) {
      initialized.current = true;

      if (roomCode) setRoomCode(roomCode);

      const currentLobbyPlayer = useLobbyStore.getState().currentPlayerId;
      if (currentLobbyPlayer) setCurrentPlayer(currentLobbyPlayer);

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
  }, [lobbyPlayers, hmPlayers.length, roomCode, setRoomCode, setCurrentPlayer, addPlayer]);

  // HOST: start game only AFTER the sync channel is confirmed connected
  useEffect(() => {
    if (isHost && isReady && !gameStarted.current && hmPlayers.length >= 2 && phase === 'lobby') {
      gameStarted.current = true;
      startGame();
    }
  }, [isHost, isReady, hmPlayers.length, phase, startGame]);

  // HOST: broadcast game state when phase changes to picking
  useEffect(() => {
    if (!isHost) return;

    if (phase === 'picking' && prevPhaseRef.current !== 'picking') {
      const t = setTimeout(() => {
        broadcastGameState();
      }, 100);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isHost]);

  // HOST: broadcast when won or lost
  useEffect(() => {
    if (!isHost) return;

    if ((phase === 'won' || phase === 'lost') && (prevPhaseRef.current === 'guessing')) {
      const t = setTimeout(() => {
        const state = useHangmanStore.getState();
        broadcastRoundEnd(phase, state.winner || '');
      }, 100);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isHost]);

  // HOST: auto-advance after win/loss (5 second delay like CAH)
  useEffect(() => {
    if (!isHost || (phase !== 'won' && phase !== 'lost')) return;

    const t = setTimeout(() => {
      const state = useHangmanStore.getState();
      if (state.currentRound >= state.maxRounds) {
        useHangmanStore.setState({ phase: 'game-over' });
        broadcastGameOver();
      } else {
        nextRound();
        setTimeout(() => {
          broadcastGameState();
        }, 200);
      }
    }, 5000);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isHost]);

  // HOST: broadcast game over
  useEffect(() => {
    if (!isHost || phase !== 'game-over') return;
    if (prevPhaseRef.current !== 'game-over') {
      broadcastGameOver();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isHost]);

  // IMPORTANT: Track previous phase LAST
  useEffect(() => {
    prevPhaseRef.current = phase;
  }, [phase]);

  // --- Handlers for child components ---

  const handleSetWord = (word: string, category: string) => {
    if (isHost) {
      useHangmanStore.getState().setWord(word, category);
    } else {
      broadcastSetWord(word, category);
      useHangmanStore.getState().setWord(word, category);
    }
  };

  const handleGuessLetter = (letter: string) => {
    if (isHost) {
      useHangmanStore.getState().guessLetter(letter, currentPlayerId!);
    } else {
      broadcastGuessLetter(letter);
      useHangmanStore.getState().guessLetter(letter, currentPlayerId!);
    }
  };

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
    case 'picking':
      return (
        <HangmanPicking
          onSetWord={handleSetWord}
        />
      );
    case 'guessing':
      return (
        <HangmanGuessing
          onGuessLetter={handleGuessLetter}
        />
      );
    case 'won':
    case 'lost':
      return <HangmanRoundEnd />;
    case 'game-over':
      return (
        <HangmanGameOver
          onPlayAgain={handlePlayAgain}
          onLeave={handleLeave}
        />
      );
    default:
      return (
        <HangmanPicking
          onSetWord={handleSetWord}
        />
      );
  }
}
