// Wavelength — Game Over Screen
import { useNavigate } from 'react-router-dom';
import useWavelengthStore from '../wavelengthStore';
import useLobbyStore from '../../../store/lobbyStore';

export default function WavelengthGameOver() {
  const navigate = useNavigate();
  const { winner, pinkScore, blueScore, players, currentPlayerId } = useWavelengthStore();
  const _lobbyStore = useLobbyStore();
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const playerWon = currentPlayer?.team === winner;

  const handleReturnLobby = () => {
    useWavelengthStore.getState().resetGame();
    navigate('/');
  };

  return (
    <div className="wl-game-over">
      <div className="wl-game-over-card">
        <div className="wl-game-over-header">
          <h1 className={`wl-game-over-title ${playerWon ? 'won' : 'lost'}`}>
            {playerWon ? '🎉 Your Team Won!' : 'Game Over'}
          </h1>
        </div>

        <div className="wl-final-scores">
          <div className={`wl-final-score-card ${winner === 'pink' ? 'winner' : ''}`}>
            <div className="wl-team-color-dot pink" />
            <div className="wl-team-name">Pink Team</div>
            <div className="wl-final-score-value">{pinkScore}</div>
          </div>

          <div className="wl-vs">vs</div>

          <div className={`wl-final-score-card ${winner === 'blue' ? 'winner' : ''}`}>
            <div className="wl-team-color-dot blue" />
            <div className="wl-team-name">Blue Team</div>
            <div className="wl-final-score-value">{blueScore}</div>
          </div>
        </div>

        <div className={`wl-final-result ${playerWon ? 'you-won' : 'you-lost'}`}>
          {winner === 'pink' && (
            <span className="wl-winner-text">🔴 Pink Team wins!</span>
          )}
          {winner === 'blue' && (
            <span className="wl-winner-text">🔵 Blue Team wins!</span>
          )}
        </div>

        <button
          className="wl-return-button"
          onClick={handleReturnLobby}
        >
          Return to Lobby
        </button>
      </div>
    </div>
  );
}
