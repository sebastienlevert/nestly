import { StorageService } from './storage.service';

export interface HourlyPoint {
  hour: number;       // 0-23
  temperature: number;
}

export interface DayForecast {
  date: string; // YYYY-MM-DD
  weatherCode: number;
  temperatureMax: number;
  temperatureMin: number;
  precipitationSum: number;       // mm
  precipitationProbabilityMax: number; // %
  windSpeedMax: number;           // km/h
  windGustsMax: number;           // km/h
  windDirection: number;          // degrees
  uvIndexMax: number;
  sunrise: string;                // ISO time
  sunset: string;                 // ISO time
  apparentTemperatureMax: number;
  apparentTemperatureMin: number;
  hourly: HourlyPoint[];          // 24 hourly temperature points
}

interface WeatherCache {
  forecasts: DayForecast[];
  timestamp: number;
  latitude: number;
  longitude: number;
  locationKey: string; // tracks which location was cached
}

// Bump version when DayForecast shape changes to bust stale caches
const CACHE_VERSION = 2;
const CACHE_KEY = `nestly_weather_cache_v${CACHE_VERSION}`;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours
const DEFAULT_COORDS = { latitude: 45.50, longitude: -73.57 }; // Montreal

// WMO Weather interpretation codes → emoji + translation key
const weatherCodeMap: Record<number, { icon: string; key: string }> = {
  0: { icon: '☀️', key: 'clearSky' },
  1: { icon: '🌤️', key: 'mainlyClear' },
  2: { icon: '⛅', key: 'partlyCloudy' },
  3: { icon: '☁️', key: 'overcast' },
  45: { icon: '🌫️', key: 'fog' },
  48: { icon: '🌫️', key: 'rimeFog' },
  51: { icon: '🌦️', key: 'lightDrizzle' },
  53: { icon: '🌦️', key: 'moderateDrizzle' },
  55: { icon: '🌧️', key: 'denseDrizzle' },
  56: { icon: '🌧️', key: 'freezingDrizzle' },
  57: { icon: '🌧️', key: 'heavyFreezingDrizzle' },
  61: { icon: '🌧️', key: 'slightRain' },
  63: { icon: '🌧️', key: 'moderateRain' },
  65: { icon: '🌧️', key: 'heavyRain' },
  66: { icon: '🌧️', key: 'freezingRain' },
  67: { icon: '🌧️', key: 'heavyFreezingRain' },
  71: { icon: '🌨️', key: 'slightSnow' },
  73: { icon: '🌨️', key: 'moderateSnow' },
  75: { icon: '❄️', key: 'heavySnow' },
  77: { icon: '🌨️', key: 'snowGrains' },
  80: { icon: '🌦️', key: 'slightShowers' },
  81: { icon: '🌧️', key: 'moderateShowers' },
  82: { icon: '🌧️', key: 'violentShowers' },
  85: { icon: '🌨️', key: 'slightSnowShowers' },
  86: { icon: '❄️', key: 'heavySnowShowers' },
  95: { icon: '⛈️', key: 'thunderstorm' },
  96: { icon: '⛈️', key: 'thunderstormHail' },
  99: { icon: '⛈️', key: 'thunderstormHeavyHail' },
};

export function getWeatherInfo(code: number): { icon: string; key: string } {
  return weatherCodeMap[code] ?? { icon: '❓', key: 'unknown' };
}

/** Today's date as YYYY-MM-DD in the local timezone */
function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Validate that a forecast array covers the required date range.
 * Returns false if forecasts are missing today or the next 7 days.
 */
export function isForecastCoverageSufficient(forecasts: DayForecast[], requiredDays = 8): boolean {
  if (forecasts.length < requiredDays) return false;
  const today = todayDateStr();
  const hasToday = forecasts.some(f => f.date === today);
  if (!hasToday) return false;
  // Verify we have at least `requiredDays` consecutive dates starting from today
  const dateSet = new Set(forecasts.map(f => f.date));
  const d = new Date();
  for (let i = 0; i < requiredDays; i++) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!dateSet.has(key)) return false;
    d.setDate(d.getDate() + 1);
  }
  return true;
}

function getCache(locationKey: string): WeatherCache | null {
  const cached = StorageService.get<WeatherCache | null>(CACHE_KEY, null);
  if (!cached) return null;
  if (cached.locationKey !== locationKey) return null; // location changed
  if (Date.now() - cached.timestamp > CACHE_TTL) return null;
  // Bust cache if it doesn't cover today's 8-day window
  if (!isForecastCoverageSufficient(cached.forecasts)) return null;
  return cached;
}

function setCache(data: WeatherCache): void {
  StorageService.set(CACHE_KEY, data);
}

/** Geocode a city name to coordinates using Open-Meteo's free geocoding API */
export async function geocodeCity(name: string): Promise<{ latitude: number; longitude: number; displayName: string } | null> {
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.results || data.results.length === 0) return null;
  const r = data.results[0];
  return { latitude: r.latitude, longitude: r.longitude, displayName: `${r.name}, ${r.country}` };
}

function getBrowserLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(DEFAULT_COORDS);
      return;
    }
    const timeout = setTimeout(() => resolve(DEFAULT_COORDS), 3000);
    navigator.geolocation.getCurrentPosition(
      (pos) => { clearTimeout(timeout); resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }); },
      () => { clearTimeout(timeout); resolve(DEFAULT_COORDS); },
      { timeout: 3000, maximumAge: CACHE_TTL }
    );
  });
}

export async function fetchWeatherForecast(): Promise<DayForecast[]> {
  // Check if user configured a location in settings
  const settings = StorageService.getSettings();
  const locationKey = settings.weatherLocation || '__browser__';

  // Return cache if fresh and for the same location
  const cached = getCache(locationKey);
  if (cached) return cached.forecasts;

  let latitude: number;
  let longitude: number;

  if (settings.weatherLocation) {
    const geo = await geocodeCity(settings.weatherLocation);
    if (geo) {
      latitude = geo.latitude;
      longitude = geo.longitude;
    } else {
      // Geocoding failed, fall back to browser / default
      const loc = await getBrowserLocation();
      latitude = loc.latitude;
      longitude = loc.longitude;
    }
  } else {
    const loc = await getBrowserLocation();
    latitude = loc.latitude;
    longitude = loc.longitude;
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,uv_index_max,sunrise,sunset&hourly=temperature_2m&forecast_days=16&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);

  const data = await res.json();
  // Build hourly lookup: date string → HourlyPoint[]
  const hourlyByDate = new Map<string, HourlyPoint[]>();
  if (data.hourly?.time) {
    for (let i = 0; i < data.hourly.time.length; i++) {
      const dt = data.hourly.time[i] as string; // "2024-03-21T14:00"
      const dateKey = dt.slice(0, 10);
      const hour = parseInt(dt.slice(11, 13), 10);
      const temp = Math.round(data.hourly.temperature_2m[i]);
      if (!hourlyByDate.has(dateKey)) hourlyByDate.set(dateKey, []);
      hourlyByDate.get(dateKey)!.push({ hour, temperature: temp });
    }
  }

  const forecasts: DayForecast[] = data.daily.time.map((date: string, i: number) => ({
    date,
    weatherCode: data.daily.weather_code[i],
    temperatureMax: Math.round(data.daily.temperature_2m_max[i]),
    temperatureMin: Math.round(data.daily.temperature_2m_min[i]),
    apparentTemperatureMax: Math.round(data.daily.apparent_temperature_max[i]),
    apparentTemperatureMin: Math.round(data.daily.apparent_temperature_min[i]),
    precipitationSum: data.daily.precipitation_sum[i] ?? 0,
    precipitationProbabilityMax: data.daily.precipitation_probability_max[i] ?? 0,
    windSpeedMax: Math.round(data.daily.wind_speed_10m_max[i] ?? 0),
    windGustsMax: Math.round(data.daily.wind_gusts_10m_max[i] ?? 0),
    windDirection: Math.round(data.daily.wind_direction_10m_dominant[i] ?? 0),
    uvIndexMax: data.daily.uv_index_max[i] ?? 0,
    sunrise: data.daily.sunrise[i] ?? '',
    sunset: data.daily.sunset[i] ?? '',
    hourly: hourlyByDate.get(date) ?? [],
  }));

  setCache({ forecasts, timestamp: Date.now(), latitude, longitude, locationKey });
  return forecasts;
}

/** Clear the weather cache so the next fetch re-queries the API */
export function clearWeatherCache(): void {
  StorageService.remove(CACHE_KEY);
  // Clean up old versioned keys
  StorageService.remove('nestly_weather_cache');
  StorageService.remove('nestly_weather_cache_v1');
}
