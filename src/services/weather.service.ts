import { StorageService } from './storage.service';

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
}

interface WeatherCache {
  forecasts: DayForecast[];
  timestamp: number;
  latitude: number;
  longitude: number;
  locationKey: string; // tracks which location was cached
}

const CACHE_KEY = 'nestly_weather_cache';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours
const DEFAULT_COORDS = { latitude: 45.50, longitude: -73.57 }; // Montreal

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

function getCache(locationKey: string): WeatherCache | null {
  const cached = StorageService.get<WeatherCache | null>(CACHE_KEY, null);
  if (!cached) return null;
  if (cached.locationKey !== locationKey) return null; // location changed
  if (Date.now() - cached.timestamp > CACHE_TTL) return null;
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

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,uv_index_max,sunrise,sunset&forecast_days=16&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);

  const data = await res.json();
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
  }));

  setCache({ forecasts, timestamp: Date.now(), latitude, longitude, locationKey });
  return forecasts;
}

/** Clear the weather cache so the next fetch re-queries the API */
export function clearWeatherCache(): void {
  StorageService.remove(CACHE_KEY);
}
