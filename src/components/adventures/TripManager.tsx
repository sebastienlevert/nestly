import React, { useState, useCallback } from 'react';
import { Plus, MapPin, Calendar, FolderOpen, Trash2, Edit3, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { useAdventure } from '../../contexts/AdventureContext';
import { useLocale } from '../../contexts/LocaleContext';
import { Button } from '../ui/button';
import { TripEditor } from './TripEditor';
import type { Trip } from '../../types/adventure.types';

interface TripManagerProps {
  onViewTrip?: (trip: Trip) => void;
  onTripCreated?: (tripId: string) => void;
}

export const TripManager: React.FC<TripManagerProps> = ({ onViewTrip, onTripCreated }) => {
  const { trips, pins, deleteTrip } = useAdventure();
  const { t } = useLocale();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | undefined>();
  const [expanded, setExpanded] = useState(true);

  const handleCreate = useCallback(() => {
    setEditingTrip(undefined);
    setEditorOpen(true);
  }, []);

  const handleEdit = useCallback((trip: Trip) => {
    setEditingTrip(trip);
    setEditorOpen(true);
  }, []);

  const handleDelete = useCallback((trip: Trip) => {
    if (window.confirm(t.adventures.deleteTripConfirm)) {
      deleteTrip(trip.id);
    }
  }, [deleteTrip, t]);

  const getPinCount = (tripId: string) => pins.filter(p => p.tripId === tripId).length;

  const formatDateRange = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
    if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
      return `${s.getDate()}–${e.getDate()} ${s.toLocaleDateString(undefined, opts)}`;
    }
    return `${s.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-lg font-semibold text-foreground hover:text-primary transition-colors min-h-[44px]"
        >
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          {t.adventures.trips}
          <span className="text-sm font-normal text-muted-foreground">({trips.length})</span>
        </button>
        <Button onClick={handleCreate} className="gap-1.5 min-h-[44px]">
          <Plus size={16} />
          <span className="hidden sm:inline">{t.adventures.createTrip}</span>
        </Button>
      </div>

      {expanded && (
        <>
          {trips.length === 0 ? (
            <div className="text-center py-8 bg-card rounded-xl border border-border">
              <MapPin size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">{t.adventures.noTrips}</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {trips.map(trip => (
                <div
                  key={trip.id}
                  className="group bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Color strip */}
                  <div className="h-1.5" style={{ backgroundColor: trip.color }} />

                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate">{trip.name}</h4>
                        {trip.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {trip.description}
                          </p>
                        )}
                      </div>
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0 border-2 border-white shadow-sm"
                        style={{ backgroundColor: trip.color }}
                      />
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDateRange(trip.startDate, trip.endDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {getPinCount(trip.id)} {t.adventures.tripPins}
                      </span>
                      {trip.photoFolderName && (
                        <span className="flex items-center gap-1">
                          <ImageIcon size={12} />
                          {trip.photoFolderName}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      {onViewTrip && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewTrip(trip)}
                          className="flex-1 text-xs gap-1"
                        >
                          <FolderOpen size={14} />
                          {t.adventures.viewPhotos}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(trip)}
                        className="touch-target"
                      >
                        <Edit3 size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(trip)}
                        className="touch-target text-destructive hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <TripEditor
        isOpen={editorOpen}
        onClose={() => { setEditorOpen(false); setEditingTrip(undefined); }}
        editTrip={editingTrip}
        onTripCreated={onTripCreated}
      />
    </div>
  );
};
