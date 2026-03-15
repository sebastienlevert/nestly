import React, { useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Star, Compass, Camera } from 'lucide-react';
import { useAdventure } from '../../contexts/AdventureContext';
import { useLocale } from '../../contexts/LocaleContext';
import type { TravelPin, Trip, DreamDestination, GeoPhoto } from '../../types/adventure.types';

// Fix leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: undefined,
  iconUrl: undefined,
  shadowUrl: undefined,
});

const visitedIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 28px; height: 28px; border-radius: 50%;
    background: #ef4444; border: 3px solid #fff;
    box-shadow: 0 2px 6px rgba(0,0,0,0.35);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});

const dreamIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 28px; height: 28px; border-radius: 50%;
    background: #3b82f6; border: 3px solid #fff;
    box-shadow: 0 2px 6px rgba(0,0,0,0.35);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});

function createTripIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 28px; height: 28px; border-radius: 50%;
      background: ${color}; border: 3px solid #fff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

function createPhotoIcon(color: string, thumbnailUrl?: string) {
  if (thumbnailUrl) {
    return L.divIcon({
      className: '',
      html: `<div style="
        width: 36px; height: 36px; border-radius: 6px;
        border: 3px solid ${color};
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        overflow: hidden; background: #fff;
      "><img src="${thumbnailUrl}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='📷'" /></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -20],
    });
  }
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 24px; height: 24px; border-radius: 4px;
      background: ${color}; border: 2px solid #fff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
      font-size: 12px;
    ">📷</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
}

interface MapClickHandlerProps {
  onAddPin: (lat: number, lng: number) => void;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onAddPin }) => {
  useMapEvents({
    click(e) {
      onAddPin(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

function renderStars(rating: number) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
        />
      ))}
    </span>
  );
}

interface PinPopupProps {
  pin: TravelPin;
  tripName?: string;
}

const PinPopup: React.FC<PinPopupProps> = ({ pin, tripName }) => {
  const { t } = useLocale();
  return (
    <div className="min-w-[180px] max-w-[240px]">
      <h3 className="font-semibold text-sm mb-1">{pin.title}</h3>
      {tripName && (
        <p className="text-xs text-primary font-medium mb-1">📍 {tripName}</p>
      )}
      {pin.description && (
        <p className="text-xs text-gray-600 mb-1">{pin.description}</p>
      )}
      <div className="text-xs text-gray-500 mb-1">
        {t.adventures.visitDate}: {new Date(pin.visitDate).toLocaleDateString()}
      </div>
      <div className="mb-1">{renderStars(pin.rating)}</div>
      {pin.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {pin.tags.map((tag) => (
            <span
              key={tag}
              className="inline-block bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

interface DreamPopupProps {
  dest: DreamDestination;
}

const DreamPopup: React.FC<DreamPopupProps> = ({ dest }) => (
  <div className="min-w-[160px] max-w-[220px]">
    <h3 className="font-semibold text-sm mb-1">{dest.name}</h3>
    {dest.reason && (
      <p className="text-xs text-gray-600">{dest.reason}</p>
    )}
  </div>
);

interface PhotoPopupProps {
  photo: GeoPhoto;
  tripName?: string;
  tripColor?: string;
}

const PhotoPopup: React.FC<PhotoPopupProps> = ({ photo, tripName, tripColor }) => (
  <div className="min-w-[180px] max-w-[260px]">
    {photo.thumbnailUrl && (
      <img
        src={photo.thumbnailUrl}
        alt={photo.name}
        className="w-full h-32 object-cover rounded-md mb-2"
      />
    )}
    <h3 className="font-semibold text-xs truncate">{photo.name}</h3>
    {tripName && (
      <p className="text-xs font-medium mt-0.5" style={{ color: tripColor }}>
        📍 {tripName}
      </p>
    )}
    {photo.takenDate && (
      <p className="text-xs text-gray-500 mt-0.5">
        📅 {new Date(photo.takenDate).toLocaleDateString()}
      </p>
    )}
  </div>
);

// Component to zoom map to trip pins and photos
interface ZoomToTripProps {
  tripPins: TravelPin[];
  tripPhotos: GeoPhoto[];
}

const ZoomToTrip: React.FC<ZoomToTripProps> = ({ tripPins, tripPhotos }) => {
  const map = useMap();

  React.useEffect(() => {
    const allPoints: [number, number][] = [
      ...tripPins.map(p => [p.latitude, p.longitude] as [number, number]),
      ...tripPhotos.map(p => [p.latitude, p.longitude] as [number, number]),
    ];
    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [tripPins, tripPhotos, map]);

  return null;
};

interface AdventureMapProps {
  onAddPin: (lat: number, lng: number) => void;
  focusTripId?: string;
}

export const AdventureMap: React.FC<AdventureMapProps> = ({ onAddPin, focusTripId }) => {
  const { pins, trips, tripPhotos, dreamDestinations, getTripPins, isLoadingPhotos } = useAdventure();
  const { t } = useLocale();

  const center = useMemo<[number, number]>(() => [20, 0], []);

  // Build a map of tripId -> trip for fast lookup
  const tripMap = useMemo(() => {
    const map = new Map<string, Trip>();
    trips.forEach(trip => map.set(trip.id, trip));
    return map;
  }, [trips]);

  // Get the icon for a pin based on its trip
  const getPinIcon = (pin: TravelPin) => {
    if (pin.tripId) {
      const trip = tripMap.get(pin.tripId);
      if (trip) return createTripIcon(trip.color);
    }
    return visitedIcon;
  };

  // Focused trip pins for zoom
  const focusedTripPins = useMemo(() => {
    if (!focusTripId) return [];
    return getTripPins(focusTripId);
  }, [focusTripId, getTripPins]);

  // Focused trip photos for zoom
  const focusedTripPhotos = useMemo(() => {
    if (!focusTripId) return [];
    return tripPhotos[focusTripId] || [];
  }, [focusTripId, tripPhotos]);

  // All photo markers to render (all trips or just focused)
  const allPhotoMarkers = useMemo(() => {
    const markers: { photo: GeoPhoto; trip: Trip }[] = [];
    for (const trip of trips) {
      const photos = tripPhotos[trip.id];
      if (!photos) continue;
      for (const photo of photos) {
        markers.push({ photo, trip });
      }
    }
    return markers;
  }, [trips, tripPhotos]);

  const hasAnyContent = pins.length > 0 || dreamDestinations.length > 0 || allPhotoMarkers.length > 0;

  return (
    <div className="relative w-full rounded-xl overflow-hidden shadow-card border border-border">
      <MapContainer
        center={center}
        zoom={2}
        style={{ height: 'clamp(250px, 45vh, 55vh)', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onAddPin={onAddPin} />

        {focusTripId && (focusedTripPins.length > 0 || focusedTripPhotos.length > 0) && (
          <ZoomToTrip tripPins={focusedTripPins} tripPhotos={focusedTripPhotos} />
        )}

        {pins.map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.latitude, pin.longitude]}
            icon={getPinIcon(pin)}
          >
            <Popup>
              <PinPopup
                pin={pin}
                tripName={pin.tripId ? tripMap.get(pin.tripId)?.name : undefined}
              />
            </Popup>
          </Marker>
        ))}

        {/* Geotagged photo markers */}
        {allPhotoMarkers.map(({ photo, trip }) => (
          <Marker
            key={`photo-${photo.id}`}
            position={[photo.latitude, photo.longitude]}
            icon={createPhotoIcon(trip.color, photo.thumbnailUrl)}
          >
            <Popup>
              <PhotoPopup
                photo={photo}
                tripName={trip.name}
                tripColor={trip.color}
              />
            </Popup>
          </Marker>
        ))}

        {dreamDestinations.map((dest) => (
          <Marker
            key={dest.id}
            position={[dest.latitude, dest.longitude]}
            icon={dreamIcon}
          >
            <Popup>
              <DreamPopup dest={dest} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-border text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-sm" />
            {t.adventures.countriesVisited}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
            {t.adventures.dreamDestinations}
          </span>
          {allPhotoMarkers.length > 0 && (
            <span className="flex items-center gap-1.5">
              <Camera size={12} className="text-muted-foreground" />
              {allPhotoMarkers.length} photos
            </span>
          )}
          {isLoadingPhotos && (
            <span className="text-muted-foreground animate-pulse">Loading photos…</span>
          )}
          {trips.length > 0 && trips.slice(0, 3).map(trip => (
            <span key={trip.id} className="flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-3 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: trip.color }}
              />
              {trip.name}
            </span>
          ))}
        </div>
      </div>

      {!hasAnyContent && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="bg-card/80 backdrop-blur-sm rounded-xl px-6 py-4 text-center shadow-md border border-border">
            <Compass size={32} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{t.adventures.noAdventures}</p>
          </div>
        </div>
      )}
    </div>
  );
};
