// Make It Meme - Game Wrapper (Orchestrator)
// Host-authoritative: host runs timers, templates, and game flow
// Flow: captioning → voting → results → (repeat) → game-over
import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useLobbyStore from '../../store/lobbyStore';
import useMemeStore from './memeStore';
import { useMemeSync } from '../../hooks/useMemeSync';
import { getRandomTemplate, resetUsedTemplates } from './memeData';
import MemeCaptioning from './components/MemeCaptioning';
import MemeVoting from './components/MemeVoting';
import MemeResults from './components/MemeResults';
import MemeGameOver from './components/MemeGameOver';
import './meme.css';

// Raw store reference for imperative access
const memeStore = useMemeStore;

export default function MakeItMemeGameWrapper() {
  const navigate = useNavigate();
  const { roomCode } = useParams();
  const lobbyStore = useLobbyStore();
  const { phase } = useMemeStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameStartedRef = useRef(false);

  const currentPlayerId = lobbyStore.currentPlayerId;
  const hostPlayer = lobbyStore.isHost();

  const {
    isReady,
    broadcastCaptionStart,
    broadcastVotingStart,
    broadcastResults,
    broadcastTimerSync,
    broadcastGameOver,
    sendCaption,
    sendVote,
  } = useMemeSync({
    roomCode: roomCode || null,
    playerId: currentPlayerId,
    isHost: hostPlayer,
  });

  // Initialize store from lobby
  useEffect(() => {
    resetUsedTemplates();
    memeStore.getState().initFromLobby(lobbyStore.players);
    const rounds = lobbyStore.roundCount || 8;
    memeStore.getState().setMaxRounds(rounds);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Start game when channel is ready (host only)
  useEffect(() => {
    if (!isReady || !hostPlayer || gameStartedRef.current) return;
    gameStartedRef.current = true;

    setTimeout(() => {
      startNewRound();
    }, 500);
  }, [isReady, hostPlayer]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start a new round (host only)
  const startNewRound = useCallback(() => {
    const template = getRandomTemplate();

    memeStore.getState().startCaptionPhase(
      template.id,
      template.src,
      template.isGif,
      template.captionPosition,
    );

    setTimeout(() => {
      broadcastCaptionStart(
        template.id,
        template.src,
        template.isGif,
        template.captionPosition,
      );
    }, 100);
  }, [broadcastCaptionStart]);

  // Timer management (host only)
  useEffect(() => {
    if (!hostPlayer) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (phase === 'game-over') return;

    timerRef.current = setInterval(() => {
      const state = memeStore.getState();
      const remaining = state.tickTimer();

      // Sync timer every 2 seconds
      if (remaining % 2 === 0) {
        broadcastTimerSync();
      }

      // Early transition: all captions in during captioning
      if (state.phase === 'captioning' && remaining > 0 && memeStore.getState().allCaptionsIn()) {
        memeStore.setState({ timeRemaining: 0 });
        handlePhaseEnd('captioning');
        return;
      }

      // Early transition: all votes in during voting
      if (state.phase === 'voting' && remaining > 0 && memeStore.getState().allVotesIn()) {
        memeStore.setState({ timeRemaining: 0 });
        handlePhaseEnd('voting');
        return;
      }

      if (remaining <= 0) {
        handlePhaseEnd(state.phase);
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [hostPlayer, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePhaseEnd = useCallback((currentPhase: string) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (currentPhase === 'captioning') {
      // Move to voting
      memeStore.getState().startVotingPhase();
      setTimeout(() => {
        broadcastVotingStart();
      }, 100);
    } else if (currentPhase === 'voting') {
      // Reveal results
      memeStore.getState().revealResults();
      setTimeout(() => {
        broadcastResults();
      }, 100);
    } else if (currentPhase === 'results') {
      // Check if game is over
      const state = memeStore.getState();
      if (state.currentRound >= state.maxRounds) {
        memeStore.getState().endGame();
        setTimeout(() => {
          broadcastGameOver();
          // Update lobby scores
          memeStore.getState().players.forEach((p: { id: string; score: number }) => {
            if (p.score > 0) {
              lobbyStore.updatePlayerScore(p.id, p.score);
            }
          });
        }, 100);
      } else {
        // Next round
        setTimeout(() => {
          startNewRound();
        }, 300);
      }
    }
  }, [broadcastVotingStart, broadcastResults, broadcastGameOver, startNewRound, lobbyStore]);

  // Handle caption submission
  const handleSubmitCaption = useCallback((caption: string) => {
    sendCaption(caption);
  }, [sendCaption]);

  // Handle vote
  const handleVote = useCallback((targetPlayerId: string) => {
    sendVote(targetPlayerId);
  }, [sendVote]);

  // Play again
  const handlePlayAgain = useCallback(() => {
    if (hostPlayer) {
      resetUsedTemplates();
      memeStore.getState().reset();
      memeStore.getState().initFromLobby(lobbyStore.players);
      gameStartedRef.current = false;

      setTimeout(() => {
        gameStartedRef.current = true;
        startNewRound();
      }, 300);
    }
  }, [hostPlayer, lobbyStore.players, startNewRound]);

  // Back to lobby
  const handleBackToLobby = useCallback(() => {
    memeStore.getState().reset();
    lobbyStore.endGame();
    navigate(`/lobby/${roomCode}`);
  }, [roomCode, navigate, lobbyStore]);

  // Loading state
  if (!isReady) {
    return (
      <div className="meme-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner" />
        <div className="text-muted mt-2">Connecting...</div>
      </div>
    );
  }

  return (
    <div className="meme-layout">
      {phase === 'captioning' && (
        <MemeCaptioning
          currentPlayerId={currentPlayerId || ''}
          onSubmitCaption={handleSubmitCaption}
        />
      )}
      {phase === 'voting' && (
        <MemeVoting
          currentPlayerId={currentPlayerId || ''}
          onVote={handleVote}
        />
      )}
      {phase === 'results' && (
        <MemeResults />
      )}
      {phase === 'game-over' && (
        <MemeGameOver
          onPlayAgain={handlePlayAgain}
          onBackToLobby={handleBackToLobby}
        />
      )}
    </div>
  );
}
