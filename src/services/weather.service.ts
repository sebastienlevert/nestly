import { StorageService } from './storage.service';

export interface DayForecast {
  date: string; // YYYY-MM-DD
  weatherCode: number;
  temperatureMax: number;
  temperatureMin: number;
}

interface WeatherCache {
  forecasts: DayForecast[];
  timestamp: number;
  latitude: number;
  longitude: number;
}

const CACHE_KEY = 'nestly_weather_cache';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

// WMO Weather interpretation codes → emoji + label
const weatherCodeMap: Record<number, { icon: string; label: string }> = {
  0: { icon: '☀️', label: 'Clear sky' },
  1: { icon: '🌤️', label: 'Mainly clear' },
  2: { icon: '⛅', label: 'Partly cloudy' },
  3: { icon: '☁️', label: 'Overcast' },
  45: { icon: '🌫️', label: 'Fog' },
  48: { icon: '🌫️', label: 'Depositing rime fog' },
  51: { icon: '🌦️', label: 'Light drizzle' },
  53: { icon: '🌦️', label: 'Moderate drizzle' },
  55: { icon: '🌧️', label: 'Dense drizzle' },
  56: { icon: '🌧️', label: 'Freezing drizzle' },
  57: { icon: '🌧️', label: 'Heavy freezing drizzle' },
  61: { icon: '🌧️', label: 'Slight rain' },
  63: { icon: '🌧️', label: 'Moderate rain' },
  65: { icon: '🌧️', label: 'Heavy rain' },
  66: { icon: '🌧️', label: 'Freezing rain' },
  67: { icon: '🌧️', label: 'Heavy freezing rain' },
  71: { icon: '🌨️', label: 'Slight snow' },
  73: { icon: '🌨️', label: 'Moderate snow' },
  75: { icon: '❄️', label: 'Heavy snow' },
  77: { icon: '🌨️', label: 'Snow grains' },
  80: { icon: '🌦️', label: 'Slight showers' },
  81: { icon: '🌧️', label: 'Moderate showers' },
  82: { icon: '🌧️', label: 'Violent showers' },
  85: { icon: '🌨️', label: 'Slight snow showers' },
  86: { icon: '❄️', label: 'Heavy snow showers' },
  95: { icon: '⛈️', label: 'Thunderstorm' },
  96: { icon: '⛈️', label: 'Thunderstorm with hail' },
  99: { icon: '⛈️', label: 'Thunderstorm with heavy hail' },
};

export function getWeatherInfo(code: number): { icon: string; label: string } {
  return weatherCodeMap[code] ?? { icon: '❓', label: 'Unknown' };
}

function getCache(): WeatherCache | null {
  const cached = StorageService.get<WeatherCache | null>(CACHE_KEY, null);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL) return null;
  return cached;
}

function setCache(data: WeatherCache): void {
  StorageService.set(CACHE_KEY, data);
}

async function getUserLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(err),
      { timeout: 10000, maximumAge: CACHE_TTL }
    );
  });
}

export async function fetchWeatherForecast(): Promise<DayForecast[]> {
  // Return cache if fresh
  const cached = getCache();
  if (cached) return cached.forecasts;

  let latitude: number;
  let longitude: number;

  try {
    const loc = await getUserLocation();
    latitude = loc.latitude;
    longitude = loc.longitude;
  } catch {
    // Fallback to a default location (New York) if geolocation fails
    latitude = 40.71;
    longitude = -74.01;
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=16&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);

  const data = await res.json();
  const forecasts: DayForecast[] = data.daily.time.map((date: string, i: number) => ({
    date,
    weatherCode: data.daily.weather_code[i],
    temperatureMax: Math.round(data.daily.temperature_2m_max[i]),
    temperatureMin: Math.round(data.daily.temperature_2m_min[i]),
  }));

  setCache({ forecasts, timestamp: Date.now(), latitude, longitude });
  return forecasts;
}
