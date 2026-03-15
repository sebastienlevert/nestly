export const appConfig = {
  // Microsoft OAuth Configuration
  microsoft: {
    clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID || '',
    redirectUri: import.meta.env.VITE_MICROSOFT_REDIRECT_URI || 'http://localhost:5173/auth/callback',
    scopes: [
      'User.Read',
      'Calendars.ReadWrite',
      'Calendars.ReadWrite.Shared',
      'Files.ReadWrite',
      'Tasks.ReadWrite',
      'offline_access',
    ],
    authority: 'https://login.microsoftonline.com/consumers',
  },

  // Azure OpenAI Configuration
  openai: {
    endpoint: import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || '',
    apiKey: import.meta.env.VITE_AZURE_OPENAI_KEY || '',
    deployment: import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT || '',
    apiVersion: '2024-08-01-preview',
  },

  // Microsoft Graph API
  graph: {
    baseUrl: 'https://graph.microsoft.com/v1.0',
    betaUrl: 'https://graph.microsoft.com/beta',
  },

  // App Settings
  calendar: {
    syncInterval: parseInt(import.meta.env.VITE_CALENDAR_SYNC_INTERVAL || '1800000', 10), // 30 minutes
    defaultView: 'week' as const,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  },

  photos: {
    slideshowInterval: parseInt(import.meta.env.VITE_PHOTO_SLIDESHOW_INTERVAL || '10000', 10), // 10 seconds
    transitionDuration: 1000, // 1 second
    supportedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  },

  storage: {
    keys: {
      auth: 'planner_auth_accounts',
      calendarCache: 'planner_calendar_cache',
      photoFolder: 'planner_photo_folder',
      fridgeInventory: 'planner_fridge_inventory',
      savedRecipes: 'planner_saved_recipes',
      settings: 'planner_settings',
      adventurePins: 'planner_adventure_pins',
      adventureTrips: 'planner_adventure_trips',
      dreamDestinations: 'planner_dream_destinations',
      loveNotes: 'planner_love_notes',
      gratitudeEntries: 'planner_gratitude_entries',
      dailySpark: 'planner_daily_spark',
      memoryCache: 'planner_memory_cache',
      boardGames: 'planner_board_games',
      funNightHistory: 'planner_fun_night_history',
    },
  },

  // Wake Lock Settings
  wakeLock: {
    enabled: true,
    inactivityTimeout: 300000, // 5 minutes
  },
};

export type AppConfig = typeof appConfig;
