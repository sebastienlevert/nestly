import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { translations, type Locale } from '../locales';
import type { TranslationKeys } from '../locales/en';
import { StorageService } from '../services/storage.service';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationKeys;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
};

interface LocaleProviderProps {
  children: ReactNode;
}

const LOCALE_STORAGE_KEY = 'nestly_selected_locale';

export const LocaleProvider: React.FC<LocaleProviderProps> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    // Load locale from its own dedicated key (immune to settings race conditions)
    try {
      const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
      if (saved && translations[saved]) return saved;
    } catch { /* ignore */ }
    // Migrate from legacy planner_settings
    const settings = StorageService.getSettings();
    return settings.locale || 'en';
  });

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    // Write to dedicated key — cannot be overwritten by other contexts
    try { localStorage.setItem(LOCALE_STORAGE_KEY, newLocale); } catch { /* ignore */ }
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('locale-changed'));
  };

  const value: LocaleContextType = {
    locale,
    setLocale,
    t: translations[locale],
  };

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};
