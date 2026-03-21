import { useState, useEffect, useCallback } from 'react';
import { fetchWeatherForecast, clearWeatherCache, type DayForecast, getWeatherInfo } from '../services/weather.service';
import { cacheService } from '../services/idb-cache.service';

const WEATHER_CACHE_KEY = 'weather:forecast:v2';
const WEATHER_TTL = 6 * 60 * 60 * 1000; // 6 hours

export function useWeather() {
  const [forecasts, setForecasts] = useState<DayForecast[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWeather = useCallback(async () => {
    setLoading(true);

    // 1. Load from IndexedDB cache first
    const cached = await cacheService.get<DayForecast[]>(WEATHER_CACHE_KEY);
    if (cached) {
      setForecasts(cached.data);
      setLoading(false);
    }

    // 2. Fetch fresh data in background
    try {
      const fresh = await fetchWeatherForecast();
      const { changed } = await cacheService.setIfChanged(WEATHER_CACHE_KEY, fresh, WEATHER_TTL);
      if (changed || !cached) {
        setForecasts(fresh);
      }
    } catch (err) {
      if (!cached) console.warn('Weather fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWeather();

    // Re-fetch when settings change (e.g., location updated)
    const handleSettingsUpdate = () => {
      clearWeatherCache();
      cacheService.remove(WEATHER_CACHE_KEY);
      loadWeather();
    };
    window.addEventListener('settings-updated', handleSettingsUpdate);
    return () => window.removeEventListener('settings-updated', handleSettingsUpdate);
  }, [loadWeather]);

  const getWeatherForDate = (date: Date): { icon: string; key: string; high: number; low: number } | null => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const forecast = forecasts.find((f) => f.date === dateStr);
    if (!forecast) return null;
    const info = getWeatherInfo(forecast.weatherCode);
    return { ...info, high: forecast.temperatureMax, low: forecast.temperatureMin };
  };

  return { forecasts, loading, getWeatherForDate };
}
