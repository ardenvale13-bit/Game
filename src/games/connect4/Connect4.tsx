// Connect Four
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Difficulty } from '../../pages/SoloGameRouter';
import './connect4.css';

const ROWS = 6;
const COLS = 7;

type Cell = 0 | 1 | 2; // 0 = empty, 1 = player 1, 2 = player 2
type Board = Cell[][];

interface Props {
  mode: 'ai' | 'local';
  difficulty: Difficulty;
}

function createBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function clone(board: Board): Board {
  return board.map(row => [...row]);
}

function dropPiece(board: Board, col: number, player: Cell): number {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === 0) {
      board[r][col] = player;
      return r;
    }
  }
  return -1;
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

// AI
function scoreWindow(window: Cell[], player: Cell): number {
  const opp = player === 1 ? 2 : 1;
  const pCount = window.filter(c => c === player).length;
  const eCount = window.filter(c => c === 0).length;
  const oCount = window.filter(c => c === opp).length;
  if (pCount === 4) return 100;
  if (pCount === 3 && eCount === 1) return 5;
  if (pCount === 2 && eCount === 2) return 2;
  if (oCount === 3 && eCount === 1) return -4;
  return 0;
}

function evaluate(board: Board, player: Cell): number {
  let score = 0;
  // Center column preference
  const centerCol = Math.floor(COLS / 2);
  const centerCount = board.reduce((acc, row) => acc + (row[centerCol] === player ? 1 : 0), 0);
  score += centerCount * 3;

  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += scoreWindow([board[r][c], board[r][c+1], board[r][c+2], board[r][c+3]], player);
    }
  }
  // Vertical
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      score += scoreWindow([board[r][c], board[r+1][c], board[r+2][c], board[r+3][c]], player);
    }
  }
  // Diag down-right
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += scoreWindow([board[r][c], board[r+1][c+1], board[r+2][c+2], board[r+3][c+3]], player);
    }
  }
  // Diag up-right
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += scoreWindow([board[r][c], board[r-1][c+1], board[r-2][c+2], board[r-3][c+3]], player);
    }
  }
  return score;
}

function minimax(board: Board, depth: number, alpha: number, beta: number, maximizing: boolean): number {
  const { winner } = checkWin(board);
  if (winner === 2) return 10000 + depth;
  if (winner === 1) return -10000 - depth;
  if (isFull(board) || depth === 0) return evaluate(board, 2);

  const validCols = [];
  for (let c = 0; c < COLS; c++) if (board[0][c] === 0) validCols.push(c);

  if (maximizing) {
    let maxEval = -Infinity;
    for (const col of validCols) {
      const b = clone(board);
      dropPiece(b, col, 2);
      const val = minimax(b, depth - 1, alpha, beta, false);
      maxEval = Math.max(maxEval, val);
      alpha = Math.max(alpha, val);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const col of validCols) {
      const b = clone(board);
      dropPiece(b, col, 1);
      const val = minimax(b, depth - 1, alpha, beta, true);
      minEval = Math.min(minEval, val);
      beta = Math.min(beta, val);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function getAiMove(board: Board, difficulty: Difficulty): number {
  const validCols = [];
  for (let c = 0; c < COLS; c++) if (board[0][c] === 0) validCols.push(c);
  if (validCols.length === 0) return -1;

  if (difficulty === 'easy') {
    return validCols[Math.floor(Math.random() * validCols.length)];
  }

  if (difficulty === 'medium') {
    if (Math.random() < 0.35) {
      return validCols[Math.floor(Math.random() * validCols.length)];
    }
  }

  const depth = difficulty === 'hard' ? 6 : 4;
  let bestScore = -Infinity;
  let bestCol = validCols[0];
  for (const col of validCols) {
    const b = clone(board);
    dropPiece(b, col, 2);
    const score = minimax(b, depth, -Infinity, Infinity, false);
    if (score > bestScore) {
      bestScore = score;
      bestCol = col;
    }
  }
  return bestCol;
}

export default function Connect4({ mode, difficulty }: Props) {
  const navigate = useNavigate();
  const [board, setBoard] = useState<Board>(createBoard);
  const [turn, setTurn] = useState<1 | 2>(1);
  const [scores, setScores] = useState({ p1: 0, p2: 0, draws: 0 });
  const { winner, line } = checkWin(board);
  const draw = !winner && isFull(board);
  const gameOver = !!winner || draw;

  const winSet = new Set(line?.map(([r, c]) => `${r}-${c}`) ?? []);

  const makeMove = useCallback((col: number) => {
    if (gameOver || board[0][col] !== 0) return;
    const newBoard = clone(board);
    dropPiece(newBoard, col, turn as Cell);
    setBoard(newBoard);
    setTurn(turn === 1 ? 2 : 1);
  }, [board, turn, gameOver]);

  useEffect(() => {
    if (mode !== 'ai' || turn !== 2 || gameOver) return;
    const timer = setTimeout(() => {
      const col = getAiMove(clone(board), difficulty);
      if (col >= 0) makeMove(col);
    }, 400);
    return () => clearTimeout(timer);
  }, [turn, mode, board, difficulty, gameOver, makeMove]);

  useEffect(() => {
    if (winner) {
      setScores(s => winner === 1 ? { ...s, p1: s.p1 + 1 } : { ...s, p2: s.p2 + 1 });
    } else if (draw) {
      setScores(s => ({ ...s, draws: s.draws + 1 }));
    }
  }, [winner, draw]);

  const reset = () => {
    setBoard(createBoard());
    setTurn(1);
  };

  const p1 = mode === 'ai' ? 'You' : 'Player 1';
  const p2 = mode === 'ai' ? 'Computer' : 'Player 2';

  return (
    <div className="solo-game-layout">
      <div className="solo-game-header">
        <button className="btn btn-ghost btn-small" onClick={() => navigate('/solo')}>← Back</button>
        <h2 className="solo-game-title">Connect Four</h2>
        <div className="solo-game-score c4-score">
          <span className="score-1">{p1}: {scores.p1}</span>
          <span className="score-draw">Draw: {scores.draws}</span>
          <span className="score-2">{p2}: {scores.p2}</span>
        </div>
      </div>

      <div className="c4-status">
        {gameOver
          ? winner
            ? `${winner === 1 ? p1 : p2} wins!`
            : "It's a draw!"
          : `${turn === 1 ? p1 : p2}'s turn`
        }
      </div>

      <div className="c4-board">
        {Array.from({ length: COLS }, (_, col) => (
          <button
            key={col}
            className="c4-col-btn"
            onClick={() => {
              if (mode === 'ai' && turn === 2) return;
              makeMove(col);
            }}
            disabled={board[0][col] !== 0 || gameOver}
          >
            {Array.from({ length: ROWS }, (_, row) => {
              const cell = board[row][col];
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

      {gameOver && (
        <button className="btn btn-primary" onClick={reset} style={{ marginTop: '16px' }}>
          Play Again
        </button>
      )}
    </div>
  );
}
