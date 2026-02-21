// fAImily Feud - Team Setup Component
import { useState, useRef } from 'react';
import useFamilyFeudStore from '../familyFeudStore';
import type { FFTeam } from '../familyFeudStore';

interface FFTeamSetupProps {
  currentPlayerId: string;
  isHost: boolean;
  onAssignTeam: (playerId: string, team: FFTeam | null) => void;
  onTeamName: (team: FFTeam, name: string) => void;
  onStartGame: () => void;
}

export default function FFTeamSetup({
  currentPlayerId,
  isHost,
  onAssignTeam,
  onTeamName,
  onStartGame,
}: FFTeamSetupProps) {
  const { players, pinkTeamName, purpleTeamName, timeRemaining } = useFamilyFeudStore();
  const [editingPink, setEditingPink] = useState(false);
  const [editingPurple, setEditingPurple] = useState(false);
  const [pinkInput, setPinkInput] = useState(pinkTeamName);
  const [purpleInput, setPurpleInput] = useState(purpleTeamName);
  const pinkInputRef = useRef<HTMLInputElement>(null);
  const purpleInputRef = useRef<HTMLInputElement>(null);

  const pinkPlayers = players.filter((p) => p.team === 'pink');
  const purplePlayers = players.filter((p) => p.team === 'purple');
  const unassigned = players.filter((p) => !p.team);

  const canStart =
    pinkPlayers.length >= 1 &&
    purplePlayers.length >= 1 &&
    Math.abs(pinkPlayers.length - purplePlayers.length) <= 1 &&
    unassigned.length === 0;

  const handleTeamNameSubmit = (team: FFTeam) => {
    if (team === 'pink') {
      onTeamName('pink', pinkInput.trim() || 'Pink Team');
      setEditingPink(false);
    } else {
      onTeamName('purple', purpleInput.trim() || 'Purple Team');
      setEditingPurple(false);
    }
  };

  return (
    <div className="ff-team-setup">
      <div className="ff-header">
        <img src="/ff-icon.png" alt="" className="ff-icon" />
        <h2>fAImily Feud</h2>
        <div className="ff-timer">{timeRemaining}s</div>
      </div>

      <div className="ff-team-setup-subtitle">Choose your teams!</div>

      <div className="ff-teams-row">
        {/* Pink Team */}
        <div className="ff-team-column ff-team-pink">
          <div className="ff-team-header">
            {editingPink ? (
              <form onSubmit={(e) => { e.preventDefault(); handleTeamNameSubmit('pink'); }}>
                <input
                  ref={pinkInputRef}
                  className="ff-team-name-input"
                  value={pinkInput}
                  onChange={(e) => setPinkInput(e.target.value)}
                  onBlur={() => handleTeamNameSubmit('pink')}
                  maxLength={20}
                  autoFocus
                />
              </form>
            ) : (
              <h3
                className="ff-team-name clickable"
                onClick={() => { setEditingPink(true); setPinkInput(pinkTeamName); }}
              >
                {pinkTeamName}
                <span className="ff-edit-hint">✎</span>
              </h3>
            )}
            <div className="ff-team-count">{pinkPlayers.length} players</div>
          </div>
          <div className="ff-team-players">
            {pinkPlayers.map((p) => (
              <div key={p.id} className="ff-team-player">
                <img
                  src={`/avatars/${p.avatarFilename}`}
                  alt=""
                  className="ff-player-avatar"
                />
                <span>{p.name}</span>
                {(p.id === currentPlayerId || isHost) && (
                  <button
                    className="ff-remove-btn"
                    onClick={() => onAssignTeam(p.id, null)}
                    title="Remove from team"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          {!unassigned.length ? null : (
            <div className="ff-join-area">
              {unassigned
                .filter((p) => p.id === currentPlayerId || isHost)
                .map((p) => (
                  <button
                    key={p.id}
                    className="ff-join-btn ff-join-pink"
                    onClick={() => onAssignTeam(p.id, 'pink')}
                  >
                    {p.id === currentPlayerId ? 'Join Pink' : `Add ${p.name}`}
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Unassigned */}
        {unassigned.length > 0 && (
          <div className="ff-unassigned-column">
            <div className="ff-unassigned-label">Unassigned</div>
            {unassigned.map((p) => (
              <div key={p.id} className="ff-unassigned-player">
                <img
                  src={`/avatars/${p.avatarFilename}`}
                  alt=""
                  className="ff-player-avatar"
                />
                <span>{p.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Purple Team */}
        <div className="ff-team-column ff-team-purple">
          <div className="ff-team-header">
            {editingPurple ? (
              <form onSubmit={(e) => { e.preventDefault(); handleTeamNameSubmit('purple'); }}>
                <input
                  ref={purpleInputRef}
                  className="ff-team-name-input"
                  value={purpleInput}
                  onChange={(e) => setPurpleInput(e.target.value)}
                  onBlur={() => handleTeamNameSubmit('purple')}
                  maxLength={20}
                  autoFocus
                />
              </form>
            ) : (
              <h3
                className="ff-team-name clickable"
                onClick={() => { setEditingPurple(true); setPurpleInput(purpleTeamName); }}
              >
                {purpleTeamName}
                <span className="ff-edit-hint">✎</span>
              </h3>
            )}
            <div className="ff-team-count">{purplePlayers.length} players</div>
          </div>
          <div className="ff-team-players">
            {purplePlayers.map((p) => (
              <div key={p.id} className="ff-team-player">
                <img
                  src={`/avatars/${p.avatarFilename}`}
                  alt=""
                  className="ff-player-avatar"
                />
                <span>{p.name}</span>
                {(p.id === currentPlayerId || isHost) && (
                  <button
                    className="ff-remove-btn"
                    onClick={() => onAssignTeam(p.id, null)}
                    title="Remove from team"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          {!unassigned.length ? null : (
            <div className="ff-join-area">
              {unassigned
                .filter((p) => p.id === currentPlayerId || isHost)
                .map((p) => (
                  <button
                    key={p.id}
                    className="ff-join-btn ff-join-purple"
                    onClick={() => onAssignTeam(p.id, 'purple')}
                  >
                    {p.id === currentPlayerId ? 'Join Purple' : `Add ${p.name}`}
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {isHost && (
        <div className="ff-start-area">
          {!canStart && (
            <div className="ff-start-hint">
              {unassigned.length > 0
                ? 'All players must join a team'
                : 'Teams must be balanced (±1 player)'}
            </div>
          )}
          <button
            className="ff-start-btn"
            disabled={!canStart}
            onClick={onStartGame}
          >
            Start Game!
          </button>
        </div>
      )}
    </div>
  );
}
