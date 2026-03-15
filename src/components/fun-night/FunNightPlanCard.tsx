import React, { useState } from 'react';
import { Dice5, UtensilsCrossed, Film, ChevronDown, ChevronRight, Sparkles, Save } from 'lucide-react';
import { useFunNight } from '../../contexts/FunNightContext';
import { useLocale } from '../../contexts/LocaleContext';

export const FunNightPlanCard: React.FC = () => {
  const { currentPlan, isGenerating, saveFunNight, generateFunNight } = useFunNight();
  const { t } = useLocale();

  const [ingredientsOpen, setIngredientsOpen] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  if (isGenerating) {
    return (
      <div className="card animate-pulse">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles size={24} className="text-primary animate-spin" />
          <h3 className="text-xl font-bold text-foreground">{t.funNight.generating}</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-5 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!currentPlan) return null;

  const handleSave = () => saveFunNight(currentPlan);

  return (
    <div className="card border-2 border-primary/30">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles size={24} className="text-primary" />
        <h3 className="text-xl font-bold text-foreground">{t.funNight.tonightsPlan}</h3>
      </div>

      <div className="space-y-6">
        {/* Game of the Night */}
        <section className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Dice5 size={20} className="text-primary" />
            <h4 className="font-semibold text-foreground">{t.funNight.gameOfTheNight}</h4>
          </div>
          {currentPlan.game ? (
            <div>
              <p className="text-lg font-bold text-foreground">{currentPlan.game.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {currentPlan.game.minPlayers}–{currentPlan.game.maxPlayers} {t.funNight.players.toLowerCase()}
                {' · '}{currentPlan.game.minAge}+
                {' · ~'}{currentPlan.game.estimatedMinutes} min
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground italic">{t.funNight.noGames}</p>
          )}
        </section>

        {/* Dinner Suggestion */}
        <section className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <UtensilsCrossed size={20} className="text-orange-500" />
            <h4 className="font-semibold text-foreground">{t.funNight.dinnerSuggestion}</h4>
          </div>
          <p className="text-lg font-bold text-foreground">{currentPlan.dinnerTitle}</p>
          <p className="text-sm text-muted-foreground mt-1">{currentPlan.dinnerDescription}</p>

          {/* Collapsible ingredients */}
          {currentPlan.dinnerIngredients.length > 0 && (
            <button
              onClick={() => setIngredientsOpen(!ingredientsOpen)}
              className="flex items-center gap-1 mt-3 text-sm font-medium text-primary hover:underline"
            >
              {ingredientsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              {t.meals.ingredients} ({currentPlan.dinnerIngredients.length})
            </button>
          )}
          {ingredientsOpen && (
            <ul className="mt-2 space-y-1 pl-6 text-sm text-foreground list-disc">
              {currentPlan.dinnerIngredients.map((ing, i) => (
                <li key={i}>{ing}</li>
              ))}
            </ul>
          )}

          {/* Collapsible instructions */}
          {currentPlan.dinnerInstructions.length > 0 && (
            <button
              onClick={() => setInstructionsOpen(!instructionsOpen)}
              className="flex items-center gap-1 mt-3 text-sm font-medium text-primary hover:underline"
            >
              {instructionsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              {t.meals.instructions} ({currentPlan.dinnerInstructions.length})
            </button>
          )}
          {instructionsOpen && (
            <ol className="mt-2 space-y-2 pl-6 text-sm text-foreground list-decimal">
              {currentPlan.dinnerInstructions.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          )}
        </section>

        {/* Activity / Movie */}
        <section className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Film size={20} className="text-purple-500" />
            <h4 className="font-semibold text-foreground">
              {currentPlan.activity.type === 'movie'
                ? t.funNight.movieSuggestion
                : t.funNight.activitySuggestion}
            </h4>
          </div>
          <p className="text-lg font-bold text-foreground">{currentPlan.activity.title}</p>
          <p className="text-sm text-muted-foreground mt-1">{currentPlan.activity.description}</p>
          {currentPlan.activity.ageRating && (
            <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
              {currentPlan.activity.ageRating}
            </span>
          )}
        </section>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mt-6">
        <button onClick={handleSave} className="btn-primary flex items-center gap-2 flex-1">
          <Save size={20} />
          {t.actions.save}
        </button>
        <button onClick={generateFunNight} className="btn-secondary flex items-center gap-2 flex-1">
          <Sparkles size={20} />
          {t.actions.generating.replace('...', '')}
        </button>
      </div>
    </div>
  );
};
