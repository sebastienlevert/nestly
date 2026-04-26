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
  locationKey: string; // tracks which location was cached
}

// Bump version to bust stale Open-Meteo caches after provider switch
const CACHE_VERSION = 3;
const CACHE_KEY = `nestly_weather_cache_v${CACHE_VERSION}`;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours
const DEFAULT_LOCATION = 'Montreal'; // fallback city

const WEATHERAPI_KEY = import.meta.env.VITE_WEATHERAPI_KEY || '';
const WEATHERAPI_BASE = 'https://api.weatherapi.com/v1';

// WeatherAPI condition codes → emoji + translation key
const weatherCodeMap: Record<number, { icon: string; key: string }> = {
  // Clear / Sunny
  1000: { icon: '☀️', key: 'clearSky' },
  // Partly cloudy
  1003: { icon: '⛅', key: 'partlyCloudy' },
  // Cloudy
  1006: { icon: '☁️', key: 'overcast' },
  // Overcast
  1009: { icon: '☁️', key: 'overcast' },
  // Mist
  1030: { icon: '🌫️', key: 'fog' },
  // Patchy rain possible
  1063: { icon: '🌦️', key: 'slightShowers' },
  // Patchy snow possible
  1066: { icon: '🌨️', key: 'slightSnow' },
  // Patchy sleet possible
  1069: { icon: '🌨️', key: 'freezingRain' },
  // Patchy freezing drizzle possible
  1072: { icon: '🌧️', key: 'freezingDrizzle' },
  // Thundery outbreaks possible
  1087: { icon: '⛈️', key: 'thunderstorm' },
  // Blowing snow
  1114: { icon: '🌨️', key: 'moderateSnow' },
  // Blizzard
  1117: { icon: '❄️', key: 'heavySnow' },
  // Fog
  1135: { icon: '🌫️', key: 'fog' },
  // Freezing fog
  1147: { icon: '🌫️', key: 'rimeFog' },
  // Patchy light drizzle
  1150: { icon: '🌦️', key: 'lightDrizzle' },
  // Light drizzle
  1153: { icon: '🌦️', key: 'lightDrizzle' },
  // Freezing drizzle
  1168: { icon: '🌧️', key: 'freezingDrizzle' },
  // Heavy freezing drizzle
  1171: { icon: '🌧️', key: 'heavyFreezingDrizzle' },
  // Patchy light rain
  1180: { icon: '🌦️', key: 'slightRain' },
  // Light rain
  1183: { icon: '🌧️', key: 'slightRain' },
  // Moderate rain at times
  1186: { icon: '🌧️', key: 'moderateRain' },
  // Moderate rain
  1189: { icon: '🌧️', key: 'moderateRain' },
  // Heavy rain at times
  1192: { icon: '🌧️', key: 'heavyRain' },
  // Heavy rain
  1195: { icon: '🌧️', key: 'heavyRain' },
  // Light freezing rain
  1198: { icon: '🌧️', key: 'freezingRain' },
  // Moderate or heavy freezing rain
  1201: { icon: '🌧️', key: 'heavyFreezingRain' },
  // Light sleet
  1204: { icon: '🌨️', key: 'freezingDrizzle' },
  // Moderate or heavy sleet
  1207: { icon: '🌨️', key: 'heavyFreezingDrizzle' },
  // Patchy light snow
  1210: { icon: '🌨️', key: 'slightSnow' },
  // Light snow
  1213: { icon: '🌨️', key: 'slightSnow' },
  // Patchy moderate snow
  1216: { icon: '🌨️', key: 'moderateSnow' },
  // Moderate snow
  1219: { icon: '🌨️', key: 'moderateSnow' },
  // Patchy heavy snow
  1222: { icon: '❄️', key: 'heavySnow' },
  // Heavy snow
  1225: { icon: '❄️', key: 'heavySnow' },
  // Ice pellets
  1237: { icon: '🌨️', key: 'snowGrains' },
  // Light rain shower
  1240: { icon: '🌦️', key: 'slightShowers' },
  // Moderate or heavy rain shower
  1243: { icon: '🌧️', key: 'moderateShowers' },
  // Torrential rain shower
  1246: { icon: '🌧️', key: 'violentShowers' },
  // Light sleet showers
  1249: { icon: '🌨️', key: 'slightSnowShowers' },
  // Moderate or heavy sleet showers
  1252: { icon: '🌨️', key: 'heavySnowShowers' },
  // Light snow showers
  1255: { icon: '🌨️', key: 'slightSnowShowers' },
  // Moderate or heavy snow showers
  1258: { icon: '❄️', key: 'heavySnowShowers' },
  // Light showers of ice pellets
  1261: { icon: '🌨️', key: 'snowGrains' },
  // Moderate or heavy showers of ice pellets
  1264: { icon: '🌨️', key: 'snowGrains' },
  // Patchy light rain with thunder
  1273: { icon: '⛈️', key: 'thunderstorm' },
  // Moderate or heavy rain with thunder
  1276: { icon: '⛈️', key: 'thunderstormHail' },
  // Patchy light snow with thunder
  1279: { icon: '⛈️', key: 'thunderstorm' },
  // Moderate or heavy snow with thunder
  1282: { icon: '⛈️', key: 'thunderstormHeavyHail' },
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
  if (cached.locationKey !== locationKey) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL) return null;
  if (!isForecastCoverageSufficient(cached.forecasts)) return null;
  return cached;
}

function setCache(data: WeatherCache): void {
  StorageService.set(CACHE_KEY, data);
}

/** Convert WeatherAPI 12-hour time (e.g. "05:50 AM") to ISO datetime */
function parseTimeToIso(date: string, time12h: string): string {
  const match = time12h.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return '';
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  return `${date}T${String(hours).padStart(2, '0')}:${minutes}:00`;
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

/** Resolve location query for WeatherAPI — city name, or lat,lon from browser */
function getBrowserLocationQuery(): Promise<string> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(DEFAULT_LOCATION);
      return;
    }
    const timeout = setTimeout(() => resolve(DEFAULT_LOCATION), 3000);
    navigator.geolocation.getCurrentPosition(
      (pos) => { clearTimeout(timeout); resolve(`${pos.coords.latitude},${pos.coords.longitude}`); },
      () => { clearTimeout(timeout); resolve(DEFAULT_LOCATION); },
      { timeout: 3000, maximumAge: CACHE_TTL }
    );
  });
}

/** Map a single WeatherAPI forecastday object to our DayForecast */
function mapForecastDay(fd: any): DayForecast {
  const hours: HourlyPoint[] = (fd.hour || []).map((h: any) => ({
    hour: parseInt((h.time as string).slice(11, 13), 10),
    temperature: Math.round(h.temp_c),
  }));

  // Aggregate values from hourly data
  const feelsLikes: number[] = (fd.hour || []).map((h: any) => h.feelslike_c as number);
  const gustSpeeds: number[] = (fd.hour || []).map((h: any) => h.gust_kph as number);
  const windDegrees: number[] = (fd.hour || []).map((h: any) => h.wind_degree as number);

  const apparentMax = feelsLikes.length > 0 ? Math.round(Math.max(...feelsLikes)) : Math.round(fd.day.maxtemp_c);
  const apparentMin = feelsLikes.length > 0 ? Math.round(Math.min(...feelsLikes)) : Math.round(fd.day.mintemp_c);
  const maxGust = gustSpeeds.length > 0 ? Math.round(Math.max(...gustSpeeds)) : 0;

  // Use the wind direction at the hour with the highest wind speed as dominant direction
  let dominantWindDir = 0;
  if (windDegrees.length > 0 && fd.hour?.length > 0) {
    let maxWind = 0;
    for (const h of fd.hour) {
      if (h.wind_kph > maxWind) {
        maxWind = h.wind_kph;
        dominantWindDir = h.wind_degree;
      }
    }
  }

  return {
    date: fd.date,
    weatherCode: fd.day.condition.code,
    temperatureMax: Math.round(fd.day.maxtemp_c),
    temperatureMin: Math.round(fd.day.mintemp_c),
    apparentTemperatureMax: apparentMax,
    apparentTemperatureMin: apparentMin,
    precipitationSum: fd.day.totalprecip_mm ?? 0,
    precipitationProbabilityMax: fd.day.daily_chance_of_rain ?? 0,
    windSpeedMax: Math.round(fd.day.maxwind_kph ?? 0),
    windGustsMax: maxGust,
    windDirection: Math.round(dominantWindDir),
    uvIndexMax: fd.day.uv ?? 0,
    sunrise: parseTimeToIso(fd.date, fd.astro?.sunrise ?? ''),
    sunset: parseTimeToIso(fd.date, fd.astro?.sunset ?? ''),
    hourly: hours,
  };
}

export async function fetchWeatherForecast(): Promise<DayForecast[]> {
  if (!WEATHERAPI_KEY) {
    console.warn('Weather: no VITE_WEATHERAPI_KEY configured');
    return [];
  }

  const settings = StorageService.getSettings();
  const locationKey = settings.weatherLocation || '__browser__';

  // Return cache if fresh and for the same location
  const cached = getCache(locationKey);
  if (cached) return cached.forecasts;

  // WeatherAPI accepts city names directly — no separate geocoding needed
  const q = settings.weatherLocation || await getBrowserLocationQuery();

  const url = `${WEATHERAPI_BASE}/forecast.json?key=${WEATHERAPI_KEY}&q=${encodeURIComponent(q)}&days=14&aqi=no&alerts=no`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`WeatherAPI error: ${res.status}`);

  const data = await res.json();
  const forecasts: DayForecast[] = (data.forecast?.forecastday || []).map(mapForecastDay);

  setCache({ forecasts, timestamp: Date.now(), locationKey });
  return forecasts;
}

/** Clear the weather cache so the next fetch re-queries the API */
export function clearWeatherCache(): void {
  StorageService.remove(CACHE_KEY);
  // Clean up old versioned keys
  StorageService.remove('nestly_weather_cache');
  StorageService.remove('nestly_weather_cache_v1');
  StorageService.remove('nestly_weather_cache_v2');
}
