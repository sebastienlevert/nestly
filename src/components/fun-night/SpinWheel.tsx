import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Dice5 } from 'lucide-react';
import { useFunNight } from '../../contexts/FunNightContext';
import { useLocale } from '../../contexts/LocaleContext';
import type { BoardGame } from '../../types/funnight.types';

interface SpinWheelProps {
  onGameSelected?: (game: BoardGame) => void;
}

export const SpinWheel: React.FC<SpinWheelProps> = ({ onGameSelected }) => {
  const { games, spinWheel, isSpinning } = useFunNight();
  const { t } = useLocale();

  const [displayedGame, setDisplayedGame] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<BoardGame | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutChainRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      timeoutChainRef.current.forEach(id => clearTimeout(id));
    };
  }, []);

  const handleSpin = useCallback(async () => {
    if (games.length === 0 || isAnimating) return;

    setSelectedGame(null);
    setIsAnimating(true);

    // Start rapid cycling through game names
    let delay = 50;
    let elapsed = 0;
    const totalDuration = 2000;

    const cycle = () => {
      const randomIndex = Math.floor(Math.random() * games.length);
      setDisplayedGame(games[randomIndex].name);

      elapsed += delay;
      if (elapsed < totalDuration) {
        // Gradually slow down
        delay = Math.min(500, delay + (delay * 0.15));
        const id = setTimeout(cycle, delay);
        timeoutChainRef.current.push(id);
      }
    };

    cycle();

    // Resolve the actual winner from context
    const winner = await spinWheel();

    if (winner) {
      // After animation completes, show the winner
      const finalDelay = Math.max(0, totalDuration - elapsed + 300);
      const id = setTimeout(() => {
        setDisplayedGame(winner.name);
        setSelectedGame(winner);
        setIsAnimating(false);
        onGameSelected?.(winner);
      }, finalDelay);
      timeoutChainRef.current.push(id);
    } else {
      setIsAnimating(false);
      setDisplayedGame(null);
    }
  }, [games, isAnimating, spinWheel, onGameSelected]);

  const isActive = isAnimating || isSpinning;
  const hasResult = selectedGame && !isActive;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Spin display */}
      <div
        className={`relative w-full max-w-xs aspect-square rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
          isActive
            ? 'border-primary animate-pulse shadow-lg shadow-primary/20'
            : hasResult
              ? 'border-primary shadow-xl scale-105'
              : 'border-border'
        } bg-card`}
      >
        {hasResult ? (
          <div className="text-center px-6 animate-bounce-in">
            <span className="text-3xl mb-2 block">🎉</span>
            <p className="text-xl font-bold text-foreground leading-tight">{selectedGame.name}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedGame.minPlayers}–{selectedGame.maxPlayers} {t.funNight.players.toLowerCase()}
            </p>
          </div>
        ) : isActive && displayedGame ? (
          <div className="text-center px-6">
            <p className="text-xl font-bold text-foreground animate-pulse">{displayedGame}</p>
            <p className="text-sm text-muted-foreground mt-2">{t.funNight.spinning}</p>
          </div>
        ) : (
          <div className="text-center px-6 text-muted-foreground">
            <Dice5 size={48} className="mx-auto mb-2" />
            {games.length > 0 ? (
              <p className="text-sm">{t.funNight.spinWheel}</p>
            ) : (
              <p className="text-sm">{t.funNight.noGames}</p>
            )}
          </div>
        )}
      </div>

      {/* Spin button */}
      <button
        onClick={handleSpin}
        disabled={games.length === 0 || isActive}
        className="btn-primary flex items-center gap-2 text-lg px-6 py-3"
      >
        <Dice5 size={24} className={isActive ? 'animate-spin' : ''} />
        {isActive ? t.funNight.spinning : t.funNight.spinWheel}
      </button>
    </div>
  );
};
