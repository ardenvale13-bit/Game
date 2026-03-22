// Chess
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Difficulty } from '../../pages/SoloGameRouter';
import './chess.css';

type Color = 'w' | 'b';
type PieceType = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';
type Piece = { color: Color; type: PieceType } | null;
type Board = Piece[][];
type Pos = [number, number];

interface Props {
  mode: 'ai' | 'local';
  difficulty: Difficulty;
}

// Unicode fallbacks for captured display
const PIECE_SYMBOLS: Record<string, string> = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
};

// Custom piece images — purple = white (player), navy = black (AI/opponent)
const PIECE_IMAGES: Record<string, string> = {
  wK: '/chess-purple-king.png',
  wQ: '/chess-purple-queen.png',
  wR: '/chess-purple-rook.png',
  wB: '/chess-purple-bishop.png',
  wN: '/chess-purple-knight-right.png',
  wP: '/chess-purple-pawn.png',
  bK: '/chess-navy-king.png',
  bQ: '/chess-navy-queen.png',
  bR: '/chess-navy-rook.png',
  bB: '/chess-navy-bishop.png',
  bN: '/chess-navy-knight.png',
  bP: '/chess-navy-pawn.png',
};

const PIECE_VALUES: Record<PieceType, number> = {
  P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000,
};

// Piece-square tables (simplified, white perspective)
const PST_PAWN = [
  [0,0,0,0,0,0,0,0],[50,50,50,50,50,50,50,50],[10,10,20,30,30,20,10,10],
  [5,5,10,25,25,10,5,5],[0,0,0,20,20,0,0,0],[5,-5,-10,0,0,-10,-5,5],
  [5,10,10,-20,-20,10,10,5],[0,0,0,0,0,0,0,0]
];
const PST_KNIGHT = [
  [-50,-40,-30,-30,-30,-30,-40,-50],[-40,-20,0,0,0,0,-20,-40],
  [-30,0,10,15,15,10,0,-30],[-30,5,15,20,20,15,5,-30],
  [-30,0,15,20,20,15,0,-30],[-30,5,10,15,15,10,5,-30],
  [-40,-20,0,5,5,0,-20,-40],[-50,-40,-30,-30,-30,-30,-40,-50]
];
const PST_BISHOP = [
  [-20,-10,-10,-10,-10,-10,-10,-20],[-10,0,0,0,0,0,0,-10],
  [-10,0,5,10,10,5,0,-10],[-10,5,5,10,10,5,5,-10],
  [-10,0,10,10,10,10,0,-10],[-10,10,10,10,10,10,10,-10],
  [-10,5,0,0,0,0,5,-10],[-20,-10,-10,-10,-10,-10,-10,-20]
];
const PST_KING = [
  [-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],[-10,-20,-20,-20,-20,-20,-20,-10],
  [20,20,0,0,0,0,20,20],[20,30,10,0,0,10,30,20]
];

function getPST(type: PieceType): number[][] | null {
  switch (type) {
    case 'P': return PST_PAWN;
    case 'N': return PST_KNIGHT;
    case 'B': return PST_BISHOP;
    case 'K': return PST_KING;
    default: return null;
  }
}

function initialBoard(): Board {
  const b: Board = Array.from({ length: 8 }, () => Array(8).fill(null));
  const backRow: PieceType[] = ['R','N','B','Q','K','B','N','R'];
  for (let c = 0; c < 8; c++) {
    b[0][c] = { color: 'b', type: backRow[c] };
    b[1][c] = { color: 'b', type: 'P' };
    b[6][c] = { color: 'w', type: 'P' };
    b[7][c] = { color: 'w', type: backRow[c] };
  }
  return b;
}

function cloneBoard(b: Board): Board {
  return b.map(row => row.map(cell => cell ? { ...cell } : null));
}

function findKing(board: Board, color: Color): Pos {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c]?.color === color && board[r][c]?.type === 'K')
        return [r, c];
  return [-1, -1]; // shouldn't happen
}

function isAttacked(board: Board, pos: Pos, byColor: Color): boolean {
  const [tr, tc] = pos;
  // Knight attacks
  for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
    const r = tr + dr, c = tc + dc;
    if (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c]?.color === byColor && board[r][c]?.type === 'N') return true;
  }
  // Pawn attacks
  const pawnDir = byColor === 'w' ? 1 : -1;
  for (const dc of [-1, 1]) {
    const r = tr + pawnDir, c = tc + dc;
    if (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c]?.color === byColor && board[r][c]?.type === 'P') return true;
  }
  // King attacks
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = tr + dr, c = tc + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c]?.color === byColor && board[r][c]?.type === 'K') return true;
    }
  }
  // Sliding pieces (rook/queen straight, bishop/queen diagonal)
  const straights: [number, number][] = [[-1,0],[1,0],[0,-1],[0,1]];
  const diagonals: [number, number][] = [[-1,-1],[-1,1],[1,-1],[1,1]];
  for (const [dr, dc] of straights) {
    for (let i = 1; i < 8; i++) {
      const r = tr + dr * i, c = tc + dc * i;
      if (r < 0 || r >= 8 || c < 0 || c >= 8) break;
      if (board[r][c]) {
        if (board[r][c]!.color === byColor && (board[r][c]!.type === 'R' || board[r][c]!.type === 'Q')) return true;
        break;
      }
    }
  }
  for (const [dr, dc] of diagonals) {
    for (let i = 1; i < 8; i++) {
      const r = tr + dr * i, c = tc + dc * i;
      if (r < 0 || r >= 8 || c < 0 || c >= 8) break;
      if (board[r][c]) {
        if (board[r][c]!.color === byColor && (board[r][c]!.type === 'B' || board[r][c]!.type === 'Q')) return true;
        break;
      }
    }
  }
  return false;
}

function inCheck(board: Board, color: Color): boolean {
  const kp = findKing(board, color);
  return isAttacked(board, kp, color === 'w' ? 'b' : 'w');
}

interface Move { from: Pos; to: Pos; promotion?: PieceType; castle?: 'K' | 'Q'; enPassant?: boolean }

function generateMoves(board: Board, color: Color, castling: Record<string, boolean>, epSquare: Pos | null): Move[] {
  const moves: Move[] = [];
  const opp = color === 'w' ? 'b' : 'w';

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || p.color !== color) continue;

      const addMove = (tr: number, tc: number, promo?: PieceType) => {
        moves.push({ from: [r, c], to: [tr, tc], promotion: promo });
      };

      switch (p.type) {
        case 'P': {
          const dir = color === 'w' ? -1 : 1;
          const startRow = color === 'w' ? 6 : 1;
          const promoRow = color === 'w' ? 0 : 7;
          // Forward
          if (r + dir >= 0 && r + dir < 8 && !board[r + dir][c]) {
            if (r + dir === promoRow) {
              for (const pt of ['Q','R','B','N'] as PieceType[]) addMove(r + dir, c, pt);
            } else {
              addMove(r + dir, c);
              // Double push
              if (r === startRow && !board[r + dir * 2][c]) addMove(r + dir * 2, c);
            }
          }
          // Captures
          for (const dc of [-1, 1]) {
            const nc = c + dc;
            if (nc < 0 || nc >= 8 || r + dir < 0 || r + dir >= 8) continue;
            if (board[r + dir][nc]?.color === opp) {
              if (r + dir === promoRow) {
                for (const pt of ['Q','R','B','N'] as PieceType[]) addMove(r + dir, nc, pt);
              } else {
                addMove(r + dir, nc);
              }
            }
            // En passant
            if (epSquare && epSquare[0] === r + dir && epSquare[1] === nc) {
              moves.push({ from: [r, c], to: [r + dir, nc], enPassant: true });
            }
          }
          break;
        }
        case 'N':
          for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc]?.color !== color)
              addMove(nr, nc);
          }
          break;
        case 'K':
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc]?.color !== color)
                addMove(nr, nc);
            }
          }
          // Castling
          if (!inCheck(board, color)) {
            const row = color === 'w' ? 7 : 0;
            if (castling[`${color}K`] && !board[row][5] && !board[row][6]
              && !isAttacked(board, [row, 5], opp) && !isAttacked(board, [row, 6], opp)) {
              moves.push({ from: [r, c], to: [row, 6], castle: 'K' });
            }
            if (castling[`${color}Q`] && !board[row][3] && !board[row][2] && !board[row][1]
              && !isAttacked(board, [row, 3], opp) && !isAttacked(board, [row, 2], opp)) {
              moves.push({ from: [r, c], to: [row, 2], castle: 'Q' });
            }
          }
          break;
        default: {
          // Sliding pieces
          const dirs: [number, number][] = [];
          if (p.type === 'R' || p.type === 'Q') dirs.push([-1,0],[1,0],[0,-1],[0,1]);
          if (p.type === 'B' || p.type === 'Q') dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
          for (const [dr, dc] of dirs) {
            for (let i = 1; i < 8; i++) {
              const nr = r + dr * i, nc = c + dc * i;
              if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
              if (board[nr][nc]) {
                if (board[nr][nc]!.color !== color) addMove(nr, nc);
                break;
              }
              addMove(nr, nc);
            }
          }
        }
      }
    }
  }
  return moves;
}

function applyMove(board: Board, move: Move): Board {
  const b = cloneBoard(board);
  const piece = b[move.from[0]][move.from[1]]!;
  b[move.from[0]][move.from[1]] = null;

  if (move.enPassant) {
    const capturedRow = piece.color === 'w' ? move.to[0] + 1 : move.to[0] - 1;
    b[capturedRow][move.to[1]] = null;
  }

  if (move.castle) {
    const row = move.from[0];
    if (move.castle === 'K') {
      b[row][5] = b[row][7];
      b[row][7] = null;
    } else {
      b[row][3] = b[row][0];
      b[row][0] = null;
    }
  }

  if (move.promotion) {
    b[move.to[0]][move.to[1]] = { color: piece.color, type: move.promotion };
  } else {
    b[move.to[0]][move.to[1]] = piece;
  }

  return b;
}

function getLegalMoves(board: Board, color: Color, castling: Record<string, boolean>, epSquare: Pos | null): Move[] {
  const pseudo = generateMoves(board, color, castling, epSquare);
  return pseudo.filter(m => {
    const nb = applyMove(board, m);
    return !inCheck(nb, color);
  });
}

function evaluate(board: Board): number {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      const sign = p.color === 'w' ? 1 : -1;
      score += sign * PIECE_VALUES[p.type];
      const pst = getPST(p.type);
      if (pst) {
        const pr = p.color === 'w' ? r : 7 - r;
        score += sign * pst[pr][c];
      }
    }
  }
  return score;
}

function aiSearch(
  board: Board, depth: number, alpha: number, beta: number, maximizing: boolean,
  castling: Record<string, boolean>, epSquare: Pos | null
): number {
  const color = maximizing ? 'w' : 'b';
  const legal = getLegalMoves(board, color, castling, epSquare);

  if (legal.length === 0) {
    return inCheck(board, color) ? (maximizing ? -99999 : 99999) : 0;
  }
  if (depth === 0) return evaluate(board);

  if (maximizing) {
    let best = -Infinity;
    for (const m of legal) {
      const nb = applyMove(board, m);
      const newCastling = updateCastling(castling, m);
      const newEp = getEpSquare(board, m);
      best = Math.max(best, aiSearch(nb, depth - 1, alpha, beta, false, newCastling, newEp));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of legal) {
      const nb = applyMove(board, m);
      const newCastling = updateCastling(castling, m);
      const newEp = getEpSquare(board, m);
      best = Math.min(best, aiSearch(nb, depth - 1, alpha, beta, true, newCastling, newEp));
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

function updateCastling(castling: Record<string, boolean>, move: Move): Record<string, boolean> {
  const c = { ...castling };
  const [fr, fc] = move.from;
  if (fr === 7 && fc === 4) { c.wK = false; c.wQ = false; }
  if (fr === 0 && fc === 4) { c.bK = false; c.bQ = false; }
  if (fr === 7 && fc === 0) c.wQ = false;
  if (fr === 7 && fc === 7) c.wK = false;
  if (fr === 0 && fc === 0) c.bQ = false;
  if (fr === 0 && fc === 7) c.bK = false;
  // Also check if rook was captured
  const [tr, tc] = move.to;
  if (tr === 0 && tc === 0) c.bQ = false;
  if (tr === 0 && tc === 7) c.bK = false;
  if (tr === 7 && tc === 0) c.wQ = false;
  if (tr === 7 && tc === 7) c.wK = false;
  return c;
}

function getEpSquare(board: Board, move: Move): Pos | null {
  const piece = board[move.from[0]][move.from[1]];
  if (piece?.type === 'P' && Math.abs(move.to[0] - move.from[0]) === 2) {
    return [(move.from[0] + move.to[0]) / 2, move.from[1]];
  }
  return null;
}

function getAiMove(
  board: Board, difficulty: Difficulty, castling: Record<string, boolean>, epSquare: Pos | null
): Move | null {
  const legal = getLegalMoves(board, 'b', castling, epSquare);
  if (legal.length === 0) return null;

  if (difficulty === 'easy') {
    return legal[Math.floor(Math.random() * legal.length)];
  }

  if (difficulty === 'medium' && Math.random() < 0.25) {
    return legal[Math.floor(Math.random() * legal.length)];
  }

  const depth = difficulty === 'hard' ? 3 : 2;
  let bestScore = Infinity;
  let bestMove = legal[0];
  for (const m of legal) {
    const nb = applyMove(board, m);
    const newCastling = updateCastling(castling, m);
    const newEp = getEpSquare(board, m);
    const score = aiSearch(nb, depth - 1, -Infinity, Infinity, true, newCastling, newEp);
    if (score < bestScore) {
      bestScore = score;
      bestMove = m;
    }
  }
  return bestMove;
}

export default function Chess({ mode, difficulty }: Props) {
  const navigate = useNavigate();
  const [board, setBoard] = useState<Board>(initialBoard);
  const [turn, setTurn] = useState<Color>('w');
  const [selected, setSelected] = useState<Pos | null>(null);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);
  const [castling, setCastling] = useState<Record<string, boolean>>({ wK: true, wQ: true, bK: true, bQ: true });
  const [epSquare, setEpSquare] = useState<Pos | null>(null);
  const [scores, setScores] = useState({ w: 0, b: 0, draws: 0 });
  const [captured, setCaptured] = useState<{ w: string[]; b: string[] }>({ w: [], b: [] });
  const [promoMove, setPromoMove] = useState<Move | null>(null);
  const [gameStatus, setGameStatus] = useState<'playing' | 'checkmate' | 'stalemate' | 'draw'>('playing');

  const allLegal = getLegalMoves(board, turn, castling, epSquare);
  const check = inCheck(board, turn);

  // Check game end
  useEffect(() => {
    if (gameStatus !== 'playing') return;
    if (allLegal.length === 0) {
      if (check) {
        setGameStatus('checkmate');
        const winner = turn === 'w' ? 'b' : 'w';
        setScores(s => ({ ...s, [winner]: s[winner as 'w' | 'b'] + 1 }));
      } else {
        setGameStatus('stalemate');
        setScores(s => ({ ...s, draws: s.draws + 1 }));
      }
    }
  }, [allLegal.length, check, turn, gameStatus]);

  const executeMove = useCallback((move: Move) => {
    const capturedPiece = board[move.to[0]][move.to[1]];
    const nb = applyMove(board, move);
    setBoard(nb);

    if (capturedPiece) {
      setCaptured(prev => ({
        ...prev,
        [turn]: [...prev[turn], PIECE_SYMBOLS[`${capturedPiece.color}${capturedPiece.type}`]]
      }));
    }
    if (move.enPassant) {
      const pawnColor = turn === 'w' ? 'b' : 'w';
      setCaptured(prev => ({
        ...prev,
        [turn]: [...prev[turn], PIECE_SYMBOLS[`${pawnColor}P`]]
      }));
    }

    setCastling(prev => updateCastling(prev, move));
    setEpSquare(getEpSquare(board, move));
    setTurn(turn === 'w' ? 'b' : 'w');
    setSelected(null);
    setLegalMoves([]);
  }, [board, turn]);

  const handleCellClick = useCallback((r: number, c: number) => {
    if (gameStatus !== 'playing') return;
    if (mode === 'ai' && turn === 'b') return;

    const piece = board[r][c];

    // Select own piece
    if (piece && piece.color === turn) {
      setSelected([r, c]);
      const pieceMoves = allLegal.filter(m => m.from[0] === r && m.from[1] === c);
      setLegalMoves(pieceMoves);
      return;
    }

    // Move to target
    if (selected) {
      const move = legalMoves.find(m => m.to[0] === r && m.to[1] === c);
      if (move) {
        // Check pawn promotion (without pre-set promotion)
        const movingPiece = board[selected[0]][selected[1]];
        if (movingPiece?.type === 'P' && (r === 0 || r === 7) && !move.promotion) {
          setPromoMove({ ...move, to: [r, c] });
          return;
        }
        // If there are multiple promo moves for this square, ask
        const promoMoves = legalMoves.filter(m => m.to[0] === r && m.to[1] === c && m.promotion);
        if (promoMoves.length > 1) {
          setPromoMove(promoMoves[0]);
          return;
        }
        executeMove(move);
      } else {
        setSelected(null);
        setLegalMoves([]);
      }
    }
  }, [board, turn, selected, legalMoves, allLegal, gameStatus, mode, executeMove]);

  const handlePromotion = (type: PieceType) => {
    if (!promoMove) return;
    const move: Move = { ...promoMove, promotion: type };
    executeMove(move);
    setPromoMove(null);
  };

  // AI move
  useEffect(() => {
    if (mode !== 'ai' || turn !== 'b' || gameStatus !== 'playing') return;
    const timer = setTimeout(() => {
      const move = getAiMove(board, difficulty, castling, epSquare);
      if (move) executeMove(move);
    }, 500);
    return () => clearTimeout(timer);
  }, [turn, mode, board, difficulty, castling, epSquare, gameStatus, executeMove]);

  const reset = () => {
    setBoard(initialBoard());
    setTurn('w');
    setSelected(null);
    setLegalMoves([]);
    setCastling({ wK: true, wQ: true, bK: true, bQ: true });
    setEpSquare(null);
    setCaptured({ w: [], b: [] });
    setPromoMove(null);
    setGameStatus('playing');
  };

  const p1 = mode === 'ai' ? 'You' : 'White';
  const p2 = mode === 'ai' ? 'Computer' : 'Black';
  const kingPos = findKing(board, turn);
  const moveTargetSet = new Set(legalMoves.map(m => `${m.to[0]}-${m.to[1]}`));

  const statusText = gameStatus === 'checkmate'
    ? `Checkmate! ${turn === 'w' ? p2 : p1} wins!`
    : gameStatus === 'stalemate'
      ? 'Stalemate - Draw!'
      : check
        ? `${turn === 'w' ? p1 : p2} is in check!`
        : `${turn === 'w' ? p1 : p2}'s turn`;

  return (
    <div className="solo-game-layout">
      <div className="solo-game-header">
        <button className="btn btn-ghost btn-small" onClick={() => navigate('/solo')}>← Back</button>
        <h2 className="solo-game-title">Chess</h2>
        <div className="solo-game-score chess-score">
          <span className="score-w">{p1}: {scores.w}</span>
          <span className="score-draw">Draw: {scores.draws}</span>
          <span className="score-b">{p2}: {scores.b}</span>
        </div>
      </div>

      <div className="chess-status">{statusText}</div>

      <div className="chess-captured">{captured.w.join(' ')}</div>

      <div className="chess-board">
        {Array.from({ length: 8 }, (_, r) =>
          Array.from({ length: 8 }, (_, c) => {
            const isDark = (r + c) % 2 === 1;
            const piece = board[r][c];
            const isSelected = selected?.[0] === r && selected?.[1] === c;
            const isTarget = moveTargetSet.has(`${r}-${c}`);
            const isCapture = isTarget && piece !== null;
            const isCheck = check && r === kingPos[0] && c === kingPos[1];

            return (
              <div
                key={`${r}-${c}`}
                className={`chess-cell ${isDark ? 'dark' : 'light'} ${isSelected ? 'selected' : ''} ${isTarget && !isCapture ? 'move-target' : ''} ${isCapture ? 'capture-target' : ''} ${isCheck ? 'check' : ''}`}
                onClick={() => handleCellClick(r, c)}
              >
                {piece && (
                  <img
                    className="chess-piece"
                    src={PIECE_IMAGES[`${piece.color}${piece.type}`]}
                    alt={PIECE_SYMBOLS[`${piece.color}${piece.type}`]}
                    draggable={false}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="chess-captured">{captured.b.join(' ')}</div>

      {gameStatus !== 'playing' && (
        <button className="btn btn-primary" onClick={reset} style={{ marginTop: '16px' }}>
          Play Again
        </button>
      )}

      {promoMove && (
        <div className="chess-promo-overlay" onClick={() => setPromoMove(null)}>
          <div className="chess-promo-modal" onClick={e => e.stopPropagation()}>
            {(['Q','R','B','N'] as PieceType[]).map(type => (
              <button
                key={type}
                className="chess-promo-option"
                onClick={() => handlePromotion(type)}
              >
                <img src={PIECE_IMAGES[`${turn}${type}`]} alt={PIECE_SYMBOLS[`${turn}${type}`]} style={{ width: '48px', height: '48px' }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
