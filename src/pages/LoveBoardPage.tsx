import React, { useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useLocale } from '../contexts/LocaleContext';
import { useLoveBoard } from '../contexts/LoveBoardContext';
import { DailySparkCard } from '../components/love-board/DailySparkCard';
import { NoteWall } from '../components/love-board/NoteWall';
import { GratitudeJar } from '../components/love-board/GratitudeJar';

export const LoveBoardPage: React.FC = () => {
  const { t } = useLocale();
  const { currentSpark, generateDailySpark } = useLoveBoard();

  // Generate daily spark on-demand when page is visited (if not already cached)
  useEffect(() => {
    if (!currentSpark) {
      generateDailySpark();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Heart size={24} className="text-rose-500 fill-rose-500" />
          <h2 className="text-2xl font-semibold text-foreground">{t.loveBoard.title}</h2>
        </div>
        <p className="text-muted-foreground">{t.loveBoard.subtitle}</p>
      </div>

      {/* Daily Spark - full width, prominent */}
      <div className="mb-8">
        <DailySparkCard />
      </div>

      {/* Two-column layout: Note Wall + Gratitude Jar */}
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 lg:flex-[2] min-w-0">
          <NoteWall />
        </div>
        <div className="lg:flex-1 lg:max-w-sm">
          <GratitudeJar />
        </div>
      </div>
    </div>
  );
};
