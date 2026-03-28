import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, ChefHat, RefreshCw, Check, Settings2 } from 'lucide-react';
import { openaiService, loadOpenAIConfig, saveOpenAIConfig } from '../../services/openai.service';
import type { OpenAIConfig } from '../../services/openai.service';
import type { Recipe } from '../../types/meal.types';
import { useCalendar } from '../../contexts/CalendarContext';
import { useLocale } from '../../contexts/LocaleContext';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePickerField } from '@/components/ui/date-picker-field';

const MEAL_TYPES = [
  { key: 'breakfast' as const, emoji: '🥐', defaultStartHour: 7, defaultStartMin: 30, defaultEndHour: 8, defaultEndMin: 0 },
  { key: 'lunch' as const, emoji: '🥗', defaultStartHour: 12, defaultStartMin: 0, defaultEndHour: 12, defaultEndMin: 30 },
  { key: 'dinner' as const, emoji: '🍽️', defaultStartHour: 17, defaultStartMin: 30, defaultEndHour: 18, defaultEndMin: 0 },
];

type MealKey = 'breakfast' | 'lunch' | 'dinner';
type Step = 'input' | 'config' | 'recipe' | 'schedule' | 'done';

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

/** Guess the most likely next meal type based on current time */
function guessNextMealType(): MealKey {
  const hour = new Date().getHours();
  if (hour < 10) return 'breakfast';
  if (hour < 14) return 'lunch';
  return 'dinner';
}

interface ImagineModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealCalendar: { id: string; accountId: string; color: string };
}

export const ImagineModal: React.FC<ImagineModalProps> = ({ isOpen, onClose, mealCalendar }) => {
  const { createEvent } = useCalendar();
  const { t } = useLocale();

  const [step, setStep] = useState<Step>('input');
  const [mealType, setMealType] = useState<MealKey>(guessNextMealType());
  const [fridgeText, setFridgeText] = useState('');
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Schedule step
  const [date, setDate] = useState(formatDateStr(new Date()));
  const [isAdding, setIsAdding] = useState(false);

  // Config step
  const [aiConfig, setAiConfig] = useState<OpenAIConfig>({ endpoint: '', apiKey: '', deployment: '' });

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep(openaiService.isConfigured() ? 'input' : 'config');
      setMealType(guessNextMealType());
      setFridgeText('');
      setRecipe(null);
      setError(null);
      setIsGenerating(false);
      setDate(formatDateStr(new Date()));
      setIsAdding(false);
      setAiConfig(loadOpenAIConfig());
    }
  }, [isOpen]);

  const handleSaveConfig = useCallback(() => {
    if (!aiConfig.endpoint || !aiConfig.apiKey || !aiConfig.deployment) return;
    saveOpenAIConfig(aiConfig);
    setStep('input');
  }, [aiConfig]);

  const handleGenerate = useCallback(async () => {
    if (!fridgeText.trim()) return;
    setError(null);
    setIsGenerating(true);
    try {
      const result = await openaiService.imagineMeal(fridgeText.trim(), mealType);
      setRecipe(result);
      setStep('recipe');
    } catch (err: any) {
      setError(err.message || 'Failed to generate recipe');
    } finally {
      setIsGenerating(false);
    }
  }, [fridgeText, mealType]);

  const handleTryAnother = useCallback(async () => {
    setError(null);
    setIsGenerating(true);
    try {
      const result = await openaiService.imagineMeal(fridgeText.trim(), mealType);
      setRecipe(result);
    } catch (err: any) {
      setError(err.message || 'Failed to generate recipe');
    } finally {
      setIsGenerating(false);
    }
  }, [fridgeText, mealType]);

  const handleUseRecipe = useCallback(() => {
    setStep('schedule');
  }, []);

  const handleAddToPlanner = useCallback(async () => {
    if (!recipe) return;
    setIsAdding(true);
    setError(null);

    const type = MEAL_TYPES.find(m => m.key === mealType)!;
    const startDate = new Date(`${date}T00:00:00`);
    startDate.setHours(type.defaultStartHour, type.defaultStartMin, 0, 0);
    const endDate = new Date(`${date}T00:00:00`);
    endDate.setHours(type.defaultEndHour, type.defaultEndMin, 0, 0);

    try {
      await createEvent({
        subject: recipe.title,
        start: startDate,
        end: endDate,
        calendarId: mealCalendar.id,
        accountId: mealCalendar.accountId,
        isReminderOn: false,
        body: `${recipe.description}\n\nIngredients:\n${recipe.ingredients.map(i => `• ${i}`).join('\n')}\n\nInstructions:\n${recipe.instructions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
      });
      setStep('done');
    } catch (err: any) {
      setError(err.message || 'Failed to add meal');
    } finally {
      setIsAdding(false);
    }
  }, [recipe, date, mealType, mealCalendar, createEvent]);

  const handleClose = () => {
    onClose();
  };

  // --- Config step ---
  if (step === 'config') {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.mealPlanner?.configureAI || 'Configure AI'}</DialogTitle>
            <DialogDescription>{t.mealPlanner?.configureAIDesc || 'Enter your Azure OpenAI credentials.'}</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="space-y-2">
              <Label>{t.mealPlanner?.aiEndpoint || 'Endpoint'}</Label>
              <Input
                value={aiConfig.endpoint}
                onChange={e => setAiConfig(c => ({ ...c, endpoint: e.target.value }))}
                placeholder={t.mealPlanner?.aiEndpointPlaceholder || 'https://your-resource.openai.azure.com'}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.mealPlanner?.aiKey || 'API Key'}</Label>
              <Input
                type="password"
                value={aiConfig.apiKey}
                onChange={e => setAiConfig(c => ({ ...c, apiKey: e.target.value }))}
                placeholder={t.mealPlanner?.aiKeyPlaceholder || 'Your API key'}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.mealPlanner?.aiDeployment || 'Deployment name'}</Label>
              <Input
                value={aiConfig.deployment}
                onChange={e => setAiConfig(c => ({ ...c, deployment: e.target.value }))}
                placeholder={t.mealPlanner?.aiDeploymentPlaceholder || 'gpt-4o'}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={handleClose}>
              {t.actions?.cancel || 'Cancel'}
            </Button>
            <Button
              onClick={handleSaveConfig}
              disabled={!aiConfig.endpoint || !aiConfig.apiKey || !aiConfig.deployment}
            >
              {t.actions?.save || 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // --- Input step ---
  if (step === 'input') {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles size={20} className="text-amber-500" />
              {t.mealPlanner?.imagineTitle || 'Imagine a Meal'}
            </DialogTitle>
            <DialogDescription>{t.mealPlanner?.imagineDesc || "Tell us what's in your fridge and we'll suggest a recipe."}</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Meal type */}
            <div className="space-y-2">
              <Label>{t.mealPlanner?.mealType || 'Meal type'}</Label>
              <div className="flex gap-2">
                {MEAL_TYPES.map(type => (
                  <button
                    key={type.key}
                    type="button"
                    onClick={() => setMealType(type.key)}
                    className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                      mealType === type.key
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <span>{type.emoji}</span>
                    <span>{t.mealPlanner?.[type.key] || type.key}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Fridge contents */}
            <div className="space-y-2">
              <Label>{t.mealPlanner?.whatsInFridge || "What's in your fridge?"}</Label>
              <textarea
                value={fridgeText}
                onChange={e => setFridgeText(e.target.value)}
                placeholder={t.mealPlanner?.fridgePlaceholder || 'e.g. chicken, rice, broccoli, soy sauce, garlic...'}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[100px] resize-none"
                autoFocus
              />
            </div>
          </DialogBody>
          <DialogFooter className="flex-row justify-between sm:justify-between">
            <Button variant="ghost" size="icon" onClick={() => setStep('config')} title={t.mealPlanner?.configureAI || 'Configure AI'}>
              <Settings2 size={18} />
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleClose}>
                {t.actions?.cancel || 'Cancel'}
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!fridgeText.trim() || isGenerating}
              >
                {isGenerating ? (
                  <><RefreshCw size={16} className="animate-spin mr-2" />{t.mealPlanner?.generating || 'Thinking...'}</>
                ) : (
                  <><Sparkles size={16} className="mr-2" />{t.mealPlanner?.generateRecipe || 'Imagine it!'}</>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // --- Recipe step ---
  if (step === 'recipe' && recipe) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat size={20} className="text-amber-500" />
              {recipe.title}
            </DialogTitle>
            <DialogDescription>{recipe.description}</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Meta */}
            <div className="flex gap-4 text-sm text-muted-foreground">
              {recipe.prepTime && <span>⏱️ Prep: {recipe.prepTime}</span>}
              {recipe.cookTime && <span>🔥 Cook: {recipe.cookTime}</span>}
              {recipe.servings && <span>🍽️ Serves {recipe.servings}</span>}
            </div>

            {/* Ingredients */}
            <div>
              <h4 className="font-semibold text-sm mb-2">{t.meals?.ingredients || 'Ingredients'}</h4>
              <ul className="space-y-1">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-muted-foreground mt-0.5">•</span>
                    <span>{ing}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div>
              <h4 className="font-semibold text-sm mb-2">{t.meals?.instructions || 'Instructions'}</h4>
              <ol className="space-y-2">
                {recipe.instructions.map((step, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </DialogBody>
          <DialogFooter className="flex-row justify-between sm:justify-between">
            <Button
              variant="secondary"
              onClick={handleTryAnother}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <><RefreshCw size={16} className="animate-spin mr-2" />{t.mealPlanner?.generating || 'Thinking...'}</>
              ) : (
                <><RefreshCw size={16} className="mr-2" />{t.mealPlanner?.tryAnother || 'Try another'}</>
              )}
            </Button>
            <Button onClick={handleUseRecipe}>
              <Check size={16} className="mr-2" />
              {t.mealPlanner?.useRecipe || 'Use this recipe'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // --- Schedule step ---
  if (step === 'schedule' && recipe) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat size={20} className="text-amber-500" />
              {recipe.title}
            </DialogTitle>
            <DialogDescription>{t.mealPlanner?.scheduleDesc || "Pick a date and we'll add it to your meal planner."}</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Meal type (shown for reference) */}
            <div className="space-y-2">
              <Label>{t.mealPlanner?.mealType || 'Meal type'}</Label>
              <div className="flex gap-2">
                {MEAL_TYPES.map(type => (
                  <button
                    key={type.key}
                    type="button"
                    onClick={() => setMealType(type.key)}
                    className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                      mealType === type.key
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <span>{type.emoji}</span>
                    <span>{t.mealPlanner?.[type.key] || type.key}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date picker */}
            <div className="space-y-2">
              <Label>{t.mealPlanner?.date || 'Date'}</Label>
              <DatePickerField
                value={date}
                onChange={v => setDate(v)}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setStep('recipe')}>
              {t.actions?.cancel || 'Back'}
            </Button>
            <Button onClick={handleAddToPlanner} disabled={isAdding}>
              {isAdding
                ? <><RefreshCw size={16} className="animate-spin mr-2" />{t.mealPlanner?.adding || 'Adding...'}</>
                : <><Check size={16} className="mr-2" />{t.mealPlanner?.addToPlanner || 'Add to Planner'}</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // --- Done step ---
  if (step === 'done') {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent>
          <DialogBody className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <Check size={32} className="text-green-500" />
            </div>
            <h3 className="text-xl font-semibold">{t.mealPlanner?.mealAdded || 'Meal added!'}</h3>
            <p className="text-muted-foreground text-center">
              <span className="font-medium text-foreground">{recipe?.title}</span>
            </p>
            <Button onClick={handleClose} className="mt-4">
              {t.actions?.close || 'Close'}
            </Button>
          </DialogBody>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
};
