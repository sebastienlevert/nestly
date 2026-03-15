import React from 'react';
import { Sparkles, RefreshCw, MessageCircle, Compass, HelpCircle, Trophy, AlertCircle, Loader2 } from 'lucide-react';
import { useLoveBoard } from '../../contexts/LoveBoardContext';
import { useLocale } from '../../contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import type { SparkType } from '../../types/loveboard.types';

const sparkTypeConfig: Record<SparkType, { emoji: string; icon: React.ElementType }> = {
  conversation: { emoji: '💬', icon: MessageCircle },
  activity: { emoji: '🎯', icon: Compass },
  question: { emoji: '❓', icon: HelpCircle },
  challenge: { emoji: '🏆', icon: Trophy },
};

export const DailySparkCard: React.FC = () => {
  const { currentSpark, isGeneratingSpark, error, refreshSpark } = useLoveBoard();
  const { t } = useLocale();

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-rose-50 dark:from-amber-950/30 dark:to-rose-950/30 border border-amber-200/50 dark:border-amber-800/30 p-6 shadow-card">
      {/* Decorative background sparkles */}
      <div className="absolute top-3 right-4 text-amber-200/60 dark:text-amber-700/40">
        <Sparkles size={48} />
      </div>
      <div className="absolute bottom-2 left-6 text-rose-200/40 dark:text-rose-800/30">
        <Sparkles size={32} />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={22} className="text-amber-500" />
            <h3 className="text-lg font-semibold text-foreground">
              {t.loveBoard.dailySpark}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshSpark}
            disabled={isGeneratingSpark}
            className="min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground"
          >
            {isGeneratingSpark ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <RefreshCw size={18} />
            )}
            <span className="ml-1.5 hidden sm:inline">{t.loveBoard.refreshSpark}</span>
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          {t.loveBoard.sparkSubtitle}
        </p>

        {/* Content */}
        {isGeneratingSpark && !currentSpark && (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={28} className="animate-spin text-amber-500" />
          </div>
        )}

        {error && !currentSpark && (
          <div className="flex items-start gap-3 py-4 px-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle size={20} className="text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">{t.loveBoard.sparkError}</p>
          </div>
        )}

        {currentSpark && (
          <div className="space-y-3">
            <p className="text-xl font-medium text-foreground leading-relaxed">
              {currentSpark.content}
            </p>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full bg-white/60 dark:bg-white/10 border border-amber-200/60 dark:border-amber-700/40 px-3 py-1 text-xs font-medium text-foreground capitalize"
              >
                {sparkTypeConfig[currentSpark.type].emoji}
                {currentSpark.type}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
