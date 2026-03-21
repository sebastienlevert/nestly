import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { calendarService } from '../services/calendar.service';
import type { Calendar, CalendarEvent, CreateEventInput, CalendarContextType } from '../types/calendar.types';
import { StorageService } from '../services/storage.service';
import { appConfig } from '../config/app.config';
import { cacheService } from '../services/idb-cache.service';

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};

interface CalendarProviderProps {
  children: ReactNode;
}

export const CalendarProvider: React.FC<CalendarProviderProps> = ({ children }) => {
  const { accounts, getAccessToken } = useAuth();
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>(() => {
    // Load selected calendars from settings on mount
    const settings = StorageService.getSettings();
    return settings.selectedCalendars || [];
  });
  const [_calendarColors, setCalendarColors] = useState<Record<string, string>>(() => {
    const settings = StorageService.getSettings();
    return settings.calendarColors || {};
  });
  const [_calendarEmojis, setCalendarEmojis] = useState<Record<string, string>>(() => {
    const settings = StorageService.getSettings();
    return settings.calendarEmojis || {};
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Track the date range we've already fetched events for
  const fetchedRangeRef = useRef<{ start: Date; end: Date } | null>(null);
  const isFetchingRef = useRef(false);
  const pendingRangeRef = useRef<{ start: Date; end: Date } | null>(null);
  const ensureDateRangeRef = useRef<(start: Date, end: Date) => void>(() => {});

  // Save selected calendars to settings whenever they change
  useEffect(() => {
    const settings = StorageService.getSettings();
    StorageService.setSettings({ ...settings, selectedCalendars });
  }, [selectedCalendars]);

  // Auto-sync on mount and when accounts change
  useEffect(() => {
    if (accounts.length === 0) return;

    let cancelled = false;
    const accountKey = accounts.map(a => a.homeAccountId).sort().join(',');

    // 1. Load from IndexedDB cache first → immediate render
    (async () => {
      const [cachedCals, cachedEvts] = await Promise.all([
        cacheService.get<Calendar[]>(`calendars:${accountKey}`),
        cacheService.get<CalendarEvent[]>(`events:${accountKey}`),
      ]);
      if (cancelled) return;
      if (cachedCals) {
        setCalendars(cachedCals.data);
        if (selectedCalendars.length === 0 && calendars.length === 0) {
          setSelectedCalendars(cachedCals.data.map(c => c.id));
        }
      }
      if (cachedEvts) setEvents(cachedEvts.data);
      if (cachedCals || cachedEvts) setIsLoading(false);

      // 2. Background API sync only AFTER cache has rendered
      syncCalendars();
    })();

    // Set up periodic sync
    const syncInterval = setInterval(() => {
      syncCalendars();
    }, appConfig.calendar.syncInterval);

    return () => { cancelled = true; clearInterval(syncInterval); };
  }, [accounts]);

  // Sync calendars and events from all accounts
  const syncCalendars = useCallback(async () => {
    if (accounts.length === 0) return;

    try {
      setIsSyncing(true);
      setError(null);

      // Fetch calendars from all accounts in parallel
      const allCalendars: Calendar[] = [];
      const calResults = await Promise.all(
        accounts.map(async (account) => {
          const accessToken = await getAccessToken(account.homeAccountId);
          return calendarService.getCalendars(accessToken, account.homeAccountId);
        })
      );
      for (const cals of calResults) allCalendars.push(...cals);

      // Apply user color overrides
      const savedColors = StorageService.getSettings().calendarColors || {};
      const savedEmojis = StorageService.getSettings().calendarEmojis || {};
      for (const cal of allCalendars) {
        if (savedColors[cal.id]) {
          cal.color = savedColors[cal.id];
        }
        if (savedEmojis[cal.id]) {
          cal.emoji = savedEmojis[cal.id];
        }
      }

      setCalendars(allCalendars);

      // Cache calendars
      const accountKey = accounts.map(a => a.homeAccountId).sort().join(',');
      cacheService.set(`calendars:${accountKey}`, allCalendars);

      // Select all calendars if none are currently selected
      setSelectedCalendars(prev => {
        if (prev.length === 0) return allCalendars.map(cal => cal.id);
        return prev;
      });

      // Fetch events - just this week + next week for fast initial load
      const now = new Date();
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const thisMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
      const nextSundayPlus7 = new Date(thisMonday.getTime() + 14 * 24 * 60 * 60 * 1000);

      const existingRange = fetchedRangeRef.current;
      const rangeStart = existingRange
        ? new Date(Math.min(thisMonday.getTime(), existingRange.start.getTime()))
        : thisMonday;
      const rangeEnd = existingRange
        ? new Date(Math.max(nextSundayPlus7.getTime(), existingRange.end.getTime()))
        : nextSundayPlus7;
      await fetchEventsForDateRange(rangeStart, rangeEnd, allCalendars, true);
      fetchedRangeRef.current = { start: rangeStart, end: rangeEnd };

      setLastSyncTime(Date.now());
      // Cache fresh events (read from state updater to get latest)
      setEvents(currentEvents => {
        cacheService.set(`events:${accountKey}`, currentEvents);
        StorageService.setCalendarCache({ calendars: allCalendars, events: currentEvents, timestamp: Date.now() });
        return currentEvents;
      });
    } catch (err) {
      console.error('Calendar sync failed:', err);
      setError('Failed to sync calendars. Please try again.');
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  }, [accounts, getAccessToken]);

  // Fetch events for a specific date range
  const fetchEventsForDateRange = async (
    startDate: Date,
    endDate: Date,
    cals?: Calendar[],
    replace?: boolean
  ): Promise<void> => {
    const calendarsToFetch = cals || calendars;
    if (calendarsToFetch.length === 0 || accounts.length === 0) return;

    try {
      // Fetch events from all calendars in parallel
      const results = await Promise.all(
        calendarsToFetch.map(async (calendar) => {
          const accessToken = await getAccessToken(calendar.accountId);
          return calendarService.getEvents(
            calendar.id,
            accessToken,
            calendar.accountId,
            startDate,
            endDate
          );
        })
      );
      const allEvents = results.flat();

      if (replace) {
        setEvents(allEvents);
      } else {
        // Merge: add new events, avoid duplicates by id
        setEvents(prev => {
          const existingIds = new Set(prev.map(e => e.id));
          const newEvents = allEvents.filter(e => !existingIds.has(e.id));
          return [...prev, ...newEvents];
        });
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
      throw err;
    }
  };

  // Ensure events are loaded for a given date range, fetching if needed
  const ensureDateRange = useCallback((start: Date, end: Date) => {
    const range = fetchedRangeRef.current;
    if (!range || calendars.length === 0 || accounts.length === 0) return;

    // Already covered
    if (start >= range.start && end <= range.end) return;

    // If currently fetching, queue the range for later
    if (isFetchingRef.current) {
      const existing = pendingRangeRef.current;
      pendingRangeRef.current = {
        start: existing ? (start < existing.start ? start : existing.start) : start,
        end: existing ? (end > existing.end ? end : existing.end) : end,
      };
      return;
    }

    let fetchStart: Date | null = null;
    let fetchEnd: Date | null = null;

    // Need to fetch earlier data — extend by an extra month backward
    if (start < range.start) {
      fetchStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
      fetchEnd = new Date(range.start.getTime() - 1);
    }

    // Need to fetch later data — extend by an extra month forward
    if (end > range.end) {
      fetchStart = fetchStart || new Date(range.end.getTime() + 1);
      const extendedEnd = new Date(end.getFullYear(), end.getMonth() + 2, 0);
      fetchEnd = extendedEnd;
    }

    if (fetchStart && fetchEnd) {
      // Extend tracked range immediately to prevent duplicate fetches
      fetchedRangeRef.current = {
        start: fetchStart < range.start ? fetchStart : range.start,
        end: fetchEnd > range.end ? fetchEnd : range.end,
      };

      isFetchingRef.current = true;
      setIsSyncing(true);

      fetchEventsForDateRange(fetchStart, fetchEnd)
        .catch(err => console.error('Failed to load additional events:', err))
        .finally(() => {
          isFetchingRef.current = false;

          // Process any queued range request
          const pending = pendingRangeRef.current;
          if (pending) {
            pendingRangeRef.current = null;
            ensureDateRangeRef.current(pending.start, pending.end);
          } else {
            setIsSyncing(false);
          }
        });
    }
  }, [calendars, accounts, getAccessToken]);

  // Keep ref in sync so async callbacks always call the latest version
  ensureDateRangeRef.current = ensureDateRange;

  // Create a new event
  const createEvent = async (input: CreateEventInput): Promise<CalendarEvent> => {
    try {
      const accessToken = await getAccessToken(input.accountId);
      const newEvent = await calendarService.createEvent(input, accessToken);

      // Add to local state
      setEvents(prev => [...prev, newEvent]);

      return newEvent;
    } catch (err) {
      console.error('Failed to create event:', err);
      throw new Error('Failed to create event. Please try again.');
    }
  };

  // Update an existing event
  const updateEvent = async (eventId: string, updates: Partial<CalendarEvent>): Promise<void> => {
    try {
      const event = events.find(e => e.id === eventId);
      if (!event) throw new Error('Event not found');

      const accessToken = await getAccessToken(event.accountId);
      await calendarService.updateEvent(eventId, updates, accessToken);

      // Update local state
      setEvents(prev =>
        prev.map(e => (e.id === eventId ? { ...e, ...updates } : e))
      );
    } catch (err) {
      console.error('Failed to update event:', err);
      throw new Error('Failed to update event. Please try again.');
    }
  };

  // Delete an event
  const deleteEvent = async (eventId: string, accountId: string): Promise<void> => {
    try {
      const accessToken = await getAccessToken(accountId);
      await calendarService.deleteEvent(eventId, accessToken);

      // Remove from local state
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (err) {
      console.error('Failed to delete event:', err);
      throw new Error('Failed to delete event. Please try again.');
    }
  };

  // Toggle calendar visibility
  const toggleCalendar = (calendarId: string) => {
    setSelectedCalendars(prev =>
      prev.includes(calendarId)
        ? prev.filter(id => id !== calendarId)
        : [...prev, calendarId]
    );
  };

  // Set a custom color for a calendar
  const setCalendarColorFn = useCallback((calendarId: string, color: string) => {
    setCalendarColors(prev => {
      const updated = { ...prev, [calendarId]: color };
      const settings = StorageService.getSettings();
      StorageService.setSettings({ ...settings, calendarColors: updated });
      return updated;
    });
    setCalendars(prev => prev.map(cal =>
      cal.id === calendarId ? { ...cal, color } : cal
    ));
  }, []);

  // Set a custom emoji for a calendar
  const setCalendarEmojiFn = useCallback((calendarId: string, emoji: string) => {
    setCalendarEmojis(prev => {
      const updated = { ...prev };
      if (emoji) {
        updated[calendarId] = emoji;
      } else {
        delete updated[calendarId];
      }
      const settings = StorageService.getSettings();
      StorageService.setSettings({ ...settings, calendarEmojis: updated });
      return updated;
    });
    setCalendars(prev => prev.map(cal =>
      cal.id === calendarId ? { ...cal, emoji: emoji || undefined } : cal
    ));
  }, []);

  // Get events for a specific date range (filtered by selected calendars)
  const getEventsForDateRange = (startDate: Date, endDate: Date): CalendarEvent[] => {
    return events.filter(event => {
      if (!selectedCalendars.includes(event.calendarId)) return false;

      const eventStart = new Date(event.start.dateTime);
      const eventEnd = new Date(event.end.dateTime);

      return eventStart <= endDate && eventEnd >= startDate;
    });
  };

  const value: CalendarContextType = {
    calendars,
    events: events.filter(e => selectedCalendars.includes(e.calendarId)),
    isLoading,
    isSyncing,
    lastSyncTime,
    error,
    selectedCalendars,
    syncCalendars,
    createEvent,
    updateEvent,
    deleteEvent,
    toggleCalendar,
    setCalendarColor: setCalendarColorFn,
    setCalendarEmoji: setCalendarEmojiFn,
    getEventsForDateRange,
    ensureDateRange,
  };

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
};
