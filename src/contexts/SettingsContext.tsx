import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { StorageService } from '../services/storage.service';
import { oneDriveSettingsService } from '../services/onedrive-settings.service';
import type { AppSettings } from '../types/settings.types';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  saveSettings: () => Promise<void>;
  isSyncing: boolean;
  lastSyncTime: number | null;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { accounts, getAccessToken } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(() => StorageService.getSettings());
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const initialSyncDone = useRef(false);

  // Get a token for the first account (settings are per-user, use primary account)
  const getToken = useCallback(async (): Promise<string | null> => {
    if (accounts.length === 0) return null;
    try {
      return await getAccessToken(accounts[0].homeAccountId);
    } catch {
      return null;
    }
  }, [accounts, getAccessToken]);

  // Load: IndexedDB cache first → OneDrive in background
  useEffect(() => {
    if (accounts.length === 0 || initialSyncDone.current) return;
    initialSyncDone.current = true;

    (async () => {
      // Keep track of the latest merged settings to avoid stale closures
      let current = settings;

      // 1. Load from IndexedDB cache (instant)
      const cached = await oneDriveSettingsService.getCached();
      if (cached) {
        // Merge cached over current, but preserve local-only keys (theme, locale)
        const merged = { ...current, ...cached, theme: current.theme ?? cached.theme, locale: current.locale ?? cached.locale };
        current = merged;
        setSettings(merged);
        StorageService.setSettings(merged);
      }

      // 2. Sync from OneDrive in background
      setIsSyncing(true);
      const token = await getToken();
      if (token) {
        const remote = await oneDriveSettingsService.read(token);
        if (remote) {
          // Merge remote over current, but preserve local-only keys (theme, locale)
          const merged = { ...current, ...remote, theme: current.theme ?? remote.theme, locale: current.locale ?? remote.locale };
          setSettings(merged);
          StorageService.setSettings(merged);
        } else if (!cached) {
          // No remote settings yet — push current local settings to OneDrive
          await oneDriveSettingsService.write(token, current);
        }
        setLastSyncTime(Date.now());
      }
      setIsSyncing(false);
    })();
  }, [accounts, getToken]);

  // Update settings locally (does NOT save to OneDrive yet)
  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    // Always read fresh from localStorage to avoid overwriting changes
    // made by other contexts (ThemeContext, LocaleContext, CalendarContext, etc.)
    const fresh = StorageService.getSettings();
    const updated = { ...fresh, ...updates };
    StorageService.setSettings(updated);
    setSettings(updated);
  }, []);

  // Save settings to both localStorage and OneDrive
  const saveSettings = useCallback(async () => {
    // Read fresh from localStorage — React state may be stale due to batched updates
    const fresh = StorageService.getSettings();
    setSettings(fresh);

    // Then push to OneDrive
    const token = await getToken();
    if (token) {
      setIsSyncing(true);
      await oneDriveSettingsService.write(token, fresh);
      setLastSyncTime(Date.now());
      setIsSyncing(false);
    }
  }, [getToken]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, saveSettings, isSyncing, lastSyncTime }}>
      {children}
    </SettingsContext.Provider>
  );
};
