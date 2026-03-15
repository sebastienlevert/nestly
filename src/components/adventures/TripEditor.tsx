import React, { useState, useEffect, useCallback } from 'react';
import { FolderOpen, Check } from 'lucide-react';
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
import { GenericFolderPicker } from './GenericFolderPicker';
import type { Trip } from '../../types/adventure.types';

const TRIP_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b',
];

interface TripEditorProps {
  isOpen: boolean;
  onClose: () => void;
  editTrip?: Trip;
  onTripCreated?: (tripId: string) => void;
}

export const TripEditor: React.FC<TripEditorProps> = ({ isOpen, onClose, editTrip, onTripCreated }) => {
  const { addTrip, updateTrip } = useAdventure();
  const { t } = useLocale();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [color, setColor] = useState(TRIP_COLORS[0]);
  const [photoFolderId, setPhotoFolderId] = useState<string | undefined>();
  const [photoFolderName, setPhotoFolderName] = useState<string | undefined>();
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);

  useEffect(() => {
    if (editTrip) {
      setName(editTrip.name);
      setDescription(editTrip.description);
      setStartDate(editTrip.startDate);
      setEndDate(editTrip.endDate);
      setColor(editTrip.color);
      setPhotoFolderId(editTrip.photoFolderId);
      setPhotoFolderName(editTrip.photoFolderName);
    } else {
      setName('');
      setDescription('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate(new Date().toISOString().split('T')[0]);
      setColor(TRIP_COLORS[0]);
      setPhotoFolderId(undefined);
      setPhotoFolderName(undefined);
    }
  }, [editTrip, isOpen]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;

      const tripData = {
        name: name.trim(),
        description: description.trim(),
        startDate,
        endDate,
        color,
        photoFolderId,
        photoFolderName,
      };

      if (editTrip) {
        updateTrip(editTrip.id, tripData);
      } else {
        const newId = addTrip(tripData);
        onTripCreated?.(newId);
      }
      onClose();
    },
    [name, description, startDate, endDate, color, photoFolderId, photoFolderName, editTrip, addTrip, updateTrip, onClose],
  );

  const handleFolderSelect = useCallback((folderId: string, folderName: string) => {
    setPhotoFolderId(folderId);
    setPhotoFolderName(folderName);
    setFolderPickerOpen(false);
  }, []);

  const dialogTitle = editTrip ? t.adventures.editTrip : t.adventures.createTrip;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription className="sr-only">{dialogTitle}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="trip-name">{t.adventures.tripName}</Label>
              <Input
                id="trip-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.adventures.tripNamePlaceholder}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="trip-desc">{t.adventures.tripDescription}</Label>
              <Textarea
                id="trip-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.adventures.tripDescriptionPlaceholder}
                rows={2}
              />
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="trip-start">{t.adventures.startDate}</Label>
                <Input
                  id="trip-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="trip-end">{t.adventures.endDate}</Label>
                <Input
                  id="trip-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Color picker */}
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {TRIP_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center"
                    style={{
                      backgroundColor: c,
                      borderColor: color === c ? 'white' : 'transparent',
                      boxShadow: color === c ? `0 0 0 2px ${c}` : 'none',
                    }}
                  >
                    {color === c && <Check size={14} className="text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo folder */}
            <div className="space-y-1.5">
              <Label>{t.adventures.selectPhotoFolder}</Label>
              {photoFolderName ? (
                <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg border border-border">
                  <FolderOpen size={18} className="text-primary flex-shrink-0" />
                  <span className="text-sm text-foreground flex-1 truncate">{photoFolderName}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFolderPickerOpen(true)}
                  >
                    {t.adventures.changeFolder}
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFolderPickerOpen(true)}
                  className="w-full justify-start gap-2"
                >
                  <FolderOpen size={16} />
                  {t.adventures.selectPhotoFolder}
                </Button>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim()}>
                {editTrip ? t.adventures.editTrip : t.adventures.createTrip}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <GenericFolderPicker
        isOpen={folderPickerOpen}
        onClose={() => setFolderPickerOpen(false)}
        onSelect={handleFolderSelect}
      />
    </>
  );
};
