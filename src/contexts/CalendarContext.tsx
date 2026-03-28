import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { calendarService } from '../services/calendar.service';
import type { Calendar, CalendarEvent, CreateEventInput, CalendarContextType } from '../types/calendar.types';
import { StorageService } from '../services/storage.service';
import { appConfig } from '../config/app.config';
import { cacheService } from '../services/idb-cache.service';
import { parallelLimit } from '../utils/parallelLimit';
import { dateHelpers } from '../utils/dateHelpers';

const MAX_CONCURRENT = 4;

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

  // Fetch events for a specific date range — one API call per account (fast)
  const fetchEventsForDateRange = async (
    startDate: Date,
    endDate: Date,
    _cals?: Calendar[],
    replace?: boolean
  ): Promise<void> => {
    if (accounts.length === 0) return;

    try {
      // One call per account using the unified calendarView endpoint
      const results = await parallelLimit(
        accounts.map((account) => async () => {
          const accessToken = await getAccessToken(account.homeAccountId);
          return calendarService.getAllEvents(
            accessToken,
            account.homeAccountId,
            startDate,
            endDate
          );
        }),
        MAX_CONCURRENT
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

  // Sync calendars and events from all accounts
  const syncCalendars = useCallback(async () => {
    if (accounts.length === 0) return;

    try {
      setIsSyncing(true);
      setError(null);

      // Fetch calendars from all accounts (max 4 concurrent)
      const allCalendars: Calendar[] = [];
      const calResults = await parallelLimit(
        accounts.map((account) => async () => {
          const accessToken = await getAccessToken(account.homeAccountId);
          return calendarService.getCalendars(accessToken, account.homeAccountId);
        }),
        MAX_CONCURRENT
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

      // Fetch events — cover the full current month grid for instant month view
      const now = new Date();
      const monthGrid = dateHelpers.getMonthCalendarGrid(now);
      const gridStart = dateHelpers.getDayStart(monthGrid[0][0]);
      const gridEnd = dateHelpers.getDayEnd(monthGrid[monthGrid.length - 1][6]);

      const existingRange = fetchedRangeRef.current;
      const rangeStart = existingRange
        ? new Date(Math.min(gridStart.getTime(), existingRange.start.getTime()))
        : gridStart;
      const rangeEnd = existingRange
        ? new Date(Math.max(gridEnd.getTime(), existingRange.end.getTime()))
        : gridEnd;
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

  // Save selected calendars to settings whenever they change
  useEffect(() => {
    const settings = StorageService.getSettings();
    StorageService.setSettings({ ...settings, selectedCalendars });
  }, [selectedCalendars]);

  // Load from IndexedDB cache on mount for instant UI
  useEffect(() => {
    if (accounts.length === 0) return;
    let cancelled = false;
    const accountKey = accounts.map(a => a.homeAccountId).sort().join(',');

    (async () => {
      const [cachedCals, cachedEvts] = await Promise.all([
        cacheService.get<Calendar[]>(`calendars:${accountKey}`),
        cacheService.get<CalendarEvent[]>(`events:${accountKey}`),
      ]);
      if (cancelled) return;
      if (cachedCals) {
        setCalendars(cachedCals.data);
        setSelectedCalendars(prev => prev.length === 0 ? cachedCals.data.map(c => c.id) : prev);
      }
      if (cachedEvts) setEvents(cachedEvts.data);
      if (cachedCals || cachedEvts) setIsLoading(false);
    })();

    return () => { cancelled = true; };
  }, [accounts]);

  // Lightweight refresh: re-fetch only the currently viewed date range and update if changed
  // Uses refs for calendars/accounts to avoid identity changes that would reset the interval
  const calendarsRef = useRef<Calendar[]>([]);
  calendarsRef.current = calendars;
  const accountsRef = useRef(accounts);
  accountsRef.current = accounts;

  const refreshCurrentView = useCallback(async () => {
    const range = fetchedRangeRef.current;
    const accts = accountsRef.current;
    if (!range || accts.length === 0) return;

    try {
      setIsSyncing(true);

      // One call per account using unified calendarView endpoint
      const results = await parallelLimit(
        accts.map((account) => async () => {
          const accessToken = await getAccessToken(account.homeAccountId);
          return calendarService.getAllEvents(
            accessToken,
            account.homeAccountId,
            range.start,
            range.end
          );
        }),
        MAX_CONCURRENT
      );
      const freshEvents = results.flat();

      setEvents(prev => {
        const inRange = prev.filter(e => {
          const s = new Date(e.start.dateTime);
          const en = new Date(e.end.dateTime);
          return s <= range.end && en >= range.start;
        });
        const outsideRange = prev.filter(e => {
          const s = new Date(e.start.dateTime);
          const en = new Date(e.end.dateTime);
          return !(s <= range.end && en >= range.start);
        });

        // Change detection: compare count + sorted fingerprints
        const fingerprint = (evts: CalendarEvent[]) =>
          evts.map(e => `${e.id}|${e.subject}|${e.start.dateTime}|${e.end.dateTime}|${e.isAllDay}|${e.isCancelled}|${e.location?.displayName || ''}`).sort().join('\n');

        if (fingerprint(inRange) === fingerprint(freshEvents)) {
          return prev; // No changes
        }

        // Replace in-range events with fresh data, keep out-of-range
        const merged = [...outsideRange, ...freshEvents];

        // Update cache
        const accountKey = accts.map(a => a.homeAccountId).sort().join(',');
        cacheService.set(`events:${accountKey}`, merged);

        return merged;
      });

      setLastSyncTime(Date.now());
    } catch (err) {
      console.error('Calendar refresh failed:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [getAccessToken]); // stable dep only — reads calendars/accounts from refs

  // Full sync on mount, lightweight refresh every 5 min
  useEffect(() => {
    if (accounts.length === 0) return;

    syncCalendars();

    const intervalId = setInterval(() => {
      refreshCurrentView();
    }, appConfig.calendar.syncInterval);

    return () => clearInterval(intervalId);
  }, [accounts, syncCalendars, refreshCurrentView]);

  // Ensure events are loaded for a given date range, fetching if needed
  const ensureDateRange = useCallback((start: Date, end: Date) => {
    if (calendars.length === 0 || accounts.length === 0) return;

    const range = fetchedRangeRef.current;

    // Already covered
    if (range && start.getTime() >= range.start.getTime() && end.getTime() <= range.end.getTime()) return;

    // If currently fetching, queue the range for later
    if (isFetchingRef.current) {
      const existing = pendingRangeRef.current;
      pendingRangeRef.current = {
        start: existing ? (start < existing.start ? start : existing.start) : start,
        end: existing ? (end > existing.end ? end : existing.end) : end,
      };
      return;
    }

    let fetchStart: Date;
    let fetchEnd: Date;

    if (!range) {
      // No range fetched yet — fetch the full requested range with a month buffer each side
      fetchStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
      fetchEnd = new Date(end.getFullYear(), end.getMonth() + 2, 0);
    } else {
      // Extend existing range as needed
      fetchStart = range.end;
      fetchEnd = range.start;

      // Need to fetch earlier data — extend by an extra month backward
      if (start.getTime() < range.start.getTime()) {
        fetchStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
        fetchEnd = new Date(range.start.getTime() - 1);
      }

      // Need to fetch later data — extend by an extra month forward
      if (end.getTime() > range.end.getTime()) {
        fetchStart = fetchStart.getTime() < range.start.getTime() ? fetchStart : new Date(range.end.getTime() + 1);
        const extendedEnd = new Date(end.getFullYear(), end.getMonth() + 2, 0);
        fetchEnd = extendedEnd;
      }

      // Safety check — if computed range is invalid, bail
      if (fetchStart.getTime() >= fetchEnd.getTime()) return;
    }

    // Extend tracked range immediately to prevent duplicate fetches
    fetchedRangeRef.current = {
      start: range ? (fetchStart < range.start ? fetchStart : range.start) : fetchStart,
      end: range ? (fetchEnd > range.end ? fetchEnd : range.end) : fetchEnd,
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
