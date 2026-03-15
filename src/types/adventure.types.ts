export interface TravelPin {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  visitDate: string;
  tripId?: string;
  photoFolderId?: string;
  photoFolderName?: string;
  coverPhotoUrl?: string;
  tags: string[];
  rating: number;
  createdAt: string;
}

export interface Trip {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  photoFolderId?: string;
  photoFolderName?: string;
  coverPhotoUrl?: string;
  color: string;
  createdAt: string;
}

export interface GeoPhoto {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  thumbnailUrl?: string;
  downloadUrl?: string;
  takenDate?: string;
}

export interface DreamDestination {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  reason: string;
  addedBy: string;
  suggestedBy: 'manual' | 'ai';
  createdAt: string;
}

export interface TripSuggestion {
  id: string;
  destination: string;
  description: string;
  whyGreatForFamily: string;
  bestTimeToVisit: string;
  kidsActivities: string[];
  latitude: number;
  longitude: number;
  createdAt: string;
}

export interface AdventureState {
  pins: TravelPin[];
  trips: Trip[];
  tripPhotos: Record<string, GeoPhoto[]>;
  dreamDestinations: DreamDestination[];
  suggestions: TripSuggestion[];
  isGenerating: boolean;
  isLoadingPhotos: boolean;
  error: string | null;
}

export interface AdventureContextType extends AdventureState {
  addPin: (pin: Omit<TravelPin, 'id' | 'createdAt'>) => void;
  updatePin: (id: string, updates: Partial<TravelPin>) => void;
  deletePin: (id: string) => void;
  addTrip: (trip: Omit<Trip, 'id' | 'createdAt'>) => string;
  updateTrip: (id: string, updates: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;
  getTripPins: (tripId: string) => TravelPin[];
  loadTripPhotos: (tripId: string) => Promise<void>;
  loadAllTripPhotos: () => Promise<void>;
  addDreamDestination: (dest: Omit<DreamDestination, 'id' | 'createdAt'>) => void;
  removeDreamDestination: (id: string) => void;
  generateTripSuggestions: () => Promise<void>;
  clearSuggestions: () => void;
}
