// Codenames — Team panel sidebar (shows during gameplay) + Clue History
import useCodenamesStore from '../codenamesStore';
import type { TeamColor } from '../codenamesData';

interface CodenamesTeamPanelProps {
  team: TeamColor;
}

export default function CodenamesTeamPanel({ team }: CodenamesTeamPanelProps) {
  const {
    players, currentPlayerId, currentTeam,
    pinkRemaining, blueRemaining,
    pinkTeamName, blueTeamName,
    clueHistory,
  } = useCodenamesStore();

  const teamPlayers = players.filter(p => p.team === team);
  const spymasters = teamPlayers.filter(p => p.role === 'spymaster');
  const operatives = teamPlayers.filter(p => p.role === 'operative');
  const remaining = team === 'pink' ? pinkRemaining : blueRemaining;
  const isActiveTurn = currentTeam === team;
  const iconSrc = team === 'pink' ? '/codenames/pink-team-icon.png' : '/codenames/blue-team-icon.png';
  const teamName = team === 'pink' ? pinkTeamName : blueTeamName;

  // Filter clue history for this team
  const teamClues = clueHistory.filter(c => c.team === team);

  return (
    <div className={`cn-team-panel ${team} ${isActiveTurn ? 'active-turn' : ''}`}>
      <div className={`cn-team-title ${team}`}>
        <img src={iconSrc} alt={team} />
        <span>{teamName} — {remaining}</span>
      </div>

      {/* Spymasters */}
      <div className="cn-role-section">
        <div className="cn-role-label">Spymaster</div>
        {spymasters.map(p => (
          <div key={p.id} className={`cn-player-chip ${p.id === currentPlayerId ? 'you' : ''}`}>
            <img src={`/avatars/${p.avatarFilename}`} alt={p.name} />
            <span>{p.name}{p.id === currentPlayerId ? ' (you)' : ''}</span>
          </div>
        ))}
      </div>

      {/* Operatives */}
      <div className="cn-role-section">
        <div className="cn-role-label">Operatives</div>
        {operatives.map(p => (
          <div key={p.id} className={`cn-player-chip ${p.id === currentPlayerId ? 'you' : ''}`}>
            <img src={`/avatars/${p.avatarFilename}`} alt={p.name} />
            <span>{p.name}{p.id === currentPlayerId ? ' (you)' : ''}</span>
          </div>
        ))}
      </div>

      {/* Clue History */}
      {teamClues.length > 0 && (
        <div className="cn-clue-history">
          <div className="cn-role-label">Clue History</div>
          <div className="cn-clue-history-list">
            {teamClues.map((clue, idx) => (
              <div key={idx} className={`cn-clue-history-item ${team}`}>
                <span className="cn-clue-history-word">{clue.word}</span>
                <span className="cn-clue-history-number">
                  {clue.number === 0 ? '∞' : clue.number}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
