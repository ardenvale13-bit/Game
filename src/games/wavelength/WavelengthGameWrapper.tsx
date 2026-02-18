// Wavelength — Main game orchestrator
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import useLobbyStore from '../../store/lobbyStore';
import useWavelengthStore from './wavelengthStore';
import { useWavelengthSync } from '../../hooks/useWavelengthSync';

import WavelengthTeamSetup from './components/WavelengthTeamSetup';
import WavelengthClueInput from './components/WavelengthClueInput';
import WavelengthDial from './components/WavelengthDial';
import WavelengthCounterGuess from './components/WavelengthCounterGuess';
import WavelengthGameOver from './components/WavelengthGameOver';

import './wavelength.css';

export default function WavelengthGameWrapper() {
  const { roomCode } = useParams();

  const lobby = useLobbyStore();
  const wl = useWavelengthStore();

  const isHost = lobby.isHost();
  const currentPlayerId = lobby.currentPlayerId;

  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showRevealContent, setShowRevealContent] = useState(false);

  // Sync hook
  const {
    broadcastGameState,
    sendJoinTeam,
    sendLeaveTeam,
    sendSubmitClue,
    sendSubmitTeamGuess,
    sendSubmitCounterGuess,
    sendAdvanceRound,
  } = useWavelengthSync({
    roomCode: roomCode || null,
    playerId: currentPlayerId,
    isHost,
  });

  // Initialize store with lobby players
  useEffect(() => {
    if (!roomCode || !currentPlayerId) return;

    wl.setRoomCode(roomCode);
    wl.setCurrentPlayer(currentPlayerId);

    // Add all lobby players to wavelength store
    for (const p of lobby.players) {
      wl.addPlayer({
        id: p.id,
        name: p.name,
        avatarId: p.avatarId,
        avatarFilename: p.avatarFilename,
        isHost: p.isHost,
      });
    }

    // Start in team-setup phase
    useWavelengthStore.setState({ phase: 'team-setup' });
  }, [roomCode, currentPlayerId]);

  // Watch for phase changes to reveal phase
  useEffect(() => {
    if (wl.phase === 'reveal') {
      setShowRevealContent(false);
      // Show the reveal content after a brief delay
      const timeout = setTimeout(() => {
        setShowRevealContent(true);
      }, 300);
      revealTimeoutRef.current = timeout;

      // Auto-advance after 5 seconds in reveal phase (host only)
      const advanceTimeout = isHost ? setTimeout(() => {
        sendAdvanceRound();
      }, 5000) : null;

      return () => {
        clearTimeout(timeout);
        if (advanceTimeout) clearTimeout(advanceTimeout);
      };
    }
  }, [wl.phase]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    };
  }, []);

  const currentPlayer = wl.players.find(p => p.id === currentPlayerId);
  const isPsychic = wl.isCurrentPsychic(currentPlayerId!);
  const isCurrentTeam = currentPlayer?.team === wl.currentTeam;

  // Determine what to render based on phase
  const renderGameContent = () => {
    switch (wl.phase) {
      case 'lobby':
        return <div>Waiting for host to start...</div>;

      case 'team-setup':
        return (
          <WavelengthTeamSetup
            onJoinTeam={(team) => sendJoinTeam(team)}
            onLeaveTeam={() => sendLeaveTeam()}
            onStart={() => {
              if (isHost) {
                wl.startGame();
                // Broadcast new game state (psychic-clue phase) to all non-host players
                setTimeout(() => broadcastGameState(), 100);
              }
            }}
          />
        );

      case 'psychic-clue':
        return (
          <div className="wl-game-layout">
            <div className="wl-game-header">
              <h2 className="wl-round-title">
                {wl.currentTeam === 'pink' ? '🔴 Pink' : '🔵 Blue'} Team's Turn
              </h2>
              <div className="wl-score-display">
                <span className="wl-score pink">{wl.pinkScore}</span>
                <span className="wl-score-sep">—</span>
                <span className="wl-score blue">{wl.blueScore}</span>
              </div>
            </div>

            {isPsychic ? (
              <WavelengthClueInput
                onSubmitClue={(clue) => sendSubmitClue(clue)}
              />
            ) : (
              <div className="wl-waiting-section">
                <div className="wl-waiting-role">
                  {isPsychic ? '🎭 You are the Psychic' : '👥 Team Member'}
                </div>
                <div className="wl-waiting-message">
                  <p>Waiting for {wl.getCurrentPsychic()?.name || 'psychic'} to give a clue...</p>
                  <div className="wl-spinner" />
                </div>
              </div>
            )}
          </div>
        );

      case 'team-guess':
        return (
          <div className="wl-game-layout">
            <div className="wl-game-header">
              <h2 className="wl-round-title">
                {wl.currentTeam === 'pink' ? '🔴 Pink' : '🔵 Blue'} Team — Guess the Position!
              </h2>
              <div className="wl-score-display">
                <span className="wl-score pink">{wl.pinkScore}</span>
                <span className="wl-score-sep">—</span>
                <span className="wl-score blue">{wl.blueScore}</span>
              </div>
            </div>

            <div className="wl-guess-container">
              <div className="wl-clue-display">
                <span className="wl-clue-label">Clue:</span>
                <span className="wl-clue-text">{wl.currentClue}</span>
              </div>

              {wl.spectrum && (
                <WavelengthDial
                  leftLabel={wl.spectrum.left}
                  rightLabel={wl.spectrum.right}
                  guessPosition={wl.teamGuessPosition}
                  isInteractive={isCurrentTeam}
                  onGuessChange={(pos) => {
                    useWavelengthStore.setState({ teamGuessPosition: pos });
                  }}
                />
              )}

              {isCurrentTeam && (
                <button
                  className="wl-guess-submit"
                  onClick={() => sendSubmitTeamGuess(wl.teamGuessPosition)}
                >
                  Submit Guess
                </button>
              )}

              {!isCurrentTeam && (
                <div className="wl-waiting-section">
                  <p>Waiting for {wl.currentTeam === 'pink' ? 'pink' : 'blue'} team to guess...</p>
                  <div className="wl-spinner" />
                </div>
              )}
            </div>
          </div>
        );

      case 'counter-guess':
        return (
          <div className="wl-game-layout">
            <div className="wl-game-header">
              <h2 className="wl-round-title">Bonus Round!</h2>
              <div className="wl-score-display">
                <span className="wl-score pink">{wl.pinkScore}</span>
                <span className="wl-score-sep">—</span>
                <span className="wl-score blue">{wl.blueScore}</span>
              </div>
            </div>

            <WavelengthCounterGuess
              onSubmitGuess={(guess) => sendSubmitCounterGuess(guess)}
            />
          </div>
        );

      case 'reveal':
        return (
          <div className="wl-game-layout wl-reveal-layout">
            <div className="wl-game-header">
              <h2 className="wl-round-title">Reveal!</h2>
              <div className="wl-score-display">
                <span className="wl-score pink">{wl.pinkScore}</span>
                <span className="wl-score-sep">—</span>
                <span className="wl-score blue">{wl.blueScore}</span>
              </div>
            </div>

            {showRevealContent && wl.spectrum && (
              <div className="wl-reveal-content">
                <WavelengthDial
                  leftLabel={wl.spectrum.left}
                  rightLabel={wl.spectrum.right}
                  targetPosition={wl.targetPosition}
                  guessPosition={wl.teamGuessPosition}
                  showTarget={true}
                  roundAccuracy={wl.roundAccuracy}
                />

                <div className="wl-reveal-breakdown">
                  <div className="wl-reveal-section">
                    <h4>{wl.currentTeam === 'pink' ? '🔴 Pink' : '🔵 Blue'} Team Guess</h4>
                    <p className="wl-reveal-position">{Math.round(wl.teamGuessPosition)}%</p>
                    <p className="wl-reveal-accuracy wl-accuracy-{wl.roundAccuracy}">
                      {wl.roundAccuracy === 'bullseye' && '🎯 Bullseye! +4 pts'}
                      {wl.roundAccuracy === 'close' && '✓ Close! +3 pts'}
                      {wl.roundAccuracy === 'near' && '~ Near! +2 pts'}
                      {wl.roundAccuracy === 'miss' && '✗ Miss! +0 pts'}
                    </p>
                  </div>

                  {wl.lastCounterCorrect !== null && (
                    <div className="wl-reveal-section">
                      <h4>{wl.currentTeam === 'pink' ? '🔵 Blue' : '🔴 Pink'} Team Counter</h4>
                      <p className="wl-reveal-counter">
                        {wl.lastCounterCorrect ? (
                          <>✓ Correct! +1 bonus pt</>
                        ) : (
                          <>✗ Wrong</>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                <p className="wl-reveal-next">Next round in 5 seconds...</p>
              </div>
            )}
          </div>
        );

      case 'game-over':
        return <WavelengthGameOver />;

      default:
        return <div>Unknown phase</div>;
    }
  };

  return (
    <div className="wl-wrapper">
      <div className="wl-container">
        {renderGameContent()}
      </div>
    </div>
  );
}
