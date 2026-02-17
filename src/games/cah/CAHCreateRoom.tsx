// CAH Create Room Page
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { avatars } from '../../data/avatars';
import type { Avatar } from '../../data/avatars';
import useCAHStore from './cahStore';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function CAHCreateRoom() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar>(avatars[0]);
  const { setRoomCode, setRoomName: setStoreRoomName, setCurrentPlayer, addPlayer, resetGame } = useCAHStore();

  const handleCreate = () => {
    if (!name.trim()) return;

    resetGame();

    const roomCode = generateRoomCode();
    const playerId = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    setRoomCode(roomCode);
    if (roomName.trim()) {
      setStoreRoomName(roomName.trim());
    }
    setCurrentPlayer(playerId);
    addPlayer({
      id: playerId,
      name: name.trim(),
      avatarId: selectedAvatar.id,
      avatarFilename: selectedAvatar.filename,
      isHost: true,
    });
    
    navigate(`/cah/lobby/${roomCode}`);
  };

  return (
    <div className="lobby-layout">
      <button className="btn btn-ghost mb-3" onClick={() => navigate('/')}>
        ← Back
      </button>

      <div className="card" style={{ background: '#000', border: '3px solid #fff' }}>
        <h2 className="mb-3" style={{ color: '#fff' }}>Cards Against Humanity</h2>

        <div className="mb-3">
          <label className="text-secondary mb-1" style={{ display: 'block', fontSize: '0.9rem' }}>
            Room Name <span className="text-muted">(optional)</span>
          </label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Friday Night Degeneracy"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            maxLength={30}
          />
        </div>

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

        <div className="mb-3">
          <label className="text-secondary mb-1" style={{ display: 'block', fontSize: '0.9rem' }}>
            Choose Avatar
          </label>
          <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '4px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
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

        <button
          className="btn btn-primary w-full"
          onClick={handleCreate}
          disabled={!name.trim()}
          style={{ background: '#fff', color: '#000', border: 'none' }}
        >
          Create Room
        </button>
      </div>
    </div>
  );
}
