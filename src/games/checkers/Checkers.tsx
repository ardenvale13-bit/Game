// Checkers
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Difficulty, CheckersColor } from '../../pages/SoloGameRouter';
import './checkers.css';

const SIZE = 8;

type Piece = { player: 1 | 2; king: boolean } | null;
type Board = Piece[][];
type Pos = [number, number];

interface Props {
  mode: 'ai' | 'local';
  difficulty: Difficulty;
  playerColor?: CheckersColor;
}

// Map player color choices to images
const CHECKERS_PIECE_IMGS: Record<CheckersColor, string> = {
  pink: '/checkers-pink.png',
  blue: '/checkers-blue.png',
  purple: '/checkers-purple.png',
};

// Opponent gets a contrasting color
function getOpponentColor(c: CheckersColor): CheckersColor {
  if (c === 'pink') return 'blue';
  if (c === 'blue') return 'pink';
  return 'blue'; // purple -> blue
}

function createBoard(): Board {
  const b: Board = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < SIZE; c++) {
      if ((r + c) % 2 === 1) b[r][c] = { player: 2, king: false };
    }
  }
  for (let r = 5; r < 8; r++) {
    for (let c = 0; c < SIZE; c++) {
      if ((r + c) % 2 === 1) b[r][c] = { player: 1, king: false };
    }
  }
  return b;
}

function cloneBoard(b: Board): Board {
  return b.map(row => row.map(cell => cell ? { ...cell } : null));
}

function getValidMoves(board: Board, player: 1 | 2): { from: Pos; to: Pos; captures: Pos[] }[] {
  const moves: { from: Pos; to: Pos; captures: Pos[] }[] = [];
  const jumps: typeof moves = [];

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const p = board[r][c];
      if (!p || p.player !== player) continue;
      const dirs = p.king
        ? [[-1,-1],[-1,1],[1,-1],[1,1]]
        : player === 1
          ? [[-1,-1],[-1,1]]
          : [[1,-1],[1,1]];

      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) continue;
        if (!board[nr][nc]) {
          moves.push({ from: [r, c], to: [nr, nc], captures: [] });
        } else if (board[nr][nc]?.player !== player) {
          const jr = nr + dr, jc = nc + dc;
          if (jr >= 0 && jr < SIZE && jc >= 0 && jc < SIZE && !board[jr][jc]) {
            jumps.push({ from: [r, c], to: [jr, jc], captures: [[nr, nc]] });
          }
        }
      }
    }
  }

  // Must jump if possible
  return jumps.length > 0 ? jumps : moves;
}

function getMultiJumps(board: Board, pos: Pos, player: 1 | 2, isKing: boolean): { to: Pos; captures: Pos[] }[] {
  const results: { to: Pos; captures: Pos[] }[] = [];

  function dfs(r: number, c: number, b: Board, captured: Pos[], king: boolean) {
    let found = false;
    const currentDirs = king
      ? [[-1,-1],[-1,1],[1,-1],[1,1]]
      : player === 1
        ? [[-1,-1],[-1,1]]
        : [[1,-1],[1,1]];

    for (const [dr, dc] of currentDirs) {
      const mr = r + dr, mc = c + dc;
      if (mr < 0 || mr >= SIZE || mc < 0 || mc >= SIZE) continue;
      if (b[mr][mc]?.player === player || b[mr][mc] === null) continue;
      // It's an opponent piece
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
    if (!found && captured.length > 0) {
      results.push({ to: [r, c], captures: [...captured] });
    }
  }

  dfs(pos[0], pos[1], board, [], isKing);
  return results;
}

function applyMove(board: Board, from: Pos, to: Pos, captures: Pos[]): Board {
  const b = cloneBoard(board);
  const piece = b[from[0]][from[1]]!;
  b[from[0]][from[1]] = null;
  for (const [cr, cc] of captures) b[cr][cc] = null;
  // King promotion
  if (piece.player === 1 && to[0] === 0) piece.king = true;
  if (piece.player === 2 && to[0] === 7) piece.king = true;
  b[to[0]][to[1]] = piece;
  return b;
}

function countPieces(board: Board, player: 1 | 2): number {
  let count = 0;
  for (const row of board) for (const cell of row) if (cell?.player === player) count++;
  return count;
}

function evaluateBoard(board: Board): number {
  let score = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const p = board[r][c];
      if (!p) continue;
      const val = p.king ? 3 : 1;
      // Positional bonus: advance pieces
      const posBonus = p.player === 2 ? r * 0.1 : (7 - r) * 0.1;
      score += p.player === 2 ? (val + posBonus) : -(val + posBonus);
    }
  }
  return score;
}

function aiMove(board: Board, difficulty: Difficulty): { from: Pos; to: Pos; captures: Pos[] } | null {
  const moves = getValidMoves(board, 2);
  if (moves.length === 0) return null;

  // Expand multi-jumps
  const expanded: typeof moves = [];
  for (const m of moves) {
    if (m.captures.length > 0) {
      const piece = board[m.from[0]][m.from[1]]!;
      const multiJumps = getMultiJumps(board, m.from, 2, piece.king);
      if (multiJumps.length > 0) {
        for (const mj of multiJumps) {
          expanded.push({ from: m.from, to: mj.to, captures: mj.captures });
        }
      } else {
        expanded.push(m);
      }
    } else {
      expanded.push(m);
    }
  }

  const pool = expanded.length > 0 ? expanded : moves;

  if (difficulty === 'easy') {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Greedy with depth
  const depth = difficulty === 'hard' ? 4 : 2;

  function search(b: Board, d: number, maximizing: boolean, alpha: number, beta: number): number {
    if (d === 0) return evaluateBoard(b);
    const player = maximizing ? 2 : 1;
    const playerMoves = getValidMoves(b, player);
    if (playerMoves.length === 0) return maximizing ? -1000 : 1000;

    if (maximizing) {
      let best = -Infinity;
      for (const m of playerMoves) {
        const nb = applyMove(b, m.from, m.to, m.captures);
        best = Math.max(best, search(nb, d - 1, false, alpha, beta));
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    } else {
      let best = Infinity;
      for (const m of playerMoves) {
        const nb = applyMove(b, m.from, m.to, m.captures);
        best = Math.min(best, search(nb, d - 1, true, alpha, beta));
        beta = Math.min(beta, best);
        if (beta <= alpha) break;
      }
      return best;
    }
  }

  if (difficulty === 'medium' && Math.random() < 0.3) {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  let bestScore = -Infinity;
  let bestMove = pool[0];
  for (const m of pool) {
    const nb = applyMove(board, m.from, m.to, m.captures);
    const score = search(nb, depth - 1, false, -Infinity, Infinity);
    if (score > bestScore) {
      bestScore = score;
      bestMove = m;
    }
  }
  return bestMove;
}

export default function Checkers({ mode, difficulty, playerColor = 'pink' }: Props) {
  const p1Img = CHECKERS_PIECE_IMGS[playerColor];
  const p2Img = CHECKERS_PIECE_IMGS[getOpponentColor(playerColor)];
  const navigate = useNavigate();
  const [board, setBoard] = useState<Board>(createBoard);
  const [turn, setTurn] = useState<1 | 2>(1);
  const [selected, setSelected] = useState<Pos | null>(null);
  const [validTargets, setValidTargets] = useState<{ to: Pos; captures: Pos[] }[]>([]);
  const [scores, setScores] = useState({ p1: 0, p2: 0 });

  const p1Count = countPieces(board, 1);
  const p2Count = countPieces(board, 2);
  const p1Moves = getValidMoves(board, 1);
  const p2Moves = getValidMoves(board, 2);

  const winner = p2Count === 0 || (turn === 2 && p2Moves.length === 0)
    ? 1
    : p1Count === 0 || (turn === 1 && p1Moves.length === 0)
      ? 2
      : null;
  const gameOver = winner !== null;

  useEffect(() => {
    if (winner) {
      setScores(s => winner === 1 ? { ...s, p1: s.p1 + 1 } : { ...s, p2: s.p2 + 1 });
    }
  }, [winner]);

  const handleCellClick = useCallback((r: number, c: number) => {
    if (gameOver) return;
    if (mode === 'ai' && turn === 2) return;

    const piece = board[r][c];

    // Clicking own piece - select it
    if (piece && piece.player === turn) {
      setSelected([r, c]);
      const allMoves = getValidMoves(board, turn);
      const pieceMoves = allMoves.filter(m => m.from[0] === r && m.from[1] === c);

      // Expand multi-jumps
      const expanded: { to: Pos; captures: Pos[] }[] = [];
      for (const m of pieceMoves) {
        if (m.captures.length > 0) {
          const multiJumps = getMultiJumps(board, m.from, turn, piece.king);
          if (multiJumps.length > 0) {
            expanded.push(...multiJumps);
          } else {
            expanded.push({ to: m.to, captures: m.captures });
          }
        } else {
          expanded.push({ to: m.to, captures: m.captures });
        }
      }
      setValidTargets(expanded);
      return;
    }

    // Clicking target square
    if (selected) {
      const target = validTargets.find(t => t.to[0] === r && t.to[1] === c);
      if (target) {
        const newBoard = applyMove(board, selected, target.to, target.captures);
        setBoard(newBoard);
        setTurn(turn === 1 ? 2 : 1);
        setSelected(null);
        setValidTargets([]);
      } else {
        setSelected(null);
        setValidTargets([]);
      }
    }
  }, [board, turn, selected, validTargets, gameOver, mode]);

  // AI move
  useEffect(() => {
    if (mode !== 'ai' || turn !== 2 || gameOver) return;
    const timer = setTimeout(() => {
      const move = aiMove(board, difficulty);
      if (move) {
        const newBoard = applyMove(board, move.from, move.to, move.captures);
        setBoard(newBoard);
        setTurn(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [turn, mode, board, difficulty, gameOver]);

  const reset = () => {
    setBoard(createBoard());
    setTurn(1);
    setSelected(null);
    setValidTargets([]);
  };

  const p1 = mode === 'ai' ? 'You' : 'Player 1';
  const p2 = mode === 'ai' ? 'Computer' : 'Player 2';

  const targetSet = new Set(validTargets.map(t => `${t.to[0]}-${t.to[1]}`));

  return (
    <div className="solo-game-layout">
      <div className="solo-game-header">
        <button className="btn btn-ghost btn-small" onClick={() => navigate('/solo')}>← Back</button>
        <h2 className="solo-game-title">Checkers</h2>
        <div className="solo-game-score checkers-score">
          <span className="score-1">{p1}: {scores.p1} ({p1Count}pc)</span>
          <span className="score-2">{p2}: {scores.p2} ({p2Count}pc)</span>
        </div>
      </div>

      <div className="checkers-status">
        {gameOver
          ? `${winner === 1 ? p1 : p2} wins!`
          : `${turn === 1 ? p1 : p2}'s turn`
        }
      </div>

      <div className="checkers-board">
        {Array.from({ length: SIZE }, (_, r) =>
          Array.from({ length: SIZE }, (_, c) => {
            const isDark = (r + c) % 2 === 1;
            const piece = board[r][c];
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
                      src={piece.player === 1 ? p1Img : p2Img}
                      alt={piece.player === 1 ? 'Your piece' : 'Opponent'}
                      className="checkers-piece-img"
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {gameOver && (
        <button className="btn btn-primary" onClick={reset} style={{ marginTop: '16px' }}>
          Play Again
        </button>
      )}
    </div>
  );
}
