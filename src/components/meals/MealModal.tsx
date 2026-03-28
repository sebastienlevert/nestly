import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { useCalendar } from '../../contexts/CalendarContext';
import { useLocale } from '../../contexts/LocaleContext';
import type { CalendarEvent } from '../../types/calendar.types';
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
import { ConfirmDialog } from '../common/ConfirmDialog';

const MEAL_TYPES = [
  { key: 'breakfast' as const, emoji: '🥐', defaultStartHour: 7, defaultStartMin: 30, defaultEndHour: 8, defaultEndMin: 0 },
  { key: 'lunch' as const, emoji: '🥗', defaultStartHour: 12, defaultStartMin: 0, defaultEndHour: 12, defaultEndMin: 30 },
  { key: 'dinner' as const, emoji: '🍽️', defaultStartHour: 17, defaultStartMin: 30, defaultEndHour: 18, defaultEndMin: 0 },
];

type MealKey = 'breakfast' | 'lunch' | 'dinner';

function classifyMeal(event: CalendarEvent): MealKey {
  const start = new Date(event.start.dateTime);
  const hour = start.getHours();
  const minutes = start.getMinutes();
  const time = hour + minutes / 60;

  if (time >= 6 && time < 10) return 'breakfast';
  if (time >= 11 && time < 13.5) return 'lunch';
  return 'dinner';
}

function getMealType(key: MealKey) {
  return MEAL_TYPES.find(m => m.key === key)!;
}

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

function formatLocalDateTime(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${mo}-${da}T${h}:${mi}:00`;
}

interface MealModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealCalendar: { id: string; accountId: string; color: string };
  /** For create mode — the initial date */
  initialDate?: Date;
  /** For create mode — the initial meal type */
  initialType?: MealKey;
  /** For edit mode — the existing meal event */
  editMeal?: CalendarEvent | null;
}

export const MealModal: React.FC<MealModalProps> = ({
  isOpen,
  onClose,
  mealCalendar,
  initialDate,
  initialType = 'breakfast',
  editMeal,
}) => {
  const { createEvent, updateEvent, deleteEvent } = useCalendar();
  const { t } = useLocale();

  const isEditMode = !!editMeal;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [recipeLink, setRecipeLink] = useState('');
  const [mealType, setMealType] = useState<MealKey>(initialType);
  const [date, setDate] = useState(formatDateStr(initialDate || new Date()));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (editMeal) {
        setName(editMeal.subject);
        setDescription(editMeal.bodyPreview || '');
        setRecipeLink(editMeal.location?.locationUri || editMeal.location?.displayName || '');
        setMealType(classifyMeal(editMeal));
        setDate(formatDateStr(new Date(editMeal.start.dateTime)));
      } else {
        setName('');
        setDescription('');
        setRecipeLink('');
        setMealType(initialType || 'breakfast');
        setDate(formatDateStr(initialDate || new Date()));
      }
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, editMeal, initialDate, initialType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError(null);
    setIsSubmitting(true);

    const type = getMealType(mealType);
    const startDate = new Date(`${date}T00:00:00`);
    startDate.setHours(type.defaultStartHour, type.defaultStartMin, 0, 0);
    const endDate = new Date(`${date}T00:00:00`);
    endDate.setHours(type.defaultEndHour, type.defaultEndMin, 0, 0);

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const locationData = recipeLink.trim()
      ? { displayName: recipeLink.trim(), locationUri: recipeLink.trim() }
      : undefined;

    try {
      if (isEditMode && editMeal) {
        await updateEvent(editMeal.id, {
          subject: name.trim(),
          start: { dateTime: formatLocalDateTime(startDate), timeZone: tz },
          end: { dateTime: formatLocalDateTime(endDate), timeZone: tz },
          location: locationData,
          bodyPreview: description.trim() || undefined,
        });
      } else {
        await createEvent({
          subject: name.trim(),
          start: startDate,
          end: endDate,
          calendarId: mealCalendar.id,
          accountId: mealCalendar.accountId,
          isReminderOn: false,
          location: recipeLink.trim() || undefined,
          body: description.trim() || undefined,
        });
      }
      onClose();
    } catch (err) {
      console.error('Failed to save meal:', err);
      setError(t.common?.error || 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!editMeal) return;
    setIsSubmitting(true);
    try {
      await deleteEvent(editMeal.id, editMeal.accountId);
      setShowDeleteConfirm(false);
      onClose();
    } catch (err) {
      console.error('Failed to delete meal:', err);
      setError(t.common?.error || 'Error');
      setShowDeleteConfirm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode
              ? (name || t.mealPlanner?.editMeal || 'Edit Meal')
              : (t.mealPlanner?.addMeal || 'Add Meal')}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? (t.mealPlanner?.editMealDesc || 'Update meal details or move it to another day.')
              : (t.mealPlanner?.addMealDesc || 'Plan a meal for your family.')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <DialogBody className="space-y-4">
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
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

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="meal-name">{t.mealPlanner?.mealName || 'Meal name'} *</Label>
              <Input
                id="meal-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t.mealPlanner?.placeholder || "What's cooking?"}
                required
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="meal-description">{t.events?.description || 'Description'}</Label>
              <textarea
                id="meal-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t.mealPlanner?.descriptionPlaceholder || 'Recipe notes, ingredients, instructions...'}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[80px] resize-none"
                rows={3}
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label>{t.mealPlanner?.date || 'Date'} *</Label>
              <DatePickerField
                value={date}
                onChange={v => setDate(v)}
              />
            </div>

            {/* Recipe link */}
            <div className="space-y-2">
              <Label htmlFor="meal-recipe">{t.mealPlanner?.recipeLink || 'Recipe link'}</Label>
              <Input
                id="meal-recipe"
                type="url"
                value={recipeLink}
                onChange={e => setRecipeLink(e.target.value)}
                placeholder={t.mealPlanner?.recipeLinkPlaceholder || 'Recipe link (optional)'}
              />
            </div>
          </DialogBody>

          <DialogFooter className="flex-row justify-between sm:justify-between">
            {isEditMode ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isSubmitting}
                size="icon"
              >
                <Trash2 size={18} />
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                {t.common?.cancel || 'Cancel'}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !name.trim()}
              >
                {isSubmitting
                  ? (t.actions.saving)
                  : isEditMode
                    ? t.actions.save
                    : t.actions.create}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title={t.mealPlanner?.deleteMeal || 'Delete Meal'}
        message={t.mealPlanner?.deleteMealConfirm || 'Are you sure you want to delete this meal?'}
        confirmText={t.actions?.delete || 'Delete'}
        cancelText={t.actions?.cancel || 'Cancel'}
        isLoading={isSubmitting}
      />
    </>
  );
};
