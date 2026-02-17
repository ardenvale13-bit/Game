import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { avatars, getRandomAvatar } from '../data/avatars';
import type { Avatar } from '../data/avatars';
import useGameStore from '../store/gameStore';

export default function JoinRoom() {
  const navigate = useNavigate();
  const { roomCode: urlRoomCode } = useParams();
  
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState(urlRoomCode || '');
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar>(getRandomAvatar());
  const [error, setError] = useState('');
  
  const { setRoomCode: setStoreRoomCode, setCurrentPlayer, addPlayer, resetGame } = useGameStore();

  useEffect(() => {
    if (urlRoomCode) {
      setRoomCode(urlRoomCode.toUpperCase());
    }
  }, [urlRoomCode]);

  const handleJoin = () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!roomCode.trim() || roomCode.length !== 6) {
      setError('Please enter a valid 6-character room code');
      return;
    }

    // Clear any previous game state
    resetGame();

    const playerId = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const player = {
      id: playerId,
      name: name.trim(),
      avatar: selectedAvatar,
      score: 0,
      isHost: false,
      isDrawing: false,
      hasGuessedCorrectly: false,
      joinedAt: Date.now(),
    };

    setStoreRoomCode(roomCode.toUpperCase());
    setCurrentPlayer(playerId);
    addPlayer(player);
    navigate(`/lobby/${roomCode.toUpperCase()}`);
  };

  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setRoomCode(value.slice(0, 6));
    setError('');
  };

  return (
    <div className="lobby-layout">
      <button 
        className="btn btn-ghost mb-3"
        onClick={() => navigate('/')}
      >
        ← Back
      </button>

      <div className="card">
        <h2 className="mb-3">Join a Room</h2>

        {/* Room code input */}
        <div className="mb-3">
          <label className="text-secondary mb-1" style={{ display: 'block', fontSize: '0.9rem' }}>
            Room Code
          </label>
          <input
            type="text"
            className="input"
            placeholder="Enter 6-letter code..."
            value={roomCode}
            onChange={handleRoomCodeChange}
            maxLength={6}
            style={{ 
              textTransform: 'uppercase', 
              letterSpacing: '0.1em',
              fontSize: '1.2rem',
              fontWeight: 600,
              textAlign: 'center'
            }}
            autoFocus={!urlRoomCode}
          />
        </div>

        {/* Name input */}
        <div className="mb-3">
          <label className="text-secondary mb-1" style={{ display: 'block', fontSize: '0.9rem' }}>
            Your Name
          </label>
          <input
            type="text"
            className="input"
            placeholder="Enter your name..."
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            maxLength={20}
            autoFocus={!!urlRoomCode}
          />
        </div>

        {/* Avatar selection - flat grid, 5 across */}
        <div className="mb-3">
          <label className="text-secondary mb-1" style={{ display: 'block', fontSize: '0.9rem' }}>
            Choose Avatar
          </label>
          <div style={{ maxHeight: '220px', overflowY: 'auto', padding: '4px' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(5, 1fr)', 
              gap: '10px' 
            }}>
              {avatars.map((avatar) => (
                <button
                  key={avatar.id}
                  className={`avatar-option ${selectedAvatar.id === avatar.id ? 'selected' : ''}`}
                  onClick={() => setSelectedAvatar(avatar)}
                  title={avatar.name}
                >
                  <img 
                    src={`/avatars/${avatar.filename}`} 
                    alt={avatar.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="text-danger mb-2" style={{ fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {/* Preview */}
        <div className="flex items-center gap-2 mb-3 mt-4" style={{ 
          padding: '16px', 
          background: 'var(--bg-elevated)', 
          borderRadius: 'var(--radius-md)' 
        }}>
          <div className="avatar-option selected" style={{ pointerEvents: 'none' }}>
            <img 
              src={`/avatars/${selectedAvatar.filename}`} 
              alt={selectedAvatar.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{name || 'Your Name'}</div>
            <div className="text-muted" style={{ fontSize: '0.85rem' }}>Player</div>
          </div>
        </div>

        {/* Join button */}
        <button
          className="btn btn-primary w-full"
          onClick={handleJoin}
          disabled={!name.trim() || roomCode.length !== 6}
        >
          Join Room
        </button>
      </div>
    </div>
  );
}
