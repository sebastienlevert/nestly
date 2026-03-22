import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useCalendar } from '../../contexts/CalendarContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLocale } from '../../contexts/LocaleContext';
import type { CreateEventInput } from '../../types/calendar.types';
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

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date;
  initialHour?: number;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  initialDate,
  initialHour = 9,
}) => {
  const { calendars, createEvent, selectedCalendars } = useCalendar();
  const { accounts } = useAuth();
  const { t } = useLocale();

  const availableCalendars = calendars.filter(cal => selectedCalendars.includes(cal.id));

  const getInitialFormData = () => {
    const dateStr = initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    return {
      subject: '',
      body: '',
      startDate: dateStr,
      startTime: `${initialHour.toString().padStart(2, '0')}:00`,
      endDate: dateStr,
      endTime: `${(initialHour + 1).toString().padStart(2, '0')}:00`,
      location: '',
      calendarId: availableCalendars.length > 0 ? availableCalendars[0].id : '',
      accountId: availableCalendars.length > 0 ? availableCalendars[0].accountId : '',
      isAllDay: false,
    };
  };

  const [formData, setFormData] = useState(getInitialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);

  // Reset form when dialog opens with new date
  React.useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData());
      setError(null);
      setShowMore(false);
    }
  }, [isOpen, initialDate]);

  // Update form data when calendars are loaded
  React.useEffect(() => {
    if (availableCalendars.length > 0 && !formData.calendarId) {
      setFormData(prev => ({
        ...prev,
        calendarId: availableCalendars[0].id,
        accountId: availableCalendars[0].accountId,
      }));
    }
  }, [availableCalendars]);

  const handleCalendarChange = (calendarId: string) => {
    const selectedCalendar = calendars.find(cal => cal.id === calendarId);
    if (selectedCalendar) {
      setFormData(prev => ({
        ...prev,
        calendarId,
        accountId: selectedCalendar.accountId,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (calendars.length === 0) {
        throw new Error(t.events.noCalendarsError);
      }

      if (!formData.calendarId || !formData.accountId) {
        throw new Error(t.events.selectCalendarError);
      }

      // Verify the account exists
      const accountExists = accounts.some(acc => acc.homeAccountId === formData.accountId);
      if (!accountExists) {
        throw new Error(t.events.accountNotFoundError);
      }

      let startDateTime: Date;
      let endDateTime: Date;

      if (formData.isAllDay) {
        // For all-day events, use midnight time
        // Microsoft Graph requires end date to be the next day at midnight
        startDateTime = new Date(`${formData.startDate}T00:00:00`);

        // Add one day to the end date for all-day events
        const endDate = new Date(`${formData.endDate}T00:00:00`);
        endDate.setDate(endDate.getDate() + 1);
        endDateTime = endDate;
      } else {
        startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
        endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      }

      if (endDateTime <= startDateTime) {
        throw new Error(t.events.endTimeError);
      }

      const input: CreateEventInput = {
        subject: formData.subject,
        body: formData.body,
        start: startDateTime,
        end: endDateTime,
        location: formData.location,
        isAllDay: formData.isAllDay,
        calendarId: formData.calendarId,
        accountId: formData.accountId,
      };

      await createEvent(input);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.events.createEvent}</DialogTitle>
          <DialogDescription>
            {t.events.addEventDescription}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <DialogBody className="space-y-4">
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}

            {availableCalendars.length === 0 && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-700 dark:text-yellow-400 text-sm">
                {t.events.noCalendarsWarning}
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

            {/* Calendar Selection */}
            <div className="space-y-2">
              <Label htmlFor="calendar">{t.events.calendar} *</Label>
              <select
                id="calendar"
                value={formData.calendarId}
                onChange={e => handleCalendarChange(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                {availableCalendars.map(cal => {
                  const account = accounts.find(acc => acc.homeAccountId === cal.accountId);
                  return (
                    <option key={cal.id} value={cal.id}>
                      {cal.name} ({account?.email || t.events.unknown})
                    </option>
                  );
                })}
              </select>
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

            {/* Expandable section for less important fields */}
            <button
              type="button"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowMore(!showMore)}
            >
              {showMore ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              {t.events.moreOptions}
            </button>

            {showMore && (
              <div className="space-y-4 pl-1">
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
              </div>
            )}
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t.actions.cancel}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || availableCalendars.length === 0}
            >
              {isSubmitting ? t.actions.creating : t.events.createEvent}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
