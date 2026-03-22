// Chess Multiplayer Wrapper
// Host = White (purple), Guest = Black (navy)
// Host owns board state, broadcasts after each move
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useLobbyStore from '../../store/lobbyStore';
import { useBoardGameSync } from '../../hooks/useBoardGameSync';
import './chess.css';

type Color = 'w' | 'b';
type PieceType = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';
type Piece = { color: Color; type: PieceType } | null;
type Board = Piece[][];
type Pos = [number, number];

const PIECE_SYMBOLS: Record<string, string> = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
};

const PIECE_IMAGES: Record<string, string> = {
  wK: '/chess-purple-king.png', wQ: '/chess-purple-queen.png', wR: '/chess-purple-rook.png',
  wB: '/chess-purple-bishop.png', wN: '/chess-purple-knight-right.png', wP: '/chess-purple-pawn.png',
  bK: '/chess-navy-king.png', bQ: '/chess-navy-queen.png', bR: '/chess-navy-rook.png',
  bB: '/chess-navy-bishop.png', bN: '/chess-navy-knight.png', bP: '/chess-navy-pawn.png',
};

// ---- Chess logic (same as Chess.tsx) ----
function initialBoard(): Board {
  const b: Board = Array.from({ length: 8 }, () => Array(8).fill(null));
  const back: PieceType[] = ['R','N','B','Q','K','B','N','R'];
  for (let c = 0; c < 8; c++) {
    b[0][c] = { color: 'b', type: back[c] };
    b[1][c] = { color: 'b', type: 'P' };
    b[6][c] = { color: 'w', type: 'P' };
    b[7][c] = { color: 'w', type: back[c] };
  }
  return b;
}

function cloneBoard(b: Board): Board {
  return b.map(row => row.map(cell => cell ? { ...cell } : null));
}

function findKing(board: Board, color: Color): Pos {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c]?.color === color && board[r][c]?.type === 'K') return [r, c];
  return [-1, -1];
}

function isAttacked(board: Board, pos: Pos, byColor: Color): boolean {
  const [tr, tc] = pos;
  for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
    const r = tr + dr, c = tc + dc;
    if (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c]?.color === byColor && board[r][c]?.type === 'N') return true;
  }
  const pDir = byColor === 'w' ? 1 : -1;
  for (const dc of [-1, 1]) {
    const r = tr + pDir, c = tc + dc;
    if (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c]?.color === byColor && board[r][c]?.type === 'P') return true;
  }
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (dr === 0 && dc === 0) continue;
    const r = tr + dr, c = tc + dc;
    if (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c]?.color === byColor && board[r][c]?.type === 'K') return true;
  }
  for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]] as [number,number][]) {
    for (let i = 1; i < 8; i++) {
      const r = tr + dr * i, c = tc + dc * i;
      if (r < 0 || r >= 8 || c < 0 || c >= 8) break;
      if (board[r][c]) { if (board[r][c]!.color === byColor && (board[r][c]!.type === 'R' || board[r][c]!.type === 'Q')) return true; break; }
    }
  }
  for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]] as [number,number][]) {
    for (let i = 1; i < 8; i++) {
      const r = tr + dr * i, c = tc + dc * i;
      if (r < 0 || r >= 8 || c < 0 || c >= 8) break;
      if (board[r][c]) { if (board[r][c]!.color === byColor && (board[r][c]!.type === 'B' || board[r][c]!.type === 'Q')) return true; break; }
    }
  }
  return false;
}

function inCheck(board: Board, color: Color): boolean {
  return isAttacked(board, findKing(board, color), color === 'w' ? 'b' : 'w');
}

interface Move { from: Pos; to: Pos; promotion?: PieceType; castle?: 'K' | 'Q'; enPassant?: boolean }

function generateMoves(board: Board, color: Color, castling: Record<string, boolean>, epSquare: Pos | null): Move[] {
  const moves: Move[] = [];
  const opp = color === 'w' ? 'b' : 'w';
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c];
    if (!p || p.color !== color) continue;
    const add = (tr: number, tc: number, promo?: PieceType) => { moves.push({ from: [r, c], to: [tr, tc], promotion: promo }); };
    switch (p.type) {
      case 'P': {
        const dir = color === 'w' ? -1 : 1;
        const start = color === 'w' ? 6 : 1;
        const promo = color === 'w' ? 0 : 7;
        if (r + dir >= 0 && r + dir < 8 && !board[r + dir][c]) {
          if (r + dir === promo) { for (const pt of ['Q','R','B','N'] as PieceType[]) add(r + dir, c, pt); }
          else { add(r + dir, c); if (r === start && !board[r + dir * 2][c]) add(r + dir * 2, c); }
        }
        for (const dc of [-1, 1]) {
          const nc = c + dc;
          if (nc < 0 || nc >= 8 || r + dir < 0 || r + dir >= 8) continue;
          if (board[r + dir][nc]?.color === opp) {
            if (r + dir === promo) { for (const pt of ['Q','R','B','N'] as PieceType[]) add(r + dir, nc, pt); }
            else add(r + dir, nc);
          }
          if (epSquare && epSquare[0] === r + dir && epSquare[1] === nc) moves.push({ from: [r, c], to: [r + dir, nc], enPassant: true });
        }
        break;
      }
      case 'N':
        for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]])
          { const nr = r + dr, nc = c + dc; if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc]?.color !== color) add(nr, nc); }
        break;
      case 'K':
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc]?.color !== color) add(nr, nc);
        }
        if (!inCheck(board, color)) {
          const row = color === 'w' ? 7 : 0;
          if (castling[`${color}K`] && !board[row][5] && !board[row][6] && !isAttacked(board, [row, 5], opp) && !isAttacked(board, [row, 6], opp))
            moves.push({ from: [r, c], to: [row, 6], castle: 'K' });
          if (castling[`${color}Q`] && !board[row][3] && !board[row][2] && !board[row][1] && !isAttacked(board, [row, 3], opp) && !isAttacked(board, [row, 2], opp))
            moves.push({ from: [r, c], to: [row, 2], castle: 'Q' });
        }
        break;
      default: {
        const dirs: [number, number][] = [];
        if (p.type === 'R' || p.type === 'Q') dirs.push([-1,0],[1,0],[0,-1],[0,1]);
        if (p.type === 'B' || p.type === 'Q') dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
        for (const [dr, dc] of dirs) for (let i = 1; i < 8; i++) {
          const nr = r + dr * i, nc = c + dc * i;
          if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
          if (board[nr][nc]) { if (board[nr][nc]!.color !== color) add(nr, nc); break; }
          add(nr, nc);
        }
      }
    }
  }
  return moves;
}

function applyMoveToBoard(board: Board, move: Move): Board {
  const b = cloneBoard(board);
  const piece = b[move.from[0]][move.from[1]]!;
  b[move.from[0]][move.from[1]] = null;
  if (move.enPassant) b[piece.color === 'w' ? move.to[0] + 1 : move.to[0] - 1][move.to[1]] = null;
  if (move.castle) {
    const row = move.from[0];
    if (move.castle === 'K') { b[row][5] = b[row][7]; b[row][7] = null; }
    else { b[row][3] = b[row][0]; b[row][0] = null; }
  }
  b[move.to[0]][move.to[1]] = move.promotion ? { color: piece.color, type: move.promotion } : piece;
  return b;
}

function getLegalMoves(board: Board, color: Color, castling: Record<string, boolean>, epSquare: Pos | null): Move[] {
  return generateMoves(board, color, castling, epSquare).filter(m => !inCheck(applyMoveToBoard(board, m), color));
}

function updateCastling(c: Record<string, boolean>, move: Move): Record<string, boolean> {
  const n = { ...c };
  const [fr, fc] = move.from;
  const [tr, tc] = move.to;
  if (fr === 7 && fc === 4) { n.wK = false; n.wQ = false; }
  if (fr === 0 && fc === 4) { n.bK = false; n.bQ = false; }
  if (fr === 7 && fc === 0) n.wQ = false; if (fr === 7 && fc === 7) n.wK = false;
  if (fr === 0 && fc === 0) n.bQ = false; if (fr === 0 && fc === 7) n.bK = false;
  if (tr === 0 && tc === 0) n.bQ = false; if (tr === 0 && tc === 7) n.bK = false;
  if (tr === 7 && tc === 0) n.wQ = false; if (tr === 7 && tc === 7) n.wK = false;
  return n;
}

function getEpSquare(board: Board, move: Move): Pos | null {
  const piece = board[move.from[0]][move.from[1]];
  if (piece?.type === 'P' && Math.abs(move.to[0] - move.from[0]) === 2)
    return [(move.from[0] + move.to[0]) / 2, move.from[1]];
  return null;
}

// ---- Component ----
interface GameState {
  board: Board;
  turn: Color;
  castling: Record<string, boolean>;
  epSquare: Pos | null;
  scores: { w: number; b: number; draws: number };
  captured: { w: string[]; b: string[] };
  status: 'playing' | 'checkmate' | 'stalemate';
}

export default function ChessMultiplayer() {
  const navigate = useNavigate();
  const { roomCode } = useParams();
  const { currentPlayerId, players, isHost: checkHost, endGame } = useLobbyStore();
  const hostPlayer = checkHost();

  const sync = useBoardGameSync({
    roomCode: roomCode || '',
    playerId: currentPlayerId || '',
    isHost: hostPlayer,
  });

  const [gs, setGs] = useState<GameState>({
    board: initialBoard(), turn: 'w',
    castling: { wK: true, wQ: true, bK: true, bQ: true },
    epSquare: null,
    scores: { w: 0, b: 0, draws: 0 },
    captured: { w: [], b: [] },
    status: 'playing',
  });
  const [selected, setSelected] = useState<Pos | null>(null);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);
  const [promoMove, setPromoMove] = useState<Move | null>(null);

  const myColor: Color = hostPlayer ? 'w' : 'b';
  const isMyTurn = gs.turn === myColor;
  const allLegal = useMemo(() => getLegalMoves(gs.board, gs.turn, gs.castling, gs.epSquare), [gs.board, gs.turn, gs.castling, gs.epSquare]);
  const check = inCheck(gs.board, gs.turn);
  const kingPos = findKing(gs.board, gs.turn);
  const moveTargetSet = useMemo(() => new Set(legalMoves.map(m => `${m.to[0]}-${m.to[1]}`)), [legalMoves]);

  const p1Name = players.find(p => p.isHost)?.name || 'White';
  const p2Name = players.find(p => !p.isHost)?.name || 'Black';

  // Check end conditions
  useEffect(() => {
    if (gs.status !== 'playing') return;
    if (allLegal.length === 0) {
      const newStatus = check ? 'checkmate' : 'stalemate';
      const newScores = { ...gs.scores };
      if (check) {
        const winner = gs.turn === 'w' ? 'b' : 'w';
        newScores[winner] += 1;
      } else {
        newScores.draws += 1;
      }
      const newGs = { ...gs, status: newStatus as GameState['status'], scores: newScores };
      setGs(newGs);
      if (hostPlayer) sync.broadcastState(newGs);
    }
  }, [allLegal.length, check, gs, hostPlayer, sync]);

  const executeMove = useCallback((move: Move) => {
    const capturedPiece = gs.board[move.to[0]][move.to[1]];
    const nb = applyMoveToBoard(gs.board, move);
    const newCaptured = { ...gs.captured };
    if (capturedPiece) {
      newCaptured[gs.turn] = [...newCaptured[gs.turn], PIECE_SYMBOLS[`${capturedPiece.color}${capturedPiece.type}`]];
    }
    if (move.enPassant) {
      const pc = gs.turn === 'w' ? 'b' : 'w';
      newCaptured[gs.turn] = [...newCaptured[gs.turn], PIECE_SYMBOLS[`${pc}P`]];
    }
    const newGs: GameState = {
      ...gs,
      board: nb,
      turn: gs.turn === 'w' ? 'b' : 'w',
      castling: updateCastling(gs.castling, move),
      epSquare: getEpSquare(gs.board, move),
      captured: newCaptured,
    };
    setGs(newGs);
    sync.broadcastState(newGs);
    setSelected(null);
    setLegalMoves([]);
    setPromoMove(null);
  }, [gs, sync]);

  const handleCellClick = useCallback((r: number, c: number) => {
    if (gs.status !== 'playing' || !isMyTurn) return;
    const piece = gs.board[r][c];
    if (piece && piece.color === gs.turn) {
      setSelected([r, c]);
      setLegalMoves(allLegal.filter(m => m.from[0] === r && m.from[1] === c));
      return;
    }
    if (selected) {
      const promoMoves = legalMoves.filter(m => m.to[0] === r && m.to[1] === c && m.promotion);
      if (promoMoves.length > 1) { setPromoMove(promoMoves[0]); return; }
      const move = legalMoves.find(m => m.to[0] === r && m.to[1] === c);
      if (move) {
        if (hostPlayer) { executeMove(move); }
        else { sync.sendMove(move); setSelected(null); setLegalMoves([]); }
      } else { setSelected(null); setLegalMoves([]); }
    }
  }, [gs, isMyTurn, selected, legalMoves, allLegal, hostPlayer, executeMove, sync]);

  const handlePromotion = (type: PieceType) => {
    if (!promoMove) return;
    const move: Move = { ...promoMove, promotion: type };
    if (hostPlayer) executeMove(move);
    else { sync.sendMove(move); setSelected(null); setLegalMoves([]); }
    setPromoMove(null);
  };

  // Host receives guest moves
  useEffect(() => {
    if (!hostPlayer || !sync.receivedMove) return;
    const move = sync.receivedMove as Move;
    if (gs.turn === 'b') executeMove(move);
    sync.clearMove();
  }, [sync.receivedMove, hostPlayer, gs.turn, executeMove, sync]);

  // Guest receives state
  useEffect(() => {
    if (hostPlayer || !sync.receivedState) return;
    setGs(sync.receivedState as GameState);
    setSelected(null);
    setLegalMoves([]);
  }, [sync.receivedState, hostPlayer]);

  useEffect(() => {
    if (sync.forceEnded) { endGame(); navigate(`/lobby/${roomCode}`); }
  }, [sync.forceEnded, endGame, navigate, roomCode]);

  const reset = () => {
    const s: GameState = {
      board: initialBoard(), turn: 'w',
      castling: { wK: true, wQ: true, bK: true, bQ: true },
      epSquare: null, scores: gs.scores, captured: { w: [], b: [] }, status: 'playing',
    };
    setGs(s);
    sync.broadcastState(s);
    setSelected(null);
    setLegalMoves([]);
  };

  const handleBack = () => { sync.sendForceEnd(); endGame(); navigate(`/lobby/${roomCode}`); };

  const statusText = gs.status === 'checkmate' ? `Checkmate! ${gs.turn === 'w' ? p2Name : p1Name} wins!`
    : gs.status === 'stalemate' ? 'Stalemate - Draw!'
    : !sync.isReady ? 'Connecting...'
    : check ? `${gs.turn === 'w' ? p1Name : p2Name} is in check!`
    : isMyTurn ? 'Your turn!'
    : `Waiting for ${gs.turn === 'w' ? p1Name : p2Name}...`;

  return (
    <div className="solo-game-layout">
      <div className="solo-game-header">
        <button className="btn btn-ghost btn-small" onClick={handleBack}>← Back to Lobby</button>
        <h2 className="solo-game-title">Chess</h2>
        <div className="solo-game-score chess-score">
          <span className="score-w">{p1Name}: {gs.scores.w}</span>
          <span className="score-draw">Draw: {gs.scores.draws}</span>
          <span className="score-b">{p2Name}: {gs.scores.b}</span>
        </div>
      </div>
      <div className="chess-status">{statusText}</div>
      <div className="chess-captured">{gs.captured.w.join(' ')}</div>
      <div className="chess-board">
        {Array.from({ length: 8 }, (_, r) =>
          Array.from({ length: 8 }, (_, c) => {
            const isDark = (r + c) % 2 === 1;
            const piece = gs.board[r][c];
            const isSel = selected?.[0] === r && selected?.[1] === c;
            const isTarget = moveTargetSet.has(`${r}-${c}`);
            const isCapture = isTarget && piece !== null;
            const isCheck2 = check && r === kingPos[0] && c === kingPos[1];
            return (
              <div key={`${r}-${c}`}
                className={`chess-cell ${isDark ? 'dark' : 'light'} ${isSel ? 'selected' : ''} ${isTarget && !isCapture ? 'move-target' : ''} ${isCapture ? 'capture-target' : ''} ${isCheck2 ? 'check' : ''}`}
                onClick={() => handleCellClick(r, c)}>
                {piece && <img className="chess-piece" src={PIECE_IMAGES[`${piece.color}${piece.type}`]} alt={PIECE_SYMBOLS[`${piece.color}${piece.type}`]} draggable={false} />}
              </div>
            );
          })
        )}
      </div>
      <div className="chess-captured">{gs.captured.b.join(' ')}</div>
      {gs.status !== 'playing' && hostPlayer && (
        <button className="btn btn-primary" onClick={reset} style={{ marginTop: '16px' }}>Play Again</button>
      )}
      {promoMove && (
        <div className="chess-promo-overlay" onClick={() => setPromoMove(null)}>
          <div className="chess-promo-modal" onClick={e => e.stopPropagation()}>
            {(['Q','R','B','N'] as PieceType[]).map(type => (
              <button key={type} className="chess-promo-option" onClick={() => handlePromotion(type)}>
                <img src={PIECE_IMAGES[`${gs.turn}${type}`]} alt={PIECE_SYMBOLS[`${gs.turn}${type}`]} style={{ width: '48px', height: '48px' }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
