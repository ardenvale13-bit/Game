// CAH Game Wrapper - Integrates with unified lobby + multiplayer sync
import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useLobbyStore from '../../store/lobbyStore';
import useCAHStore from './cahStore';
import { useCAHSync } from '../../hooks/useCAHSync';
import { shuffleArray } from './cardData';
import CAHPlaying from './components/CAHPlaying';
import CAHJudging from './components/CAHJudging';
import CAHReveal from './components/CAHReveal';
import CAHGameOver from './components/CAHGameOver';

export default function CAHGameWrapper() {
  const navigate = useNavigate();
  const { roomCode } = useParams();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerSyncRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialized = useRef(false);
  const gameStarted = useRef(false);
  const prevPhaseRef = useRef<string | null>(null);

  const lobbyPlayers = useLobbyStore((state) => state.players);
  const endLobbyGame = useLobbyStore((state) => state.endGame);

  const {
    phase,
    players: cahPlayers,
    currentPlayerId,
    submissions,
    addPlayer,
    setCurrentPlayer,
    setRoomCode,
    startGame,
    nextRound,
    selectWinner,
    submitCards,
    decrementTime,
    resetGame,
  } = useCAHStore();

  const currentPlayer = cahPlayers.find(p => p.id === currentPlayerId);
  const isHost = currentPlayer?.isHost ?? false;

  // --- Multiplayer sync ---
  const {
    isReady,
    broadcastRoundStart,
    broadcastPhaseChange,
    broadcastTimerSync,
    broadcastSubmissionCount,
    broadcastWinner,
    broadcastGameOver,
    broadcastSubmitCards,
    broadcastPickWinner,
    broadcastTTS,
  } = useCAHSync({
    roomCode: roomCode || null,
    playerId: currentPlayerId,
    isHost,
  });

  // Initialize CAH game with lobby players (ALL clients)
  useEffect(() => {
    if (!initialized.current && lobbyPlayers.length > 0 && cahPlayers.length === 0) {
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
  }, [lobbyPlayers, cahPlayers.length, roomCode, setRoomCode, setCurrentPlayer, addPlayer]);

  // HOST: start game only AFTER the sync channel is confirmed connected
  useEffect(() => {
    if (isHost && isReady && !gameStarted.current && cahPlayers.length >= 3 && phase === 'lobby') {
      gameStarted.current = true;
      startGame();
    }
  }, [isHost, isReady, cahPlayers.length, phase, startGame]);

  // HOST: after startGame / startRound, broadcast round start (includes hands atomically)
  const lastBroadcastRound = useRef(0);
  useEffect(() => {
    if (!isHost) return;
    const state = useCAHStore.getState();
    if (phase === 'playing' && state.currentRound > lastBroadcastRound.current) {
      lastBroadcastRound.current = state.currentRound;
      // Small delay to let store settle after startRound()
      const t = setTimeout(() => {
        broadcastRoundStart();
      }, 100);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isHost]);

  // HOST: when store transitions to judging (all submitted), broadcast
  useEffect(() => {
    if (!isHost) return;

    if (phase === 'judging' && prevPhaseRef.current === 'playing') {
      const t = setTimeout(() => {
        const state = useCAHStore.getState();
        broadcastPhaseChange('judging', state.timeRemaining, state.submissions);
      }, 50);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isHost]);

  // HOST: when winner is selected (phase becomes 'reveal'), broadcast winner
  useEffect(() => {
    if (!isHost) return;

    if (phase === 'reveal' && prevPhaseRef.current === 'judging') {
      const t = setTimeout(() => {
        const state = useCAHStore.getState();
        const winnerSubmission = state.submissions.find(s => s.isWinner);
        if (winnerSubmission) {
          broadcastWinner(winnerSubmission.playerId);
        }
      }, 50);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isHost]);

  // HOST: during reveal phase, auto-advance to next round after 5 seconds
  useEffect(() => {
    if (!isHost || phase !== 'reveal') return;

    const t = setTimeout(() => {
      const state = useCAHStore.getState();
      if (state.currentRound >= state.maxRounds) {
        useCAHStore.setState({ phase: 'game-over' });
        broadcastGameOver();
      } else {
        nextRound();
        // Explicitly broadcast after store settles with new czar
        setTimeout(() => {
          broadcastRoundStart();
        }, 200);
      }
    }, 5000);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isHost]);

  // HOST: when game-over, broadcast
  useEffect(() => {
    if (!isHost || phase !== 'game-over') return;
    if (prevPhaseRef.current !== 'game-over') {
      broadcastGameOver();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isHost]);

  // HOST ONLY: run the game timer
  useEffect(() => {
    if (!isHost) return;
    if (phase === 'playing' || phase === 'judging') {
      timerRef.current = setInterval(() => {
        const state = useCAHStore.getState();

        if (state.timeRemaining <= 1) {
          // Timer expired
          if (state.phase === 'playing') {
            // Force transition to judging with whatever submissions exist
            if (state.submissions.length > 0) {
              useCAHStore.setState({
                phase: 'judging',
                timeRemaining: state.judgeTime,
                submissions: shuffleArray(state.submissions),
              });
            } else {
              // No submissions at all — skip to next round
              nextRound();
              setTimeout(() => broadcastRoundStart(), 200);
            }
          } else if (state.phase === 'judging') {
            // Auto-pick random winner
            if (state.submissions.length > 0) {
              const randomIdx = Math.floor(Math.random() * state.submissions.length);
              selectWinner(state.submissions[randomIdx].playerId);
            }
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

  // HOST: sync timer to non-host clients every 2 seconds
  useEffect(() => {
    if (!isHost || (phase !== 'playing' && phase !== 'judging')) {
      if (timerSyncRef.current) clearInterval(timerSyncRef.current);
      return;
    }
    timerSyncRef.current = setInterval(() => broadcastTimerSync(), 2000);
    return () => {
      if (timerSyncRef.current) clearInterval(timerSyncRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, phase]);

  // HOST: broadcast submission count when submissions change
  useEffect(() => {
    if (!isHost || phase !== 'playing') return;
    broadcastSubmissionCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissions.length, isHost, phase]);

  // IMPORTANT: Track previous phase LAST — must run after all detection effects above
  // so that prevPhaseRef still holds the old value when detections check it
  useEffect(() => {
    prevPhaseRef.current = phase;
  }, [phase]);

  // --- Handlers for child components ---

  // Submit cards (called from CAHPlaying)
  const handleSubmitCards = (cardIds: string[]) => {
    if (isHost) {
      // Host submits locally
      submitCards(currentPlayerId!);
    } else {
      // Non-host broadcasts to host
      broadcastSubmitCards(cardIds);
      // Also mark locally as submitted for immediate UI feedback
      useCAHStore.setState({
        players: cahPlayers.map(p =>
          p.id === currentPlayerId ? { ...p, hasSubmitted: true } : p
        ),
      });
    }
  };

  // Pick winner (called from CAHJudging)
  const handlePickWinner = (winnerId: string) => {
    if (isHost) {
      // Host picks locally
      selectWinner(winnerId);
    } else {
      // Non-host czar broadcasts to host
      broadcastPickWinner(winnerId);
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
    case 'playing':
      return (
        <CAHPlaying
          onSubmitCards={handleSubmitCards}
          isHost={isHost}
        />
      );
    case 'judging':
      return (
        <CAHJudging
          onPickWinner={handlePickWinner}
          isHost={isHost}
          onReadAloud={broadcastTTS}
        />
      );
    case 'reveal':
      return <CAHReveal />;
    case 'game-over':
      return <CAHGameOver onPlayAgain={handlePlayAgain} onLeave={handleLeave} />;
    default:
      return (
        <CAHPlaying
          onSubmitCards={handleSubmitCards}
          isHost={isHost}
        />
      );
  }
}
