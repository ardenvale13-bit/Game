// CAH Lobby Component
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useCAHStore from '../cahStore';

export default function CAHLobby() {
  const navigate = useNavigate();
  const { roomCode } = useParams();
  const [copied, setCopied] = useState(false);
  
  const {
    players,
    currentPlayerId,
    roomName,
    maxRounds,
    canStartGame,
    startGame,
    setMaxRounds,
    resetGame,
  } = useCAHStore();

  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const isHost = currentPlayer?.isHost ?? false;

  const handleCopyCode = async () => {
    if (roomCode) {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/cah/join/${roomCode}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = () => {
    if (canStartGame()) {
      startGame();
    }
  };

  const handleLeave = () => {
    resetGame();
    navigate('/');
  };

  return (
    <div className="lobby-layout">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <button className="btn btn-ghost" onClick={handleLeave}>
          ← Leave
        </button>
        <div className="text-muted" style={{ fontSize: '0.9rem' }}>
          {players.length} player{players.length !== 1 ? 's' : ''} in room
        </div>
      </div>

      {/* Game Title */}
      <div className="card text-center mb-3" style={{ background: '#000', border: '3px solid #fff' }}>
        <h2 style={{ color: '#fff', marginBottom: '4px' }}>Cards Against Humanity</h2>
        <p className="text-muted" style={{ fontSize: '0.9rem' }}>A party game for horrible people</p>
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

        <p className="text-muted mt-2" style={{ fontSize: '0.85rem' }}>
          Need at least 3 players!
        </p>
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
            </div>
          ))}
        </div>

        {players.length < 3 && (
          <div className="text-center text-muted mt-3" style={{ fontSize: '0.9rem' }}>
            Waiting for more players...
            <br />
            <span style={{ fontSize: '0.85rem' }}>Need at least 3 players to start</span>
          </div>
        )}
      </div>

      {/* Start Game Button */}
      {isHost ? (
        <button
          className="btn btn-primary btn-large w-full"
          onClick={handleStartGame}
          disabled={!canStartGame()}
          style={{ background: '#000', border: '2px solid #fff' }}
        >
          {canStartGame() ? 'Start Game' : 'Waiting for players...'}
        </button>
      ) : (
        <div className="card text-center">
          <div className="text-muted">
            Waiting for host to start the game...
          </div>
        </div>
      )}

      {/* Settings */}
      {isHost && players.length >= 3 && (
        <div className="card mt-3">
          <h3 className="mb-2">Settings</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.9rem' }}>Rounds:</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[5, 10, 15, 20].map(n => (
                <button
                  key={n}
                  className={`btn btn-small ${maxRounds === n ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setMaxRounds(n)}
                  style={maxRounds === n ? { background: '#000', border: '2px solid #fff' } : {}}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
