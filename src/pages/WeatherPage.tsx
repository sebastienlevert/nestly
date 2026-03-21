import React, { useMemo, useRef, useEffect } from 'react';
import { CloudSun, Thermometer, Droplets, Wind, Sun, Sunrise, Sunset } from 'lucide-react';
import { useWeather } from '../hooks/useWeather';
import { useLocale } from '../contexts/LocaleContext';
import { dateHelpers } from '../utils/dateHelpers';
import { getWeatherInfo, type DayForecast } from '../services/weather.service';
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
            <span className="text-3xl leading-none" title={info.label}>
              {info.icon}
            </span>
          )}
        </div>

        {/* Weather details */}
        <div className="p-4 flex-1 flex flex-col gap-2.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {forecast && info ? (
            <>
              {/* Condition */}
              <p className="text-sm font-semibold text-foreground">{info.label}</p>

              {/* Temperature with feels-like */}
              <div className="flex items-center gap-2">
                <Thermometer size={15} className="text-muted-foreground shrink-0" />
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-foreground">{forecast.temperatureMax}°</span>
                  <span className="text-sm text-muted-foreground">/ {forecast.temperatureMin}°</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground -mt-1 ml-[23px]">
                Feels {forecast.apparentTemperatureMax}° / {forecast.apparentTemperatureMin}°
              </p>

              {/* Temp bar */}
              <div className="ml-[23px]">
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, Math.max(10, ((forecast.temperatureMax + 10) / 50) * 100))}%`,
                      background: getTempGradient(forecast.temperatureMax),
                    }}
                  />
                </div>
              </div>

              {/* Precipitation */}
              <div className="flex items-center gap-2">
                <Droplets size={15} className="text-blue-400 shrink-0" />
                <span className="text-sm text-foreground">
                  {forecast.precipitationProbabilityMax}%
                  {forecast.precipitationSum > 0 && (
                    <span className="text-muted-foreground"> · {forecast.precipitationSum.toFixed(1)} mm</span>
                  )}
                </span>
              </div>

              {/* Wind */}
              <div className="flex items-center gap-2">
                <Wind size={15} className="text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground">
                  {forecast.windSpeedMax} km/h {windCompass(forecast.windDirection)}
                  {forecast.windGustsMax > forecast.windSpeedMax && (
                    <span className="text-muted-foreground"> · gusts {forecast.windGustsMax}</span>
                  )}
                </span>
              </div>

              {/* UV Index */}
              <div className="flex items-center gap-2">
                <Sun size={15} className={`shrink-0 ${uvLevel(forecast.uvIndexMax).color}`} />
                <span className="text-sm text-foreground">
                  UV {Math.round(forecast.uvIndexMax)}
                  <span className={`ml-1 text-xs font-medium ${uvLevel(forecast.uvIndexMax).color}`}>
                    {uvLevel(forecast.uvIndexMax).label}
                  </span>
                </span>
              </div>

              {/* Sunrise / Sunset */}
              <div className="flex items-center gap-3 mt-auto pt-1 border-t border-border/50">
                <div className="flex items-center gap-1.5">
                  <Sunrise size={14} className="text-orange-400" />
                  <span className="text-xs text-muted-foreground">{formatTime(forecast.sunrise)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sunset size={14} className="text-indigo-400" />
                  <span className="text-xs text-muted-foreground">{formatTime(forecast.sunset)}</span>
                </div>
              </div>
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

function getTempGradient(temp: number): string {
  if (temp <= -10) return '#60a5fa';
  if (temp <= 0) return '#93c5fd';
  if (temp <= 10) return '#67e8f9';
  if (temp <= 20) return '#86efac';
  if (temp <= 25) return '#fde047';
  if (temp <= 30) return '#fb923c';
  return '#ef4444';
}
