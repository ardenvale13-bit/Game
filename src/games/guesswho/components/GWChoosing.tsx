// Guess Who - Choosing Phase (Chooser picks a character)
import useGuesswhoStore from '../guesswhoStore';

interface GWChoosingProps {
  currentPlayerId: string;
  onChoose: (charId: string) => void;
}

export default function GWChoosing({ currentPlayerId, onChoose }: GWChoosingProps) {
  const { characters, chooserIndex, players, chosenCharacterId } = useGuesswhoStore();

  const chooser = players[chooserIndex];
  const isChooser = currentPlayerId === chooser?.id;

  if (!isChooser) {
    return (
      <div className="gw-layout">
        <div className="gw-waiting-screen">
          <div className="gw-waiting-title">Waiting for {chooser?.name || 'Chooser'}...</div>
          <div className="gw-waiting-message">to pick a character</div>
          <div className="spinner" style={{ marginTop: '32px' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="gw-layout">
      <div className="gw-header">
        <span className="gw-round-badge">
          Round {0} - Your Turn to Choose
        </span>
      </div>

      <div className="gw-prompt-card">
        <div className="gw-prompt-label">Pick a character secretly</div>
        <div className="gw-prompt-text">Other players will ask yes/no questions to figure out who you chose</div>
      </div>

      <div className="gw-character-grid">
        {characters.map((char) => (
          <button
            key={char.id}
            className={`gw-char-card ${chosenCharacterId === char.id ? 'selected' : ''}`}
            onClick={() => onChoose(char.id)}
          >
            <div className="gw-char-image">
              <img src={char.imagePath} alt={char.name} />
            </div>
            <div className="gw-char-name">{char.name}</div>
            {chosenCharacterId === char.id && (
              <div className="gw-char-checkmark">✓</div>
            )}
          </button>
        ))}
      </div>

      {chosenCharacterId && (
        <div className="gw-submit-bar">
          <div className="text-muted" style={{ fontSize: '0.95rem' }}>
            You selected{' '}
            <strong>
              {characters.find(c => c.id === chosenCharacterId)?.name}
            </strong>
          </div>
        </div>
      )}
    </div>
  );
}
