import React, { useMemo, useRef, useEffect } from 'react';
import { CloudSun, Thermometer, Droplets, Wind, Sun, Sunrise, Sunset } from 'lucide-react';
import { useWeather } from '../hooks/useWeather';
import { useLocale } from '../contexts/LocaleContext';
import { dateHelpers } from '../utils/dateHelpers';
import { getWeatherInfo, type DayForecast, type HourlyPoint } from '../services/weather.service';
import { addDays } from 'date-fns';

/** Wind direction degrees → compass label */
function windCompass(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

/** UV index → risk label + color class */
function uvLevel(uv: number): { label: string; color: string } {
  if (uv <= 2) return { label: 'Low', color: 'text-green-500' };
  if (uv <= 5) return { label: 'Moderate', color: 'text-yellow-500' };
  if (uv <= 7) return { label: 'High', color: 'text-orange-500' };
  if (uv <= 10) return { label: 'Very High', color: 'text-red-500' };
  return { label: 'Extreme', color: 'text-purple-500' };
}

/** Format HH:MM from ISO datetime */
function formatTime(iso: string): string {
  if (!iso) return '--:--';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** Mini SVG sparkline for hourly temperature */
const HourlyChart: React.FC<{ points: HourlyPoint[] }> = ({ points }) => {
  if (points.length < 2) return null;

  const PAD_LEFT = 12;
  const PAD_RIGHT = 12;
  const W = 200;
  const H = 80;
  const PAD_TOP = 14;
  const PAD_BOT = 16;

  const temps = points.map(p => p.temperature);
  const minT = Math.min(...temps);
  const maxT = Math.max(...temps);
  const range = maxT - minT || 1;

  const x = (i: number) => PAD_LEFT + (i / (points.length - 1)) * (W - PAD_LEFT - PAD_RIGHT);
  const y = (t: number) => PAD_TOP + (1 - (t - minT) / range) * (H - PAD_TOP - PAD_BOT);

  const pathD = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.temperature).toFixed(1)}`
  ).join(' ');

  // Fill area under curve
  const areaD = `${pathD} L${x(points.length - 1).toFixed(1)},${H} L${x(0).toFixed(1)},${H} Z`;

  // Find min/max point positions for labels
  const maxIdx = temps.indexOf(maxT);
  const minIdx = temps.lastIndexOf(minT);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20">
      <defs>
        <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#tempGrad)" className="text-primary" />
      <path d={pathD} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary" />
      {/* Max label */}
      <text x={x(maxIdx)} y={y(maxT) - 4} textAnchor="middle" className="fill-foreground" style={{ fontSize: '8px', fontWeight: 600 }}>
        {maxT}°
      </text>
      {/* Min label (only if different position) */}
      {Math.abs(maxIdx - minIdx) > 2 && (
        <text x={x(minIdx)} y={y(minT) + 11} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: '7px' }}>
          {minT}°
        </text>
      )}
      {/* Time markers */}
      {[0, 6, 12, 18].map(h => {
        const idx = points.findIndex(p => p.hour === h);
        if (idx < 0) return null;
        return (
          <text key={h} x={x(idx)} y={H - 3} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: '6px' }}>
            {h}h
          </text>
        );
      })}
    </svg>
  );
};

export const WeatherPage: React.FC = () => {
  const { forecasts, loading } = useWeather();
  const { locale, t } = useLocale();
  const todayRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => new Date(), []);
  const days = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => addDays(today, i)),
    [today]
  );

  const forecastMap = useMemo(() => {
    const map = new Map<string, DayForecast>();
    for (const f of forecasts) map.set(f.date, f);
    return map;
  }, [forecasts]);

  const getForecast = (date: Date) => {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return forecastMap.get(key) ?? null;
  };

  useEffect(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const conditionLabel = (key: string) =>
    t.weather?.conditions?.[key as keyof typeof t.weather.conditions] ?? key;

  const topRow = days.slice(0, 4);
  const bottomRow = days.slice(4, 8);

  if (!loading && forecasts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <CloudSun size={64} className="mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            {t.weather?.noData ?? 'No weather data'}
          </h2>
          <p className="text-muted-foreground">
            {t.weather?.configureLocation ?? 'Set your location in Settings to see weather forecasts.'}
          </p>
        </div>
      </div>
    );
  }

  const renderDayCard = (day: Date, isMobile = false) => {
    const isToday = dateHelpers.isToday(day);
    const forecast = getForecast(day);
    const info = forecast ? getWeatherInfo(forecast.weatherCode) : null;

    return (
      <div
        key={day.toISOString()}
        ref={isToday ? todayRef : undefined}
        className={`flex flex-col border border-border rounded-xl overflow-hidden ${
          isToday ? 'ring-2 ring-primary bg-secondary/50' : 'bg-card'
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
              {capitalize(dateHelpers.formatDate(day, 'EEE', locale))}
            </span>
            {isMobile && (
              <span className={`text-sm ${isToday ? 'text-primary/70' : 'text-muted-foreground/70'}`}>
                {dateHelpers.formatDate(day, 'MMM', locale)}
              </span>
            )}
          </div>
          {info && (
            <span className="text-3xl leading-none" title={conditionLabel(info.key)}>
              {info.icon}
            </span>
          )}
        </div>

        {/* Weather details */}
        <div className="p-4 flex-1 flex flex-col gap-2.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {forecast && info ? (
            <>
              {/* Condition */}
              <p className="text-sm font-semibold text-foreground">{conditionLabel(info.key)}</p>

              {/* Temperature with feels-like */}
              <div className="flex items-center gap-2">
                <Thermometer size={15} className="text-muted-foreground shrink-0" />
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-foreground">{forecast.temperatureMax}°</span>
                  <span className="text-sm text-muted-foreground">/ {forecast.temperatureMin}°</span>
                </div>
              </div>
              {forecast.apparentTemperatureMax != null && (
                <p className="text-xs text-muted-foreground -mt-1 ml-[23px]">
                  {t.weather?.feels ?? 'Feels'} {forecast.apparentTemperatureMax}° / {forecast.apparentTemperatureMin}°
                </p>
              )}

              {/* Hourly temperature graph */}
              {forecast.hourly && forecast.hourly.length > 0 && (
                <div className="mt-1 -mx-1">
                  <HourlyChart points={forecast.hourly} />
                </div>
              )}

              {/* Precipitation */}
              {forecast.precipitationProbabilityMax != null && (
                <div className="flex items-center gap-2">
                  <Droplets size={15} className="text-blue-400 shrink-0" />
                  <span className="text-sm text-foreground">
                    {forecast.precipitationProbabilityMax}%
                    {(forecast.precipitationSum ?? 0) > 0 && (
                      <span className="text-muted-foreground"> · {forecast.precipitationSum.toFixed(1)} mm</span>
                    )}
                  </span>
                </div>
              )}

              {/* Wind */}
              {forecast.windSpeedMax != null && (
                <div className="flex items-center gap-2">
                  <Wind size={15} className="text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground">
                    {forecast.windSpeedMax} km/h {windCompass(forecast.windDirection ?? 0)}
                    {(forecast.windGustsMax ?? 0) > (forecast.windSpeedMax ?? 0) && (
                      <span className="text-muted-foreground"> · {t.weather?.gusts ?? 'gusts'} {forecast.windGustsMax}</span>
                    )}
                  </span>
                </div>
              )}

              {/* UV Index */}
              {forecast.uvIndexMax != null && (
                <div className="flex items-center gap-2">
                  <Sun size={15} className={`shrink-0 ${uvLevel(forecast.uvIndexMax).color}`} />
                  <span className="text-sm text-foreground">
                    UV {Math.round(forecast.uvIndexMax)}
                    <span className={`ml-1 text-xs font-medium ${uvLevel(forecast.uvIndexMax).color}`}>
                      {uvLevel(forecast.uvIndexMax).label}
                    </span>
                  </span>
                </div>
              )}

              {/* Sunrise / Sunset */}
              {(forecast.sunrise || forecast.sunset) && (
                <div className="flex items-center gap-3 mt-auto pt-1 border-t border-border/50">
                  {forecast.sunrise && (
                    <div className="flex items-center gap-1.5">
                      <Sunrise size={14} className="text-orange-400" />
                      <span className="text-xs text-muted-foreground">{formatTime(forecast.sunrise)}</span>
                    </div>
                  )}
                  {forecast.sunset && (
                    <div className="flex items-center gap-1.5">
                      <Sunset size={14} className="text-indigo-400" />
                      <span className="text-xs text-muted-foreground">{formatTime(forecast.sunset)}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : loading ? (
            <div className="flex items-center justify-center flex-1">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">—</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Mobile: single column scrollable list */}
      <div className="lg:hidden flex-1 overflow-y-auto p-3 space-y-3">
        {days.map(day => renderDayCard(day, true))}
      </div>

      {/* Desktop: 4-column grid, 2 rows */}
      <div className="hidden lg:flex flex-col h-full p-4 gap-4">
        <div className="flex-1 grid grid-cols-4 gap-4 min-h-0">
          {topRow.map(day => renderDayCard(day))}
        </div>
        <div className="flex-1 grid grid-cols-4 gap-4 min-h-0">
          {bottomRow.map(day => renderDayCard(day))}
        </div>
      </div>
    </div>
  );
};
