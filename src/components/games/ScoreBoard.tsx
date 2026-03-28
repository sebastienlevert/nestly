import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocale } from '../../contexts/LocaleContext';
import { useGame } from '../../contexts/GameContext';
import type { GameSession } from '../../types/game.types';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Plus, Trophy, ArrowLeft, Check, Minus, X } from 'lucide-react';

interface ScoreBoardProps {
  session: GameSession;
  onBack: () => void;
}

interface ScoreEntry {
  round: number;
  player: number;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ session, onBack }) => {
  const { t } = useLocale();
  const { updateScore, addRound, finishGame } = useGame();
  const [editing, setEditing] = useState<ScoreEntry | null>(null);
  const [editValue, setEditValue] = useState(0);
  const [notes, setNotes] = useState(session.notes || '');
  const inputRef = useRef<HTMLInputElement>(null);

  const categories = session.scoringCategories;
  const isCategoryGame = categories && categories.length > 0;

  // On mobile, don't auto-focus the input to avoid triggering the keyboard.
  // Users can use the +/- buttons or tap the input to type manually.
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches;

  useEffect(() => {
    if (editing && inputRef.current && !isMobile) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing, isMobile]);

  const openEditor = useCallback((playerIndex: number, roundIndex: number) => {
    if (!session.isActive) return;
    setEditing({ player: playerIndex, round: roundIndex });
    setEditValue(session.players[playerIndex].roundScores[roundIndex] || 0);
  }, [session.isActive, session.players]);

  const saveAndClose = useCallback(() => {
    if (!editing) return;
    updateScore(session.id, editing.player, editing.round, editValue);
    setEditing(null);
  }, [editing, editValue, session.id, updateScore]);

  const saveAndNext = useCallback(() => {
    if (!editing) return;
    updateScore(session.id, editing.player, editing.round, editValue);
    // Advance to next player in same round, or close if last
    const nextPlayer = editing.player + 1;
    if (nextPlayer < session.players.length) {
      const nextVal = session.players[nextPlayer].roundScores[editing.round] || 0;
      setEditing({ player: nextPlayer, round: editing.round });
      setEditValue(nextVal);
    } else {
      setEditing(null);
    }
  }, [editing, editValue, session.id, session.players, updateScore]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveAndNext();
    if (e.key === 'Escape') setEditing(null);
  };

  const adjustValue = (delta: number) => {
    setEditValue(prev => prev + delta);
  };

  const handleAddRound = () => {
    addRound(session.id);
    // Auto-open score entry for first player of the new round
    setTimeout(() => {
      openEditor(0, session.rounds); // session.rounds is the index of the new round
    }, 50);
  };

  const handleFinish = () => {
    finishGame(session.id, notes || undefined);
  };

  // Find winner(s)
  const maxScore = Math.max(...session.players.map(p => p.totalScore));
  const winners = session.players.filter(p => p.totalScore === maxScore);
  const isTie = winners.length > 1;

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 min-h-[44px] min-w-[44px]">
          <ArrowLeft size={18} /> <span className="hidden sm:inline">{t.games.backToGames}</span>
        </Button>
        {session.isActive && (
          <div className="flex gap-2">
            {!isCategoryGame && (
              <Button variant="outline" size="sm" onClick={handleAddRound} className="min-h-[44px] px-3">
                <Plus size={18} className="sm:mr-1" /> <span className="hidden sm:inline">{t.games.addRound}</span>
              </Button>
            )}
            <Button size="sm" onClick={handleFinish} className="gap-1 min-h-[44px] px-3">
              <Check size={18} /> <span className="hidden sm:inline">{t.games.finishGame}</span>
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

      {/* Score table — larger cells for mobile */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground sticky left-0 bg-muted/50 text-xs sm:text-sm">
                {isCategoryGame ? t.games.category : t.games.round}
              </th>
              {session.players.map((player, i) => (
                <th key={i} className="text-center p-2 sm:p-3 font-medium text-foreground min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm">
                  {player.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: session.rounds }, (_, roundIndex) => (
              <tr key={roundIndex} className="border-t border-border">
                <td className="p-2 sm:p-3 font-medium text-muted-foreground sticky left-0 bg-card text-xs sm:text-sm whitespace-nowrap">
                  {isCategoryGame ? categories![roundIndex] : `${t.games.round} ${roundIndex + 1}`}
                </td>
                {session.players.map((player, playerIndex) => {
                  const isActive = editing?.player === playerIndex && editing?.round === roundIndex;
                  return (
                    <td key={playerIndex} className="text-center p-1 sm:p-2">
                      <button
                        onClick={() => openEditor(playerIndex, roundIndex)}
                        className={`w-full min-h-[44px] py-2 px-1 rounded-lg text-center text-base font-medium transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground ring-2 ring-primary'
                            : session.isActive
                              ? 'hover:bg-primary/10 active:bg-primary/20 cursor-pointer'
                              : 'cursor-default'
                        }`}
                      >
                        {player.roundScores[roundIndex] || 0}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* Total row */}
            <tr className="border-t-2 border-primary/30 bg-primary/5 font-bold">
              <td className="p-2 sm:p-3 text-primary sticky left-0 bg-primary/5 text-xs sm:text-sm">{t.games.total}</td>
              {session.players.map((player, i) => (
                <td key={i} className={`text-center p-2 sm:p-3 text-base ${
                  !session.isActive && player.totalScore === maxScore ? 'text-primary' : 'text-foreground'
                }`}>
                  {player.totalScore}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Score entry panel — slides up from bottom on mobile */}
      {editing && (
        <div className="fixed inset-x-0 bottom-0 z-50 sm:relative sm:inset-auto">
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 bg-black/30 sm:hidden"
            onClick={() => { saveAndClose(); }}
          />
          <div className="relative bg-card border-t sm:border border-border rounded-t-2xl sm:rounded-xl shadow-xl p-4 sm:p-5 space-y-4 animate-in slide-in-from-bottom duration-200">
            {/* Close button */}
            <button
              onClick={() => setEditing(null)}
              className="absolute top-3 right-3 p-2 rounded-full hover:bg-muted min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X size={20} />
            </button>

            {/* Player name + round label */}
            <div className="text-center pr-8">
              <p className="text-sm text-muted-foreground">
                {isCategoryGame ? categories![editing.round] : `${t.games.round} ${editing.round + 1}`}
              </p>
              <p className="text-lg font-semibold text-foreground">
                {t.games.scoreForPlayer} {session.players[editing.player].name}
              </p>
            </div>

            {/* Stepper + input */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => adjustValue(-5)}
                className="w-12 h-12 rounded-full bg-muted hover:bg-muted/80 active:scale-95 flex items-center justify-center text-sm font-bold text-muted-foreground transition-transform"
              >
                -5
              </button>
              <button
                onClick={() => adjustValue(-1)}
                className="w-14 h-14 rounded-full bg-destructive/10 hover:bg-destructive/20 active:scale-95 flex items-center justify-center text-destructive transition-transform"
              >
                <Minus size={24} />
              </button>
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="-?[0-9]*"
                value={editValue}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || val === '-') { setEditValue(0); return; }
                  const n = parseInt(val);
                  if (!isNaN(n)) setEditValue(n);
                }}
                onKeyDown={handleKeyDown}
                className="w-24 h-16 text-center text-3xl font-bold bg-muted/50 border-2 border-primary rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={() => adjustValue(1)}
                className="w-14 h-14 rounded-full bg-primary/10 hover:bg-primary/20 active:scale-95 flex items-center justify-center text-primary transition-transform"
              >
                <Plus size={24} />
              </button>
              <button
                onClick={() => adjustValue(5)}
                className="w-12 h-12 rounded-full bg-muted hover:bg-muted/80 active:scale-95 flex items-center justify-center text-sm font-bold text-muted-foreground transition-transform"
              >
                +5
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              {editing.player < session.players.length - 1 ? (
                <Button onClick={saveAndNext} className="flex-1 min-h-[48px] text-base">
                  {t.games.nextPlayer} → {session.players[editing.player + 1]?.name}
                </Button>
              ) : (
                <Button onClick={saveAndClose} className="flex-1 min-h-[48px] text-base">
                  {t.games.done}
                </Button>
              )}
            </div>

            {/* Player indicator dots */}
            <div className="flex justify-center gap-2">
              {session.players.map((p, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (editing) updateScore(session.id, editing.player, editing.round, editValue);
                    setEditing({ player: i, round: editing.round });
                    setEditValue(session.players[i].roundScores[editing.round] || 0);
                  }}
                  className={`h-2.5 rounded-full transition-all ${
                    i === editing.player
                      ? 'w-8 bg-primary'
                      : 'w-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                  title={p.name}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hint for mobile when no editing */}
      {session.isActive && !editing && (
        <p className="text-center text-xs text-muted-foreground sm:hidden">
          {t.games.tapToEdit}
        </p>
      )}

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
