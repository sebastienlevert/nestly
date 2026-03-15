import React, { useState, useMemo } from 'react';
import { Dice5, Heart, HeartOff, Plus, X } from 'lucide-react';
import { useFunNight } from '../../contexts/FunNightContext';
import { useLocale } from '../../contexts/LocaleContext';
import type { GameCategory } from '../../types/funnight.types';

const categoryColors: Record<GameCategory, string> = {
  strategy: 'bg-blue-100 text-blue-800',
  party: 'bg-pink-100 text-pink-800',
  cooperative: 'bg-green-100 text-green-800',
  card: 'bg-amber-100 text-amber-800',
  dice: 'bg-purple-100 text-purple-800',
  trivia: 'bg-cyan-100 text-cyan-800',
  family: 'bg-orange-100 text-orange-800',
  kids: 'bg-lime-100 text-lime-800',
  other: 'bg-secondary text-secondary-foreground',
};

const GAME_CATEGORIES: GameCategory[] = [
  'strategy', 'party', 'cooperative', 'card', 'dice', 'trivia', 'family', 'kids', 'other',
];

export const GameLibrary: React.FC = () => {
  const { games, addGame, removeGame, toggleFavoriteGame } = useFunNight();
  const { t } = useLocale();

  const [isAdding, setIsAdding] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [newGame, setNewGame] = useState({
    name: '',
    minPlayers: 2,
    maxPlayers: 4,
    minAge: 6,
    estimatedMinutes: 30,
    category: 'family' as GameCategory,
  });

  const categories = useMemo(() =>
    GAME_CATEGORIES.map(value => ({
      value,
      label: t.funNight.categories[value],
    })),
    [t],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGame.name.trim()) return;
    addGame(newGame);
    setNewGame({ name: '', minPlayers: 2, maxPlayers: 4, minAge: 6, estimatedMinutes: 30, category: 'family' });
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      removeGame(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  };

  // Sort favorites first
  const sortedGames = useMemo(
    () => [...games].sort((a, b) => (a.isFavorite === b.isFavorite ? 0 : a.isFavorite ? -1 : 1)),
    [games],
  );

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Dice5 size={24} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">{t.funNight.gameLibrary}</h3>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          {t.funNight.addGame}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-muted rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={newGame.name}
              onChange={e => setNewGame(prev => ({ ...prev, name: e.target.value }))}
              className="input sm:col-span-2"
              placeholder={t.funNight.gameNamePlaceholder}
              autoFocus
            />
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">{t.funNight.minPlayers}</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={newGame.minPlayers}
                  onChange={e => setNewGame(prev => ({ ...prev, minPlayers: Number(e.target.value) }))}
                  className="input"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">{t.funNight.maxPlayers}</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={newGame.maxPlayers}
                  onChange={e => setNewGame(prev => ({ ...prev, maxPlayers: Number(e.target.value) }))}
                  className="input"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">{t.funNight.minAge}</label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={newGame.minAge}
                  onChange={e => setNewGame(prev => ({ ...prev, minAge: Number(e.target.value) }))}
                  className="input"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">{t.funNight.estimatedMinutes}</label>
                <input
                  type="number"
                  min={1}
                  max={600}
                  value={newGame.estimatedMinutes}
                  onChange={e => setNewGame(prev => ({ ...prev, estimatedMinutes: Number(e.target.value) }))}
                  className="input"
                />
              </div>
            </div>
            <select
              value={newGame.category}
              onChange={e => setNewGame(prev => ({ ...prev, category: e.target.value as GameCategory }))}
              className="input"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 mt-3">
            <button type="submit" className="btn-primary flex-1">
              {t.actions.save}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewGame({ name: '', minPlayers: 2, maxPlayers: 4, minAge: 6, estimatedMinutes: 30, category: 'family' });
              }}
              className="btn-secondary flex-1"
            >
              {t.actions.cancel}
            </button>
          </div>
        </form>
      )}

      {sortedGames.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Dice5 size={48} className="mx-auto mb-3 text-muted-foreground" />
          <p>{t.funNight.emptyLibrary}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {sortedGames.map(game => (
            <div
              key={game.id}
              className="relative bg-card border border-border rounded-lg p-3 transition-shadow hover:shadow-md group"
            >
              {/* Actions row */}
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  onClick={() => toggleFavoriteGame(game.id)}
                  className="btn-icon !min-w-[36px] !min-h-[36px] !p-1"
                  aria-label={game.isFavorite ? t.actions.unfavorite : t.actions.favorite}
                >
                  {game.isFavorite
                    ? <Heart size={16} className="text-red-500 fill-red-500" />
                    : <HeartOff size={16} className="text-muted-foreground" />}
                </button>
                <button
                  onClick={() => handleDelete(game.id)}
                  className={`btn-icon !min-w-[36px] !min-h-[36px] !p-1 ${
                    confirmDeleteId === game.id ? 'bg-destructive text-white' : 'text-muted-foreground'
                  }`}
                  aria-label={t.funNight.removeGame}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Game info */}
              <div className="pr-16">
                <p className="font-bold text-foreground text-sm leading-tight mb-1">{game.name}</p>
              </div>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <p>{game.minPlayers}–{game.maxPlayers} {t.funNight.players.toLowerCase()}</p>
                <p>{game.minAge}+</p>
                <p>~{game.estimatedMinutes} min</p>
              </div>
              <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${categoryColors[game.category]}`}>
                {t.funNight.categories[game.category]}
              </span>

              {/* Confirm delete overlay */}
              {confirmDeleteId === game.id && (
                <div
                  className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center p-2 cursor-pointer"
                  onClick={() => setConfirmDeleteId(null)}
                >
                  <div className="text-center" onClick={e => e.stopPropagation()}>
                    <p className="text-sm text-foreground mb-2">{t.funNight.removeGameConfirm}</p>
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => handleDelete(game.id)} className="btn-primary text-xs !py-1.5 !px-3">
                        {t.actions.confirm}
                      </button>
                      <button onClick={() => setConfirmDeleteId(null)} className="btn-secondary text-xs !py-1.5 !px-3">
                        {t.actions.cancel}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
