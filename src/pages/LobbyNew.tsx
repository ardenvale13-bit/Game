// Unified Lobby - Game selection happens here (Multiplayer via Supabase Realtime)
import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useLobbyStore from '../store/lobbyStore';
import type { GameType, Player } from '../store/lobbyStore';
import { CATEGORY_INFO } from '../games/guess-betrayal/questionData';
import { useRealtimeRoom } from '../hooks/useRealtimeRoom';
import type { PresencePlayer, BroadcastEvent } from '../hooks/useRealtimeRoom';
import { deleteRoom, findRoom, updateRoomHost } from '../lib/roomService';
import { clearPlayerSession, getPlayerSession, savePlayerSession } from '../lib/playerSession';

const PLAYER_NAME_KEY = 'party_player_name';

export default function Lobby() {
  const navigate = useNavigate();
  const { roomCode } = useParams();
  const [copied, setCopied] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [authoritativeHostId, setAuthoritativeHostId] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const {
    players,
    currentPlayerId,
    roomName,
    selectedGame,
    roundCount,
    gbCategory,
    unoMode,
    selectGame,
    setRoundCount,
    setGbCategory,
    setUnoMode,
    startGame,
    leaveLobby,
    setPlayers,
    setRoomCode,
    setCurrentPlayer,
    addPlayer,
    canStartGame,
    updatePlayerName,
  } = useLobbyStore();

  const hostPlayer = Boolean(
    currentPlayerId &&
    authoritativeHostId &&
    currentPlayerId === authoritativeHostId
  );

  // Build current player's presence data.
  // Uses useState so that when it resolves (possibly after first render),
  // it triggers a re-render and the realtime hook picks it up.
  const [currentPresencePlayer, setCurrentPresencePlayer] = useState<PresencePlayer | null>(null);
  const presenceInitRef = useRef(false);
  const authoritativeHostIdRef = useRef<string | null>(null);
  const latestPresencePlayersRef = useRef<PresencePlayer[]>([]);
  const hostMigrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Recover the lobby identity when arriving from an older session that predates
  // the persisted lobby store, or when the in-memory state was otherwise cleared.
  useEffect(() => {
    if (currentPlayerId) return;
    const session = getPlayerSession();
    if (!session || session.roomCode !== roomCode) {
      navigate(`/join/${roomCode}`, { replace: true });
      return;
    }

    setRoomCode(session.roomCode);
    setCurrentPlayer(session.playerId);
    addPlayer({
      id: session.playerId,
      name: session.name,
      avatarId: session.avatarId,
      avatarFilename: session.avatarFilename,
      isHost: session.isHost,
    });
  }, [currentPlayerId, roomCode, navigate, setRoomCode, setCurrentPlayer, addPlayer]);

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

  // Ref for updatePresence so leave callback can use it
  const updatePresenceRef = useRef<((updates: Partial<PresencePlayer>) => Promise<void>) | null>(null);

  const applyAuthoritativeHost = useCallback((presencePlayers: PresencePlayer[], hostId: string) => {
    const synced: Player[] = presencePlayers.map(p => ({
      id: p.id,
      name: p.name,
      avatarId: p.avatarId,
      avatarFilename: p.avatarFilename,
      isHost: p.id === hostId,
      score: p.score,
    }));
    setPlayers(synced);

    if (!currentPlayerId) return;
    const shouldBeHost = currentPlayerId === hostId;
    const session = getPlayerSession();
    if (session && session.roomCode === roomCode && session.isHost !== shouldBeHost) {
      savePlayerSession({ ...session, isHost: shouldBeHost });
    }

    setCurrentPresencePlayer(prev => {
      if (!prev || prev.isHost === shouldBeHost) return prev;
      return { ...prev, isHost: shouldBeHost };
    });

    const myPresence = presencePlayers.find(p => p.id === currentPlayerId);
    if (myPresence && myPresence.isHost !== shouldBeHost) {
      updatePresenceRef.current?.({ isHost: shouldBeHost });
    }
  }, [setPlayers, currentPlayerId, roomCode]);

  const scheduleHostMigration = useCallback(() => {
    if (!roomCode || !currentPlayerId || hostMigrationTimerRef.current) return;

    // Presence can briefly omit the real host while a page is reconnecting.
    // Wait before migrating, then verify the room record and live presence again.
    hostMigrationTimerRef.current = setTimeout(async () => {
      hostMigrationTimerRef.current = null;
      const presencePlayers = latestPresencePlayersRef.current;
      if (presencePlayers.length === 0) return;

      const room = await findRoom(roomCode);
      if (!room) return;

      const currentHostId = room.host_player_id;
      if (presencePlayers.some(p => p.id === currentHostId)) {
        authoritativeHostIdRef.current = currentHostId;
        setAuthoritativeHostId(currentHostId);
        applyAuthoritativeHost(presencePlayers, currentHostId);
        return;
      }

      const nextHost = [...presencePlayers].sort((a, b) => a.joinedAt - b.joinedAt)[0];
      if (!nextHost || nextHost.id !== currentPlayerId) return;

      const updated = await updateRoomHost(roomCode, nextHost.id);
      if (!updated) return;

      authoritativeHostIdRef.current = nextHost.id;
      setAuthoritativeHostId(nextHost.id);
      applyAuthoritativeHost(presencePlayers, nextHost.id);
    }, 4000);
  }, [roomCode, currentPlayerId, applyAuthoritativeHost]);

  // Sync player list from Presence using the room record as the host authority.
  const handlePlayersSync = useCallback((presencePlayers: PresencePlayer[]) => {
    latestPresencePlayersRef.current = presencePlayers;
    const hostId = authoritativeHostIdRef.current;

    if (!hostId) {
      setPlayers(presencePlayers.map(p => ({
        id: p.id,
        name: p.name,
        avatarId: p.avatarId,
        avatarFilename: p.avatarFilename,
        isHost: false,
        score: p.score,
      })));
      return;
    }

    applyAuthoritativeHost(presencePlayers, hostId);

    if (presencePlayers.some(p => p.id === hostId)) {
      if (hostMigrationTimerRef.current) {
        clearTimeout(hostMigrationTimerRef.current);
        hostMigrationTimerRef.current = null;
      }
    } else {
      scheduleHostMigration();
    }
  }, [setPlayers, applyAuthoritativeHost, scheduleHostMigration]);

  useEffect(() => {
    if (!roomCode) return;
    let cancelled = false;

    findRoom(roomCode).then(room => {
      if (cancelled || !room) return;
      authoritativeHostIdRef.current = room.host_player_id;
      setAuthoritativeHostId(room.host_player_id);
      if (latestPresencePlayersRef.current.length > 0) {
        handlePlayersSync(latestPresencePlayersRef.current);
      }
    });

    return () => {
      cancelled = true;
      if (hostMigrationTimerRef.current) {
        clearTimeout(hostMigrationTimerRef.current);
        hostMigrationTimerRef.current = null;
      }
    };
  }, [roomCode, handlePlayersSync]);

  // Handle broadcast events from other clients
  const handleBroadcast = useCallback((event: BroadcastEvent) => {
    // Lobby configuration and navigation are host-authoritative. Ignore forged
    // or stale events from any other browser, even if it claims to be a host.
    if (!authoritativeHostIdRef.current || event.senderId !== authoritativeHostIdRef.current) {
      return;
    }

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
        if (event.payload.unoMode === 'classic' || event.payload.unoMode === 'chaos') {
          setUnoMode(event.payload.unoMode);
        }
        break;
      case 'game_start':
        if (event.payload.roundCount !== undefined) {
          setRoundCount(event.payload.roundCount as number);
        }
        if (event.payload.gbCategory !== undefined) {
          setGbCategory(event.payload.gbCategory as string);
        }
        if (event.payload.unoMode === 'classic' || event.payload.unoMode === 'chaos') {
          setUnoMode(event.payload.unoMode);
        }
        startGame();
        navigate(`/play/${event.payload.game}/${roomCode}`);
        break;
    }
  }, [selectGame, setRoundCount, setGbCategory, setUnoMode, startGame, navigate, roomCode]);

  const { isConnected, sendEvent, updatePresence } = useRealtimeRoom({
    roomCode: roomCode || null,
    player: currentPresencePlayer,
    onPlayersSync: handlePlayersSync,
    onBroadcast: handleBroadcast,
  });

  // Keep updatePresence in a ref so the sync callback can use it
  useEffect(() => { updatePresenceRef.current = updatePresence; }, [updatePresence]);

  // When host selects a game, broadcast to everyone
  const handleSelectGame = (game: GameType) => {
    if (!hostPlayer) return;
    selectGame(game);
    sendEvent('game_selected', { game });
  };

  // When host changes round count, broadcast to everyone
  const handleRoundCountChange = (count: number) => {
    if (!hostPlayer) return;
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
    if (!hostPlayer || !canStartGame() || !selectedGame) return;
    startGame();
    // Broadcast to all clients to start (include settings)
    sendEvent('game_start', { game: selectedGame, roundCount, gbCategory, unoMode });
    navigate(`/play/${selectedGame}/${roomCode}`);
  };

  const handleLeave = async () => {
    // Only delete room if host AND last player
    if (hostPlayer && roomCode && players.length <= 1) {
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
    if (game === 'wyr') return 2;
    if (game === 'hangman') return 2;
    if (game === 'uno') return 2;
    if (game === 'tictactoe') return 2;
    if (game === 'connect4') return 2;
    if (game === 'checkers') return 2;
    if (game === 'chess') return 2;

    if (game === 'guess-betrayal') return 4;
    if (game === 'meme') return 3;
    if (game === 'familyfeud') return 6;
    return 2;
  };

  const getGameName = (game: GameType) => {
    switch (game) {
      case 'pictionary': return "Scribbl n' Draw";
      case 'cah': return 'Cards Against Humanity';
      case 'codenames': return 'Codenames';
      case 'wmlt': return "Who's Most Likely To";
      case 'wyr': return 'Would You Rather';
      case 'hangman': return 'Hangman';
      case 'uno': return 'Uno';
      case 'tictactoe': return 'Noughts & Crosses';
      case 'connect4': return 'Connect Four';
      case 'checkers': return 'Checkers';
      case 'chess': return 'Chess';

      case 'guess-betrayal': return 'Guess Betrayal';
      case 'meme': return 'Make It Meme';
      case 'familyfeud': return 'fAImily Feud';
      default: return '';
    }
  };

  const getGameIcon = (game: GameType) => {
    switch (game) {
      case 'pictionary': return '/pictionary-icon.png';
      case 'cah': return '/cah-icon.png';
      case 'codenames': return '/codenames-icon.png';
      case 'wmlt': return '/wmlt-icon.png';
      case 'wyr': return '/wyr-icon.png';
      case 'hangman': return '/hangman-icon.png';
      case 'uno': return '/uno-icon.png';
      case 'tictactoe': return '/tictactoe-icon.png';
      case 'connect4': return '/connect4-icon.png';
      case 'checkers': return '/checkers-icon.png';
      case 'chess': return '/chess-icon.png';

      case 'guess-betrayal': return '/guess-betrayal-icon.png';
      case 'meme': return '/meme-icon.png';
      case 'familyfeud': return '/ff-icon.png';
      default: return '';
    }
  };

  const handleGbCategoryChange = (cat: string) => {
    if (!hostPlayer) return;
    setGbCategory(cat);
    sendEvent('settings_changed', { gbCategory: cat });
  };

  const handleUnoModeChange = (mode: 'classic' | 'chaos') => {
    if (!hostPlayer) return;
    setUnoMode(mode);
    sendEvent('settings_changed', { unoMode: mode });
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
                          padding: '2px 4px',
                          borderRadius: '4px',
                          opacity: 0.7,
                          transition: 'opacity 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
                      >
                        <img
                          src="/pencil.png"
                          alt="Edit"
                          style={{ width: '14px', height: '14px', filter: 'brightness(0.7)' }}
                        />
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
        <div className="game-grid">
          {(['pictionary', 'cah', 'codenames', 'wmlt', 'wyr', 'hangman', 'guess-betrayal', 'meme', 'familyfeud', 'uno', 'tictactoe', 'connect4', 'checkers', 'chess'] as GameType[]).map((game) => (
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
            {(selectedGame === 'pictionary' || selectedGame === 'wmlt' || selectedGame === 'wyr' || selectedGame === 'hangman' || selectedGame === 'cah' || selectedGame === 'guess-betrayal' || selectedGame === 'meme' || selectedGame === 'familyfeud' || selectedGame === 'uno') && ` · ${roundCount} rounds`}
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

        {/* Round count selector for WYR - host only */}
        {hostPlayer && selectedGame === 'wyr' && (
          <div className="mt-3">
            <div className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>Rounds</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[5, 10, 15, 20].map((count) => (
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

        {/* Round count selector for fAImily Feud - host only */}
        {hostPlayer && selectedGame === 'familyfeud' && (
          <div className="mt-3">
            <div className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>Rounds</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[15, 20, 30].map((count) => (
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

        {/* Uno settings - host only */}
        {hostPlayer && selectedGame === 'uno' && (
          <>
            <div className="mt-3">
              <div className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>Mode</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className={`btn ${unoMode === 'classic' ? 'btn-primary' : 'btn-secondary'} btn-small`}
                  onClick={() => handleUnoModeChange('classic')}
                  style={{ padding: '6px 12px', fontSize: '0.85rem', fontWeight: unoMode === 'classic' ? 700 : 400 }}
                >
                  Classic
                </button>
                <button
                  className={`btn ${unoMode === 'chaos' ? 'btn-primary' : 'btn-secondary'} btn-small`}
                  onClick={() => handleUnoModeChange('chaos')}
                  style={{ padding: '6px 12px', fontSize: '0.85rem', fontWeight: unoMode === 'chaos' ? 700 : 400 }}
                >
                  Chaos
                </button>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>Rounds</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 3, 5].map((count) => (
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
          </>
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
