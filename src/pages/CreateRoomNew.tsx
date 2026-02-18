// Unified Create Room - Just name and avatar
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { avatars } from '../data/avatars';
import type { Avatar } from '../data/avatars';
import useLobbyStore from '../store/lobbyStore';
import { createRoom } from '../lib/roomService';
import { savePlayerSession, generatePlayerId } from '../lib/playerSession';

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
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const { setRoomCode, setRoomName: setStoreRoomName, setCurrentPlayer, addPlayer, leaveLobby } = useLobbyStore();

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsCreating(true);
    setError('');

    // Reset any existing state
    leaveLobby();

    const roomCode = generateRoomCode();
    const playerId = generatePlayerId();

    // Create room in Supabase
    const room = await createRoom(roomCode, roomName.trim() || null, playerId);
    if (!room) {
      setError('Failed to create room. Try again.');
      setIsCreating(false);
      return;
    }

    // Save session for reconnection
    savePlayerSession({
      playerId,
      name: name.trim(),
      avatarId: selectedAvatar.id,
      avatarFilename: selectedAvatar.filename,
      roomCode,
      isHost: true,
    });

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

    navigate(`/lobby/${roomCode}`);
  };

  return (
    <div className="lobby-layout">
      <button className="btn btn-ghost mb-3" onClick={() => navigate('/')}>
        ← Back
      </button>

      <div className="card">
        <h2 className="mb-3">Create Room</h2>

        <div className="mb-3">
          <label className="text-secondary mb-1" style={{ display: 'block', fontSize: '0.9rem' }}>
            Room Name <span className="text-muted">(optional)</span>
          </label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Friday Night Games"
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
          <div style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'hidden', padding: '4px' }}>
            <div className="avatar-grid">
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

        {error && (
          <div className="text-danger mb-2" style={{ fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <button
          className="btn btn-primary w-full"
          onClick={handleCreate}
          disabled={!name.trim() || isCreating}
        >
          {isCreating ? 'Creating...' : 'Create Room'}
        </button>
      </div>
    </div>
  );
}
