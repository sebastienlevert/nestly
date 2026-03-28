import { appConfig } from '../config/app.config';
import { cacheService } from './idb-cache.service';
import type { GamesData } from '../types/game.types';

const ONEDRIVE_GAMES_PATH = '/drive/special/approot:/nestly/games.json';
const CACHE_KEY = 'onedrive-games';

const EMPTY_DATA: GamesData = { customTemplates: [], sessions: [] };

/**
 * Syncs game data to/from OneDrive at:
 *   /Apps/nestly/games.json  (approot special folder)
 *
 * Uses IndexedDB as local cache with stale-while-revalidate.
 */
class OneDriveGamesService {
  private baseUrl = appConfig.graph.baseUrl;

  /** Read games.json from OneDrive */
  async read(accessToken: string): Promise<GamesData | null> {
    try {
      const url = `${this.baseUrl}${ONEDRIVE_GAMES_PATH}:/content`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.status === 404) return null;
      if (!response.ok) {
        console.warn('OneDrive games read failed:', response.status);
        return null;
      }

      const data: GamesData = await response.json();
      await cacheService.set(CACHE_KEY, data);
      return data;
    } catch (err) {
      console.error('Failed to read OneDrive games:', err);
      return null;
    }
  }

  /** Write games.json to OneDrive (PUT creates or overwrites) */
  async write(accessToken: string, data: GamesData): Promise<boolean> {
    try {
      const url = `${this.baseUrl}${ONEDRIVE_GAMES_PATH}:/content`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data, null, 2),
      });

      if (!response.ok) {
        console.error('OneDrive games write failed:', response.status);
        return false;
      }

      await cacheService.set(CACHE_KEY, data);
      return true;
    } catch (err) {
      console.error('Failed to write OneDrive games:', err);
      return false;
    }
  }

  /** Get cached games from IndexedDB (instant, offline-safe) */
  async getCached(): Promise<GamesData | null> {
    const entry = await cacheService.get<GamesData>(CACHE_KEY);
    return entry?.data ?? null;
  }

  /** Get empty data structure */
  getEmpty(): GamesData {
    return { ...EMPTY_DATA, customTemplates: [], sessions: [] };
  }
}

export const oneDriveGamesService = new OneDriveGamesService();
