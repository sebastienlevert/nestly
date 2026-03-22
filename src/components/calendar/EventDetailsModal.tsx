import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { useCalendar } from '../../contexts/CalendarContext';
import { useLocale } from '../../contexts/LocaleContext';
import type { CalendarEvent } from '../../types/calendar.types';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerField } from '@/components/ui/date-picker-field';

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  const { calendars, updateEvent, deleteEvent } = useCalendar();
  const { t } = useLocale();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Populate form data when modal opens with an event
  useEffect(() => {
    if (isOpen && event) {
      const s = new Date(event.start.dateTime);
      const e = new Date(event.end.dateTime);
      setFormData({
        subject: event.subject,
        body: event.bodyPreview || '',
        startDate: s.toISOString().split('T')[0],
        startTime: `${s.getHours().toString().padStart(2, '0')}:${s.getMinutes().toString().padStart(2, '0')}`,
        endDate: e.toISOString().split('T')[0],
        endTime: `${e.getHours().toString().padStart(2, '0')}:${e.getMinutes().toString().padStart(2, '0')}`,
        location: event.location?.displayName || '',
        isAllDay: event.isAllDay,
      });
    }
    if (!isOpen) {
      setError(null);
    }
  }, [isOpen, event]);

  const [formData, setFormData] = useState({
    subject: '',
    body: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    location: '',
    isAllDay: false,
  });

  if (!isOpen || !event) return null;

  const calendar = calendars.find(cal => cal.id === event.calendarId);
  const canEdit = calendar?.canEdit;

  const handleSubmit= async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const newStartDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const newEndDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

      if (newEndDateTime <= newStartDateTime) {
        throw new Error('End time must be after start time');
      }

      await updateEvent(event.id, {
        subject: formData.subject,
        bodyPreview: formData.body,
        start: {
          dateTime: newStartDateTime.toISOString(),
          timeZone: event.start.timeZone,
        },
        end: {
          dateTime: newEndDateTime.toISOString(),
          timeZone: event.end.timeZone,
        },
        location: formData.location ? { displayName: formData.location } : undefined,
        isAllDay: formData.isAllDay,
      });

      onClose();
    } catch (err: any) {
      setError(err.message || t.events.failedToUpdate);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await deleteEvent(event.id, event.accountId);
      setShowDeleteConfirm(false);
      onClose();
    } catch (err: any) {
      setError(err.message || t.events.failedToDelete);
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl">
              {event?.subject || t.events.editEvent}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <DialogBody className="space-y-4">
                {error && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                    {error}
                  </div>
                )}

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">{t.events.title} *</Label>
                  <Input
                    id="title"
                    type="text"
                    value={formData.subject}
                    onChange={e => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder={t.events.eventTitle}
                    required
                  />
                </div>

                {/* All Day Toggle */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allDay"
                    checked={formData.isAllDay}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAllDay: checked as boolean }))}
                  />
                  <Label htmlFor="allDay" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {t.events.allDayEvent}
                  </Label>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t.events.startDate} *</Label>
                    <DatePickerField
                      value={formData.startDate}
                      onChange={v => setFormData(prev => ({ ...prev, startDate: v }))}
                    />
                  </div>

                  {!formData.isAllDay && (
                    <div className="space-y-2">
                      <Label htmlFor="startTime">{t.events.startTime} *</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={e => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t.events.endDate} *</Label>
                    <DatePickerField
                      value={formData.endDate}
                      onChange={v => setFormData(prev => ({ ...prev, endDate: v }))}
                    />
                  </div>

                  {!formData.isAllDay && (
                    <div className="space-y-2">
                      <Label htmlFor="endTime">{t.events.endTime} *</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={e => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                        required
                      />
                    </div>
                  )}
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">{t.events.location}</Label>
                  <Input
                    id="location"
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder={t.events.addLocation}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">{t.events.description}</Label>
                  <Textarea
                    id="description"
                    value={formData.body}
                    onChange={e => setFormData(prev => ({ ...prev, body: e.target.value }))}
                    rows={3}
                    placeholder={t.events.addDescription}
                  />
                </div>
              </DialogBody>

              <DialogFooter className="justify-between">
                {canEdit ? (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isSubmitting || isDeleting}
                  >
                    <Trash2 size={18} />
                    {t.actions.delete}
                  </Button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => onClose()}
                    disabled={isSubmitting}
                  >
                    {t.actions.cancel}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t.actions.saving : t.actions.saveChanges}
                  </Button>
                </div>
              </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title={t.events.deleteEvent}
        message={t.events.deleteEventConfirm.replace('{name}', event.subject)}
        confirmText={t.actions.delete}
        cancelText={t.actions.cancel}
        isLoading={isDeleting}
      />
    </>
  );
};
