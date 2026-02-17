// Codenames — 5×5 Board grid
import useCodenamesStore from '../codenamesStore';
import CodenamesCard from './CodenamesCard';

interface CodenamesBoardProps {
  onVote: (cardIndex: number) => void;
  onLock: (cardIndex: number) => void;
}

export default function CodenamesBoard({ onVote, onLock }: CodenamesBoardProps) {
  const { board, currentPlayerId, phase, currentTeam } = useCodenamesStore();

  const currentPlayer = useCodenamesStore.getState().getCurrentPlayer();
  const iAmSpymaster = currentPlayer?.role === 'spymaster';
  const isMyTeamTurn = currentPlayer?.team === currentTeam;
  const isGuessingPhase = phase === 'operative-guess';
  const isMyTurn = isMyTeamTurn && isGuessingPhase && !iAmSpymaster;

  return (
    <div className="cn-board">
      {board.map((card) => {
        const myVote = card.votes.some(v => v.playerId === currentPlayerId);
        return (
          <CodenamesCard
            key={card.index}
            card={card}
            isSpymaster={iAmSpymaster}
            isMyTurn={isMyTurn}
            myVote={myVote}
            onVote={() => onVote(card.index)}
            onLock={() => onLock(card.index)}
            disabled={!isMyTurn || card.isRevealed}
          />
        );
      })}
    </div>
  );
}
