// Solo Game Router - Routes to the correct solo game
import { useParams, useSearchParams, Navigate } from 'react-router-dom';
import TicTacToe from '../games/tictactoe/TicTacToe';
import Connect4 from '../games/connect4/Connect4';
import Checkers from '../games/checkers/Checkers';
import Chess from '../games/chess/Chess';
import Sudoku from '../games/sudoku/Sudoku';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type CheckersColor = 'pink' | 'blue' | 'purple';

export default function SoloGameRouter() {
  const { game } = useParams();
  const [searchParams] = useSearchParams();
  const mode = (searchParams.get('mode') || 'ai') as 'ai' | 'local';
  const difficulty = (searchParams.get('diff') || 'medium') as Difficulty;
  const checkersColor = (searchParams.get('color') || 'pink') as CheckersColor;

  switch (game) {
    case 'tictactoe':
      return <TicTacToe mode={mode} difficulty={difficulty} />;
    case 'connect4':
      return <Connect4 mode={mode} difficulty={difficulty} />;
    case 'checkers':
      return <Checkers mode={mode} difficulty={difficulty} playerColor={checkersColor} />;
    case 'chess':
      return <Chess mode={mode} difficulty={difficulty} />;
    case 'sudoku':
      return <Sudoku difficulty={difficulty} />;
    default:
      return <Navigate to="/solo" replace />;
  }
}
