import React, { useState } from 'react';
import { useLocale } from '../../contexts/LocaleContext';
import { useGame } from '../../contexts/GameContext';
import type { GameSession } from '../../types/game.types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Plus, Trophy, ArrowLeft, Check } from 'lucide-react';

interface ScoreBoardProps {
  session: GameSession;
  onBack: () => void;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ session, onBack }) => {
  const { t } = useLocale();
  const { updateScore, addRound, finishGame } = useGame();
  const [editingCell, setEditingCell] = useState<{ player: number; round: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [notes, setNotes] = useState(session.notes || '');

  const handleCellClick = (playerIndex: number, roundIndex: number) => {
    if (!session.isActive) return;
    setEditingCell({ player: playerIndex, round: roundIndex });
    setEditValue(String(session.players[playerIndex].roundScores[roundIndex] || 0));
  };

  const handleSaveScore = () => {
    if (!editingCell) return;
    const score = parseInt(editValue) || 0;
    updateScore(session.id, editingCell.player, editingCell.round, score);
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveScore();
    if (e.key === 'Escape') setEditingCell(null);
  };

  const handleFinish = () => {
    finishGame(session.id, notes || undefined);
  };

  const handleAddRound = () => {
    addRound(session.id);
  };

  // Find winner(s)
  const maxScore = Math.max(...session.players.map(p => p.totalScore));
  const winners = session.players.filter(p => p.totalScore === maxScore);
  const isTie = winners.length > 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft size={16} /> {t.games.backToGames}
        </Button>
        {session.isActive && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleAddRound}>
              <Plus size={16} className="mr-1" /> {t.games.addRound}
            </Button>
            <Button size="sm" onClick={handleFinish} className="gap-1">
              <Check size={16} /> {t.games.finishGame}
            </Button>
          </div>
        )}
      </div>

      {/* Game title */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">{session.gameName}</h2>
        <p className="text-sm text-muted-foreground">
          {t.games.playedOn} {new Date(session.playedAt).toLocaleDateString()}
        </p>
        {!session.isActive && (
          <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Trophy size={14} />
            {isTie ? t.games.tie : `${t.games.winner}: ${winners[0]?.name}`}
          </div>
        )}
      </div>

      {/* Score table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground sticky left-0 bg-muted/50">
                {t.games.round}
              </th>
              {session.players.map((player, i) => (
                <th key={i} className="text-center p-3 font-medium text-foreground min-w-[80px]">
                  {player.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: session.rounds }, (_, roundIndex) => (
              <tr key={roundIndex} className="border-t border-border">
                <td className="p-3 font-medium text-muted-foreground sticky left-0 bg-card">
                  {t.games.round} {roundIndex + 1}
                </td>
                {session.players.map((player, playerIndex) => (
                  <td key={playerIndex} className="text-center p-2">
                    {editingCell?.player === playerIndex && editingCell?.round === roundIndex ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onBlur={handleSaveScore}
                          className="w-16 h-8 text-center text-sm mx-auto"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => handleCellClick(playerIndex, roundIndex)}
                        className={`w-full py-1 px-2 rounded text-center transition-colors ${
                          session.isActive
                            ? 'hover:bg-primary/10 cursor-pointer'
                            : 'cursor-default'
                        }`}
                      >
                        {player.roundScores[roundIndex] || 0}
                      </button>
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {/* Total row */}
            <tr className="border-t-2 border-primary/30 bg-primary/5 font-bold">
              <td className="p-3 text-primary sticky left-0 bg-primary/5">{t.games.total}</td>
              {session.players.map((player, i) => (
                <td key={i} className={`text-center p-3 ${
                  !session.isActive && player.totalScore === maxScore ? 'text-primary' : 'text-foreground'
                }`}>
                  {player.totalScore} {t.games.points}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Notes */}
      {session.isActive ? (
        <div className="space-y-2">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t.games.notesPlaceholder}
            className="min-h-[60px]"
          />
        </div>
      ) : session.notes ? (
        <div className="p-3 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground font-medium mb-1">{t.games.notes}</p>
          <p className="text-sm text-foreground">{session.notes}</p>
        </div>
      ) : null}
    </div>
  );
};
