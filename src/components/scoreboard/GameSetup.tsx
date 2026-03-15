import React, { useState } from 'react';
import { Trophy, Search, Dice5, ChevronUp, ChevronDown, Plus, Users } from 'lucide-react';
import { useFunNight } from '../../contexts/FunNightContext';
import { useLocale } from '../../contexts/LocaleContext';
import type { BoardGame } from '../../types/funnight.types';
import type { ScoringMode, ScorePlayer } from '../../types/funnight.types';

const PLAYER_COLORS = [
  { name: 'Red', class: 'bg-red-500' },
  { name: 'Blue', class: 'bg-blue-500' },
  { name: 'Green', class: 'bg-emerald-500' },
  { name: 'Purple', class: 'bg-purple-500' },
  { name: 'Orange', class: 'bg-orange-500' },
  { name: 'Pink', class: 'bg-pink-500' },
  { name: 'Cyan', class: 'bg-cyan-500' },
  { name: 'Yellow', class: 'bg-yellow-500' },
];

interface GameSetupProps {
  onStart: (gameId: string, gameName: string, scoringMode: ScoringMode, players: ScorePlayer[]) => void;
}

export const GameSetup: React.FC<GameSetupProps> = ({ onStart }) => {
  const { games } = useFunNight();
  const { t } = useLocale();
  const [step, setStep] = useState<'pick' | 'players'>('pick');
  const [search, setSearch] = useState('');
  const [selectedGame, setSelectedGame] = useState<BoardGame | null>(null);
  const [scoringMode, setScoringMode] = useState<ScoringMode>('highest');
  const [players, setPlayers] = useState<ScorePlayer[]>([]);
  const [newName, setNewName] = useState('');
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);

  const filtered = games.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const usedColors = players.map(p => p.color);

  const addPlayer = () => {
    const trimmed = newName.trim();
    if (!trimmed || players.length >= 8) return;
    const color = PLAYER_COLORS[selectedColorIdx];
    setPlayers(prev => [...prev, {
      id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: trimmed,
      color: color.name,
      score: 0,
    }]);
    setNewName('');
    const nextAvail = PLAYER_COLORS.findIndex(
      (c, i) => i !== selectedColorIdx && !usedColors.includes(c.name)
    );
    if (nextAvail >= 0) setSelectedColorIdx(nextAvail);
  };

  const removePlayer = (id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
  };

  const handleStart = () => {
    if (!selectedGame || players.length < 2) return;
    onStart(selectedGame.id, selectedGame.name, scoringMode, players);
  };

  // Step 1: Pick a game from your library
  if (step === 'pick') {
    return (
      <div className="space-y-4">
        <div className="text-center py-4">
          <Trophy size={40} className="text-primary mx-auto mb-2" />
          <h3 className="text-lg font-semibold text-foreground">{t.scoreboard.chooseGame}</h3>
          <p className="text-sm text-muted-foreground">{t.scoreboard.chooseGameSub}</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.scoreboard.searchGames}
            className="input pl-10"
          />
        </div>

        {/* Game list */}
        {filtered.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">
              {games.length === 0 ? t.scoreboard.noGamesInLibrary : t.scoreboard.noMatchingGames}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filtered.map(game => (
              <button
                key={game.id}
                onClick={() => { setSelectedGame(game); setStep('players'); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                style={{ minHeight: 44 }}
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Dice5 size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-foreground truncate">{game.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {game.minPlayers}–{game.maxPlayers} {t.scoreboard.players} · {t.funNight.categories[game.category] || game.category}
                  </p>
                </div>
                {game.isFavorite && <span className="text-yellow-500">★</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Step 2: Configure players
  return (
    <div className="space-y-4">
      {/* Back + game name */}
      <div>
        <button
          onClick={() => setStep('pick')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          style={{ minHeight: 44, display: 'flex', alignItems: 'center' }}
        >
          ← {t.scoreboard.backToGames}
        </button>
        <div className="flex items-center gap-2">
          <Dice5 size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">{selectedGame?.name}</h3>
        </div>
      </div>

      {/* Scoring mode */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
          {t.scoreboard.winCondition}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'highest' as ScoringMode, label: t.scoreboard.highestWins, icon: ChevronUp },
            { value: 'lowest' as ScoringMode, label: t.scoreboard.lowestWins, icon: ChevronDown },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setScoringMode(value)}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                scoringMode === value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/30'
              }`}
              style={{ minHeight: 44 }}
            >
              <Icon size={18} />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Add player */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
          {t.scoreboard.addPlayers} ({players.length}/8)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addPlayer()}
            placeholder={t.scoreboard.playerNamePlaceholder}
            maxLength={15}
            className="input flex-1"
          />
          <button
            onClick={addPlayer}
            disabled={!newName.trim() || players.length >= 8}
            className="btn-primary px-4 rounded-lg disabled:opacity-30"
            style={{ minHeight: 44 }}
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Color picker */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {PLAYER_COLORS.map((color, i) => {
            const used = usedColors.includes(color.name);
            return (
              <button
                key={color.name}
                onClick={() => !used && setSelectedColorIdx(i)}
                disabled={used}
                className={`w-8 h-8 rounded-full ${color.class} transition-all ${
                  used
                    ? 'opacity-20 cursor-not-allowed'
                    : selectedColorIdx === i
                      ? 'ring-2 ring-offset-2 ring-offset-background ring-primary scale-110'
                      : 'hover:scale-105'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Player list */}
      <div className="space-y-2">
        {players.map(player => {
          const color = PLAYER_COLORS.find(c => c.name === player.color);
          return (
            <div key={player.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <div className={`w-8 h-8 rounded-full ${color?.class || 'bg-muted'} flex items-center justify-center text-white text-xs font-bold`}>
                {player.name.charAt(0).toUpperCase()}
              </div>
              <span className="flex-1 font-medium text-foreground text-sm">{player.name}</span>
              <button
                onClick={() => removePlayer(player.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
                style={{ minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {/* Start button */}
      <button
        onClick={handleStart}
        disabled={players.length < 2}
        className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4 rounded-xl disabled:opacity-30"
        style={{ minHeight: 48 }}
      >
        <Users size={20} />
        {t.scoreboard.startGame} ({players.length} {t.scoreboard.players})
      </button>
    </div>
  );
};
