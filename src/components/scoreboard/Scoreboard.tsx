import React from 'react';
import { useScoreboard } from '../../contexts/ScoreboardContext';
import { GameSetup } from './GameSetup';
import { ActiveSession } from './ActiveSession';
import { PastSessions } from './PastSessions';
import { useLocale } from '../../contexts/LocaleContext';
import type { ScoringMode, ScorePlayer } from '../../types/funnight.types';

export const Scoreboard: React.FC = () => {
  const { currentSession, pastSessions, startSession } = useScoreboard();
  const { t } = useLocale();

  const handleStart = (gameId: string, gameName: string, scoringMode: ScoringMode, players: ScorePlayer[]) => {
    startSession(gameId, gameName, scoringMode, players);
  };

  if (currentSession) {
    return <ActiveSession />;
  }

  return (
    <div className="space-y-6">
      <GameSetup onStart={handleStart} />
      {pastSessions.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {t.scoreboard.pastGames}
          </h4>
          <PastSessions />
        </div>
      )}
    </div>
  );
};
