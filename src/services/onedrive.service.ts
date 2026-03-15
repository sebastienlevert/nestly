import { graphService } from './graph.service';
import { appConfig } from '../config/app.config';
import type { GeoPhoto } from '../types/adventure.types';

export interface DriveItem {
  id: string;
  name: string;
  folder?: { childCount: number };
  file?: { mimeType: string };
  size?: number;
  webUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  photo?: {
    takenDateTime?: string;
    cameraMake?: string;
    cameraModel?: string;
  };
  thumbnails?: Array<{
    large?: { url: string };
    medium?: { url: string };
    small?: { url: string };
  }>;
  '@microsoft.graph.downloadUrl'?: string;
}

export class OneDriveService {
  // Get root folder
  async getRootFolder(accessToken: string): Promise<DriveItem> {
    return graphService.getDriveRoot(accessToken) as Promise<DriveItem>;
  }

  // Get folder contents
  async getFolderContents(folderId: string, accessToken: string): Promise<DriveItem[]> {
    try {
      const response: any = await graphService.getFolderChildren(folderId, accessToken);
      return response.value || [];
    } catch (error) {
      console.error('Failed to fetch folder contents:', error);
      throw error;
    }
  }

  // Get images from a folder and all its subfolders recursively
  async getImagesFromFolder(folderId: string, accessToken: string): Promise<DriveItem[]> {
    try {
      const allImages = await this.collectImagesRecursively(folderId, accessToken);

      // Fetch thumbnails for all collected images
      const imagesWithThumbnails = await Promise.all(
        allImages.map(async image => {
          try {
            const thumbnails: any = await graphService.getImageThumbnails(image.id, accessToken);
            return {
              ...image,
              thumbnails: thumbnails.value,
            };
          } catch (error) {
            console.warn(`Failed to fetch thumbnails for ${image.name}:`, error);
            return image;
          }
        })
      );

      return imagesWithThumbnails;
    } catch (error) {
      console.error('Failed to fetch images:', error);
      throw error;
    }
  }

  // Recursively collect images from a folder and all subfolders
  private async collectImagesRecursively(folderId: string, accessToken: string): Promise<DriveItem[]> {
    const items = await this.getFolderContents(folderId, accessToken);
    const imageExtensions = appConfig.photos.supportedExtensions;

    const images = items.filter(item => {
      if (!item.file) return false;
      const extension = item.name.toLowerCase().match(/\.[^.]+$/)?.[0];
      return extension && imageExtensions.includes(extension);
    });

    // Recurse into subfolders
    const subfolders = items.filter(item => this.isFolder(item));
    const subfolderImages = await Promise.all(
      subfolders.map(folder => this.collectImagesRecursively(folder.id, accessToken))
    );

    return [...images, ...subfolderImages.flat()];
  }

  // Get image download URL
  async getImageDownloadUrl(itemId: string, accessToken: string): Promise<string> {
    try {
      const response: any = await graphService.get(`/me/drive/items/${itemId}`, accessToken);
      return response['@microsoft.graph.downloadUrl'] || '';
    } catch (error) {
      console.error('Failed to get download URL:', error);
      throw error;
    }
  }

  // Navigate folder path
  async navigateToPath(path: string, accessToken: string): Promise<DriveItem[]> {
    try {
      const response: any = await graphService.getDriveItemsByPath(path, accessToken);
      return response.value || [];
    } catch (error) {
      console.error('Failed to navigate to path:', error);
      throw error;
    }
  }

  // Check if item is a folder
  isFolder(item: DriveItem): boolean {
    return Boolean(item.folder);
  }

  // Check if item is an image
  isImage(item: DriveItem): boolean {
    if (!item.file) return false;
    const extension = item.name.toLowerCase().match(/\.[^.]+$/)?.[0];
    return Boolean(extension && appConfig.photos.supportedExtensions.includes(extension));
  }

  // Get thumbnail URL (prefer large, fallback to medium, then small)
  getThumbnailUrl(item: DriveItem): string | null {
    if (!item.thumbnails || item.thumbnails.length === 0) return null;

    const thumbnail = item.thumbnails[0];
    return thumbnail.large?.url || thumbnail.medium?.url || thumbnail.small?.url || null;
  }

  // Get geotagged photos from a folder (recursively), returning only those with GPS coordinates
  async getGeotaggedPhotos(folderId: string, accessToken: string): Promise<GeoPhoto[]> {
    try {
      return await this.collectGeoPhotosRecursively(folderId, accessToken);
    } catch (error) {
      console.error('Failed to fetch geotagged photos:', error);
      throw error;
    }
  }

  private async collectGeoPhotosRecursively(folderId: string, accessToken: string): Promise<GeoPhoto[]> {
    const response: any = await graphService.getFolderChildrenWithLocation(folderId, accessToken);
    const items: DriveItem[] = response.value || [];
    const imageExtensions = appConfig.photos.supportedExtensions;

    const geoPhotos: GeoPhoto[] = items
      .filter(item => {
        if (!item.file || !item.location) return false;
        if (typeof item.location.latitude !== 'number' || typeof item.location.longitude !== 'number') return false;
        // Must be a valid coordinate (not 0,0 which is often a default)
        if (item.location.latitude === 0 && item.location.longitude === 0) return false;
        const ext = item.name.toLowerCase().match(/\.[^.]+$/)?.[0];
        return ext && imageExtensions.includes(ext);
      })
      .map(item => ({
        id: item.id,
        name: item.name,
        latitude: item.location!.latitude,
        longitude: item.location!.longitude,
        thumbnailUrl: this.getThumbnailUrl(item) || undefined,
        downloadUrl: item['@microsoft.graph.downloadUrl'],
        takenDate: item.photo?.takenDateTime,
      }));

    // Recurse into subfolders
    const subfolders = items.filter(item => this.isFolder(item));
    const subResults = await Promise.all(
      subfolders.map(folder => this.collectGeoPhotosRecursively(folder.id, accessToken))
    );

    return [...geoPhotos, ...subResults.flat()];
  }
}

export const onedriveService = new OneDriveService();
