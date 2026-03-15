import React, { useState } from 'react';
import { Dice5, Sparkles, Trophy } from 'lucide-react';
import { useFunNight } from '../contexts/FunNightContext';
import { useLocale } from '../contexts/LocaleContext';
import { SpinWheel } from '../components/fun-night/SpinWheel';
import { FunNightPlanCard } from '../components/fun-night/FunNightPlanCard';
import { GameLibrary } from '../components/fun-night/GameLibrary';
import { FunNightHistory } from '../components/fun-night/FunNightHistory';
import { Scoreboard } from '../components/scoreboard/Scoreboard';

type Tab = 'library' | 'history' | 'scoreboard';

export const FunNightPage: React.FC = () => {
  const { currentPlan, isGenerating, generateFunNight, games, error } = useFunNight();
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<Tab>('library');

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Dice5 size={28} className="text-primary" />
          <h2 className="text-2xl font-semibold text-foreground">{t.funNight.title}</h2>
        </div>
        <p className="text-muted-foreground">{t.funNight.subtitle}</p>
      </div>

      {/* Hero: SpinWheel + Plan Tonight */}
      <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
        <div className="w-full md:w-auto flex-shrink-0">
          <SpinWheel />
        </div>
        <div className="flex-1 flex flex-col items-center md:items-start gap-4">
          <button
            onClick={generateFunNight}
            disabled={isGenerating || games.length === 0}
            className="btn-primary flex items-center gap-3 text-xl px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            <Sparkles size={28} className={isGenerating ? 'animate-spin' : ''} />
            {isGenerating ? t.funNight.generating : t.funNight.planTonight}
          </button>
          {games.length === 0 && (
            <p className="text-sm text-muted-foreground">{t.funNight.noGames}</p>
          )}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
      </div>

      {/* Current plan */}
      {(currentPlan || isGenerating) && (
        <div className="mb-8">
          <FunNightPlanCard />
        </div>
      )}

      {/* Tabs: Library / History */}
      <div className="flex gap-2 mb-4 border-b border-border">
        <button
          onClick={() => setActiveTab('library')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'library'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          style={{ minHeight: 44 }}
        >
          {t.funNight.gameLibrary}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          style={{ minHeight: 44 }}
        >
          {t.funNight.history}
        </button>
        <button
          onClick={() => setActiveTab('scoreboard')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
            activeTab === 'scoreboard'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          style={{ minHeight: 44 }}
        >
          <Trophy size={14} />
          {t.scoreboard.title}
        </button>
      </div>

      {activeTab === 'library' ? <GameLibrary /> : activeTab === 'history' ? <FunNightHistory /> : <Scoreboard />}
    </div>
  );
};
