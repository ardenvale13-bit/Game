// Unified Join Room
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { avatars, getRandomAvatar } from '../data/avatars';
import type { Avatar } from '../data/avatars';
import useLobbyStore from '../store/lobbyStore';
import { findRoom } from '../lib/roomService';
import { savePlayerSession, generatePlayerId } from '../lib/playerSession';

export default function JoinRoom() {
  const navigate = useNavigate();
  const { roomCode: urlRoomCode } = useParams();

  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState(urlRoomCode || '');
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar>(getRandomAvatar());
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const { setRoomCode: setStoreRoomCode, setRoomName: setStoreRoomName, setCurrentPlayer, addPlayer, leaveLobby } = useLobbyStore();

  useEffect(() => {
    if (urlRoomCode) {
      setRoomCode(urlRoomCode.toUpperCase());
    }
  }, [urlRoomCode]);

  const handleJoin = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!roomCode.trim() || roomCode.length !== 6) {
      setError('Please enter a valid 6-character room code');
      return;
    }

    setIsJoining(true);
    setError('');

    // Verify room exists in Supabase
    const room = await findRoom(roomCode.toUpperCase());
    if (!room) {
      setError('Room not found. Check the code and try again.');
      setIsJoining(false);
      return;
    }

    // Reset any existing state
    leaveLobby();

    const playerId = generatePlayerId();
    const code = roomCode.toUpperCase();

    // Save session for reconnection
    savePlayerSession({
      playerId,
      name: name.trim(),
      avatarId: selectedAvatar.id,
      avatarFilename: selectedAvatar.filename,
      roomCode: code,
      isHost: false,
    });

    setStoreRoomCode(code);
    if (room.name) {
      setStoreRoomName(room.name);
    }
    setCurrentPlayer(playerId);
    addPlayer({
      id: playerId,
      name: name.trim(),
      avatarId: selectedAvatar.id,
      avatarFilename: selectedAvatar.filename,
      isHost: false,
    });

    navigate(`/lobby/${code}`);
  };

  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setRoomCode(value.slice(0, 6));
    setError('');
  };

  return (
    <div className="lobby-layout">
      <button className="btn btn-ghost mb-3" onClick={() => navigate('/')}>
        ← Back
      </button>

      <div className="card">
        <h2 className="mb-3">Join Room</h2>

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
          onClick={handleJoin}
          disabled={!name.trim() || roomCode.length !== 6 || isJoining}
        >
          {isJoining ? 'Joining...' : 'Join Room'}
        </button>
      </div>
    </div>
  );
}
