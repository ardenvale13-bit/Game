// Guess Betrayal - Game Wrapper
import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useLobbyStore from '../../store/lobbyStore';
import useGuessBetrayalStore, { genId } from './guessBetrayalStore';
import type { GBAnswer } from './guessBetrayalStore';
import { useGuessBetrayalSync } from '../../hooks/useGuessBetrayalSync';
import GBAnswering from './components/GBAnswering';
import GBGuessing from './components/GBGuessing';
import GBResults from './components/GBResults';
import GBGameOver from './components/GBGameOver';

export default function GuessBetrayalGameWrapper() {
  const navigate = useNavigate();
  const { roomCode } = useParams();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerSyncRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialized = useRef(false);
  const gameStarted = useRef(false);
  const prevPhaseRef = useRef<string | null>(null);
  const lastBroadcastRound = useRef(0);

  const lobbyPlayers = useLobbyStore((s) => s.players);
  const endLobbyGame = useLobbyStore((s) => s.endGame);

  const {
    phase,
    players: gbPlayers,
    currentPlayerId,
    currentRound,
    addPlayer,
    setCurrentPlayer,
    setRoomCode,
    setCategory,
    setMaxRounds,
    startGame,
    submitAnswer,
    submitGuesses,
    calculateResults,
    nextRound,
    decrementTime,
    resetGame,
  } = useGuessBetrayalStore();

  const currentPlayer = gbPlayers.find(p => p.id === currentPlayerId);
  const isHost = currentPlayer?.isHost ?? false;

  const {
    isReady,
    broadcastRoundStart,
    broadcastPhaseChange,
    broadcastTimerSync,
    broadcastAnswerCount,
    broadcastResults,
    broadcastGameOver,
    broadcastSubmitAnswer,
    broadcastSubmitGuesses,
  } = useGuessBetrayalSync({
    roomCode: roomCode || null,
    playerId: currentPlayerId,
    isHost,
  });

  // Initialize with lobby players
  useEffect(() => {
    if (!initialized.current && lobbyPlayers.length > 0 && gbPlayers.length === 0) {
      initialized.current = true;
      if (roomCode) setRoomCode(roomCode);

      const currentLobbyPlayer = useLobbyStore.getState().currentPlayerId;
      if (currentLobbyPlayer) setCurrentPlayer(currentLobbyPlayer);

      // Read category from lobby store (stored in a custom field or default)
      const lobbyState = useLobbyStore.getState();
      const rc = lobbyState.roundCount;
      if (rc && [5, 8, 10, 12, 15].includes(rc)) {
        setMaxRounds(rc);
      }
      const cat = lobbyState.gbCategory;
      if (cat) setCategory(cat as import('./questionData').QuestionCategory);

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
  }, [lobbyPlayers, gbPlayers.length, roomCode, setRoomCode, setCurrentPlayer, addPlayer, setMaxRounds, setCategory]);

  // HOST: start game after sync ready
  useEffect(() => {
    if (isHost && isReady && !gameStarted.current && gbPlayers.length >= 4 && phase === 'lobby') {
      gameStarted.current = true;
      startGame();
    }
  }, [isHost, isReady, gbPlayers.length, phase, startGame]);

  // HOST: broadcast round start when entering 'answering' with new round
  useEffect(() => {
    if (!isHost) return;
    const state = useGuessBetrayalStore.getState();
    if (phase === 'answering' && state.currentRound > lastBroadcastRound.current) {
      lastBroadcastRound.current = state.currentRound;
      const t = setTimeout(() => broadcastRoundStart(), 100);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isHost, currentRound]);

  // HOST: when all answers are in, transition to guessing
  useEffect(() => {
    if (!isHost || phase !== 'answering') return;
    const state = useGuessBetrayalStore.getState();
    if (state.allPlayersAnswered() && state.players.length >= 4) {
      // Shuffle answers for guessing phase
      const answers: GBAnswer[] = state.players
        .filter(p => p.answer.trim())
        .map(p => ({
          id: genId(),
          text: p.answer,
          playerId: p.id,
        }))
        .sort(() => Math.random() - 0.5);

      useGuessBetrayalStore.setState({
        shuffledAnswers: answers,
        phase: 'guessing',
        timeRemaining: state.guessTime,
      });

      setTimeout(() => {
        broadcastPhaseChange('guessing', state.guessTime, answers);
      }, 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gbPlayers, phase, isHost]);

  // HOST: when all guesses are in, calculate results
  useEffect(() => {
    if (!isHost || phase !== 'guessing') return;
    const state = useGuessBetrayalStore.getState();
    if (state.allPlayersGuessed()) {
      calculateResults();
      setTimeout(() => broadcastResults(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gbPlayers, phase, isHost]);

  // HOST: broadcast phase changes
  useEffect(() => {
    if (!isHost) return;
    if (phase === 'game-over' && prevPhaseRef.current !== 'game-over') {
      broadcastGameOver();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isHost]);

  // HOST: auto-advance from results after 10 seconds
  useEffect(() => {
    if (!isHost || phase !== 'results') return;
    const t = setTimeout(() => {
      const state = useGuessBetrayalStore.getState();
      if (state.currentRound >= state.maxRounds) {
        useGuessBetrayalStore.setState({ phase: 'game-over' });
        broadcastGameOver();
      } else {
        nextRound();
      }
    }, 10000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isHost]);

  // HOST: run timer
  useEffect(() => {
    if (!isHost) return;
    if (phase === 'answering' || phase === 'guessing') {
      timerRef.current = setInterval(() => {
        const state = useGuessBetrayalStore.getState();
        if (state.timeRemaining <= 1) {
          if (state.phase === 'answering') {
            // Force submit empty answers for players who didn't answer
            const updatedPlayers = state.players.map(p =>
              p.hasAnswered ? p : { ...p, answer: '(no answer)', hasAnswered: true }
            );
            useGuessBetrayalStore.setState({ players: updatedPlayers });
          } else if (state.phase === 'guessing') {
            // Force submit empty guesses for players who didn't guess
            const updatedPlayers = state.players.map(p =>
              p.hasGuessed ? p : { ...p, hasGuessed: true }
            );
            useGuessBetrayalStore.setState({ players: updatedPlayers });
          }
          return;
        }
        decrementTime();
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isHost]);

  // HOST: sync timer every 2s
  useEffect(() => {
    if (!isHost || (phase !== 'answering' && phase !== 'guessing')) {
      if (timerSyncRef.current) clearInterval(timerSyncRef.current);
      return;
    }
    timerSyncRef.current = setInterval(() => broadcastTimerSync(), 2000);
    return () => {
      if (timerSyncRef.current) clearInterval(timerSyncRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, phase]);

  // HOST: broadcast answer count when it changes
  useEffect(() => {
    if (!isHost || phase !== 'answering') return;
    broadcastAnswerCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gbPlayers.filter(p => p.hasAnswered).length, isHost, phase]);

  // Track previous phase
  useEffect(() => {
    prevPhaseRef.current = phase;
  }, [phase]);

  // --- Handlers ---
  const handleSubmitAnswer = (answer: string) => {
    if (isHost) {
      submitAnswer(currentPlayerId!, answer);
    } else {
      broadcastSubmitAnswer(answer);
      // Optimistic local update
      useGuessBetrayalStore.setState((state) => ({
        players: state.players.map(p =>
          p.id === currentPlayerId ? { ...p, answer, hasAnswered: true } : p
        ),
      }));
    }
  };

  const handleSubmitGuesses = (guesses: Record<string, string>) => {
    if (isHost) {
      submitGuesses(currentPlayerId!, guesses);
    } else {
      broadcastSubmitGuesses(guesses);
      useGuessBetrayalStore.setState((state) => ({
        players: state.players.map(p =>
          p.id === currentPlayerId ? { ...p, guesses, hasGuessed: true } : p
        ),
      }));
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

  switch (phase) {
    case 'lobby':
      return (
        <div className="gb-loading">
          <div className="spinner" />
          <span>Starting game...</span>
        </div>
      );
    case 'answering':
      return (
        <GBAnswering
          onSubmitAnswer={handleSubmitAnswer}
          onLeave={handleLeave}
        />
      );
    case 'guessing':
      return (
        <GBGuessing
          onSubmitGuesses={handleSubmitGuesses}
          onLeave={handleLeave}
        />
      );
    case 'results':
      return <GBResults onLeave={handleLeave} />;
    case 'game-over':
      return <GBGameOver onPlayAgain={handlePlayAgain} onLeave={handleLeave} />;
    default:
      return (
        <div className="gb-loading">
          <div className="spinner" />
          <span>Loading...</span>
        </div>
      );
  }
}
