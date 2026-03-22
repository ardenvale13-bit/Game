// Tic-Tac-Toe Multiplayer Wrapper
// Host = X (player 1), Guest = O (player 2)
// Host owns board state, broadcasts after each move
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useLobbyStore from '../../store/lobbyStore';
import { useBoardGameSync } from '../../hooks/useBoardGameSync';
import './tictactoe.css';

type Cell = 'X' | 'O' | null;
type Board = Cell[];

const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

function checkWinner(board: Board): { winner: Cell; line: number[] | null } {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] };
    }
  }
  return { winner: null, line: null };
}

interface GameState {
  board: Board;
  turnIndex: number; // 0 = X, 1 = O
  scores: { x: number; o: number; draws: number };
}

export default function TicTacToeMultiplayer() {
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
    board: Array(9).fill(null),
    turnIndex: 0,
    scores: { x: 0, o: 0, draws: 0 },
  });

  const mySymbol: Cell = hostPlayer ? 'X' : 'O';
  const myTurnIndex = hostPlayer ? 0 : 1;
  const isMyTurn = gameState.turnIndex === myTurnIndex;

  const { winner, line } = checkWinner(gameState.board);
  const draw = !winner && gameState.board.every(c => c !== null);
  const gameOver = !!winner || draw;

  const winSet = useMemo(() => new Set(line ?? []), [line]);

  const p1Name = players.find(p => p.isHost)?.name || 'Player 1';
  const p2Name = players.find(p => !p.isHost)?.name || 'Player 2';

  // Host processes moves
  const makeMove = useCallback((index: number) => {
    if (gameOver || gameState.board[index] !== null) return;

    const newBoard = [...gameState.board];
    newBoard[index] = gameState.turnIndex === 0 ? 'X' : 'O';
    const newState: GameState = {
      ...gameState,
      board: newBoard,
      turnIndex: gameState.turnIndex === 0 ? 1 : 0,
    };

    // Check for win/draw to update scores
    const result = checkWinner(newBoard);
    if (result.winner) {
      newState.scores = {
        ...gameState.scores,
        [result.winner.toLowerCase() as 'x' | 'o']: gameState.scores[result.winner.toLowerCase() as 'x' | 'o'] + 1,
      };
    } else if (newBoard.every(c => c !== null)) {
      newState.scores = { ...gameState.scores, draws: gameState.scores.draws + 1 };
    }

    setGameState(newState);
    sync.broadcastState(newState);
  }, [gameState, gameOver, sync]);

  // Client click: if it's my turn, send move to host (or if host, process directly)
  const handleClick = useCallback((index: number) => {
    if (!isMyTurn || gameOver || gameState.board[index] !== null) return;
    if (hostPlayer) {
      makeMove(index);
    } else {
      sync.sendMove({ index });
    }
  }, [isMyTurn, gameOver, gameState.board, hostPlayer, makeMove, sync]);

  // Host receives moves from client
  useEffect(() => {
    if (!hostPlayer || !sync.receivedMove) return;
    const move = sync.receivedMove as { index: number };
    if (gameState.turnIndex === 1) { // Only process if it's O's turn
      makeMove(move.index);
    }
    sync.clearMove();
  }, [sync.receivedMove, hostPlayer, gameState.turnIndex, makeMove, sync]);

  // Client receives state from host
  useEffect(() => {
    if (hostPlayer || !sync.receivedState) return;
    setGameState(sync.receivedState as GameState);
  }, [sync.receivedState, hostPlayer]);

  // Force end
  useEffect(() => {
    if (sync.forceEnded) {
      endGame();
      navigate(`/lobby/${roomCode}`);
    }
  }, [sync.forceEnded, endGame, navigate, roomCode]);

  const reset = () => {
    const newState: GameState = {
      board: Array(9).fill(null),
      turnIndex: 0,
      scores: gameState.scores,
    };
    setGameState(newState);
    sync.broadcastState(newState);
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
        <h2 className="solo-game-title">Noughts & Crosses</h2>
        <div className="solo-game-score">
          <span className="score-x">{p1Name} (X): {gameState.scores.x}</span>
          <span className="score-draw">Draw: {gameState.scores.draws}</span>
          <span className="score-o">{p2Name} (O): {gameState.scores.o}</span>
        </div>
      </div>

      <div className="ttt-status">
        {!sync.isReady
          ? 'Connecting...'
          : gameOver
            ? winner
              ? `${winner === 'X' ? p1Name : p2Name} wins!`
              : "It's a draw!"
            : isMyTurn
              ? 'Your turn!'
              : `Waiting for ${gameState.turnIndex === 0 ? p1Name : p2Name}...`
        }
      </div>

      <div className="ttt-board">
        {gameState.board.map((cell, i) => (
          <button
            key={i}
            className={`ttt-cell ${cell === 'X' ? 'cell-x' : cell === 'O' ? 'cell-o' : ''} ${winSet.has(i) ? 'win-cell' : ''}`}
            onClick={() => handleClick(i)}
            disabled={!isMyTurn || cell !== null || gameOver}
          >
            {cell}
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
