// Sudoku
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Difficulty } from '../../pages/SoloGameRouter';
import './sudoku.css';

interface Props {
  difficulty: Difficulty;
}

type SudokuBoard = (number | null)[][];

function createEmptyGrid(): SudokuBoard {
  return Array.from({ length: 9 }, () => Array(9).fill(null));
}

function isValidPlacement(grid: SudokuBoard, row: number, col: number, num: number): boolean {
  for (let c = 0; c < 9; c++) if (grid[row][c] === num) return false;
  for (let r = 0; r < 9; r++) if (grid[r][col] === num) return false;
  const br = Math.floor(row / 3) * 3, bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if (grid[r][c] === num) return false;
    }
  }
  return true;
}

function solveSudoku(grid: SudokuBoard): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] !== null) continue;
      const nums = shuffle([1,2,3,4,5,6,7,8,9]);
      for (const n of nums) {
        if (isValidPlacement(grid, r, c, n)) {
          grid[r][c] = n;
          if (solveSudoku(grid)) return true;
          grid[r][c] = null;
        }
      }
      return false;
    }
  }
  return true;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generatePuzzle(difficulty: Difficulty): { puzzle: SudokuBoard; solution: SudokuBoard } {
  const grid = createEmptyGrid();
  solveSudoku(grid);
  const solution = grid.map(row => [...row]) as SudokuBoard;

  // Remove cells based on difficulty
  const cellsToRemove = difficulty === 'easy' ? 35 : difficulty === 'medium' ? 45 : 55;
  const positions = shuffle(
    Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9] as [number, number])
  );

  let removed = 0;
  for (const [r, c] of positions) {
    if (removed >= cellsToRemove) break;
    grid[r][c] = null;
    removed++;
  }

  return { puzzle: grid, solution };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Sudoku({ difficulty }: Props) {
  const navigate = useNavigate();
  const [gameData, setGameData] = useState(() => generatePuzzle(difficulty));
  const [board, setBoard] = useState<SudokuBoard>(() => gameData.puzzle.map(r => [...r]));
  const [given, setGiven] = useState<boolean[][]>(() =>
    gameData.puzzle.map(r => r.map(c => c !== null))
  );
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [timer, setTimer] = useState(0);
  const [solved, setSolved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (!solved) setTimer(t => t + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [solved]);

  const checkErrors = useCallback((b: SudokuBoard) => {
    const errs = new Set<string>();
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = b[r][c];
        if (val === null) continue;
        // Check row
        for (let cc = 0; cc < 9; cc++) {
          if (cc !== c && b[r][cc] === val) {
            errs.add(`${r}-${c}`);
            errs.add(`${r}-${cc}`);
          }
        }
        // Check col
        for (let rr = 0; rr < 9; rr++) {
          if (rr !== r && b[rr][c] === val) {
            errs.add(`${r}-${c}`);
            errs.add(`${rr}-${c}`);
          }
        }
        // Check box
        const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
        for (let rr = br; rr < br + 3; rr++) {
          for (let cc = bc; cc < bc + 3; cc++) {
            if (rr !== r && cc !== c && b[rr][cc] === val) {
              errs.add(`${r}-${c}`);
              errs.add(`${rr}-${cc}`);
            }
          }
        }
      }
    }
    return errs;
  }, []);

  const placeNumber = useCallback((num: number | null) => {
    if (!selected || solved) return;
    const [r, c] = selected;
    if (given[r][c]) return;

    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = num;
    setBoard(newBoard);
    const errs = checkErrors(newBoard);
    setErrors(errs);

    // Check win
    if (errs.size === 0 && newBoard.every(row => row.every(cell => cell !== null))) {
      setSolved(true);
    }
  }, [selected, board, given, solved, checkErrors]);

  const newGame = () => {
    const data = generatePuzzle(difficulty);
    setGameData(data);
    setBoard(data.puzzle.map(r => [...r]));
    setGiven(data.puzzle.map(r => r.map(c => c !== null)));
    setSelected(null);
    setErrors(new Set());
    setTimer(0);
    setSolved(false);
  };

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!selected || solved) return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        placeNumber(num);
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        placeNumber(null);
      } else if (e.key === 'ArrowUp' && selected[0] > 0) {
        setSelected([selected[0] - 1, selected[1]]);
      } else if (e.key === 'ArrowDown' && selected[0] < 8) {
        setSelected([selected[0] + 1, selected[1]]);
      } else if (e.key === 'ArrowLeft' && selected[1] > 0) {
        setSelected([selected[0], selected[1] - 1]);
      } else if (e.key === 'ArrowRight' && selected[1] < 8) {
        setSelected([selected[0], selected[1] + 1]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selected, solved, placeNumber]);

  return (
    <div className="solo-game-layout">
      <div className="solo-game-header">
        <button className="btn btn-ghost btn-small" onClick={() => navigate('/solo')}>← Back</button>
        <h2 className="solo-game-title">Sudoku</h2>
        <div className="sudoku-timer">{formatTime(timer)}</div>
      </div>

      {solved && (
        <div className="sudoku-status" style={{ color: 'var(--accent-success)' }}>
          Puzzle Complete! {formatTime(timer)}
        </div>
      )}

      <div className="sudoku-board">
        {board.map((row, r) =>
          row.map((cell, c) => {
            const isGiven = given[r][c];
            const isSelected = selected?.[0] === r && selected?.[1] === c;
            const isError = errors.has(`${r}-${c}`);
            const borderRight = c === 2 || c === 5;
            const borderBottom = r === 2 || r === 5;

            return (
              <div
                key={`${r}-${c}`}
                className={`sudoku-cell ${isGiven ? 'given' : ''} ${isSelected ? 'selected' : ''} ${!isGiven && cell ? 'filled' : ''} ${isError ? 'error' : ''} ${borderRight ? 'border-right' : ''} ${borderBottom ? 'border-bottom' : ''}`}
                onClick={() => !solved && setSelected([r, c])}
              >
                {cell || ''}
              </div>
            );
          })
        )}
      </div>

      <div className="sudoku-numpad">
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} onClick={() => placeNumber(n)}>{n}</button>
        ))}
        <button className="erase-btn" onClick={() => placeNumber(null)}>✕</button>
      </div>

      {solved && (
        <button className="btn btn-primary" onClick={newGame} style={{ marginTop: '8px' }}>
          New Puzzle
        </button>
      )}
    </div>
  );
}
