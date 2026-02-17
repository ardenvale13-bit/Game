// Codenames — Team Setup (pre-game role/team selection)
import useCodenamesStore from '../codenamesStore';
import type { TeamColor, PlayerRole } from '../codenamesData';

interface CodenamesTeamSetupProps {
  onJoinTeam?: (team: TeamColor, role: PlayerRole) => void;
  onLeaveTeam?: () => void;
  onStart?: () => void;
  onTimerToggle?: (enabled: boolean) => void;
}

export default function CodenamesTeamSetup({ onJoinTeam, onLeaveTeam, onStart, onTimerToggle }: CodenamesTeamSetupProps) {
  const { players, currentPlayerId, timerEnabled } = useCodenamesStore();

  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const isHost = currentPlayer?.isHost ?? false;
  const canStart = useCodenamesStore.getState().canStartGame();

  const getTeamRolePlayers = (team: TeamColor, role: PlayerRole) =>
    players.filter(p => p.team === team && p.role === role);

  const isInSlot = (team: TeamColor, role: PlayerRole) =>
    currentPlayer?.team === team && currentPlayer?.role === role;

  const handleJoin = (team: TeamColor, role: PlayerRole) => {
    if (isInSlot(team, role)) {
      // Already in this slot — leave
      if (onLeaveTeam) onLeaveTeam();
      else useCodenamesStore.getState().clearPlayerTeamRole(currentPlayerId!);
    } else {
      if (onJoinTeam) onJoinTeam(team, role);
      else useCodenamesStore.getState().setPlayerTeamRole(currentPlayerId!, team, role);
    }
  };

  const renderSlot = (team: TeamColor, role: PlayerRole, maxSlots: number) => {
    const slotPlayers = getTeamRolePlayers(team, role);
    const iAmHere = isInSlot(team, role);

    return (
      <div className="cn-role-slot">
        <div className="cn-role-slot-title">
          {role === 'spymaster' ? '🕵️ Spymaster' : '🔍 Operative'} ({slotPlayers.length}/{maxSlots})
        </div>
        <div className="cn-slot-players">
          {slotPlayers.map(p => (
            <div key={p.id} className={`cn-slot-player ${p.id === currentPlayerId ? 'you' : ''}`}>
              <img src={`/avatars/${p.avatarFilename}`} alt={p.name} />
              <span>{p.name}{p.id === currentPlayerId ? ' (you)' : ''}</span>
            </div>
          ))}
          {slotPlayers.length < maxSlots && (
            <button
              className={`cn-join-btn ${iAmHere ? `active-${team}` : ''}`}
              onClick={() => handleJoin(team, role)}
            >
              {iAmHere ? '← Leave' : '+ Join'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="cn-setup-layout">
      <div className="cn-setup-header">
        <img src="/codenames-icon.png" alt="Codenames" />
        <h2>Choose Your Team</h2>
        <p className="text-muted" style={{ fontSize: '0.9rem' }}>
          Each team needs at least 1 spymaster and 1 operative
        </p>
      </div>

      <div className="cn-teams-row">
        {/* Pink Team */}
        <div className="cn-team-column pink">
          <div className="cn-team-column-header">
            <img src="/codenames/pink-team-icon.png" alt="Pink" />
            <span className="cn-team-title pink">Pink Team</span>
          </div>
          {renderSlot('pink', 'spymaster', 2)}
          {renderSlot('pink', 'operative', 7)}
        </div>

        {/* Blue Team */}
        <div className="cn-team-column blue">
          <div className="cn-team-column-header">
            <img src="/codenames/blue-team-icon.png" alt="Blue" />
            <span className="cn-team-title blue">Blue Team</span>
          </div>
          {renderSlot('blue', 'spymaster', 2)}
          {renderSlot('blue', 'operative', 7)}
        </div>
      </div>

      {/* Timer toggle */}
      {isHost && (
        <div className="card mb-3" style={{ padding: '12px' }}>
          <div className="flex justify-between items-center">
            <span style={{ fontSize: '0.9rem' }}>Turn Timer</span>
            <button
              className={`btn ${timerEnabled ? 'btn-primary' : 'btn-secondary'} btn-small`}
              onClick={() => {
                const next = !timerEnabled;
                useCodenamesStore.getState().setTimerEnabled(next);
                if (onTimerToggle) onTimerToggle(next);
              }}
            >
              {timerEnabled ? 'On' : 'Off'}
            </button>
          </div>
        </div>
      )}

      {/* Unassigned players */}
      {players.filter(p => !p.team).length > 0 && (
        <div className="card mb-3" style={{ padding: '12px' }}>
          <div className="text-muted mb-1" style={{ fontSize: '0.8rem' }}>Unassigned</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {players.filter(p => !p.team).map(p => (
              <div key={p.id} className="cn-slot-player">
                <img src={`/avatars/${p.avatarFilename}`} alt={p.name} />
                <span>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Start button */}
      {isHost ? (
        <button
          className="btn btn-primary btn-large w-full"
          disabled={!canStart}
          onClick={onStart}
        >
          {canStart ? 'Start Game' : 'Need 1 spymaster + 1 operative per team'}
        </button>
      ) : (
        <div className="card text-center">
          <div className="text-muted">Waiting for host to start...</div>
        </div>
      )}
    </div>
  );
}
