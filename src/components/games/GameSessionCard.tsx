import React from 'react';
import { useLocale } from '../../contexts/LocaleContext';
import type { GameSession } from '../../types/game.types';
import { Button } from '../ui/button';
import { Trophy, Play, Eye, Trash2, Dices, TreePine, Bird, Gamepad2 } from 'lucide-react';

interface GameSessionCardProps {
  session: GameSession;
  onSelect: (session: GameSession) => void;
  onDelete: (sessionId: string) => void;
}

const gameIcons: Record<string, React.ReactNode> = {
  'dice-hospital': <Dices size={18} />,
  'parks': <TreePine size={18} />,
  'wingspan': <Bird size={18} />,
};

export const GameSessionCard: React.FC<GameSessionCardProps> = ({ session, onSelect, onDelete }) => {
  const { t } = useLocale();

  const maxScore = Math.max(...session.players.map(p => p.totalScore));
  const winners = session.players.filter(p => p.totalScore === maxScore);
  const isTie = winners.length > 1 && !session.isActive;

  return (
    <div className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow bg-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            session.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
          }`}>
            {gameIcons[session.gameId] || <Gamepad2 size={18} />}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{session.gameName}</h3>
            <p className="text-xs text-muted-foreground">
              {new Date(session.playedAt).toLocaleDateString()} · {session.players.length} {t.games.players.toLowerCase()}
              {session.rounds > 1 && ` · ${session.rounds} ${t.games.round.toLowerCase()}s`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => onSelect(session)} className="h-8 w-8 p-0">
            {session.isActive ? <Play size={16} /> : <Eye size={16} />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(session.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      {/* Player scores preview */}
      <div className="mt-3 flex flex-wrap gap-2">
        {session.players.map((player, i) => {
          const isWinner = !session.isActive && player.totalScore === maxScore;
          return (
            <div
              key={i}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                isWinner
                  ? 'bg-primary/15 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {isWinner && <Trophy size={12} />}
              <span>{player.name}</span>
              <span className="font-bold">{player.totalScore}</span>
            </div>
          );
        })}
      </div>

      {/* Status badge */}
      {session.isActive && (
        <div className="mt-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {t.games.activeGames}
          </span>
        </div>
      )}

      {isTie && (
        <div className="mt-2">
          <span className="text-xs text-muted-foreground">{t.games.tie}</span>
        </div>
      )}
    </div>
  );
};
