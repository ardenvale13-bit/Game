// Unified Lobby - Game selection happens here (Multiplayer via Supabase Realtime)
import { useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useLobbyStore from '../store/lobbyStore';
import type { GameType, Player } from '../store/lobbyStore';
import { useRealtimeRoom } from '../hooks/useRealtimeRoom';
import type { PresencePlayer, BroadcastEvent } from '../hooks/useRealtimeRoom';
import { deleteRoom } from '../lib/roomService';
import { clearPlayerSession } from '../lib/playerSession';

export default function Lobby() {
  const navigate = useNavigate();
  const { roomCode } = useParams();
  const [copied, setCopied] = useState(false);

  const {
    players,
    currentPlayerId,
    roomName,
    selectedGame,
    selectGame,
    startGame,
    leaveLobby,
    setPlayers,
    isHost,
    canStartGame,
  } = useLobbyStore();

  const hostPlayer = isHost();

  // Build current player's presence data
  const currentPlayer = useMemo(() => {
    const p = players.find(p => p.id === currentPlayerId);
    if (!p) return null;
    return {
      id: p.id,
      name: p.name,
      avatarId: p.avatarId,
      avatarFilename: p.avatarFilename,
      isHost: p.isHost,
      score: p.score,
      joinedAt: Date.now(),
    };
  }, [currentPlayerId, players]);

  // Sync player list from Presence
  const handlePlayersSync = useCallback((presencePlayers: PresencePlayer[]) => {
    const synced: Player[] = presencePlayers.map(p => ({
      id: p.id,
      name: p.name,
      avatarId: p.avatarId,
      avatarFilename: p.avatarFilename,
      isHost: p.isHost,
      score: p.score,
    }));
    setPlayers(synced);
  }, [setPlayers]);

  // Handle broadcast events from other clients
  const handleBroadcast = useCallback((event: BroadcastEvent) => {
    switch (event.type) {
      case 'game_selected':
        selectGame(event.payload.game as GameType);
        break;
      case 'game_start':
        startGame();
        navigate(`/play/${event.payload.game}/${roomCode}`);
        break;
    }
  }, [selectGame, startGame, navigate, roomCode]);

  const { isConnected, sendEvent } = useRealtimeRoom({
    roomCode: roomCode || null,
    player: currentPlayer,
    onPlayersSync: handlePlayersSync,
    onBroadcast: handleBroadcast,
  });

  // When host selects a game, broadcast to everyone
  const handleSelectGame = (game: GameType) => {
    selectGame(game);
    sendEvent('game_selected', { game });
  };

  const handleCopyCode = async () => {
    if (roomCode) {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/join/${roomCode}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = () => {
    if (!canStartGame() || !selectedGame) return;
    startGame();
    // Broadcast to all clients to start
    sendEvent('game_start', { game: selectedGame });
    navigate(`/play/${selectedGame}/${roomCode}`);
  };

  const handleLeave = async () => {
    // If host leaves, clean up the room
    if (hostPlayer && roomCode) {
      await deleteRoom(roomCode);
    }
    clearPlayerSession();
    leaveLobby();
    navigate('/');
  };

  const getMinPlayers = (game: GameType) => {
    if (game === 'cah') return 3;
    return 2;
  };

  return (
    <div className="lobby-layout">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <button className="btn btn-ghost" onClick={handleLeave}>
          ← Leave
        </button>
        <div className="text-muted" style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isConnected ? '#4ade80' : '#f87171',
            display: 'inline-block',
          }} />
          {players.length} player{players.length !== 1 ? 's' : ''} in room
        </div>
      </div>

      {/* Room Code Card */}
      <div className="card text-center mb-3">
        {roomName && (
          <div style={{
            fontSize: '1.3rem',
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            marginBottom: '8px',
            color: 'var(--accent-primary)'
          }}>
            {roomName}
          </div>
        )}
        <div className="text-muted mb-1" style={{ fontSize: '0.9rem' }}>Room Code</div>
        <div className="room-code">{roomCode}</div>

        <div className="flex gap-2 justify-center mt-3">
          <button className="btn btn-secondary btn-small" onClick={handleCopyCode}>
            {copied ? '✓ Copied!' : 'Copy Code'}
          </button>
          <button className="btn btn-secondary btn-small" onClick={handleCopyLink}>
            Copy Link
          </button>
        </div>
      </div>

      {/* Players List */}
      <div className="card mb-3">
        <h3 className="mb-2">Players</h3>
        <div className="flex flex-col gap-1">
          {players
            .sort((a) => (a.isHost ? -1 : 1))
            .map((player) => (
            <div
              key={player.id}
              className={`player-card ${player.isHost ? 'host' : ''}`}
              style={player.id === currentPlayerId ? {
                borderColor: 'var(--accent-tertiary)',
                boxShadow: '0 0 10px var(--glow-tertiary)'
              } : {}}
            >
              <div className="avatar">
                <img
                  src={`/avatars/${player.avatarFilename}`}
                  alt={player.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
              </div>
              <span className="name">
                {player.name}
                {player.id === currentPlayerId && ' (you)'}
              </span>
              {player.score > 0 && (
                <span className="score">{player.score} pts</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Game Selection - Host Only */}
      {hostPlayer && (
        <div className="card mb-3">
          <h3 className="mb-2">Choose Game</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              className={`game-select-btn ${selectedGame === 'pictionary' ? 'selected' : ''}`}
              onClick={() => handleSelectGame('pictionary')}
            >
              <img src="/pictionary-icon.png" alt="Scribbl n' Guess" className="game-icon-img" />
            </button>
            <button
              className={`game-select-btn ${selectedGame === 'cah' ? 'selected' : ''}`}
              onClick={() => handleSelectGame('cah')}
            >
              <img src="/cah-icon.png" alt="Cards Against Humanity" className="game-icon-img" />
            </button>
          </div>

          {selectedGame && players.length < getMinPlayers(selectedGame) && (
            <div className="text-muted mt-2" style={{ fontSize: '0.85rem' }}>
              Need {getMinPlayers(selectedGame) - players.length} more player{getMinPlayers(selectedGame) - players.length !== 1 ? 's' : ''} for {selectedGame === 'cah' ? 'Cards Against Humanity' : 'Pictionary'}
            </div>
          )}
        </div>
      )}

      {/* Non-host sees selected game */}
      {!hostPlayer && selectedGame && (
        <div className="card mb-3 text-center">
          <div className="text-muted mb-1" style={{ fontSize: '0.9rem' }}>Selected Game</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <img
              src={selectedGame === 'pictionary' ? '/pictionary-icon.png' : '/cah-icon.png'}
              alt={selectedGame}
              style={{ width: '32px', height: '32px', borderRadius: '6px' }}
            />
            <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>
              {selectedGame === 'pictionary' ? "Scribbl n' Guess" : 'Cards Against Humanity'}
            </span>
          </div>
        </div>
      )}

      {/* Start Game Button */}
      {hostPlayer ? (
        <button
          className="btn btn-primary btn-large w-full"
          onClick={handleStartGame}
          disabled={!canStartGame()}
        >
          {!selectedGame
            ? 'Select a game above'
            : !canStartGame()
              ? `Need ${getMinPlayers(selectedGame)} players`
              : 'Start Game'}
        </button>
      ) : (
        <div className="card text-center">
          <div className="text-muted">
            {selectedGame
              ? 'Waiting for host to start...'
              : 'Waiting for host to pick a game...'}
          </div>
        </div>
      )}
    </div>
  );
}
