import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useGameStore from '../store/gameStore';

export default function Lobby() {
  const navigate = useNavigate();
  const { roomCode } = useParams();
  const [copied, setCopied] = useState(false);
  
  const { 
    players, 
    currentPlayerId,
    roomName,
    settings,
    canStartGame,
    startWordSelection,
    resetGame,
    updateSettings,
  } = useGameStore();

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
    const link = `${window.location.origin}/join/${roomCode}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = () => {
    if (canStartGame()) {
      startWordSelection();
      navigate(`/game/${roomCode}`);
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
        <button 
          className="btn btn-ghost"
          onClick={handleLeave}
        >
          ← Leave
        </button>
        <div className="text-muted" style={{ fontSize: '0.9rem' }}>
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

        <p className="text-muted mt-2" style={{ fontSize: '0.85rem' }}>
          Share this code with friends to join!
        </p>
      </div>

      {/* Players List */}
      <div className="card mb-3">
        <h3 className="mb-2">Players</h3>
        
        <div className="flex flex-col gap-1">
          {players
            .sort((a, b) => a.joinedAt - b.joinedAt)
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
                  src={`/avatars/${player.avatar.filename}`} 
                  alt={player.avatar.name}
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

        {players.length < 2 && (
          <div className="text-center text-muted mt-3" style={{ fontSize: '0.9rem' }}>
            Waiting for more players to join...
            <br />
            <span style={{ fontSize: '0.85rem' }}>Need at least 2 players to start</span>
          </div>
        )}
      </div>

      {/* Start Game Button (Host Only) */}
      {isHost ? (
        <button
          className="btn btn-primary btn-large w-full"
          onClick={handleStartGame}
          disabled={!canStartGame()}
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

      {/* Game Settings (Host Only) */}
      {isHost && players.length >= 2 && (
        <div className="card mt-3">
          <h3 className="mb-2">Game Settings</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.9rem' }}>Rounds:</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className={`btn btn-small ${settings.rounds === 3 ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => updateSettings({ rounds: 3 })}
              >
                3
              </button>
              <button
                className={`btn btn-small ${settings.rounds === 5 ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => updateSettings({ rounds: 5 })}
              >
                5
              </button>
              <button
                className={`btn btn-small ${settings.rounds === 10 ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => updateSettings({ rounds: 10 })}
              >
                10
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.9rem' }}>Words to choose from:</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className={`btn btn-small ${settings.wordChoices === 3 ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => updateSettings({ wordChoices: 3 })}
              >
                3
              </button>
              <button
                className={`btn btn-small ${settings.wordChoices === 4 ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => updateSettings({ wordChoices: 4 })}
              >
                4
              </button>
            </div>
          </div>
          
          <div className="text-muted" style={{ fontSize: '0.85rem' }}>
            • Each player takes a turn drawing<br />
            • Others try to guess the word<br />
            • First to guess gets the most points!
          </div>
        </div>
      )}
    </div>
  );
}
