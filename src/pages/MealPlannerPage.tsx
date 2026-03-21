import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { Check, ChevronLeft, ChevronRight, Plus, UtensilsCrossed, Link as LinkIcon, Loader2, Pencil } from 'lucide-react';
import { useCalendar } from '../contexts/CalendarContext';
import { useLocale } from '../contexts/LocaleContext';
import { StorageService } from '../services/storage.service';
import { dateHelpers } from '../utils/dateHelpers';
import type { CalendarEvent } from '../types/calendar.types';
import { addDays } from 'date-fns';
import { MealModal } from '../components/meals/MealModal';
import { Button } from '@/components/ui/button';

const MEAL_TYPES = [
  { key: 'breakfast', emoji: '🥐', defaultStartHour: 7, defaultStartMin: 30, defaultEndHour: 8, defaultEndMin: 0 },
  { key: 'lunch', emoji: '🥗', defaultStartHour: 12, defaultStartMin: 0, defaultEndHour: 12, defaultEndMin: 30 },
  { key: 'dinner', emoji: '🍽️', defaultStartHour: 17, defaultStartMin: 30, defaultEndHour: 18, defaultEndMin: 0 },
] as const;

type MealKey = typeof MEAL_TYPES[number]['key'];

function classifyMeal(event: CalendarEvent): MealKey | null {
  const start = new Date(event.start.dateTime);
  const hour = start.getHours();
  const minutes = start.getMinutes();
  const time = hour + minutes / 60;

  if (time >= 6 && time < 10) return 'breakfast';
  if (time >= 11 && time < 13.5) return 'lunch';
  if (time >= 17 && time < 21) return 'dinner';
  return null;
}

export const MealPlannerPage: React.FC = () => {
  const { calendars, events, getEventsForDateRange, ensureDateRange, isSyncing, isLoading, lastSyncTime } = useCalendar();
  const { locale, t } = useLocale();
  const todayRef = useRef<HTMLDivElement>(null);

  const [currentDate, setCurrentDate] = useState(new Date());

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState<Date | null>(null);
  const [modalType, setModalType] = useState<MealKey>('breakfast');
  const [modalEditMeal, setModalEditMeal] = useState<CalendarEvent | null>(null);

  const mealCalendarId = useMemo(() => {
    return StorageService.getSettings().mealCalendarId || null;
  }, []);

  const mealCalendar = useMemo(() => {
    return calendars.find(c => c.id === mealCalendarId) || null;
  }, [calendars, mealCalendarId]);

  // Week navigation
  const weekStart = useMemo(() => dateHelpers.getWeekStart(currentDate), [currentDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const topRow = weekDays.slice(0, 4);
  const bottomRow = weekDays.slice(4, 7);

  // Next week
  const nextWeekStart = useMemo(() => dateHelpers.nextWeek(weekStart), [weekStart]);
  const nextWeekEnd = useMemo(() => addDays(nextWeekStart, 6), [nextWeekStart]);
  const nextWeekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(nextWeekStart, i)), [nextWeekStart]);

  // Ensure events loaded (current + next week)
  useEffect(() => {
    const rangeEnd = dateHelpers.getDayEnd(nextWeekEnd);
    ensureDateRange(weekStart, rangeEnd);
  }, [weekStart, nextWeekEnd, ensureDateRange]);

  // Get meal events for both weeks
  const allMealEvents = useMemo(() => {
    if (!mealCalendarId) return [];
    const rangeEnd = dateHelpers.getDayEnd(nextWeekEnd);
    return getEventsForDateRange(weekStart, rangeEnd).filter(e => e.calendarId === mealCalendarId);
  }, [mealCalendarId, weekStart, nextWeekEnd, getEventsForDateRange, events]);

  // Classify meals per day
  const getMealsForDay = useCallback((day: Date): Record<MealKey, CalendarEvent[]> => {
    const dayStart = dateHelpers.getDayStart(day);
    const dayEnd = dateHelpers.getDayEnd(day);
    const dayEvents = allMealEvents.filter(event => {
      const eventStart = new Date(event.start.dateTime);
      return eventStart >= dayStart && eventStart < dayEnd;
    });

    const result: Record<MealKey, CalendarEvent[]> = { breakfast: [], lunch: [], dinner: [] };
    for (const event of dayEvents) {
      const type = classifyMeal(event);
      if (type) result[type].push(event);
    }
    return result;
  }, [allMealEvents]);

  // Next week meals grouped by day
  const nextWeekByDay = useMemo(() => {
    return nextWeekDays.map(day => ({
      day,
      meals: getMealsForDay(day),
    })).filter(d => d.meals.breakfast.length > 0 || d.meals.lunch.length > 0 || d.meals.dinner.length > 0);
  }, [nextWeekDays, getMealsForDay]);

  // Auto-scroll to today on mobile
  useEffect(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentDate]);

  const openAddMeal = useCallback((day: Date, type: MealKey = 'breakfast') => {
    setModalDate(day);
    setModalType(type);
    setModalEditMeal(null);
    setModalOpen(true);
  }, []);

  const openEditMeal = useCallback((meal: CalendarEvent) => {
    setModalEditMeal(meal);
    setModalDate(null);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setModalEditMeal(null);
    setModalDate(null);
  }, []);

  const goToPrevWeek = () => setCurrentDate(prev => addDays(dateHelpers.getWeekStart(prev), -7));
  const goToNextWeek = () => setCurrentDate(prev => addDays(dateHelpers.getWeekStart(prev), 7));
  const goToToday = () => setCurrentDate(new Date());
  const goToNextWeekNav = () => setCurrentDate(nextWeekStart);

  // No meal calendar selected
  if (!mealCalendar) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
        <UtensilsCrossed size={48} className="text-muted-foreground" />
        <h2 className="text-xl font-semibold">{t.mealPlanner?.noCalendar || 'No Meal Calendar Selected'}</h2>
        <p className="text-muted-foreground max-w-md">
          {t.mealPlanner?.noCalendarDesc || 'Go to Settings → Calendars and select a calendar for meal planning.'}
        </p>
      </div>
    );
  }

  const now = new Date();

  const renderMealLine = (type: typeof MEAL_TYPES[number], meals: CalendarEvent[]) => (
    <div key={type.key} className="flex items-start gap-2 lg:gap-3 min-h-[36px]">
      <span className="text-base shrink-0 mt-1" title={t.mealPlanner?.[type.key] || type.key}>{type.emoji}</span>
      <div className="flex-1 min-w-0">
        {meals.length > 0 ? (
          <div className="space-y-1">
            {meals.map(meal => {
              const recipeUrl = meal.location?.locationUri || meal.location?.displayName;
              const hasRecipe = recipeUrl && (recipeUrl.startsWith('http://') || recipeUrl.startsWith('https://'));
              const isPast = new Date(meal.end.dateTime) < now;
              return (
                <div
                  key={meal.id}
                  className={`group rounded-lg p-3 lg:p-4 text-base font-semibold flex items-center gap-2 min-w-0 cursor-pointer hover:opacity-80 transition-all ${
                    isPast ? 'opacity-40' : ''
                  }`}
                  style={{ backgroundColor: `${mealCalendar.color}40`, color: mealCalendar.color }}
                  onClick={() => openEditMeal(meal)}
                >
                  <span className="truncate flex-1">{meal.subject}</span>
                  {hasRecipe && (
                    <a
                      href={recipeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                      title={recipeUrl}
                    >
                      <LinkIcon size={14} />
                    </a>
                  )}
                  <Pencil size={14} className="shrink-0 opacity-0 group-hover:opacity-40 transition-opacity" />
                </div>
              );
            })}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground/40 italic mt-1">—</span>
        )}
      </div>
    </div>
  );

  const renderDayCell = (day: Date, isMobile = false) => {
    const isToday = dateHelpers.isToday(day);
    const isPastDay = day < new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const meals = getMealsForDay(day);

    return (
      <div
        key={day.toISOString()}
        ref={isToday ? todayRef : undefined}
        className={`flex flex-col border border-border rounded-xl overflow-hidden ${
          isToday ? 'ring-2 ring-primary bg-secondary/50' : isPastDay ? 'bg-card opacity-60' : 'bg-card'
        }`}
      >
        {/* Day header */}
        <div
          className={`px-4 py-3 border-b border-border flex items-center justify-between ${
            isToday ? 'bg-primary/10' : 'bg-muted/30'
          }`}
        >
          <div className="flex items-baseline gap-2">
            <span className={`text-xl font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>
              {dateHelpers.formatDate(day, 'd')}
            </span>
            <span className={`text-base font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
              {locale === 'en'
                ? dateHelpers.formatDate(day, 'EEE', locale).charAt(0).toUpperCase() + dateHelpers.formatDate(day, 'EEE', locale).slice(1)
                : dateHelpers.formatDate(day, 'EEE', locale)}
            </span>
            {isMobile && (
              <span className={`text-sm ${isToday ? 'text-primary/70' : 'text-muted-foreground/70'}`}>
                {dateHelpers.formatDate(day, 'MMM', locale)}
              </span>
            )}
          </div>
          <button
            onClick={() => openAddMeal(day)}
            className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
          >
            <Plus size={24} />
          </button>
        </div>

        {/* Meals content */}
        <div className={`p-3 lg:p-4 space-y-1.5 lg:space-y-2.5 ${isMobile ? '' : 'flex-1'}`}>
          {MEAL_TYPES.map(type => renderMealLine(type, meals[type.key]))}
        </div>
      </div>
    );
  };

  const renderNextWeekTile = () => {
    const nextWeekEndDate = addDays(nextWeekStart, 6);
    const sameMonth = nextWeekStart.getMonth() === nextWeekEndDate.getMonth();
    const startMonth = dateHelpers.formatDate(nextWeekStart, 'MMM', locale);
    const endMonth = dateHelpers.formatDate(nextWeekEndDate, 'MMM', locale);
    const capitalize = (s: string) => locale === 'en' ? s.charAt(0).toUpperCase() + s.slice(1) : s;
    const monthLabel = sameMonth ? capitalize(startMonth) : `${capitalize(startMonth)} – ${capitalize(endMonth)}`;

    return (
      <div
        className="flex flex-col border border-border rounded-xl overflow-hidden bg-card cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
        onClick={goToNextWeekNav}
      >
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-foreground">
              {dateHelpers.formatDate(nextWeekStart, 'd')}–{dateHelpers.formatDate(nextWeekEndDate, 'd')}
            </span>
            <span className="text-base font-medium text-muted-foreground">
              {monthLabel}
            </span>
          </div>
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-muted-foreground">
            <ChevronRight size={24} />
          </div>
        </div>

        <div className="flex-1 p-4 space-y-3 lg:space-y-4 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {nextWeekByDay.length > 0 ? (
            nextWeekByDay.map(({ day, meals }) => (
              <div key={day.toISOString()}>
                <div className="flex items-baseline gap-1.5 mb-1.5 lg:mb-2">
                  <span className="text-sm lg:text-base font-bold text-foreground">
                    {dateHelpers.formatDate(day, 'd')}
                  </span>
                  <span className="text-sm lg:text-base font-medium text-muted-foreground">
                    {locale === 'en'
                      ? dateHelpers.formatDate(day, 'EEE', locale).charAt(0).toUpperCase() + dateHelpers.formatDate(day, 'EEE', locale).slice(1)
                      : dateHelpers.formatDate(day, 'EEE', locale)}
                  </span>
                </div>
                <div className="space-y-0.5 lg:space-y-1">
                  {MEAL_TYPES.map(type => {
                    const typeMeals = meals[type.key];
                    if (typeMeals.length === 0) return null;
                    return typeMeals.map(meal => (
                      <div
                        key={meal.id}
                        className="text-base font-semibold rounded-lg p-3 lg:p-4 truncate"
                        style={{ backgroundColor: `${mealCalendar?.color || '#6366f1'}40`, color: mealCalendar?.color || '#6366f1' }}
                      >
                        {type.emoji} {meal.subject}
                      </div>
                    ));
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-base">
              {t.common.noResults}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 px-3 sm:px-5 py-3">
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-11 sm:w-11" onClick={goToPrevWeek} aria-label="Previous week">
              <ChevronLeft size={22} />
            </Button>
            <Button variant="secondary" className="h-10 px-3 sm:h-11 sm:px-5 text-sm sm:text-base" onClick={goToToday}>
              {t.mealPlanner?.today || 'Today'}
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-11 sm:w-11" onClick={goToNextWeek} aria-label="Next week">
              <ChevronRight size={22} />
            </Button>
          </div>

          <h2 className="text-base sm:text-lg font-semibold text-foreground">
            {locale === 'en'
              ? dateHelpers.formatDate(weekStart, 'MMMM yyyy', locale).charAt(0).toUpperCase() + dateHelpers.formatDate(weekStart, 'MMMM yyyy', locale).slice(1)
              : dateHelpers.formatDate(weekStart, 'MMMM yyyy', locale)}
          </h2>

          <div className="flex-1 min-w-0" />

          {/* Sync status */}
          <div className="flex items-center">
            {(isSyncing || isLoading) ? (
              <div className="w-9 h-9 flex items-center justify-center">
                <Loader2 size={18} className="text-primary animate-spin" />
              </div>
            ) : lastSyncTime ? (
              <div className="w-9 h-9 flex items-center justify-center text-green-500">
                <Check size={18} strokeWidth={3} />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Mobile: single column scrollable list */}
      <div className="lg:hidden flex-1 overflow-y-auto p-3 space-y-3">
        {weekDays.map(day => renderDayCell(day, true))}
        {renderNextWeekTile()}
      </div>

      {/* Desktop: 4-column grid (same layout as calendar agenda) */}
      <div className="hidden lg:flex flex-col h-full p-4 gap-4">
        {/* Top row: Mon–Thu */}
        <div className="flex-1 grid grid-cols-4 gap-4 min-h-0">
          {topRow.map(day => renderDayCell(day))}
        </div>
        {/* Bottom row: Fri–Sun + Next week */}
        <div className="flex-1 grid grid-cols-4 gap-4 min-h-0">
          {bottomRow.map(day => renderDayCell(day))}
          {renderNextWeekTile()}
        </div>
      </div>

      {/* Meal Modal */}
      {mealCalendar && (
        <MealModal
          isOpen={modalOpen}
          onClose={closeModal}
          mealCalendar={mealCalendar}
          initialDate={modalDate || undefined}
          initialType={modalType}
          editMeal={modalEditMeal}
        />
      )}
    </div>
  );
};
