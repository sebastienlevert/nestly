import React, { useState, useEffect, useCallback } from 'react';
import { Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { useAdventure } from '../../contexts/AdventureContext';
import { useLocale } from '../../contexts/LocaleContext';
import type { TravelPin } from '../../types/adventure.types';

interface PinEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pin: Omit<TravelPin, 'id' | 'createdAt'>) => void;
  initialLat?: number;
  initialLng?: number;
  editPin?: TravelPin;
}

export const PinEditor: React.FC<PinEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  initialLat,
  initialLng,
  editPin,
}) => {
  const { t } = useLocale();
  const { trips } = useAdventure();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [rating, setRating] = useState(0);
  const [tagsInput, setTagsInput] = useState('');
  const [tripId, setTripId] = useState<string | undefined>();

  useEffect(() => {
    if (editPin) {
      setTitle(editPin.title);
      setDescription(editPin.description);
      setVisitDate(editPin.visitDate);
      setLatitude(editPin.latitude);
      setLongitude(editPin.longitude);
      setRating(editPin.rating);
      setTagsInput(editPin.tags.join(', '));
      setTripId(editPin.tripId);
    } else {
      setTitle('');
      setDescription('');
      setVisitDate(new Date().toISOString().split('T')[0]);
      setLatitude(initialLat ?? 0);
      setLongitude(initialLng ?? 0);
      setRating(0);
      setTagsInput('');
      setTripId(undefined);
    }
  }, [editPin, initialLat, initialLng, isOpen]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim()) return;

      const tags = tagsInput
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      onSave({
        title: title.trim(),
        description: description.trim(),
        visitDate,
        latitude,
        longitude,
        rating,
        tags,
        tripId: tripId || undefined,
        photoFolderId: editPin?.photoFolderId,
        photoFolderName: editPin?.photoFolderName,
        coverPhotoUrl: editPin?.coverPhotoUrl,
      });

      onClose();
    },
    [title, description, visitDate, latitude, longitude, rating, tagsInput, tripId, editPin, onSave, onClose],
  );

  const dialogTitle = editPin ? t.adventures.editPin : t.adventures.addPin;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription className="sr-only">{dialogTitle}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="pin-title">{t.adventures.pinTitle}</Label>
            <Input
              id="pin-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.adventures.pinTitlePlaceholder}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="pin-description">{t.adventures.pinDescription}</Label>
            <Textarea
              id="pin-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.adventures.pinDescriptionPlaceholder}
              rows={3}
            />
          </div>

          {/* Trip assignment */}
          {trips.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="pin-trip">{t.adventures.assignToTrip}</Label>
              <select
                id="pin-trip"
                value={tripId || ''}
                onChange={(e) => setTripId(e.target.value || undefined)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">{t.adventures.noTrip}</option>
                {trips.map(trip => (
                  <option key={trip.id} value={trip.id}>
                    {trip.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Visit date */}
          <div className="space-y-1.5">
            <Label htmlFor="pin-date">{t.adventures.visitDate}</Label>
            <Input
              id="pin-date"
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
            />
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pin-lat">{t.adventures.latitude}</Label>
              <Input
                id="pin-lat"
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pin-lng">{t.adventures.longitude}</Label>
              <Input
                id="pin-lng"
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-1.5">
            <Label>{t.adventures.rating}</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star === rating ? 0 : star)}
                  className="touch-target p-1 rounded-md hover:bg-accent transition-colors"
                  aria-label={`${star} star${star > 1 ? 's' : ''}`}
                >
                  <Star
                    size={24}
                    className={
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="pin-tags">Tags</Label>
            <Input
              id="pin-tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="beach, family, hiking"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              {editPin ? t.adventures.editPin : t.adventures.addPin}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
