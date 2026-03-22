import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Users, Trash2, Edit2, Calendar as CalendarIcon, Repeat } from 'lucide-react';
import { useCalendar } from '../../contexts/CalendarContext';
import { useLocale } from '../../contexts/LocaleContext';
import type { CalendarEvent } from '../../types/calendar.types';
import { dateHelpers } from '../../utils/dateHelpers';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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
  const { locale, t } = useLocale();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Reset edit mode when modal closes or event changes
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
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
  const eventColor = calendar?.color || '#0ea5e9';
  const canEdit = calendar?.canEdit;

  const startDate = new Date(event.start.dateTime);
  const endDate = new Date(event.end.dateTime);
  const startTime = dateHelpers.formatTime(event.start.dateTime, locale);
  const endTime = dateHelpers.formatTime(event.end.dateTime, locale);

  const handleEdit = () => {
    setFormData({
      subject: event.subject,
      body: event.bodyPreview || '',
      startDate: startDate.toISOString().split('T')[0],
      startTime: `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`,
      endDate: endDate.toISOString().split('T')[0],
      endTime: `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`,
      location: event.location?.displayName || '',
      isAllDay: event.isAllDay,
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

      setIsEditing(false);
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
              {isEditing ? (event?.subject || t.events.editEvent) : (event?.subject || t.events.eventDetails)}
            </DialogTitle>
            {!isEditing && event && (
              <DialogDescription className="sr-only">
                View details for {event.subject}
              </DialogDescription>
            )}
          </DialogHeader>

          {/* Content */}
          {isEditing ? (
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
                    <Label htmlFor="startDate">{t.events.startDate} *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      required
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
                    <Label htmlFor="endDate">{t.events.endDate} *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      required
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

              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancelEdit}
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
              </DialogFooter>
            </form>
          ) : (
            <DialogBody className="space-y-4">
              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                  {error}
                </div>
              )}

              {/* Action buttons */}
              {canEdit && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleEdit}
                    aria-label="Edit"
                    title="Edit event"
                    className="text-primary hover:bg-primary/10"
                  >
                    <Edit2 size={20} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDelete}
                    aria-label="Delete"
                    title="Delete event"
                    disabled={isDeleting}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 size={20} />
                  </Button>
                </div>
              )}

              {/* Event Title */}
              <div>
                <h3 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  {event.recurrence && <Repeat size={24} />}
                  {event.subject}
                </h3>
              </div>

              {/* Calendar Badge */}
              {calendar && (
                <div className="flex items-center gap-2">
                  <CalendarIcon size={16} className="text-muted-foreground" />
                  <Badge
                    variant="secondary"
                    className="text-xs"
                    style={{
                      backgroundColor: eventColor,
                      color: 'white',
                    }}
                  >
                    {calendar.name}
                  </Badge>
                </div>
              )}

              {/* Date and Time */}
              <div className="flex items-start gap-3">
                <Clock size={20} className="text-muted-foreground mt-0.5" />
                <div>
                  {event.isAllDay ? (
                    <div>
                      <div className="font-medium text-foreground">{t.calendar.allDay}</div>
                      <div className="text-sm text-muted-foreground">
                        {dateHelpers.formatDate(startDate, 'PPP', locale)}
                        {startDate.toDateString() !== endDate.toDateString() && (
                          <> - {dateHelpers.formatDate(endDate, 'PPP', locale)}</>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium text-foreground">
                        {dateHelpers.formatDate(startDate, 'PPP', locale)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {startTime} - {endTime}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              {event.location && event.location.displayName && (
                <div className="flex items-start gap-3">
                  <MapPin size={20} className="text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium text-foreground">{t.events.location}</div>
                    <div className="text-sm text-muted-foreground">{event.location.displayName}</div>
                  </div>
                </div>
              )}

              {/* Organizer */}
              {event.organizer && (
                <div className="flex items-start gap-3">
                  <Users size={20} className="text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium text-foreground">{t.events.organizer}</div>
                    <div className="text-sm text-muted-foreground">
                      {event.organizer.emailAddress.name} ({event.organizer.emailAddress.address})
                    </div>
                  </div>
                </div>
              )}

              {/* Attendees */}
              {event.attendees && event.attendees.length > 0 && (
                <div className="flex items-start gap-3">
                  <Users size={20} className="text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-foreground mb-2">
                      {t.events.attendees} ({event.attendees.length})
                    </div>
                    <div className="space-y-1">
                      {event.attendees.map((attendee, index) => (
                        <div key={index} className="text-sm text-muted-foreground">
                          {attendee.emailAddress.name} ({attendee.emailAddress.address})
                          <span className="text-xs ml-2">
                            {attendee.status.response}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              {event.bodyPreview && (
                <>
                  <Separator />
                  <div>
                    <div className="font-medium text-foreground mb-2">{t.events.description}</div>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {event.bodyPreview}
                    </div>
                  </div>
                </>
              )}

              {/* Status badges */}
              <Separator />
              <div className="flex gap-2">
                {event.isCancelled && (
                  <Badge variant="destructive" className="text-xs">
                    {t.events.cancelled}
                  </Badge>
                )}
                {!canEdit && (
                  <Badge variant="secondary" className="text-xs">
                    {t.events.readOnly}
                  </Badge>
                )}
              </div>
            </DialogBody>
          )}
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
