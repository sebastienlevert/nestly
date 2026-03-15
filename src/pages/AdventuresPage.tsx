import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MapPin, Compass, Plane } from 'lucide-react';
import { useAdventure } from '../contexts/AdventureContext';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { AdventureMap } from '../components/adventures/AdventureMap';
import { PinEditor } from '../components/adventures/PinEditor';
import { DreamBoard } from '../components/adventures/DreamBoard';
import { TripManager } from '../components/adventures/TripManager';
import type { TravelPin, Trip } from '../types/adventure.types';

export const AdventuresPage: React.FC = () => {
  const { pins, trips, dreamDestinations, addPin, updatePin, loadTripPhotos, loadAllTripPhotos } = useAdventure();
  const { isAuthenticated } = useAuth();
  const { t } = useLocale();
  const photosLoadedRef = useRef(false);

  const [pinEditorOpen, setPinEditorOpen] = useState(false);
  const [selectedLat, setSelectedLat] = useState<number | undefined>();
  const [selectedLng, setSelectedLng] = useState<number | undefined>();
  const [editingPin, setEditingPin] = useState<TravelPin | undefined>();
  const [focusTripId, setFocusTripId] = useState<string | undefined>();

  // Load trip photos on-demand when page is visited
  useEffect(() => {
    if (isAuthenticated && trips.length > 0 && !photosLoadedRef.current) {
      photosLoadedRef.current = true;
      loadAllTripPhotos();
    }
  }, [isAuthenticated, trips.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddPin = useCallback((lat: number, lng: number) => {
    setEditingPin(undefined);
    setSelectedLat(lat);
    setSelectedLng(lng);
    setPinEditorOpen(true);
  }, []);

  const handleSavePin = useCallback(
    (pin: Omit<TravelPin, 'id' | 'createdAt'>) => {
      if (editingPin) {
        updatePin(editingPin.id, pin);
      } else {
        addPin(pin);
      }
    },
    [editingPin, addPin, updatePin],
  );

  const handleCloseEditor = useCallback(() => {
    setPinEditorOpen(false);
    setEditingPin(undefined);
    setSelectedLat(undefined);
    setSelectedLng(undefined);
  }, []);

  const handleViewTrip = useCallback((trip: Trip) => {
    setFocusTripId(prev => prev === trip.id ? undefined : trip.id);
  }, []);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-foreground">{t.adventures.title}</h2>
        <p className="text-muted-foreground">{t.adventures.subtitle}</p>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-6 mb-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin size={16} className="text-red-500" />
          <span>
            <span className="font-semibold text-foreground">{pins.length}</span>{' '}
            {t.adventures.countriesVisited}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Plane size={16} className="text-green-500" />
          <span>
            <span className="font-semibold text-foreground">{trips.length}</span>{' '}
            {t.adventures.trips}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Compass size={16} className="text-blue-500" />
          <span>
            <span className="font-semibold text-foreground">{dreamDestinations.length}</span>{' '}
            {t.adventures.dreamDestinations}
          </span>
        </div>
      </div>

      {/* Map */}
      <div className="mb-8">
        <AdventureMap onAddPin={handleAddPin} focusTripId={focusTripId} />
      </div>

      {/* Trip manager */}
      <div className="mb-8">
        <TripManager onViewTrip={handleViewTrip} onTripCreated={(tripId) => {
          setFocusTripId(tripId);
          // Force load geotagged photos for the new trip
          setTimeout(() => loadTripPhotos(tripId), 500);
        }} />
      </div>

      {/* Dream board */}
      <DreamBoard />

      {/* Pin editor modal */}
      <PinEditor
        isOpen={pinEditorOpen}
        onClose={handleCloseEditor}
        onSave={handleSavePin}
        initialLat={selectedLat}
        initialLng={selectedLng}
        editPin={editingPin}
      />
    </div>
  );
};
