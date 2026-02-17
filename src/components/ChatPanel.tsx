import { useState, useRef, useEffect } from 'react';
import useGameStore from '../store/gameStore';

export default function ChatPanel() {
  const [guess, setGuess] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    currentPlayerId,
    phase,
    submitGuess,
    isCurrentPlayerDrawing,
    players,
  } = useGameStore();

  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const isDrawing = isCurrentPlayerDrawing();
  const hasGuessedCorrectly = currentPlayer?.hasGuessedCorrectly ?? false;
  const canGuess = phase === 'drawing' && !isDrawing && !hasGuessedCorrectly;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || !canGuess || !currentPlayer) return;

    submitGuess(currentPlayerId!, currentPlayer.name, guess.trim());
    setGuess('');
  };

  const getInputPlaceholder = () => {
    if (isDrawing) return "You're drawing!";
    if (hasGuessedCorrectly) return "You guessed correctly! 🎉";
    if (phase !== 'drawing') return "Waiting...";
    return "Type your guess...";
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        fontWeight: 600,
      }}>
        💬 Guesses
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="text-muted text-center" style={{ 
            marginTop: 'auto', 
            marginBottom: 'auto',
            fontSize: '0.9rem',
          }}>
            Guesses will appear here...
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`chat-message ${msg.isCorrectGuess ? 'correct' : ''} ${msg.isSystemMessage ? 'system' : ''}`}
            >
              {!msg.isSystemMessage && (
                <div className="author">{msg.playerName}</div>
              )}
              <div>{msg.content}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-container">
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="input"
            placeholder={getInputPlaceholder()}
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            disabled={!canGuess}
            maxLength={50}
            autoComplete="off"
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!canGuess || !guess.trim()}
            style={{ padding: '12px 16px' }}
          >
            ↵
          </button>
        </form>

        {/* Status indicator */}
        {hasGuessedCorrectly && (
          <div className="text-success text-center mt-1" style={{ fontSize: '0.85rem' }}>
            ✓ You got it!
          </div>
        )}
        {isDrawing && (
          <div className="text-muted text-center mt-1" style={{ fontSize: '0.85rem' }}>
            You're the artist this round
          </div>
        )}
      </div>
    </div>
  );
}
