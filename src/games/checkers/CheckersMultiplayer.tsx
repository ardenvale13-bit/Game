// Checkers Multiplayer Wrapper
// Host = Player 1 (bottom), Guest = Player 2 (top)
// Reuses all game logic from Checkers.tsx but with network sync
import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useLobbyStore from '../../store/lobbyStore';
import { useBoardGameSync } from '../../hooks/useBoardGameSync';
import './checkers.css';

const SIZE = 8;

type Piece = { player: 1 | 2; king: boolean } | null;
type Board = Piece[][];
type Pos = [number, number];

function createBoard(): Board {
  const b: Board = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < SIZE; c++)
      if ((r + c) % 2 === 1) b[r][c] = { player: 2, king: false };
  for (let r = 5; r < 8; r++)
    for (let c = 0; c < SIZE; c++)
      if ((r + c) % 2 === 1) b[r][c] = { player: 1, king: false };
  return b;
}

function cloneBoard(b: Board): Board {
  return b.map(row => row.map(cell => cell ? { ...cell } : null));
}

function getValidMoves(board: Board, player: 1 | 2) {
  const moves: { from: Pos; to: Pos; captures: Pos[] }[] = [];
  const jumps: typeof moves = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const p = board[r][c];
      if (!p || p.player !== player) continue;
      const dirs = p.king ? [[-1,-1],[-1,1],[1,-1],[1,1]] : player === 1 ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]];
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) continue;
        if (!board[nr][nc]) {
          moves.push({ from: [r, c], to: [nr, nc], captures: [] });
        } else if (board[nr][nc]?.player !== player) {
          const jr = nr + dr, jc = nc + dc;
          if (jr >= 0 && jr < SIZE && jc >= 0 && jc < SIZE && !board[jr][jc])
            jumps.push({ from: [r, c], to: [jr, jc], captures: [[nr, nc]] });
        }
      }
    }
  }
  return jumps.length > 0 ? jumps : moves;
}

function getMultiJumps(board: Board, pos: Pos, player: 1 | 2, isKing: boolean) {
  const results: { to: Pos; captures: Pos[] }[] = [];
  function dfs(r: number, c: number, b: Board, captured: Pos[], king: boolean) {
    let found = false;
    const currentDirs = king ? [[-1,-1],[-1,1],[1,-1],[1,1]] : player === 1 ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]];
    for (const [dr, dc] of currentDirs) {
      const mr = r + dr, mc = c + dc;
      if (mr < 0 || mr >= SIZE || mc < 0 || mc >= SIZE) continue;
      if (b[mr][mc]?.player === player || b[mr][mc] === null) continue;
      if (captured.some(([cr, cc]) => cr === mr && cc === mc)) continue;
      const jr = mr + dr, jc = mc + dc;
      if (jr < 0 || jr >= SIZE || jc < 0 || jc >= SIZE) continue;
      if (b[jr][jc] !== null && !(jr === pos[0] && jc === pos[1])) continue;
      found = true;
      const nb = cloneBoard(b);
      nb[mr][mc] = null;
      const becameKing = king || (player === 1 && jr === 0) || (player === 2 && jr === 7);
      dfs(jr, jc, nb, [...captured, [mr, mc]], becameKing);
    }
    if (!found && captured.length > 0) results.push({ to: [r, c], captures: [...captured] });
  }
  dfs(pos[0], pos[1], board, [], isKing);
  return results;
}

function applyMove(board: Board, from: Pos, to: Pos, captures: Pos[]): Board {
  const b = cloneBoard(board);
  const piece = b[from[0]][from[1]]!;
  b[from[0]][from[1]] = null;
  for (const [cr, cc] of captures) b[cr][cc] = null;
  if (piece.player === 1 && to[0] === 0) piece.king = true;
  if (piece.player === 2 && to[0] === 7) piece.king = true;
  b[to[0]][to[1]] = piece;
  return b;
}

function countPieces(board: Board, player: 1 | 2) {
  let n = 0;
  for (const row of board) for (const c of row) if (c?.player === player) n++;
  return n;
}

interface GameState {
  board: Board;
  turn: 1 | 2;
  scores: { p1: number; p2: number };
}

export default function CheckersMultiplayer() {
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
    board: createBoard(), turn: 1, scores: { p1: 0, p2: 0 },
  });
  const [selected, setSelected] = useState<Pos | null>(null);
  const [validTargets, setValidTargets] = useState<{ to: Pos; captures: Pos[] }[]>([]);

  const myPlayer: 1 | 2 = hostPlayer ? 1 : 2;
  const isMyTurn = gameState.turn === myPlayer;
  const p1Count = countPieces(gameState.board, 1);
  const p2Count = countPieces(gameState.board, 2);
  const p1Moves = getValidMoves(gameState.board, 1);
  const p2Moves = getValidMoves(gameState.board, 2);
  const winner = p2Count === 0 || (gameState.turn === 2 && p2Moves.length === 0) ? 1
    : p1Count === 0 || (gameState.turn === 1 && p1Moves.length === 0) ? 2 : null;
  const gameOver = winner !== null;

  const p1Name = players.find(p => p.isHost)?.name || 'Player 1';
  const p2Name = players.find(p => !p.isHost)?.name || 'Player 2';

  // Host processes a move
  const processMove = useCallback((from: Pos, to: Pos, captures: Pos[]) => {
    const newBoard = applyMove(gameState.board, from, to, captures);
    const newState: GameState = {
      board: newBoard,
      turn: gameState.turn === 1 ? 2 : 1,
      scores: gameState.scores,
    };
    // Check winner after move
    const p1c = countPieces(newBoard, 1);
    const p2c = countPieces(newBoard, 2);
    const p1m = getValidMoves(newBoard, 1);
    const p2m = getValidMoves(newBoard, 2);
    const w = p2c === 0 || (newState.turn === 2 && p2m.length === 0) ? 1
      : p1c === 0 || (newState.turn === 1 && p1m.length === 0) ? 2 : null;
    if (w) {
      newState.scores = w === 1
        ? { ...gameState.scores, p1: gameState.scores.p1 + 1 }
        : { ...gameState.scores, p2: gameState.scores.p2 + 1 };
    }
    setGameState(newState);
    sync.broadcastState(newState);
    setSelected(null);
    setValidTargets([]);
  }, [gameState, sync]);

  const handleCellClick = useCallback((r: number, c: number) => {
    if (gameOver || !isMyTurn) return;
    const piece = gameState.board[r][c];

    if (piece && piece.player === myPlayer) {
      setSelected([r, c]);
      const allMoves = getValidMoves(gameState.board, myPlayer);
      const pieceMoves = allMoves.filter(m => m.from[0] === r && m.from[1] === c);
      const expanded: { to: Pos; captures: Pos[] }[] = [];
      for (const m of pieceMoves) {
        if (m.captures.length > 0) {
          const multi = getMultiJumps(gameState.board, m.from, myPlayer, piece.king);
          if (multi.length > 0) expanded.push(...multi);
          else expanded.push({ to: m.to, captures: m.captures });
        } else {
          expanded.push({ to: m.to, captures: m.captures });
        }
      }
      setValidTargets(expanded);
      return;
    }

    if (selected) {
      const target = validTargets.find(t => t.to[0] === r && t.to[1] === c);
      if (target) {
        if (hostPlayer) {
          processMove(selected, target.to, target.captures);
        } else {
          sync.sendMove({ from: selected, to: target.to, captures: target.captures });
          setSelected(null);
          setValidTargets([]);
        }
      } else {
        setSelected(null);
        setValidTargets([]);
      }
    }
  }, [gameState, gameOver, isMyTurn, myPlayer, selected, validTargets, hostPlayer, processMove, sync]);

  // Host receives moves from guest
  useEffect(() => {
    if (!hostPlayer || !sync.receivedMove) return;
    const move = sync.receivedMove as { from: Pos; to: Pos; captures: Pos[] };
    if (gameState.turn === 2) processMove(move.from, move.to, move.captures);
    sync.clearMove();
  }, [sync.receivedMove, hostPlayer, gameState.turn, processMove, sync]);

  // Guest receives state from host
  useEffect(() => {
    if (hostPlayer || !sync.receivedState) return;
    setGameState(sync.receivedState as GameState);
    setSelected(null);
    setValidTargets([]);
  }, [sync.receivedState, hostPlayer]);

  useEffect(() => {
    if (sync.forceEnded) { endGame(); navigate(`/lobby/${roomCode}`); }
  }, [sync.forceEnded, endGame, navigate, roomCode]);

  const reset = () => {
    const s: GameState = { board: createBoard(), turn: 1, scores: gameState.scores };
    setGameState(s);
    sync.broadcastState(s);
    setSelected(null);
    setValidTargets([]);
  };

  const handleBack = () => { sync.sendForceEnd(); endGame(); navigate(`/lobby/${roomCode}`); };
  const targetSet = new Set(validTargets.map(t => `${t.to[0]}-${t.to[1]}`));

  return (
    <div className="solo-game-layout">
      <div className="solo-game-header">
        <button className="btn btn-ghost btn-small" onClick={handleBack}>← Back to Lobby</button>
        <h2 className="solo-game-title">Checkers</h2>
        <div className="solo-game-score checkers-score">
          <span className="score-1">{p1Name}: {gameState.scores.p1} ({p1Count}pc)</span>
          <span className="score-2">{p2Name}: {gameState.scores.p2} ({p2Count}pc)</span>
        </div>
      </div>
      <div className="checkers-status">
        {!sync.isReady ? 'Connecting...'
          : gameOver ? `${winner === 1 ? p1Name : p2Name} wins!`
          : isMyTurn ? 'Your turn!' : `Waiting for ${gameState.turn === 1 ? p1Name : p2Name}...`}
      </div>
      <div className="checkers-board">
        {Array.from({ length: SIZE }, (_, r) =>
          Array.from({ length: SIZE }, (_, c) => {
            const isDark = (r + c) % 2 === 1;
            const piece = gameState.board[r][c];
            const isSelected = selected?.[0] === r && selected?.[1] === c;
            const isTarget = targetSet.has(`${r}-${c}`);
            return (
              <div
                key={`${r}-${c}`}
                className={`checkers-cell ${isDark ? 'dark' : 'light'} ${isSelected ? 'selected' : ''} ${isTarget ? 'move-target' : ''}`}
                onClick={() => handleCellClick(r, c)}
              >
                {piece && !isTarget && (
                  <div className={`checkers-piece p${piece.player} ${piece.king ? 'king' : ''}`}>
                    <img
                      src={piece.player === 1 ? '/checkers-pink.png' : '/checkers-blue.png'}
                      alt={piece.player === 1 ? 'P1' : 'P2'}
                      className="checkers-piece-img"
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      {gameOver && hostPlayer && (
        <button className="btn btn-primary" onClick={reset} style={{ marginTop: '16px' }}>Play Again</button>
      )}
    </div>
  );
}
