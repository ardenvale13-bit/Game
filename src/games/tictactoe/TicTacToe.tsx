// Noughts & Crosses (Tic-Tac-Toe)
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Difficulty } from '../../pages/SoloGameRouter';
import './tictactoe.css';

type Cell = 'X' | 'O' | null;
type Board = Cell[];

interface Props {
  mode: 'ai' | 'local';
  difficulty: Difficulty;
}

const WINS = [
  [0,1,2],[3,4,5],[6,7,8], // rows
  [0,3,6],[1,4,7],[2,5,8], // cols
  [0,4,8],[2,4,6],         // diags
];

function checkWinner(board: Board): { winner: Cell; line: number[] | null } {
  for (const combo of WINS) {
    const [a,b,c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: combo };
    }
  }
  return { winner: null, line: null };
}

function isDraw(board: Board): boolean {
  return board.every(c => c !== null) && !checkWinner(board).winner;
}

// AI Logic
function getAiMove(board: Board, difficulty: Difficulty): number {
  const empty = board.map((c, i) => c === null ? i : -1).filter(i => i !== -1);
  if (empty.length === 0) return -1;

  if (difficulty === 'easy') {
    return empty[Math.floor(Math.random() * empty.length)];
  }

  if (difficulty === 'medium') {
    // 60% smart, 40% random
    if (Math.random() < 0.4) {
      return empty[Math.floor(Math.random() * empty.length)];
    }
  }

  // Hard (and medium's smart path): minimax
  return minimaxMove(board);
}

function minimaxMove(board: Board): number {
  let bestScore = -Infinity;
  let bestMove = -1;
  for (let i = 0; i < 9; i++) {
    if (board[i] !== null) continue;
    board[i] = 'O';
    const score = minimax(board, false);
    board[i] = null;
    if (score > bestScore) {
      bestScore = score;
      bestMove = i;
    }
  }
  return bestMove;
}

function minimax(board: Board, isMaximizing: boolean): number {
  const { winner } = checkWinner(board);
  if (winner === 'O') return 1;
  if (winner === 'X') return -1;
  if (board.every(c => c !== null)) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] !== null) continue;
      board[i] = 'O';
      best = Math.max(best, minimax(board, false));
      board[i] = null;
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] !== null) continue;
      board[i] = 'X';
      best = Math.min(best, minimax(board, true));
      board[i] = null;
    }
    return best;
  }
}

export default function TicTacToe({ mode, difficulty }: Props) {
  const navigate = useNavigate();
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [turn, setTurn] = useState<'X' | 'O'>('X');
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const { winner, line } = checkWinner(board);
  const draw = isDraw(board);
  const gameOver = !!winner || draw;

  const makeMove = useCallback((index: number) => {
    if (board[index] || gameOver) return;
    const newBoard = [...board];
    newBoard[index] = turn;
    setBoard(newBoard);
    setTurn(turn === 'X' ? 'O' : 'X');
  }, [board, turn, gameOver]);

  // AI move
  useEffect(() => {
    if (mode !== 'ai' || turn !== 'O' || gameOver) return;
    const timer = setTimeout(() => {
      const move = getAiMove([...board], difficulty);
      if (move >= 0) makeMove(move);
    }, 400);
    return () => clearTimeout(timer);
  }, [turn, mode, board, difficulty, gameOver, makeMove]);

  // Score tracking
  useEffect(() => {
    if (winner) {
      setScores(s => ({ ...s, [winner]: s[winner as 'X' | 'O'] + 1 }));
    } else if (draw) {
      setScores(s => ({ ...s, draws: s.draws + 1 }));
    }
  }, [winner, draw]);

  const reset = () => {
    setBoard(Array(9).fill(null));
    setTurn('X');
  };

  const p1Label = mode === 'ai' ? 'You' : 'Player 1';
  const p2Label = mode === 'ai' ? 'Computer' : 'Player 2';

  return (
    <div className="solo-game-layout">
      <div className="solo-game-header">
        <button className="btn btn-ghost btn-small" onClick={() => navigate('/solo')}>← Back</button>
        <h2 className="solo-game-title">Noughts & Crosses</h2>
        <div className="solo-game-score">
          <span className="score-x">{p1Label}: {scores.X}</span>
          <span className="score-draw">Draw: {scores.draws}</span>
          <span className="score-o">{p2Label}: {scores.O}</span>
        </div>
      </div>

      <div className="ttt-status">
        {gameOver
          ? winner
            ? `${winner === 'X' ? p1Label : p2Label} wins!`
            : "It's a draw!"
          : `${turn === 'X' ? p1Label : p2Label}'s turn (${turn})`
        }
      </div>

      <div className="ttt-board">
        {board.map((cell, i) => (
          <button
            key={i}
            className={`ttt-cell ${cell ? 'filled' : ''} ${cell === 'X' ? 'cell-x' : cell === 'O' ? 'cell-o' : ''} ${line?.includes(i) ? 'win-cell' : ''}`}
            onClick={() => {
              if (mode === 'ai' && turn === 'O') return;
              makeMove(i);
            }}
            disabled={!!cell || gameOver}
          >
            {cell}
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
