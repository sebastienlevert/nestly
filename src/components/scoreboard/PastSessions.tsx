import React from 'react';
import { Trophy, Trash2, Crown, Clock } from 'lucide-react';
import { useScoreboard } from '../../contexts/ScoreboardContext';
import { useLocale } from '../../contexts/LocaleContext';

const PLAYER_COLORS: Record<string, string> = {
  Red: 'bg-red-500',
  Blue: 'bg-blue-500',
  Green: 'bg-emerald-500',
  Purple: 'bg-purple-500',
  Orange: 'bg-orange-500',
  Pink: 'bg-pink-500',
  Cyan: 'bg-cyan-500',
  Yellow: 'bg-yellow-500',
};

export const PastSessions: React.FC = () => {
  const { pastSessions, deleteSession } = useScoreboard();
  const { t } = useLocale();

  if (pastSessions.length === 0) {
    return (
      <div className="text-center py-8">
        <Trophy size={32} className="text-muted-foreground mx-auto mb-2 opacity-40" />
        <p className="text-muted-foreground text-sm">{t.scoreboard.noHistory}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pastSessions.map(session => {
        const sorted = [...session.players].sort((a, b) =>
          session.scoringMode === 'highest' ? b.score - a.score : a.score - b.score
        );
        const date = new Date(session.createdAt);
        const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

        return (
          <div key={session.id} className="card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-foreground">{session.gameName}</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <Clock size={12} />
                  <span>{dateStr}</span>
                  <span>·</span>
                  <span>{session.round} {t.scoreboard.rounds}</span>
                  <span>·</span>
                  <span>{session.players.length} {t.scoreboard.players}</span>
                </div>
              </div>
              <button
                onClick={() => deleteSession(session.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
                style={{ minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Results */}
            <div className="space-y-1">
              {sorted.map((player, i) => {
                const bg = PLAYER_COLORS[player.color] || 'bg-muted';
                return (
                  <div key={player.id} className={`flex items-center gap-2 p-2 rounded-lg ${i === 0 ? 'bg-primary/5' : ''}`}>
                    <div className="w-5 text-center text-xs">
                      {i === 0 ? <Crown size={14} className="text-yellow-500 mx-auto" /> : <span className="text-muted-foreground">{i + 1}</span>}
                    </div>
                    <div className={`w-6 h-6 rounded-full ${bg} flex items-center justify-center text-white text-[10px] font-bold`}>
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="flex-1 text-sm text-foreground truncate">{player.name}</span>
                    <span className="text-sm font-mono font-semibold text-foreground">{player.score}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
