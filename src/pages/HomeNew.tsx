// Home Page - Simple create/join
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLobbyStore from '../store/lobbyStore';

export default function Home() {
  const navigate = useNavigate();
  const leaveLobby = useLobbyStore((state) => state.leaveLobby);

  // Clear any lingering state when landing on home
  useEffect(() => {
    leaveLobby();
  }, [leaveLobby]);

  return (
    <div className="home-layout">
      <div className="logo">
        <img 
          src="/controller.png" 
          alt="Game Time"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
      <h1 className="game-title">Game Time</h1>
      <p className="tagline">Party games for the digitally unhinged</p>
      
      <div className="home-actions">
        <button 
          className="btn btn-primary btn-large w-full"
          onClick={() => navigate('/create')}
        >
          Create Room
        </button>
        
        <button 
          className="btn btn-secondary btn-large w-full"
          onClick={() => navigate('/join')}
        >
          Join Room
        </button>
      </div>

      <p className="text-muted mt-4" style={{ fontSize: '0.9rem' }}>
        No account needed • Just jump in and play
      </p>
    </div>
  );
}
