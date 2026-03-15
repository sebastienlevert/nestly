import React, { useState } from 'react';
import { Heart, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useLoveBoard } from '../../contexts/LoveBoardContext';
import { useLocale } from '../../contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ENTRY_COLORS = [
  'bg-rose-100 dark:bg-rose-900/30',
  'bg-amber-100 dark:bg-amber-900/30',
  'bg-emerald-100 dark:bg-emerald-900/30',
  'bg-sky-100 dark:bg-sky-900/30',
  'bg-violet-100 dark:bg-violet-900/30',
  'bg-pink-100 dark:bg-pink-900/30',
  'bg-orange-100 dark:bg-orange-900/30',
  'bg-teal-100 dark:bg-teal-900/30',
];

const VISIBLE_LIMIT = 20;

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export const GratitudeJar: React.FC = () => {
  const { gratitudeEntries, addGratitude } = useLoveBoard();
  const { t } = useLocale();

  const [message, setMessage] = useState('');
  const [author, setAuthor] = useState('');
  const [showAll, setShowAll] = useState(false);

  const sortedEntries = [...gratitudeEntries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const visibleEntries = showAll ? sortedEntries : sortedEntries.slice(0, VISIBLE_LIMIT);
  const hasMore = sortedEntries.length > VISIBLE_LIMIT;

  const countText = t.loveBoard.gratitudeCount.replace('{count}', String(gratitudeEntries.length));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    addGratitude({
      message: trimmed,
      author: author.trim(),
    });

    setMessage('');
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-rose-50 to-amber-50 dark:from-rose-950/20 dark:to-amber-950/20 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <Heart size={20} className="text-rose-500 fill-rose-500" />
          <h3 className="text-lg font-semibold text-foreground">{t.loveBoard.gratitudeJar}</h3>
        </div>
        {gratitudeEntries.length > 0 && (
          <p className="text-sm text-muted-foreground">{countText}</p>
        )}
      </div>

      {/* Jar visual */}
      <div className="p-4">
        {/* Empty state */}
        {gratitudeEntries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-20 h-24 rounded-b-3xl rounded-t-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center mb-4">
              <Heart size={24} className="text-muted-foreground/30" />
            </div>
            <p className="text-sm text-muted-foreground">{t.loveBoard.emptyGratitude}</p>
          </div>
        )}

        {/* Entries as bubbles inside jar shape */}
        {gratitudeEntries.length > 0 && (
          <div className="relative">
            {/* Jar outline */}
            <div className="rounded-2xl border-2 border-amber-200/60 dark:border-amber-800/30 bg-gradient-to-b from-amber-50/30 to-rose-50/30 dark:from-amber-950/10 dark:to-rose-950/10 p-3 min-h-[120px]">
              {/* Jar lid */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-2/3 h-3 rounded-t-lg bg-amber-200/60 dark:bg-amber-800/40 border-2 border-b-0 border-amber-200/60 dark:border-amber-800/30" />

              <div className="flex flex-wrap gap-2 mt-2">
                {visibleEntries.map((entry, i) => (
                  <div
                    key={entry.id}
                    className={`${ENTRY_COLORS[i % ENTRY_COLORS.length]} rounded-xl px-3 py-2 text-sm animate-in fade-in duration-300`}
                    style={{ animationDelay: `${Math.min(i, 10) * 50}ms` }}
                  >
                    <p className="text-foreground leading-snug">{entry.message}</p>
                    <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                      {entry.author && <span className="font-medium">{entry.author}</span>}
                      <span className={entry.author ? '' : 'ml-auto'}>{formatDate(entry.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Show all / show less toggle */}
              {hasMore && (
                <div className="mt-3 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAll(!showAll)}
                    className="min-h-[44px] text-muted-foreground"
                  >
                    {showAll ? (
                      <>
                        <ChevronUp size={16} />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown size={16} />
                        Show all ({sortedEntries.length})
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick-add form */}
      <div className="p-4 pt-0">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            placeholder={t.loveBoard.gratitudePlaceholder}
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
          <div className="flex gap-2">
            <Input
              placeholder={t.loveBoard.authorPlaceholder}
              value={author}
              onChange={e => setAuthor(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={!message.trim()} className="min-h-[44px] shrink-0">
              <Plus size={16} />
              {t.loveBoard.addGratitude}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
