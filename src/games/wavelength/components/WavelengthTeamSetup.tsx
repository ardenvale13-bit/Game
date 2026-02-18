// Wavelength — Team Setup
import useWavelengthStore from '../wavelengthStore';

interface WavelengthTeamSetupProps {
  onJoinTeam?: (team: 'pink' | 'blue') => void;
  onLeaveTeam?: () => void;
  onStart?: () => void;
}

export default function WavelengthTeamSetup({
  onJoinTeam,
  onLeaveTeam,
  onStart,
}: WavelengthTeamSetupProps) {
  const { players, currentPlayerId } = useWavelengthStore();

  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const isHost = currentPlayer?.isHost ?? false;
  const canStart = useWavelengthStore.getState().canStartGame();

  const pinkPlayers = players.filter(p => p.team === 'pink');
  const bluePlayers = players.filter(p => p.team === 'blue');
  const unassignedPlayers = players.filter(p => p.team === null);

  const isInTeam = (team: 'pink' | 'blue') => currentPlayer?.team === team;

  const handleJoinTeam = (team: 'pink' | 'blue') => {
    if (isInTeam(team)) {
      // Leave team
      if (onLeaveTeam) onLeaveTeam();
      else useWavelengthStore.getState().clearPlayerTeam(currentPlayerId!);
    } else {
      // Join team
      if (onJoinTeam) onJoinTeam(team);
      else useWavelengthStore.getState().setPlayerTeam(currentPlayerId!, team);
    }
  };

  const handleStartGame = () => {
    if (canStart && onStart) {
      onStart();
    } else {
      useWavelengthStore.getState().startGame();
    }
  };

  return (
    <div className="wl-team-setup">
      <h2 className="wl-setup-title">Team Setup</h2>
      <p className="wl-setup-subtitle">Each team needs at least 2 players</p>

      <div className="wl-team-columns">
        {/* Pink Team */}
        <div className="wl-team-column pink">
          <div className="wl-team-header pink">
            <div className="wl-team-color-dot pink" />
            <h3>Pink Team</h3>
          </div>
          <div className="wl-team-roster">
            {pinkPlayers.map(p => (
              <div key={p.id} className={`wl-roster-player ${p.id === currentPlayerId ? 'you' : ''}`}>
                <img src={`/avatars/${p.avatarFilename}`} alt={p.name} />
                <span>{p.name}{p.id === currentPlayerId ? ' (you)' : ''}</span>
              </div>
            ))}
            {pinkPlayers.length < 10 && (
              <button
                className={`wl-join-button ${isInTeam('pink') ? 'active-pink' : ''}`}
                onClick={() => handleJoinTeam('pink')}
              >
                {isInTeam('pink') ? '✗ Leave' : '+ Join'}
              </button>
            )}
          </div>
          <div className="wl-team-count">{pinkPlayers.length} player{pinkPlayers.length !== 1 ? 's' : ''}</div>
        </div>

        {/* Blue Team */}
        <div className="wl-team-column blue">
          <div className="wl-team-header blue">
            <div className="wl-team-color-dot blue" />
            <h3>Blue Team</h3>
          </div>
          <div className="wl-team-roster">
            {bluePlayers.map(p => (
              <div key={p.id} className={`wl-roster-player ${p.id === currentPlayerId ? 'you' : ''}`}>
                <img src={`/avatars/${p.avatarFilename}`} alt={p.name} />
                <span>{p.name}{p.id === currentPlayerId ? ' (you)' : ''}</span>
              </div>
            ))}
            {bluePlayers.length < 10 && (
              <button
                className={`wl-join-button ${isInTeam('blue') ? 'active-blue' : ''}`}
                onClick={() => handleJoinTeam('blue')}
              >
                {isInTeam('blue') ? '✗ Leave' : '+ Join'}
              </button>
            )}
          </div>
          <div className="wl-team-count">{bluePlayers.length} player{bluePlayers.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {unassignedPlayers.length > 0 && (
        <div className="wl-unassigned">
          <h4>Waiting for teams:</h4>
          <div className="wl-unassigned-players">
            {unassignedPlayers.map(p => (
              <div key={p.id} className={`wl-unassigned-player ${p.id === currentPlayerId ? 'you' : ''}`}>
                <img src={`/avatars/${p.avatarFilename}`} alt={p.name} />
                <span>{p.name}{p.id === currentPlayerId ? ' (you)' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isHost && (
        <button
          className={`wl-start-button ${canStart ? 'enabled' : 'disabled'}`}
          onClick={handleStartGame}
          disabled={!canStart}
        >
          {canStart ? 'Start Game' : `Need 2+ per team (${pinkPlayers.length}/${Math.max(pinkPlayers.length, 2)} pink, ${bluePlayers.length}/${Math.max(bluePlayers.length, 2)} blue)`}
        </button>
      )}
    </div>
  );
}
