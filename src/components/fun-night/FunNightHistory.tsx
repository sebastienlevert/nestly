import React, { useState } from 'react';
import { Clock, Star, ChevronDown, ChevronRight, CheckCircle, Dice5, UtensilsCrossed, Film } from 'lucide-react';
import { useFunNight } from '../../contexts/FunNightContext';
import { useLocale } from '../../contexts/LocaleContext';
import { format, parseISO } from 'date-fns';

export const FunNightHistory: React.FC = () => {
  const { history, completeFunNight } = useFunNight();
  const { t } = useLocale();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ratingDraft, setRatingDraft] = useState<Record<string, number>>({});
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  if (history.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Clock size={24} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">{t.funNight.history}</h3>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <Clock size={48} className="mx-auto mb-3 text-muted-foreground" />
          <p>{t.funNight.noHistory}</p>
        </div>
      </div>
    );
  }

  const handleComplete = (id: string) => {
    const rating = ratingDraft[id] ?? 0;
    const notes = notesDraft[id] ?? '';
    completeFunNight(id, rating, notes);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <Clock size={24} className="text-primary" />
        <h3 className="text-lg font-semibold text-foreground">{t.funNight.history}</h3>
      </div>

      <div className="space-y-3">
        {history.map(plan => {
          const isExpanded = expandedId === plan.id;
          const currentRating = plan.isCompleted ? plan.rating : (ratingDraft[plan.id] ?? 0);

          return (
            <div key={plan.id} className="border border-border rounded-lg overflow-hidden">
              {/* Compact header — always visible */}
              <button
                onClick={() => toggleExpand(plan.id)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors touch-manipulation"
                style={{ minHeight: 44 }}
              >
                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {format(parseISO(plan.date), 'MMM d, yyyy')}
                    </span>
                    {plan.isCompleted && <CheckCircle size={14} className="text-green-500" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {plan.game?.name ?? '—'} · {plan.dinnerTitle} · {plan.activity.title}
                  </p>
                </div>

                {/* Star rating (compact) */}
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      size={14}
                      className={star <= currentRating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}
                    />
                  ))}
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                  {/* Game */}
                  {plan.game && (
                    <div className="flex items-start gap-2">
                      <Dice5 size={16} className="text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{plan.game.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {plan.game.minPlayers}–{plan.game.maxPlayers} {t.funNight.players.toLowerCase()} · ~{plan.game.estimatedMinutes} min
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Dinner */}
                  <div className="flex items-start gap-2">
                    <UtensilsCrossed size={16} className="text-orange-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{plan.dinnerTitle}</p>
                      <p className="text-xs text-muted-foreground">{plan.dinnerDescription}</p>
                    </div>
                  </div>

                  {/* Activity */}
                  <div className="flex items-start gap-2">
                    <Film size={16} className="text-purple-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{plan.activity.title}</p>
                      <p className="text-xs text-muted-foreground">{plan.activity.description}</p>
                    </div>
                  </div>

                  {/* Rating + Notes + Complete */}
                  {!plan.isCompleted && (
                    <div className="pt-2 space-y-3 border-t border-border">
                      {/* Clickable stars */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">{t.funNight.rate}</p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              onClick={(e) => {
                                e.stopPropagation();
                                setRatingDraft(prev => ({ ...prev, [plan.id]: star }));
                              }}
                              className="btn-icon !min-w-[36px] !min-h-[36px] !p-1"
                              aria-label={`${star} star${star > 1 ? 's' : ''}`}
                            >
                              <Star
                                size={20}
                                className={
                                  star <= (ratingDraft[plan.id] ?? 0)
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-muted-foreground'
                                }
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          {t.funNight.notes}
                        </label>
                        <textarea
                          value={notesDraft[plan.id] ?? ''}
                          onChange={e => setNotesDraft(prev => ({ ...prev, [plan.id]: e.target.value }))}
                          placeholder={t.funNight.notesPlaceholder}
                          className="input resize-none"
                          rows={2}
                        />
                      </div>

                      {/* Complete button */}
                      <button
                        onClick={() => handleComplete(plan.id)}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={20} />
                        {t.funNight.completeFunNight}
                      </button>
                    </div>
                  )}

                  {/* Show notes if completed and has notes */}
                  {plan.isCompleted && plan.notes && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs font-medium text-muted-foreground mb-1">{t.funNight.notes}</p>
                      <p className="text-sm text-foreground">{plan.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
