import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { avatars } from '../data/avatars';
import type { Avatar } from '../data/avatars';
import useGameStore from '../store/gameStore';

// Generate a random 6-character room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function CreateRoom() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar>(avatars[0]);
  const { setRoomCode, setRoomName: setStoreRoomName, setCurrentPlayer, addPlayer, resetGame } = useGameStore();

  const handleCreate = () => {
    if (!name.trim()) return;

    // Clear any previous game state
    resetGame();

    const roomCode = generateRoomCode();
    const playerId = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const hostPlayer = {
      id: playerId,
      name: name.trim(),
      avatar: selectedAvatar,
      score: 0,
      isHost: true,
      isDrawing: false,
      hasGuessedCorrectly: false,
      joinedAt: Date.now(),
    };

    setRoomCode(roomCode);
    if (roomName.trim()) {
      setStoreRoomName(roomName.trim());
    }
    setCurrentPlayer(playerId);
    addPlayer(hostPlayer);
    navigate(`/lobby/${roomCode}`);
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
        <h2 className="mb-3">Create a Room</h2>

        {/* Room name input (optional) */}
        <div className="mb-3">
          <label className="text-secondary mb-1" style={{ display: 'block', fontSize: '0.9rem' }}>
            Room Name <span className="text-muted">(optional)</span>
          </label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Friday Game Night"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            maxLength={30}
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
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            autoFocus
          />
        </div>

        {/* Avatar selection - flat grid, 5 across */}
        <div className="mb-3">
          <label className="text-secondary mb-1" style={{ display: 'block', fontSize: '0.9rem' }}>
            Choose Avatar
          </label>
          <div style={{ maxHeight: '280px', overflowY: 'auto', padding: '4px' }}>
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
            <div className="text-muted" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>Room Host <img src="/crown.png" alt="host" style={{ width: '16px', height: '16px' }} /></div>
          </div>
        </div>

        {/* Create button */}
        <button
          className="btn btn-primary w-full"
          onClick={handleCreate}
          disabled={!name.trim()}
        >
          Create Room
        </button>
      </div>
    </div>
  );
}
