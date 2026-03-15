import { appConfig } from '../config/app.config';
import type { AppSettings } from '../types/settings.types';

export class StorageService {
  private static isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  static get<T>(key: string, defaultValue: T): T {
    if (!this.isAvailable()) {
      console.warn('localStorage is not available');
      return defaultValue;
    }

    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage (key: ${key}):`, error);
      return defaultValue;
    }
  }

  static set<T>(key: string, value: T): boolean {
    if (!this.isAvailable()) {
      console.warn('localStorage is not available');
      return false;
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage (key: ${key}):`, error);
      return false;
    }
  }

  static remove(key: string): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage (key: ${key}):`, error);
      return false;
    }
  }

  static clear(): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }

  // Helper methods for app-specific storage
  static getAuthAccounts() {
    return this.get(appConfig.storage.keys.auth, []);
  }

  static setAuthAccounts(accounts: any[]) {
    return this.set(appConfig.storage.keys.auth, accounts);
  }

  static getCalendarCache() {
    return this.get(appConfig.storage.keys.calendarCache, { events: [], timestamp: null });
  }

  static setCalendarCache(cache: any) {
    return this.set(appConfig.storage.keys.calendarCache, { ...cache, timestamp: Date.now() });
  }

  static getPhotoFolder(): { id: string; name?: string } | null {
    return this.get<{ id: string; name?: string } | null>(appConfig.storage.keys.photoFolder, null);
  }

  static setPhotoFolder(folder: { id: string; name: string }) {
    return this.set(appConfig.storage.keys.photoFolder, folder);
  }

  static getFridgeInventory() {
    return this.get(appConfig.storage.keys.fridgeInventory, []);
  }

  static setFridgeInventory(items: any[]) {
    return this.set(appConfig.storage.keys.fridgeInventory, items);
  }

  static getSavedRecipes() {
    return this.get(appConfig.storage.keys.savedRecipes, []);
  }

  static setSavedRecipes(recipes: any[]) {
    return this.set(appConfig.storage.keys.savedRecipes, recipes);
  }

  static getSettings(): AppSettings {
    return this.get<AppSettings>(appConfig.storage.keys.settings, {});
  }

  static setSettings(settings: AppSettings) {
    return this.set(appConfig.storage.keys.settings, settings);
  }

  // Adventure Map
  static getAdventurePins() {
    return this.get(appConfig.storage.keys.adventurePins, []);
  }

  static setAdventurePins(pins: any[]) {
    return this.set(appConfig.storage.keys.adventurePins, pins);
  }

  static getAdventureTrips() {
    return this.get(appConfig.storage.keys.adventureTrips, []);
  }

  static setAdventureTrips(trips: any[]) {
    return this.set(appConfig.storage.keys.adventureTrips, trips);
  }

  static getDreamDestinations() {
    return this.get(appConfig.storage.keys.dreamDestinations, []);
  }

  static setDreamDestinations(destinations: any[]) {
    return this.set(appConfig.storage.keys.dreamDestinations, destinations);
  }

  // Love Board
  static getLoveNotes() {
    return this.get(appConfig.storage.keys.loveNotes, []);
  }

  static setLoveNotes(notes: any[]) {
    return this.set(appConfig.storage.keys.loveNotes, notes);
  }

  static getGratitudeEntries() {
    return this.get(appConfig.storage.keys.gratitudeEntries, []);
  }

  static setGratitudeEntries(entries: any[]) {
    return this.set(appConfig.storage.keys.gratitudeEntries, entries);
  }

  static getDailySpark() {
    return this.get<any | null>(appConfig.storage.keys.dailySpark, null);
  }

  static setDailySpark(spark: any) {
    return this.set(appConfig.storage.keys.dailySpark, spark);
  }

  // Memories
  static getMemoryCache() {
    return this.get<any>(appConfig.storage.keys.memoryCache, {});
  }

  static setMemoryCache(cache: any) {
    return this.set(appConfig.storage.keys.memoryCache, cache);
  }

  // Fun Night & Scoreboard
  static getBoardGames() {
    return this.get(appConfig.storage.keys.boardGames, []);
  }

  static setBoardGames(games: any[]) {
    return this.set(appConfig.storage.keys.boardGames, games);
  }

  static getFunNightHistory() {
    return this.get(appConfig.storage.keys.funNightHistory, []);
  }

  static setFunNightHistory(history: any[]) {
    return this.set(appConfig.storage.keys.funNightHistory, history);
  }

  static getGameScores() {
    return this.get(appConfig.storage.keys.gameScores, { currentSession: null, pastSessions: [] });
  }

  static setGameScores(scores: any) {
    return this.set(appConfig.storage.keys.gameScores, scores);
  }
}
