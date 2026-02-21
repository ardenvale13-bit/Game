// Unified Lobby - Game selection happens here (Multiplayer via Supabase Realtime)
import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useLobbyStore from '../store/lobbyStore';
import type { GameType, Player } from '../store/lobbyStore';
import { CATEGORY_INFO } from '../games/guess-betrayal/questionData';
import { useRealtimeRoom } from '../hooks/useRealtimeRoom';
import type { PresencePlayer, BroadcastEvent } from '../hooks/useRealtimeRoom';
import { deleteRoom } from '../lib/roomService';
import { clearPlayerSession, getPlayerSession } from '../lib/playerSession';

const PLAYER_NAME_KEY = 'party_player_name';

export default function Lobby() {
  const navigate = useNavigate();
  const { roomCode } = useParams();
  const [copied, setCopied] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const {
    players,
    currentPlayerId,
    roomName,
    selectedGame,
    roundCount,
    gbCategory,
    selectGame,
    setRoundCount,
    setGbCategory,
    startGame,
    leaveLobby,
    setPlayers,
    isHost,
    canStartGame,
    updatePlayerName,
  } = useLobbyStore();

  const hostPlayer = isHost();

  // Build current player's presence data.
  // Uses useState so that when it resolves (possibly after first render),
  // it triggers a re-render and the realtime hook picks it up.
  const [currentPresencePlayer, setCurrentPresencePlayer] = useState<PresencePlayer | null>(null);
  const presenceInitRef = useRef(false);

  useEffect(() => {
    if (presenceInitRef.current || !currentPlayerId) return;

    // Try from store first
    const p = useLobbyStore.getState().players.find(p => p.id === currentPlayerId);
    if (p) {
      presenceInitRef.current = true;
      setCurrentPresencePlayer({
        id: p.id,
        name: p.name,
        avatarId: p.avatarId,
        avatarFilename: p.avatarFilename,
        isHost: p.isHost,
        score: p.score,
        joinedAt: Date.now(),
      });
      return;
    }

    // Fallback: try sessionStorage
    const session = getPlayerSession();
    if (session) {
      presenceInitRef.current = true;
      setCurrentPresencePlayer({
        id: session.playerId,
        name: session.name,
        avatarId: session.avatarId,
        avatarFilename: session.avatarFilename,
        isHost: session.isHost,
        score: 0,
        joinedAt: Date.now(),
      });
    }
  }, [currentPlayerId, players]); // Re-run if players populate after first render

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
      case 'settings_changed':
        if (event.payload.roundCount !== undefined) {
          setRoundCount(event.payload.roundCount as number);
        }
        if (event.payload.gbCategory !== undefined) {
          setGbCategory(event.payload.gbCategory as string);
        }
        break;
      case 'game_start':
        if (event.payload.roundCount !== undefined) {
          setRoundCount(event.payload.roundCount as number);
        }
        if (event.payload.gbCategory !== undefined) {
          setGbCategory(event.payload.gbCategory as string);
        }
        startGame();
        navigate(`/play/${event.payload.game}/${roomCode}`);
        break;
    }
  }, [selectGame, setRoundCount, startGame, navigate, roomCode]);

  const { isConnected, sendEvent, updatePresence } = useRealtimeRoom({
    roomCode: roomCode || null,
    player: currentPresencePlayer,
    onPlayersSync: handlePlayersSync,
    onBroadcast: handleBroadcast,
  });

  // When host selects a game, broadcast to everyone
  const handleSelectGame = (game: GameType) => {
    selectGame(game);
    sendEvent('game_selected', { game });
  };

  // When host changes round count, broadcast to everyone
  const handleRoundCountChange = (count: number) => {
    setRoundCount(count);
    sendEvent('settings_changed', { roundCount: count });
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
    // Broadcast to all clients to start (include settings)
    sendEvent('game_start', { game: selectedGame, roundCount, gbCategory });
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

  // Name editing
  const startEditingName = () => {
    const me = players.find(p => p.id === currentPlayerId);
    if (!me) return;
    setNameInput(me.name);
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  const confirmNameChange = () => {
    const trimmed = nameInput.trim();
    if (!trimmed || !currentPlayerId) {
      setEditingName(false);
      return;
    }
    // Update store
    updatePlayerName(currentPlayerId, trimmed);
    // Update sessionStorage
    sessionStorage.setItem(PLAYER_NAME_KEY, trimmed);
    // Update presence so other players see it immediately
    updatePresence({ name: trimmed });
    // Also update the local presence player state so heartbeat uses new name
    setCurrentPresencePlayer(prev => prev ? { ...prev, name: trimmed } : prev);
    setEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      confirmNameChange();
    } else if (e.key === 'Escape') {
      setEditingName(false);
    }
  };

  const getMinPlayers = (game: GameType) => {
    if (game === 'cah') return 3;
    if (game === 'codenames') return 4;
    if (game === 'wmlt') return 3;
    if (game === 'hangman') return 2;
    if (game === 'wavelength') return 4;
    if (game === 'guess-betrayal') return 4;
    if (game === 'meme') return 3;
    return 2;
  };

  const getGameName = (game: GameType) => {
    switch (game) {
      case 'pictionary': return "Scribbl n' Draw";
      case 'cah': return 'Cards Against Humanity';
      case 'codenames': return 'Codenames';
      case 'wmlt': return "Who's Most Likely To";
      case 'hangman': return 'Hangman';
      case 'wavelength': return 'Wavelength';
      case 'guess-betrayal': return 'Guess Betrayal';
      case 'meme': return 'Make It Meme';
      default: return '';
    }
  };

  const getGameIcon = (game: GameType) => {
    switch (game) {
      case 'pictionary': return '/pictionary-icon.png';
      case 'cah': return '/cah-icon.png';
      case 'codenames': return '/codenames-icon.png';
      case 'wmlt': return '/wmlt-icon.png';
      case 'hangman': return '/hangman-icon.png';
      case 'wavelength': return '/wavelength-icon.png';
      case 'guess-betrayal': return '/guess-betrayal-icon.png';
      case 'meme': return '/meme-icon.png';
      default: return '';
    }
  };

  const handleGbCategoryChange = (cat: string) => {
    setGbCategory(cat);
    sendEvent('settings_changed', { gbCategory: cat });
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
              {player.id === currentPlayerId && editingName ? (
                <div style={{ flex: 1, display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={handleNameKeyDown}
                    onBlur={confirmNameChange}
                    maxLength={20}
                    style={{
                      flex: 1,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--accent-primary)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '4px 8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>
              ) : (
                <span className="name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {player.name}
                  {player.id === currentPlayerId && (
                    <>
                      {' (you) '}
                      <button
                        onClick={startEditingName}
                        title="Edit name"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          opacity: 0.7,
                          transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
                      >
                        ✏️
                      </button>
                    </>
                  )}
                </span>
              )}
              {player.score > 0 && (
                <span className="score">{player.score} pts</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Game Selection - visible to all, clickable by host only */}
      <div className="card mb-3">
        <h3 className="mb-2">{hostPlayer ? 'Choose Game' : 'Games'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {(['pictionary', 'cah', 'codenames', 'wmlt', 'hangman', 'wavelength', 'guess-betrayal', 'meme'] as GameType[]).map((game) => (
            <button
              key={game}
              className={`game-select-btn ${selectedGame === game ? 'selected' : ''}`}
              onClick={() => hostPlayer && handleSelectGame(game)}
              style={!hostPlayer ? { cursor: 'default', opacity: selectedGame && selectedGame !== game ? 0.5 : 1 } : {}}
            >
              <img src={getGameIcon(game)} alt={getGameName(game)} className="game-icon-img" />
            </button>
          ))}
        </div>

        {selectedGame && players.length < getMinPlayers(selectedGame) && (
          <div className="text-muted mt-2" style={{ fontSize: '0.85rem' }}>
            Need {getMinPlayers(selectedGame) - players.length} more player{getMinPlayers(selectedGame) - players.length !== 1 ? 's' : ''} for {getGameName(selectedGame)}
          </div>
        )}

        {!hostPlayer && selectedGame && (
          <div className="text-muted mt-2 text-center" style={{ fontSize: '0.85rem' }}>
            Host selected: <strong>{getGameName(selectedGame)}</strong>
            {(selectedGame === 'pictionary' || selectedGame === 'wmlt' || selectedGame === 'hangman' || selectedGame === 'cah' || selectedGame === 'guess-betrayal' || selectedGame === 'meme') && ` · ${roundCount} rounds`}
          </div>
        )}

        {/* Round count selector for CAH - host only */}
        {hostPlayer && selectedGame === 'cah' && (
          <div className="mt-3">
            <div className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>Rounds</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[10, 15, 20, 25, 30].map((count) => (
                <button
                  key={count}
                  className={`btn ${roundCount === count ? 'btn-primary' : 'btn-secondary'} btn-small`}
                  onClick={() => handleRoundCountChange(count)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '0.95rem',
                    fontWeight: roundCount === count ? 700 : 400,
                    minWidth: '50px',
                  }}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Guess Betrayal settings - host only */}
        {hostPlayer && selectedGame === 'guess-betrayal' && (
          <>
            <div className="mt-3">
              <div className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>Category</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  className={`btn ${gbCategory === 'blend' ? 'btn-primary' : 'btn-secondary'} btn-small`}
                  onClick={() => handleGbCategoryChange('blend')}
                  style={{ padding: '6px 12px', fontSize: '0.85rem', fontWeight: gbCategory === 'blend' ? 700 : 400 }}
                >
                  🎲 Blend
                </button>
                {(Object.entries(CATEGORY_INFO) as [string, { name: string; icon: string }][]).map(([key, info]) => (
                  <button
                    key={key}
                    className={`btn ${gbCategory === key ? 'btn-primary' : 'btn-secondary'} btn-small`}
                    onClick={() => handleGbCategoryChange(key)}
                    style={{ padding: '6px 12px', fontSize: '0.85rem', fontWeight: gbCategory === key ? 700 : 400 }}
                  >
                    {info.icon} {info.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3">
              <div className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>Rounds</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[5, 8, 10, 12, 15].map((count) => (
                  <button
                    key={count}
                    className={`btn ${roundCount === count ? 'btn-primary' : 'btn-secondary'} btn-small`}
                    onClick={() => handleRoundCountChange(count)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      fontSize: '0.95rem',
                      fontWeight: roundCount === count ? 700 : 400,
                      minWidth: '45px',
                    }}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Round count selector for WMLT - host only */}
        {hostPlayer && selectedGame === 'wmlt' && (
          <div className="mt-3">
            <div className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>Rounds</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[5, 10, 15].map((count) => (
                <button
                  key={count}
                  className={`btn ${roundCount === count ? 'btn-primary' : 'btn-secondary'} btn-small`}
                  onClick={() => handleRoundCountChange(count)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '0.95rem',
                    fontWeight: roundCount === count ? 700 : 400,
                  }}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Round count selector for Hangman - host only */}
        {hostPlayer && selectedGame === 'hangman' && (
          <div className="mt-3">
            <div className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>Rounds</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[3, 5, 10].map((count) => (
                <button
                  key={count}
                  className={`btn ${roundCount === count ? 'btn-primary' : 'btn-secondary'} btn-small`}
                  onClick={() => handleRoundCountChange(count)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '0.95rem',
                    fontWeight: roundCount === count ? 700 : 400,
                  }}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Round count selector for Make It Meme - host only */}
        {hostPlayer && selectedGame === 'meme' && (
          <div className="mt-3">
            <div className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>Rounds</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[5, 8, 12].map((count) => (
                <button
                  key={count}
                  className={`btn ${roundCount === count ? 'btn-primary' : 'btn-secondary'} btn-small`}
                  onClick={() => handleRoundCountChange(count)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '0.95rem',
                    fontWeight: roundCount === count ? 700 : 400,
                  }}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Round count selector for Scribbl n' Draw - host only */}
        {hostPlayer && selectedGame === 'pictionary' && (
          <div className="mt-3">
            <div className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>Rounds</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[3, 5, 10].map((count) => (
                <button
                  key={count}
                  className={`btn ${roundCount === count ? 'btn-primary' : 'btn-secondary'} btn-small`}
                  onClick={() => handleRoundCountChange(count)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '0.95rem',
                    fontWeight: roundCount === count ? 700 : 400,
                  }}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

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
