import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { onedriveService } from '../services/onedrive.service';
import type { DriveItem } from '../services/onedrive.service';
import type { PhotoContextType } from '../types/photo.types';
import { StorageService } from '../services/storage.service';

const PhotoContext = createContext<PhotoContextType | undefined>(undefined);

export const usePhoto = () => {
  const context = useContext(PhotoContext);
  if (!context) {
    throw new Error('usePhoto must be used within a PhotoProvider');
  }
  return context;
};

interface PhotoProviderProps {
  children: ReactNode;
}

export const PhotoProvider: React.FC<PhotoProviderProps> = ({ children }) => {
  const { accounts, getAccessToken } = useAuth();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedFolderName, setSelectedFolderName] = useState<string | null>(null);
  const [photos, setPhotos] = useState<DriveItem[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved folder on mount
  useEffect(() => {
    const savedFolder = StorageService.getPhotoFolder();
    if (savedFolder) {
      setSelectedFolderId(savedFolder.id);
      setSelectedFolderName(savedFolder.name ?? null);
    }
  }, []);

  // Photos are loaded on-demand when the user navigates to the Photos page
  // via loadPhotos() — no eager loading here

  const setSelectedFolder = (folderId: string, folderName: string) => {
    setSelectedFolderId(folderId);
    setSelectedFolderName(folderName);
    setCurrentPhotoIndex(0);
    StorageService.setPhotoFolder({ id: folderId, name: folderName });
    window.dispatchEvent(new CustomEvent('planner-data-changed'));
  };

  const loadPhotos = async () => {
    if (!selectedFolderId || accounts.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      // Use the first account for OneDrive access
      const accessToken = await getAccessToken(accounts[0].homeAccountId);
      const loadedPhotos = await onedriveService.getImagesFromFolder(
        selectedFolderId,
        accessToken
      );

      setPhotos(loadedPhotos);

      if (loadedPhotos.length === 0) {
        setError('No photos found in this folder');
      }
    } catch (err: any) {
      console.error('Failed to load photos:', err);
      setError(err.message || 'Failed to load photos');
    } finally {
      setIsLoading(false);
    }
  };

  const nextPhoto = () => {
    setCurrentPhotoIndex(prev => (prev + 1) % photos.length);
  };

  const previousPhoto = () => {
    setCurrentPhotoIndex(prev => (prev - 1 + photos.length) % photos.length);
  };

  const togglePlayback = () => {
    setIsPlaying(prev => !prev);
  };

  const setPhotoIndex = (index: number) => {
    if (index >= 0 && index < photos.length) {
      setCurrentPhotoIndex(index);
    }
  };

  const value: PhotoContextType = {
    selectedFolderId,
    selectedFolderName,
    photos,
    currentPhotoIndex,
    isPlaying,
    isLoading,
    error,
    setSelectedFolder,
    loadPhotos,
    nextPhoto,
    previousPhoto,
    togglePlayback,
    setPhotoIndex,
  };

  return <PhotoContext.Provider value={value}>{children}</PhotoContext.Provider>;
};
