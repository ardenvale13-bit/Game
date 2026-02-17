// Codenames — Main game orchestrator
import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useLobbyStore from '../../store/lobbyStore';
import useCodenamesStore from './codenamesStore';
import { useCodenamesSync } from '../../hooks/useCodenamesSync';

import CodenamesTeamSetup from './components/CodenamesTeamSetup';
import CodenamesBoard from './components/CodenamesBoard';
import CodenamesClueBar from './components/CodenamesClueBar';
import CodenamesTeamPanel from './components/CodenamesTeamPanel';
import CodenamesGameOver from './components/CodenamesGameOver';

import './codenames.css';

export default function CodenamesGameWrapper() {
  const navigate = useNavigate();
  const { roomCode } = useParams();

  const lobby = useLobbyStore();
  const cn = useCodenamesStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isHost = lobby.isHost();
  const currentPlayerId = lobby.currentPlayerId;

  // Initialize codenames store with lobby players
  useEffect(() => {
    if (!roomCode || !currentPlayerId) return;

    cn.setRoomCode(roomCode);
    cn.setCurrentPlayer(currentPlayerId);

    // Add all lobby players to codenames store
    for (const p of lobby.players) {
      cn.addPlayer({
        id: p.id,
        name: p.name,
        avatarId: p.avatarId,
        avatarFilename: p.avatarFilename,
        isHost: p.isHost,
      });
    }

    // Start in team-setup phase
    useCodenamesStore.setState({ phase: 'team-setup' });
  }, [roomCode, currentPlayerId]);

  // Sync hook
  const {
    broadcastGameState,
    broadcastTimerToggle,
    broadcastTimerTick,
    sendJoinTeam,
    sendLeaveTeam,
    sendVoteCard,
    sendLockCard,
    sendSubmitClue,
    sendEndTurn,
  } = useCodenamesSync({
    roomCode: roomCode || null,
    playerId: currentPlayerId,
    isHost,
  });

  // Timer effect — host ticks and broadcasts
  useEffect(() => {
    if (!isHost || !cn.timerEnabled || cn.timeRemaining <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (cn.phase !== 'spymaster-clue' && cn.phase !== 'operative-guess') {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      const s = useCodenamesStore.getState();
      if (s.timeRemaining <= 1) {
        // Time's up — end turn
        s.endTurn();
        broadcastTimerTick(0);
        broadcastGameState();
      } else {
        s.decrementTime();
        broadcastTimerTick(s.timeRemaining - 1);
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isHost, cn.timerEnabled, cn.timeRemaining, cn.phase, broadcastGameState, broadcastTimerTick]);

  // Team setup handlers
  const handleJoinTeam = (team: Parameters<typeof sendJoinTeam>[0], role: Parameters<typeof sendJoinTeam>[1]) => {
    sendJoinTeam(team, role);
  };

  const handleLeaveTeam = () => {
    sendLeaveTeam();
  };

  const handleTimerToggle = (enabled: boolean) => {
    broadcastTimerToggle(enabled);
  };

  const handleStartGame = () => {
    if (!isHost) return;
    cn.startGame();
    broadcastGameState();
  };

  // Gameplay handlers
  const handleVote = (cardIndex: number) => {
    if (!currentPlayerId) return;
    const card = cn.board[cardIndex];
    if (!card || card.isRevealed) return;

    // Toggle vote
    const hasVote = card.votes.some(v => v.playerId === currentPlayerId);
    if (hasVote) {
      // Unvote — clicking same card again
      if (isHost) {
        cn.unvoteCard(currentPlayerId, cardIndex);
        // Broadcast board update via sync
      } else {
        // Non-host sends unvote to host
        // For simplicity, sendVoteCard handles toggle logic on host side
      }
    }
    sendVoteCard(cardIndex);
  };

  const handleLock = (cardIndex: number) => {
    sendLockCard(cardIndex);
  };

  const handleSubmitClue = (word: string, number: number) => {
    sendSubmitClue(word, number);
  };

  const handleEndTurn = () => {
    sendEndTurn();
  };

  const handlePlayAgain = () => {
    if (!isHost) return;
    // Reset to team setup, keep players and teams
    useCodenamesStore.setState({
      phase: 'team-setup',
      board: [],
      currentClue: null,
      guessesRemaining: 0,
      clueHistory: [],
      winner: null,
      winReason: null,
    });
    broadcastGameState();
  };

  const handleBackToLobby = () => {
    cn.resetGame();
    lobby.endGame();
    navigate(`/lobby/${roomCode}`);
  };

  // Render based on phase
  if (cn.phase === 'team-setup') {
    return (
      <CodenamesTeamSetup
        onJoinTeam={handleJoinTeam}
        onLeaveTeam={handleLeaveTeam}
        onStart={handleStartGame}
        onTimerToggle={handleTimerToggle}
      />
    );
  }

  if (cn.phase === 'game-over') {
    return (
      <CodenamesGameOver
        onPlayAgain={handlePlayAgain}
        onBackToLobby={handleBackToLobby}
      />
    );
  }

  // Main game view
  return (
    <div className="cn-layout">
      {/* Header */}
      <div className="cn-header">
        <div className="cn-turn-indicator">
          <div className={`cn-turn-dot ${cn.currentTeam}`} />
          <span>
            {cn.phase === 'spymaster-clue'
              ? `${cn.currentTeam === 'pink' ? 'Pink' : 'Blue'} Spymaster's Turn`
              : `${cn.currentTeam === 'pink' ? 'Pink' : 'Blue'} Team Guessing`}
          </span>
        </div>
        <div className="cn-score-display">
          <span className="cn-score-pink">{cn.pinkRemaining}</span>
          <span className="text-muted">—</span>
          <span className="cn-score-blue">{cn.blueRemaining}</span>
        </div>
      </div>

      {/* Main game area */}
      <div className="cn-game-area">
        <CodenamesTeamPanel team="pink" />
        <CodenamesBoard onVote={handleVote} onLock={handleLock} />
        <CodenamesTeamPanel team="blue" />
      </div>

      {/* Clue bar */}
      <CodenamesClueBar
        onSubmitClue={handleSubmitClue}
        onEndTurn={handleEndTurn}
      />
    </div>
  );
}
