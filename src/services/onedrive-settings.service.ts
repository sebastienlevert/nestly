import { appConfig } from '../config/app.config';
import { cacheService } from './idb-cache.service';
import type { AppSettings } from '../types/settings.types';

const ONEDRIVE_SETTINGS_PATH = '/drive/special/approot:/nestly/settings.json';
const CACHE_KEY = 'onedrive-settings';

/**
 * Syncs AppSettings to/from OneDrive at:
 *   /Apps/nestly/settings.json  (approot special folder)
 *
 * Uses IndexedDB as local cache with stale-while-revalidate.
 */
class OneDriveSettingsService {
  private baseUrl = appConfig.graph.baseUrl;

  /** Read settings.json from OneDrive */
  async read(accessToken: string): Promise<AppSettings | null> {
    try {
      const url = `${this.baseUrl}${ONEDRIVE_SETTINGS_PATH}:/content`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.status === 404) return null; // File doesn't exist yet
      if (!response.ok) {
        console.warn('OneDrive settings read failed:', response.status);
        return null;
      }

      const settings: AppSettings = await response.json();
      // Cache the fresh data
      await cacheService.set(CACHE_KEY, settings);
      return settings;
    } catch (err) {
      console.error('Failed to read OneDrive settings:', err);
      return null;
    }
  }

  /** Write settings.json to OneDrive (PUT creates or overwrites) */
  async write(accessToken: string, settings: AppSettings): Promise<boolean> {
    try {
      const url = `${this.baseUrl}${ONEDRIVE_SETTINGS_PATH}:/content`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings, null, 2),
      });

      if (!response.ok) {
        console.error('OneDrive settings write failed:', response.status);
        return false;
      }

      // Update local cache
      await cacheService.set(CACHE_KEY, settings);
      return true;
    } catch (err) {
      console.error('Failed to write OneDrive settings:', err);
      return false;
    }
  }

  /** Get cached settings from IndexedDB (instant, offline-safe) */
  async getCached(): Promise<AppSettings | null> {
    const entry = await cacheService.get<AppSettings>(CACHE_KEY);
    return entry?.data ?? null;
  }
}

export const oneDriveSettingsService = new OneDriveSettingsService();
