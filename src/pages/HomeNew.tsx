// Home Page - Simple create/join
import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useLobbyStore from '../store/lobbyStore';

// Sparkle particle component
function Sparkle({ delay, x, y, size }: { delay: number; x: number; y: number; size: number }) {
  return (
    <div
      className="sparkle"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${size}px`,
        height: `${size}px`,
        animationDelay: `${delay}ms`,
      }}
    />
  );
}

// Generate sparkle data once
const sparkles = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  delay: Math.random() * 1200 + 200,
  x: Math.random() * 120 - 10,
  y: Math.random() * 120 - 10,
  size: Math.random() * 6 + 3,
}));

export default function Home() {
  const navigate = useNavigate();
  const leaveLobby = useLobbyStore((state) => state.leaveLobby);
  const [entered, setEntered] = useState(false);
  const audioPlayed = useRef(false);

  // Clear any lingering state when landing on home
  useEffect(() => {
    leaveLobby();
  }, [leaveLobby]);

  // Entrance animation trigger
  useEffect(() => {
    const timer = setTimeout(() => setEntered(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Sound effect helper
  const playEntranceSound = useCallback(() => {
    if (audioPlayed.current) return;
    audioPlayed.current = true;

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Whoosh sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.6);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.1);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.7);

      // Sparkle chime
      const chime = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chime.type = 'triangle';
      chime.frequency.setValueAtTime(1200, ctx.currentTime + 0.2);
      chime.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.5);
      chimeGain.gain.setValueAtTime(0, ctx.currentTime + 0.2);
      chimeGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.3);
      chimeGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
      chime.connect(chimeGain).connect(ctx.destination);
      chime.start(ctx.currentTime + 0.2);
      chime.stop(ctx.currentTime + 0.9);

      // Cleanup
      setTimeout(() => ctx.close(), 2000);
    } catch {
      // Audio not available, no big deal
    }
  }, []);

  // Try playing sound on entrance (works if returning from lobby)
  // Also listen for first user interaction to play on cold opens
  useEffect(() => {
    if (!entered) return;

    // Try immediately — works if there's been prior interaction
    playEntranceSound();

    // Fallback: play on first click/tap/keypress for cold opens
    if (!audioPlayed.current) {
      const handler = () => {
        playEntranceSound();
        window.removeEventListener('click', handler);
        window.removeEventListener('touchstart', handler);
        window.removeEventListener('keydown', handler);
      };
      window.addEventListener('click', handler);
      window.addEventListener('touchstart', handler);
      window.addEventListener('keydown', handler);

      return () => {
        window.removeEventListener('click', handler);
        window.removeEventListener('touchstart', handler);
        window.removeEventListener('keydown', handler);
      };
    }
  }, [entered, playEntranceSound]);

  return (
    <div className="home-layout">
      <div className={`home-header-entrance ${entered ? 'entered' : ''}`}>
        <div className="sparkle-container">
          {sparkles.map((s) => (
            <Sparkle key={s.id} delay={s.delay} x={s.x} y={s.y} size={s.size} />
          ))}
        </div>
        <div className="home-logo">
          <img
            src="/controller.png"
            alt="Controller"
            className="home-controller-img"
          />
        </div>
        <img
          src="/game-time.png"
          alt="Game Time"
          className="home-header-img"
        />
      </div>
      <p className={`tagline ${entered ? 'tagline-entered' : ''}`}>
        Party games for the digitally unhinged
      </p>

      <div className={`home-actions ${entered ? 'actions-entered' : ''}`}>
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

      <p className={`text-muted mt-4 ${entered ? 'actions-entered' : ''}`} style={{ fontSize: '0.9rem' }}>
        No account needed • Just jump in and play
      </p>
    </div>
  );
}
