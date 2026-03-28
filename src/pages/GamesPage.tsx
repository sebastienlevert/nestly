import React, { useState } from 'react';
import { useLocale } from '../contexts/LocaleContext';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import type { GameSession } from '../types/game.types';
import { NewGameModal } from '../components/games/NewGameModal';
import { ScoreBoard } from '../components/games/ScoreBoard';
import { GameSessionCard } from '../components/games/GameSessionCard';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Plus, Dices, Cloud } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

type ViewFilter = 'active' | 'completed';

export const GamesPage: React.FC = () => {
  const { t } = useLocale();
  const { isAuthenticated } = useAuth();
  const { sessions, isLoading, isSyncing, deleteSession } = useGame();
  const [showNewGame, setShowNewGame] = useState(false);
  const [activeSession, setActiveSession] = useState<GameSession | null>(null);
  const [filter, setFilter] = useState<ViewFilter>('active');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Update activeSession whenever sessions change (for live score updates)
  const currentSession = activeSession
    ? sessions.find(s => s.id === activeSession.id) || activeSession
    : null;

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-4">
        <Dices size={48} className="text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{t.games.signInMessage}</p>
      </div>
    );
  }

  if (currentSession) {
    return (
      <div className="max-w-4xl mx-auto p-3 sm:p-6">
        <ScoreBoard session={currentSession} onBack={() => setActiveSession(null)} />
      </div>
    );
  }

  const activeSessions = sessions.filter(s => s.isActive);
  const completedSessions = sessions.filter(s => !s.isActive);
  const filteredSessions = filter === 'active' ? activeSessions : completedSessions;

  const handleGameCreated = (session: GameSession) => {
    setActiveSession(session);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteSession(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.games.title}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            {t.games.subtitle}
            {isSyncing && <Cloud size={14} className="animate-pulse text-primary" />}
          </p>
        </div>
        <Button onClick={() => setShowNewGame(true)} className="gap-1 min-h-[44px]">
          <Plus size={18} /> <span className="hidden sm:inline">{t.games.newGame}</span>
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('active')}
          className="min-h-[44px]"
        >
          {t.games.activeGames} {activeSessions.length > 0 && `(${activeSessions.length})`}
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('completed')}
          className="min-h-[44px]"
        >
          {t.games.completedGames} {completedSessions.length > 0 && `(${completedSessions.length})`}
        </Button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredSessions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Dices size={48} className="text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">{t.games.noGames}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t.games.noGamesDescription}</p>
          <Button onClick={() => setShowNewGame(true)} className="gap-1">
            <Plus size={16} /> {t.games.newGame}
          </Button>
        </div>
      )}

      {/* Session list */}
      {!isLoading && filteredSessions.length > 0 && (
        <div className="space-y-3">
          {filteredSessions.map(session => (
            <GameSessionCard
              key={session.id}
              session={session}
              onSelect={setActiveSession}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </div>
      )}

      {/* New game modal */}
      <NewGameModal
        isOpen={showNewGame}
        onClose={() => setShowNewGame(false)}
        onGameCreated={handleGameCreated}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.games.deleteGame}</AlertDialogTitle>
            <AlertDialogDescription>{t.games.deleteGameConfirm}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.games.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t.games.deleteGame}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
