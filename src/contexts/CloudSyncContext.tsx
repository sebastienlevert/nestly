import React, { createContext, useContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { cloudStorageService, type CloudSettings } from '../services/cloud-storage.service';
import { StorageService } from '../services/storage.service';

interface CloudSyncContextType {
  isSyncing: boolean;
  lastSynced: string | null;
  syncError: string | null;
  syncNow: () => Promise<void>;
  saveToCloud: () => Promise<void>;
}

const CloudSyncContext = createContext<CloudSyncContextType | undefined>(undefined);

export const useCloudSync = () => {
  const context = useContext(CloudSyncContext);
  if (!context) {
    throw new Error('useCloudSync must be used within a CloudSyncProvider');
  }
  return context;
};

interface CloudSyncProviderProps {
  children: ReactNode;
}

// Collect all app data into a single CloudSettings object
function collectLocalData(): CloudSettings {
  return {
    version: 1,
    lastModified: new Date().toISOString(),
    photoFolder: StorageService.getPhotoFolder() || undefined,
    adventurePins: StorageService.getAdventurePins(),
    adventureTrips: StorageService.getAdventureTrips(),
    dreamDestinations: StorageService.getDreamDestinations(),
    loveNotes: StorageService.getLoveNotes(),
    gratitudeEntries: StorageService.getGratitudeEntries(),
    boardGames: StorageService.getBoardGames(),
    funNightHistory: StorageService.getFunNightHistory(),
    fridgeInventory: StorageService.getFridgeInventory(),
    savedRecipes: StorageService.getSavedRecipes(),
    settings: StorageService.getSettings(),
  };
}

// Apply cloud data to local storage
function applyCloudData(cloud: CloudSettings) {
  if (cloud.photoFolder) StorageService.setPhotoFolder({ id: cloud.photoFolder.id, name: cloud.photoFolder.name || '' });
  if (cloud.adventurePins) StorageService.setAdventurePins(cloud.adventurePins);
  if (cloud.adventureTrips) StorageService.setAdventureTrips(cloud.adventureTrips);
  if (cloud.dreamDestinations) StorageService.setDreamDestinations(cloud.dreamDestinations);
  if (cloud.loveNotes) StorageService.setLoveNotes(cloud.loveNotes);
  if (cloud.gratitudeEntries) StorageService.setGratitudeEntries(cloud.gratitudeEntries);
  if (cloud.boardGames) StorageService.setBoardGames(cloud.boardGames);
  if (cloud.funNightHistory) StorageService.setFunNightHistory(cloud.funNightHistory);
  if (cloud.fridgeInventory) StorageService.setFridgeInventory(cloud.fridgeInventory);
  if (cloud.savedRecipes) StorageService.setSavedRecipes(cloud.savedRecipes);
  if (cloud.settings) StorageService.setSettings(cloud.settings);
}

export const CloudSyncProvider: React.FC<CloudSyncProviderProps> = ({ children }) => {
  const { accounts, getAccessToken, isAuthenticated } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const initialLoadDone = useRef(false);

  const getToken = useCallback(async () => {
    if (accounts.length === 0) return null;
    try {
      return await getAccessToken(accounts[0].homeAccountId);
    } catch {
      return null;
    }
  }, [accounts, getAccessToken]);

  // Load from cloud on first authentication
  const syncNow = useCallback(async () => {
    const token = await getToken();
    if (!token) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      const cloudData = await cloudStorageService.load(token);
      if (cloudData.lastModified) {
        applyCloudData(cloudData);
        setLastSynced(cloudData.lastModified);
        // Trigger a page-level refresh so contexts re-read localStorage
        window.dispatchEvent(new CustomEvent('cloud-sync-loaded'));
      }
    } catch (error: any) {
      console.error('Cloud sync load failed:', error);
      setSyncError(error.message || 'Failed to load from cloud');
    } finally {
      setIsSyncing(false);
    }
  }, [getToken]);

  // Save current local data to cloud
  const saveToCloud = useCallback(async () => {
    const token = await getToken();
    if (!token) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      const data = collectLocalData();
      await cloudStorageService.save(token, data);
      setLastSynced(data.lastModified);
    } catch (error: any) {
      console.error('Cloud sync save failed:', error);
      setSyncError(error.message || 'Failed to save to cloud');
    } finally {
      setIsSyncing(false);
    }
  }, [getToken]);

  // Initial load from cloud when user authenticates
  useEffect(() => {
    if (isAuthenticated && !initialLoadDone.current) {
      initialLoadDone.current = true;
      syncNow();
    }
  }, [isAuthenticated, syncNow]);

  // Auto-save to cloud on storage changes (debounced)
  useEffect(() => {
    if (!isAuthenticated) return;

    let timer: ReturnType<typeof setTimeout>;

    const handleStorageChange = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        saveToCloud();
      }, 2000);
    };

    // Listen for custom storage-changed events from contexts
    window.addEventListener('planner-data-changed', handleStorageChange);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('planner-data-changed', handleStorageChange);
    };
  }, [isAuthenticated, saveToCloud]);

  const value: CloudSyncContextType = {
    isSyncing,
    lastSynced,
    syncError,
    syncNow,
    saveToCloud,
  };

  return (
    <CloudSyncContext.Provider value={value}>
      {children}
    </CloudSyncContext.Provider>
  );
};
