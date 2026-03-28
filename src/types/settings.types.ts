import type { Locale } from '../locales';
import type { ThemeName } from '../config/themes';
import type { TodoListSettings } from './task.types';
import type { OpenAIConfig } from '../services/openai.service';

export interface AppSettings {
  calendarName?: string;
  locale?: Locale;
  theme?: ThemeName;
  selectedCalendars?: string[];
  calendarColors?: Record<string, string>;
  calendarEmojis?: Record<string, string>;
  selectedTodoLists?: string[];
  todoListSettings?: Record<string, TodoListSettings>;
  mealCalendarId?: string;
  weatherLocation?: string;
  openaiConfig?: OpenAIConfig;
}
