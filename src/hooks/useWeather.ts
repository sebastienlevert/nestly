import { useState, useEffect } from 'react';
import { fetchWeatherForecast, type DayForecast, getWeatherInfo } from '../services/weather.service';

export function useWeather() {
  const [forecasts, setForecasts] = useState<DayForecast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchWeatherForecast()
      .then((data) => {
        if (!cancelled) {
          setForecasts(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Weather fetch failed:', err);
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const getWeatherForDate = (date: Date): { icon: string; label: string; high: number; low: number } | null => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const forecast = forecasts.find((f) => f.date === dateStr);
    if (!forecast) return null;
    const info = getWeatherInfo(forecast.weatherCode);
    return { ...info, high: forecast.temperatureMax, low: forecast.temperatureMin };
  };

  return { forecasts, loading, getWeatherForDate };
}
