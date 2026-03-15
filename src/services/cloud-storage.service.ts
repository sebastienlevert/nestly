import { graphService } from './graph.service';

const SETTINGS_PATH = '/.planner/settings.json';

export interface CloudSettings {
  version: number;
  lastModified: string;
  photoFolder?: { id: string; name?: string };
  adventurePins?: any[];
  adventureTrips?: any[];
  dreamDestinations?: any[];
  loveNotes?: any[];
  gratitudeEntries?: any[];
  boardGames?: any[];
  funNightHistory?: any[];
  fridgeInventory?: any[];
  savedRecipes?: any[];
  settings?: any;
}

const EMPTY_SETTINGS: CloudSettings = {
  version: 1,
  lastModified: new Date().toISOString(),
};

class CloudStorageService {
  private saving = false;
  private pendingSave: CloudSettings | null = null;

  async load(accessToken: string): Promise<CloudSettings> {
    try {
      const data = await graphService.getFileByPath<CloudSettings>(SETTINGS_PATH, accessToken);
      return data;
    } catch (error: any) {
      if (error.message === 'FILE_NOT_FOUND') {
        // First time — create the file with empty settings
        return EMPTY_SETTINGS;
      }
      console.error('Failed to load cloud settings:', error);
      throw error;
    }
  }

  async save(accessToken: string, settings: CloudSettings): Promise<void> {
    settings.lastModified = new Date().toISOString();

    // Debounce: if already saving, queue latest
    if (this.saving) {
      this.pendingSave = settings;
      return;
    }

    this.saving = true;
    try {
      await graphService.putFileByPath(SETTINGS_PATH, accessToken, settings);
    } catch (error) {
      console.error('Failed to save cloud settings:', error);
      throw error;
    } finally {
      this.saving = false;

      // If there's a pending save, flush it
      if (this.pendingSave) {
        const pending = this.pendingSave;
        this.pendingSave = null;
        await this.save(accessToken, pending);
      }
    }
  }
}

export const cloudStorageService = new CloudStorageService();
