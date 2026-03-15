import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { openaiService } from '../services/openai.service';
import { onedriveService } from '../services/onedrive.service';
import { useAuth } from './AuthContext';
import type {
  TravelPin,
  Trip,
  GeoPhoto,
  DreamDestination,
  TripSuggestion,
  AdventureContextType,
} from '../types/adventure.types';
import { StorageService } from '../services/storage.service';

const TRIP_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b',
];

const AdventureContext = createContext<AdventureContextType | undefined>(undefined);

export const useAdventure = () => {
  const context = useContext(AdventureContext);
  if (!context) {
    throw new Error('useAdventure must be used within an AdventureProvider');
  }
  return context;
};

interface AdventureProviderProps {
  children: ReactNode;
}

export const AdventureProvider: React.FC<AdventureProviderProps> = ({ children }) => {
  const { accounts, getAccessToken } = useAuth();
  const [pins, setPins] = useState<TravelPin[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripPhotos, setTripPhotos] = useState<Record<string, GeoPhoto[]>>({});
  const [dreamDestinations, setDreamDestinations] = useState<DreamDestination[]>([]);
  const [suggestions, setSuggestions] = useState<TripSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedTripsRef = useRef<Set<string>>(new Set());
  const tripsRef = useRef<Trip[]>(trips);
  const initializedRef = useRef(false);
  tripsRef.current = trips;

  useEffect(() => {
    const storedPins = StorageService.getAdventurePins();
    const storedTrips = StorageService.getAdventureTrips();
    const storedDestinations = StorageService.getDreamDestinations();
    setPins(storedPins);
    setTrips(storedTrips);
    setDreamDestinations(storedDestinations);
    initializedRef.current = true;
  }, []);

  // Re-read from localStorage when cloud sync restores data
  useEffect(() => {
    const handleCloudRestore = () => {
      setPins(StorageService.getAdventurePins());
      setTrips(StorageService.getAdventureTrips());
      setDreamDestinations(StorageService.getDreamDestinations());
    };
    window.addEventListener('cloud-sync-loaded', handleCloudRestore);
    return () => window.removeEventListener('cloud-sync-loaded', handleCloudRestore);
  }, []);

  const notifyChange = () => window.dispatchEvent(new CustomEvent('planner-data-changed'));

  useEffect(() => { if (!initializedRef.current) return; StorageService.setAdventurePins(pins); notifyChange(); }, [pins]);
  useEffect(() => { if (!initializedRef.current) return; StorageService.setAdventureTrips(trips); notifyChange(); }, [trips]);
  useEffect(() => { if (!initializedRef.current) return; StorageService.setDreamDestinations(dreamDestinations); notifyChange(); }, [dreamDestinations]);

  const generateId = (prefix: string): string => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Pin CRUD
  const addPin = useCallback((pin: Omit<TravelPin, 'id' | 'createdAt'>) => {
    const newPin: TravelPin = {
      ...pin,
      id: generateId('pin'),
      createdAt: new Date().toISOString(),
    };
    setPins(prev => [...prev, newPin]);
  }, []);

  const updatePin = useCallback((id: string, updates: Partial<TravelPin>) => {
    setPins(prev => prev.map(pin => (pin.id === id ? { ...pin, ...updates } : pin)));
  }, []);

  const deletePin = useCallback((id: string) => {
    setPins(prev => prev.filter(pin => pin.id !== id));
  }, []);

  // Trip CRUD
  const addTrip = useCallback((trip: Omit<Trip, 'id' | 'createdAt'>): string => {
    const newTrip: Trip = {
      ...trip,
      id: generateId('trip'),
      color: trip.color || TRIP_COLORS[trips.length % TRIP_COLORS.length],
      createdAt: new Date().toISOString(),
    };
    setTrips(prev => [...prev, newTrip]);
    return newTrip.id;
  }, [trips.length]);

  const updateTrip = useCallback((id: string, updates: Partial<Trip>) => {
    setTrips(prev => prev.map(trip => (trip.id === id ? { ...trip, ...updates } : trip)));
  }, []);

  const deleteTrip = useCallback((id: string) => {
    setTrips(prev => prev.filter(trip => trip.id !== id));
    // Unlink pins from deleted trip
    setPins(prev => prev.map(pin => pin.tripId === id ? { ...pin, tripId: undefined } : pin));
  }, []);

  const getTripPins = useCallback((tripId: string) => {
    return pins.filter(pin => pin.tripId === tripId);
  }, [pins]);

  // Dream destinations
  const addDreamDestination = useCallback((dest: Omit<DreamDestination, 'id' | 'createdAt'>) => {
    const newDest: DreamDestination = {
      ...dest,
      id: generateId('dream'),
      createdAt: new Date().toISOString(),
    };
    setDreamDestinations(prev => [...prev, newDest]);
  }, []);

  const removeDreamDestination = useCallback((id: string) => {
    setDreamDestinations(prev => prev.filter(dest => dest.id !== id));
  }, []);

  // AI suggestions
  const generateTripSuggestions = useCallback(async () => {
    if (!openaiService.isConfigured()) {
      setError('Azure OpenAI is not configured. Please add your credentials to the .env file.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const generated = await openaiService.generateTripSuggestions(4, [
        'photos',
        'travelling',
        'board games',
        'music',
        'good food',
      ]);
      setSuggestions(generated);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate trip suggestions';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  // Load geotagged photos for a single trip
  const loadTripPhotos = useCallback(async (tripId: string) => {
    const trip = tripsRef.current.find(t => t.id === tripId);
    if (!trip?.photoFolderId || accounts.length === 0) return;
    // Clear the "already loaded" flag so re-loads work after trip creation
    loadedTripsRef.current.delete(tripId);

    try {
      setIsLoadingPhotos(true);
      const token = await getAccessToken(accounts[0].homeAccountId);
      const photos = await onedriveService.getGeotaggedPhotos(trip.photoFolderId, token);
      loadedTripsRef.current.add(tripId);
      setTripPhotos(prev => ({ ...prev, [tripId]: photos }));
    } catch (err) {
      console.warn(`Failed to load geotagged photos for trip ${tripId}:`, err);
    } finally {
      setIsLoadingPhotos(false);
    }
  }, [accounts, getAccessToken]);

  // Load geotagged photos for all trips that have photo folders
  const loadAllTripPhotos = useCallback(async () => {
    const tripsWithPhotos = trips.filter(t => t.photoFolderId);
    if (tripsWithPhotos.length === 0 || accounts.length === 0) return;

    setIsLoadingPhotos(true);
    try {
      const token = await getAccessToken(accounts[0].homeAccountId);
      const results: Record<string, GeoPhoto[]> = {};

      await Promise.all(
        tripsWithPhotos.map(async (trip) => {
          if (loadedTripsRef.current.has(trip.id)) return;
          try {
            const photos = await onedriveService.getGeotaggedPhotos(trip.photoFolderId!, token);
            loadedTripsRef.current.add(trip.id);
            results[trip.id] = photos;
          } catch (err) {
            console.warn(`Failed to load photos for trip ${trip.name}:`, err);
          }
        })
      );

      if (Object.keys(results).length > 0) {
        setTripPhotos(prev => ({ ...prev, ...results }));
      }
    } catch (err) {
      console.warn('Failed to load trip photos:', err);
    } finally {
      setIsLoadingPhotos(false);
    }
  }, [trips, accounts, getAccessToken]);

  // Trip photos are loaded on-demand when the user navigates to Adventures page
  // via loadAllTripPhotos() — no eager loading here

  const value: AdventureContextType = {
    pins,
    trips,
    tripPhotos,
    dreamDestinations,
    suggestions,
    isGenerating,
    isLoadingPhotos,
    error,
    addPin,
    updatePin,
    deletePin,
    addTrip,
    updateTrip,
    deleteTrip,
    getTripPins,
    loadTripPhotos,
    loadAllTripPhotos,
    addDreamDestination,
    removeDreamDestination,
    generateTripSuggestions,
    clearSuggestions,
  };

  return <AdventureContext.Provider value={value}>{children}</AdventureContext.Provider>;
};
