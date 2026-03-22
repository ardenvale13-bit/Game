// Connect Four Multiplayer Wrapper
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useLobbyStore from '../../store/lobbyStore';
import { useBoardGameSync } from '../../hooks/useBoardGameSync';
import './connect4.css';

const ROWS = 6;
const COLS = 7;
type Cell = 0 | 1 | 2;
type Board = Cell[][];

function createBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function dropPiece(board: Board, col: number, player: Cell): [Board, number] {
  const b = board.map(r => [...r]);
  for (let r = ROWS - 1; r >= 0; r--) {
    if (b[r][col] === 0) {
      b[r][col] = player;
      return [b, r];
    }
  }
  return [b, -1];
}

function checkWin(board: Board): { winner: Cell; line: [number, number][] | null } {
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] === 0) continue;
      const p = board[r][c];
      for (const [dr, dc] of dirs) {
        const cells: [number, number][] = [[r, c]];
        let ok = true;
        for (let i = 1; i < 4; i++) {
          const nr = r + dr * i, nc = c + dc * i;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || board[nr][nc] !== p) { ok = false; break; }
          cells.push([nr, nc]);
        }
        if (ok) return { winner: p, line: cells };
      }
    }
  }
  return { winner: 0, line: null };
}

function isFull(board: Board): boolean {
  return board[0].every(c => c !== 0);
}

interface GameState {
  board: Board;
  turn: 1 | 2;
  scores: { p1: number; p2: number; draws: number };
}

export default function Connect4Multiplayer() {
  const navigate = useNavigate();
  const { roomCode } = useParams();
  const { currentPlayerId, players, isHost: checkHost, endGame } = useLobbyStore();
  const hostPlayer = checkHost();

  const sync = useBoardGameSync({
    roomCode: roomCode || '',
    playerId: currentPlayerId || '',
    isHost: hostPlayer,
  });

  const [gameState, setGameState] = useState<GameState>({
    board: createBoard(),
    turn: 1,
    scores: { p1: 0, p2: 0, draws: 0 },
  });

  const myPlayer: 1 | 2 = hostPlayer ? 1 : 2;
  const isMyTurn = gameState.turn === myPlayer;
  const { winner, line } = checkWin(gameState.board);
  const draw = !winner && isFull(gameState.board);
  const gameOver = !!winner || draw;
  const winSet = useMemo(() => new Set(line?.map(([r, c]) => `${r}-${c}`) ?? []), [line]);

  const p1Name = players.find(p => p.isHost)?.name || 'Player 1';
  const p2Name = players.find(p => !p.isHost)?.name || 'Player 2';

  const makeMove = useCallback((col: number) => {
    if (gameOver || gameState.board[0][col] !== 0) return;
    const [newBoard] = dropPiece(gameState.board, col, gameState.turn);
    const newState: GameState = {
      ...gameState,
      board: newBoard,
      turn: gameState.turn === 1 ? 2 : 1,
    };
    const result = checkWin(newBoard);
    if (result.winner) {
      newState.scores = {
        ...gameState.scores,
        [result.winner === 1 ? 'p1' : 'p2']: gameState.scores[result.winner === 1 ? 'p1' : 'p2'] + 1,
      };
    } else if (isFull(newBoard)) {
      newState.scores = { ...gameState.scores, draws: gameState.scores.draws + 1 };
    }
    setGameState(newState);
    sync.broadcastState(newState);
  }, [gameState, gameOver, sync]);

  const handleClick = useCallback((col: number) => {
    if (!isMyTurn || gameOver || gameState.board[0][col] !== 0) return;
    if (hostPlayer) {
      makeMove(col);
    } else {
      sync.sendMove({ col });
    }
  }, [isMyTurn, gameOver, gameState.board, hostPlayer, makeMove, sync]);

  useEffect(() => {
    if (!hostPlayer || !sync.receivedMove) return;
    const move = sync.receivedMove as { col: number };
    if (gameState.turn === 2) makeMove(move.col);
    sync.clearMove();
  }, [sync.receivedMove, hostPlayer, gameState.turn, makeMove, sync]);

  useEffect(() => {
    if (hostPlayer || !sync.receivedState) return;
    setGameState(sync.receivedState as GameState);
  }, [sync.receivedState, hostPlayer]);

  useEffect(() => {
    if (sync.forceEnded) {
      endGame();
      navigate(`/lobby/${roomCode}`);
    }
  }, [sync.forceEnded, endGame, navigate, roomCode]);

  const reset = () => {
    const s: GameState = { board: createBoard(), turn: 1, scores: gameState.scores };
    setGameState(s);
    sync.broadcastState(s);
  };

  const handleBack = () => {
    sync.sendForceEnd();
    endGame();
    navigate(`/lobby/${roomCode}`);
  };

  return (
    <div className="solo-game-layout">
      <div className="solo-game-header">
        <button className="btn btn-ghost btn-small" onClick={handleBack}>← Back to Lobby</button>
        <h2 className="solo-game-title">Connect Four</h2>
        <div className="solo-game-score c4-score">
          <span className="score-1">{p1Name}: {gameState.scores.p1}</span>
          <span className="score-draw">Draw: {gameState.scores.draws}</span>
          <span className="score-2">{p2Name}: {gameState.scores.p2}</span>
        </div>
      </div>

      <div className="c4-status">
        {!sync.isReady ? 'Connecting...'
          : gameOver ? (winner ? `${winner === 1 ? p1Name : p2Name} wins!` : "It's a draw!")
          : isMyTurn ? 'Your turn!' : `Waiting for ${gameState.turn === 1 ? p1Name : p2Name}...`}
      </div>

      <div className="c4-board">
        {Array.from({ length: COLS }, (_, col) => (
          <button
            key={col}
            className="c4-col-btn"
            onClick={() => handleClick(col)}
            disabled={!isMyTurn || gameState.board[0][col] !== 0 || gameOver}
          >
            {Array.from({ length: ROWS }, (_, row) => {
              const cell = gameState.board[row][col];
              return (
                <div
                  key={row}
                  className={`c4-slot ${cell === 1 ? 'filled-1' : cell === 2 ? 'filled-2' : ''} ${winSet.has(`${row}-${col}`) ? 'win-slot' : ''}`}
                >
                  {cell !== 0 && (
                    <img
                      src={cell === 1 ? '/c4-pink.png' : '/c4-teal.png'}
                      alt={cell === 1 ? 'Pink' : 'Teal'}
                      className="c4-token-img"
                    />
                  )}
                </div>
              );
            })}
          </button>
        ))}
      </div>

      {gameOver && hostPlayer && (
        <button className="btn btn-primary" onClick={reset} style={{ marginTop: '16px' }}>
          Play Again
        </button>
      )}
    </div>
  );
}
