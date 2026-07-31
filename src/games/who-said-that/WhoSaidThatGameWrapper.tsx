import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useLobbyStore from '../../store/lobbyStore';
import useWhoSaidThatStore from './whoSaidThatStore';
import { useWhoSaidThatSync } from '../../hooks/useWhoSaidThatSync';

export default function WhoSaidThatGameWrapper() {
  const navigate = useNavigate();
  const { roomCode } = useParams();
  const initialized = useRef(false);
  const gameStarted = useRef(false);
  const lastBroadcastRound = useRef(0);
  const prevPhase = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerSyncRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [draftAnswer, setDraftAnswer] = useState('');
  const [draftGuesses, setDraftGuesses] = useState<Record<string, string>>({});
  const [activeAnswerId, setActiveAnswerId] = useState<string | null>(null);

  const lobbyPlayers = useLobbyStore((state) => state.players);
  const endLobbyGame = useLobbyStore((state) => state.endGame);
  const {
    phase,
    players,
    currentPlayerId,
    currentRound,
    maxRounds,
    currentPrompt,
    answers,
    timeRemaining,
    addPlayer,
    setRoomCode,
    setCurrentPlayer,
    setMaxRounds,
    startGame,
    submitAnswer,
    beginGuessing,
    submitGuesses,
    calculateResults,
    nextRound,
    decrementTime,
    resetGame,
  } = useWhoSaidThatStore();

  const currentPlayer = players.find(player => player.id === currentPlayerId);
  const isHost = currentPlayer?.isHost ?? false;
  const answeredCount = players.filter(player => player.hasAnswered).length;
  const guessedCount = players.filter(player => player.hasGuessed).length;

  const handleForceEnd = useCallback(() => {
    resetGame();
    endLobbyGame();
    navigate(`/lobby/${roomCode}`);
  }, [endLobbyGame, navigate, resetGame, roomCode]);

  const {
    isReady,
    broadcastRoundStart,
    broadcastAnswerCount,
    broadcastGuessing,
    broadcastGuessCount,
    broadcastResults,
    broadcastGameOver,
    broadcastTimer,
    broadcastSubmitAnswer,
    broadcastSubmitGuesses,
    broadcastForceEnd,
  } = useWhoSaidThatSync({
    roomCode: roomCode ?? null,
    playerId: currentPlayerId,
    isHost,
    onForceEnd: handleForceEnd,
  });

  useEffect(() => {
    if (initialized.current || lobbyPlayers.length === 0 || players.length > 0) return;
    initialized.current = true;
    if (roomCode) setRoomCode(roomCode);
    const lobbyPlayerId = useLobbyStore.getState().currentPlayerId;
    if (lobbyPlayerId) setCurrentPlayer(lobbyPlayerId);
    const rounds = useLobbyStore.getState().roundCount;
    if ([3, 5, 8, 10].includes(rounds)) setMaxRounds(rounds);
    lobbyPlayers.forEach(player => addPlayer({
      id: player.id,
      name: player.name,
      avatarId: player.avatarId,
      avatarFilename: player.avatarFilename,
      isHost: player.isHost,
    }));
  }, [
    addPlayer,
    lobbyPlayers,
    players.length,
    roomCode,
    setCurrentPlayer,
    setMaxRounds,
    setRoomCode,
  ]);

  useEffect(() => {
    if (!isHost || !isReady || gameStarted.current || players.length < 3 || phase !== 'lobby') return;
    gameStarted.current = true;
    startGame();
  }, [isHost, isReady, phase, players.length, startGame]);

  useEffect(() => {
    if (!isHost || phase !== 'answering' || currentRound <= lastBroadcastRound.current) return;
    lastBroadcastRound.current = currentRound;
    const timeout = setTimeout(broadcastRoundStart, 80);
    return () => clearTimeout(timeout);
  }, [broadcastRoundStart, currentRound, isHost, phase]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDraftAnswer('');
      setDraftGuesses({});
      setActiveAnswerId(null);
    }, 0);
    return () => clearTimeout(timeout);
  }, [currentRound]);

  useEffect(() => {
    if (!isHost || phase !== 'answering') return;
    broadcastAnswerCount();
    if (players.length >= 3 && players.every(player => player.hasAnswered)) {
      beginGuessing();
    }
  }, [answeredCount, beginGuessing, broadcastAnswerCount, isHost, phase, players]);

  useEffect(() => {
    if (!isHost || phase !== 'guessing') return;
    if (prevPhase.current === 'answering') {
      const timeout = setTimeout(broadcastGuessing, 50);
      return () => clearTimeout(timeout);
    }
  }, [broadcastGuessing, isHost, phase]);

  useEffect(() => {
    if (!isHost || phase !== 'guessing') return;
    broadcastGuessCount();
    if (players.filter(player => player.answer).every(player => player.hasGuessed)) {
      calculateResults();
    }
  }, [broadcastGuessCount, calculateResults, guessedCount, isHost, phase, players]);

  useEffect(() => {
    if (!isHost || phase !== 'results' || prevPhase.current !== 'guessing') return;
    const timeout = setTimeout(broadcastResults, 50);
    return () => clearTimeout(timeout);
  }, [broadcastResults, isHost, phase]);

  useEffect(() => {
    if (!isHost || phase !== 'results') return;
    const timeout = setTimeout(() => {
      const state = useWhoSaidThatStore.getState();
      if (state.currentRound >= state.maxRounds) {
        useWhoSaidThatStore.setState({ phase: 'game-over' });
        broadcastGameOver();
      } else {
        nextRound();
      }
    }, 10000);
    return () => clearTimeout(timeout);
  }, [broadcastGameOver, isHost, nextRound, phase]);

  useEffect(() => {
    if (!isHost || (phase !== 'answering' && phase !== 'guessing')) return;
    timerRef.current = setInterval(() => {
      const state = useWhoSaidThatStore.getState();
      if (state.timeRemaining <= 1) {
        if (state.phase === 'answering') {
          const completedAnswers = state.players.filter(player => player.answer).length;
          if (completedAnswers < 2) {
            if (state.currentRound >= state.maxRounds) {
              useWhoSaidThatStore.setState({ phase: 'game-over' });
              broadcastGameOver();
            } else {
              nextRound();
            }
            return;
          }
          useWhoSaidThatStore.setState({
            players: state.players.map(player =>
              player.hasAnswered ? player : { ...player, hasAnswered: true }
            ),
          });
        } else {
          useWhoSaidThatStore.setState({
            players: state.players.map(player =>
              player.hasGuessed ? player : { ...player, hasGuessed: true }
            ),
          });
        }
        return;
      }
      decrementTime();
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [broadcastGameOver, decrementTime, isHost, nextRound, phase]);

  useEffect(() => {
    if (!isHost || (phase !== 'answering' && phase !== 'guessing')) return;
    timerSyncRef.current = setInterval(broadcastTimer, 2000);
    return () => {
      if (timerSyncRef.current) clearInterval(timerSyncRef.current);
    };
  }, [broadcastTimer, isHost, phase]);

  useEffect(() => {
    prevPhase.current = phase;
  }, [phase]);

  const handleSubmitAnswer = () => {
    const answer = draftAnswer.trim();
    if (!answer || !currentPlayerId || currentPlayer?.hasAnswered) return;
    if (isHost) {
      submitAnswer(currentPlayerId, answer);
    } else {
      broadcastSubmitAnswer(answer);
      useWhoSaidThatStore.setState((state) => ({
        players: state.players.map(player =>
          player.id === currentPlayerId
            ? { ...player, answer, hasAnswered: true }
            : player
        ),
      }));
    }
  };

  const guessableAnswers = useMemo(
    () => answers.filter(answer => answer.id !== currentPlayer?.ownAnswerId),
    [answers, currentPlayer?.ownAnswerId],
  );
  const candidatePlayers = useMemo(
    () => players.filter(player => player.id !== currentPlayerId && player.hasAnswered),
    [currentPlayerId, players],
  );
  const usedPlayerIds = new Set(Object.values(draftGuesses));
  const readyToSubmitGuesses = guessableAnswers.length > 0
    && Object.keys(draftGuesses).length === guessableAnswers.length;

  const assignGuess = (playerId: string) => {
    if (!activeAnswerId) return;
    setDraftGuesses(previous => {
      const next = { ...previous };
      Object.keys(next).forEach(answerId => {
        if (next[answerId] === playerId) delete next[answerId];
      });
      next[activeAnswerId] = playerId;
      return next;
    });
    const nextUnassigned = guessableAnswers.find(answer =>
      answer.id !== activeAnswerId && !draftGuesses[answer.id]
    );
    setActiveAnswerId(nextUnassigned?.id ?? null);
  };

  const handleSubmitGuesses = () => {
    if (!readyToSubmitGuesses || !currentPlayerId || currentPlayer?.hasGuessed) return;
    if (isHost) {
      submitGuesses(currentPlayerId, draftGuesses);
    } else {
      broadcastSubmitGuesses(draftGuesses);
      useWhoSaidThatStore.setState((state) => ({
        players: state.players.map(player =>
          player.id === currentPlayerId
            ? { ...player, guesses: draftGuesses, hasGuessed: true }
            : player
        ),
      }));
    }
  };

  const leaveGame = () => {
    resetGame();
    endLobbyGame();
    navigate(`/lobby/${roomCode}`);
  };

  const endGame = () => {
    broadcastForceEnd();
    handleForceEnd();
  };

  const controls = (
    <div className="wst-controls">
      <button className="btn btn-ghost btn-small" onClick={leaveGame}>← Lobby</button>
      {isHost && <button className="btn btn-small wst-end-btn" onClick={endGame}>End Game</button>}
    </div>
  );

  const header = (
    <header className="wst-header">
      <span>Round {currentRound} / {maxRounds}</span>
      <span className={timeRemaining <= 10 ? 'wst-timer warning' : 'wst-timer'}>{timeRemaining}s</span>
      <span>{phase === 'answering' ? `${answeredCount}/${players.length} answered` : `${guessedCount}/${players.length} guessed`}</span>
    </header>
  );

  const prompt = (
    <section className="wst-prompt-card">
      <span className="wst-eyebrow">Answer honestly. Regret it later.</span>
      <h1>{currentPrompt}</h1>
    </section>
  );

  if (phase === 'lobby') {
    return <main className="wst-loading">{controls}<div className="spinner" /> Starting nonsense...</main>;
  }

  if (phase === 'answering') {
    return (
      <main className="wst-layout">
        {controls}{header}{prompt}
        {currentPlayer?.hasAnswered ? (
          <section className="wst-waiting">
            <div className="wst-big-icon">✓</div>
            <h2>Answer locked in</h2>
            <p>Now pretending you didn’t write that...</p>
            <strong>{answeredCount} / {players.length} ready</strong>
          </section>
        ) : (
          <section className="wst-answer-box">
            <textarea
              value={draftAnswer}
              onChange={(event) => setDraftAnswer(event.target.value.slice(0, 180))}
              placeholder="Type the answer your friends should definitely recognise..."
              autoFocus
            />
            <div className="wst-answer-footer">
              <span>{draftAnswer.length}/180</span>
              <button className="btn btn-primary" onClick={handleSubmitAnswer} disabled={!draftAnswer.trim()}>
                Lock It In
              </button>
            </div>
          </section>
        )}
      </main>
    );
  }

  if (phase === 'guessing') {
    return (
      <main className="wst-layout">
        {controls}{header}{prompt}
        {currentPlayer?.hasGuessed ? (
          <section className="wst-waiting">
            <div className="wst-big-icon">🕵️</div>
            <h2>Accusations submitted</h2>
            <p>Waiting for everyone else to expose themselves...</p>
          </section>
        ) : (
          <>
            <p className="wst-instructions">Tap an answer, then tap who you think wrote it. Each person is used once.</p>
            <section className="wst-guess-grid">
              {guessableAnswers.map((answer, index) => {
                const assigned = players.find(player => player.id === draftGuesses[answer.id]);
                return (
                  <button
                    key={answer.id}
                    className={`wst-answer-card ${activeAnswerId === answer.id ? 'active' : ''} ${assigned ? 'assigned' : ''}`}
                    onClick={() => setActiveAnswerId(answer.id)}
                  >
                    <span className="wst-answer-number">#{index + 1}</span>
                    <span>{answer.text}</span>
                    {assigned && (
                      <span className="wst-assigned-player">
                        <img src={`/avatars/${assigned.avatarFilename}`} alt="" />
                        {assigned.name}
                      </span>
                    )}
                  </button>
                );
              })}
            </section>
            {activeAnswerId && (
              <section className="wst-player-picker">
                <h2>Who said that?</h2>
                <div>
                  {candidatePlayers.map(player => {
                    const used = usedPlayerIds.has(player.id) && draftGuesses[activeAnswerId] !== player.id;
                    return (
                      <button key={player.id} disabled={used} onClick={() => assignGuess(player.id)}>
                        <img src={`/avatars/${player.avatarFilename}`} alt="" />
                        <span>{player.name}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
            <button
              className="btn btn-primary btn-large wst-submit-guesses"
              disabled={!readyToSubmitGuesses}
              onClick={handleSubmitGuesses}
            >
              Submit Accusations
            </button>
          </>
        )}
      </main>
    );
  }

  if (phase === 'results') {
    return (
      <main className="wst-layout">
        {controls}{header}{prompt}
        <section className="wst-round-score">
          You earned <strong>+{currentPlayer?.roundScore ?? 0}</strong> this round
        </section>
        <section className="wst-results-list">
          {answers.map(answer => {
            const author = players.find(player => player.id === answer.authorId);
            return (
              <article key={answer.id} className="wst-result-card">
                <blockquote>“{answer.text}”</blockquote>
                <div className="wst-author">
                  <img src={`/avatars/${author?.avatarFilename}`} alt="" />
                  <span><strong>{author?.name}</strong> said that</span>
                  <em>Fooled {answer.fooledCount ?? 0}</em>
                </div>
              </article>
            );
          })}
        </section>
        <p className="wst-next-round">Next round incoming...</p>
      </main>
    );
  }

  const leaderboard = [...players].sort((a, b) => b.score - a.score);
  return (
    <main className="wst-layout wst-game-over">
      {controls}
      <div className="wst-trophy">🏆</div>
      <h1>{leaderboard[0]?.name} knows too much!</h1>
      <p>Final scores</p>
      <section className="wst-leaderboard">
        {leaderboard.map((player, index) => (
          <div key={player.id} className={index === 0 ? 'winner' : ''}>
            <span>{index + 1}</span>
            <img src={`/avatars/${player.avatarFilename}`} alt="" />
            <strong>{player.name}</strong>
            <b>{player.score}</b>
          </div>
        ))}
      </section>
      <button className="btn btn-primary btn-large" onClick={leaveGame}>Back to Lobby</button>
    </main>
  );
}
