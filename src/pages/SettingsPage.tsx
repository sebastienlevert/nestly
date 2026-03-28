import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Save, Users, Calendar as CalendarIcon, CheckSquare, Sliders, ChevronDown, Check, Sparkles } from 'lucide-react';
import { AccountManager } from '../components/auth/AccountManager';
import { useAuth } from '../contexts/AuthContext';
import { useCalendar } from '../contexts/CalendarContext';
import { useTask } from '../contexts/TaskContext';
import { useLocale } from '../contexts/LocaleContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { localeNames, type Locale } from '../locales';
import { themes, type ThemeName } from '../config/themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { loadOpenAIConfig, saveOpenAIConfig } from '../services/openai.service';
import type { OpenAIConfig } from '../services/openai.service';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type SettingsTab = 'accounts' | 'calendars' | 'todos' | 'general' | 'ai';

export const SettingsPage: React.FC = () => {
  const { reloadAccounts, accounts } = useAuth();
  const { calendars, selectedCalendars, toggleCalendar, setCalendarColor, setCalendarEmoji } = useCalendar();
  const { lists: todoLists, selectedLists: selectedTodoLists, toggleList, listSettings, setListSettings } = useTask();
  const { locale, setLocale, t } = useLocale();
  const { themeName, setTheme } = useTheme();
  const { settings: appSettings, updateSettings, saveSettings: saveToCloud, isSyncing: isCloudSyncing } = useSettings();
  const [activeTab, setActiveTab] = useState<SettingsTab>('accounts');
  const [calendarName, setCalendarName] = useState('');
  const [selectedLocale, setSelectedLocale] = useState<Locale>(locale);
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>(themeName);
  const [isSaved, setIsSaved] = useState(false);
  const [colorPickerCalendarId, setColorPickerCalendarId] = useState<string | null>(null);
  const [emojiPickerCalendarId, setEmojiPickerCalendarId] = useState<string | null>(null);
  const [popupDirection, setPopupDirection] = useState<'down' | 'up'>('down');
  const [mealCalendarId, setMealCalendarId] = useState<string>('');
  const [weatherLocation, setWeatherLocation] = useState<string>('');
  const [aiConfig, setAiConfig] = useState<OpenAIConfig>({ endpoint: '', apiKey: '', deployment: '' });
  const [aiConfigSaved, setAiConfigSaved] = useState(false);  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Close pickers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerCalendarId && emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setEmojiPickerCalendarId(null);
      }
      if (colorPickerCalendarId && colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setColorPickerCalendarId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [emojiPickerCalendarId, colorPickerCalendarId]);

  // Measure available space and flip popup if needed
  const popupRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const rect = node.getBoundingClientRect();
    if (rect.bottom > window.innerHeight) {
      setPopupDirection('up');
    } else {
      setPopupDirection('down');
    }
  }, []);

  const EMOJI_PALETTE = [
    '📅', '💼', '👨‍👩‍👧‍👦', '🏠', '🎉', '🏋️', '📚', '🎮',
    '✈️', '🎂', '❤️', '⚽', '🎵', '🍽️', '💊', '🐾',
    '👶', '🏫', '⛪', '🧑‍💻', '🎯', '🌟', '🔔', '📧',
    '🍳', '🥗', '🍕', '🧁', '☕', '🛒', '🎨', '🏖️',
    '🧘', '🎓', '🩺',
  ];

  const COLOR_PALETTE = [
    '#3b82f6', '#2563eb', '#1d4ed8', // Blues
    '#8b5cf6', '#7c3aed', '#a855f7', // Purples
    '#ec4899', '#f43f5e', '#ef4444', // Pinks/Reds
    '#f97316', '#f59e0b', '#eab308', // Oranges/Yellows
    '#22c55e', '#16a34a', '#10b981', // Greens
    '#14b8a6', '#06b6d4', '#0ea5e9', // Teals/Cyans
    '#6366f1', '#64748b',            // Indigo/Slate
  ];

  useEffect(() => {
    reloadAccounts();

    // Load from context settings (already synced from OneDrive/cache)
    setCalendarName(appSettings.calendarName || t.settings.appName);
    setSelectedLocale(appSettings.locale || 'en');
    setSelectedTheme(appSettings.theme || themeName);
    setMealCalendarId(appSettings.mealCalendarId || '');
    setWeatherLocation(appSettings.weatherLocation || '');
    setAiConfig(loadOpenAIConfig());
  }, [t, appSettings]);

  const handleSaveSettings = async () => {
    const updated = {
      ...appSettings,
      calendarName,
      locale: selectedLocale,
      theme: selectedTheme,
      mealCalendarId: mealCalendarId || undefined,
      weatherLocation: weatherLocation || undefined,
    };
    updateSettings(updated);
    setLocale(selectedLocale);
    setTheme(selectedTheme);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);

    // Save to OneDrive
    await saveToCloud();

    window.dispatchEvent(new CustomEvent('settings-updated'));
  };

  const handleLocaleChange = (newLocale: Locale) => {
    setSelectedLocale(newLocale);
  };

  const handleThemeChange = (newTheme: ThemeName) => {
    setSelectedTheme(newTheme);
    // Apply theme immediately for live preview
    setTheme(newTheme);
  };

  // Group calendars by owner name
  const calendarsByOwner = calendars.reduce<Record<string, typeof calendars>>((groups, cal) => {
    const ownerName = cal.owner?.name || 'Unknown';
    if (!groups[ownerName]) groups[ownerName] = [];
    groups[ownerName].push(cal);
    return groups;
  }, {});

  const tabs = [
    { id: 'accounts' as SettingsTab, label: t.tabs.accounts, icon: Users },
    { id: 'calendars' as SettingsTab, label: t.tabs.calendars, icon: CalendarIcon },
    { id: 'todos' as SettingsTab, label: t.tabs.todos, icon: CheckSquare },
    { id: 'ai' as SettingsTab, label: t.tabs.ai, icon: Sparkles },
    { id: 'general' as SettingsTab, label: t.tabs.general, icon: Sliders },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header — same layout as calendar */}
      <div className="bg-card border-b border-border">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 px-3 sm:px-5 py-3">
          {/* Section dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 min-w-[160px] h-10 sm:h-11">
                {(() => { const tab = tabs.find(t => t.id === activeTab); const Icon = tab!.icon; return <Icon size={18} />; })()}
                <span className="text-sm sm:text-base font-medium">{tabs.find(t => t.id === activeTab)?.label}</span>
                <ChevronDown size={18} className="text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <DropdownMenuItem
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex items-center justify-between cursor-pointer py-3 text-base"
                  >
                    <span className="flex items-center gap-2">
                      <Icon size={16} />
                      {tab.label}
                    </span>
                    {activeTab === tab.id && (
                      <Check size={16} className="text-primary" />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Spacer */}
          <div className="flex-1 min-w-0" />

          {/* Save button */}
          <Button
            onClick={handleSaveSettings}
            disabled={isCloudSyncing}
            className={`flex items-center gap-2 ${
              isSaved ? 'bg-green-600 hover:bg-green-700' : ''
            }`}
          >
            <Save size={18} />
            {isSaved ? t.actions.saved : t.actions.save}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3 sm:p-6">
        {activeTab === 'accounts' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">{t.auth.microsoftAccounts}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t.auth.microsoftAccountsHelp}
              </p>
            </div>
            <AccountManager />
          </div>
        )}

        {activeTab === 'calendars' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">{t.settings.calendarSync}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t.settings.calendarSyncHelp}
              </p>
            </div>

            {/* Calendar List — grouped by owner */}
            <Card>
              <CardContent className="pt-6">
                {Object.keys(calendarsByOwner).length > 0 ? (
                  <div className="space-y-6">
                    {Object.entries(calendarsByOwner).map(([ownerName, ownerCalendars]) => (
                      <div key={ownerName}>
                        <div className="text-sm font-semibold text-muted-foreground mb-2">{ownerName}</div>
                        <div className="space-y-2">
                          {ownerCalendars.map((calendar) => (
                            <label
                              key={calendar.id}
                              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                            >
                              <Checkbox
                                checked={selectedCalendars.includes(calendar.id)}
                                onCheckedChange={() => toggleCalendar(calendar.id)}
                              />
                              <div className="flex-1">
                                <div className="font-medium text-foreground">{calendar.name}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="relative" ref={emojiPickerCalendarId === calendar.id ? emojiPickerRef : undefined}>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setEmojiPickerCalendarId(prev => prev === calendar.id ? null : calendar.id);
                                      setColorPickerCalendarId(null);
                                    }}
                                    className="w-7 h-7 rounded border border-muted-foreground/30 hover:border-foreground/50 transition-colors flex items-center justify-center text-sm bg-muted/50"
                                    title={t.settings.changeEmoji || 'Set emoji'}
                                  >
                                    {calendar.emoji || <span className="text-muted-foreground/50">—</span>}
                                  </button>
                                  {emojiPickerCalendarId === calendar.id && (
                                    <div
                                      ref={popupRef}
                                      className={`absolute right-0 z-50 bg-popover border rounded-lg shadow-lg p-3 w-64 ${popupDirection === 'up' ? 'bottom-9' : 'top-9'}`}
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                    >
                                      <div className="grid grid-cols-6 gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setCalendarEmoji(calendar.id, '');
                                            setEmojiPickerCalendarId(null);
                                          }}
                                          className={`w-9 h-9 rounded-lg border transition-transform hover:scale-110 flex items-center justify-center text-xs ${
                                            !calendar.emoji ? 'border-foreground bg-muted ring-2 ring-foreground/20' : 'border-transparent hover:bg-muted/50'
                                          }`}
                                          title={t.settings.removeEmoji}
                                        >
                                          <span className="text-muted-foreground">✕</span>
                                        </button>
                                        {EMOJI_PALETTE.map((emoji) => (
                                          <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => {
                                              setCalendarEmoji(calendar.id, emoji);
                                              setEmojiPickerCalendarId(null);
                                            }}
                                            className={`w-9 h-9 rounded-lg border transition-transform hover:scale-110 flex items-center justify-center text-lg ${
                                              calendar.emoji === emoji ? 'border-foreground bg-muted ring-2 ring-foreground/20' : 'border-transparent hover:bg-muted/50'
                                            }`}
                                          >
                                            {emoji}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="relative" ref={colorPickerCalendarId === calendar.id ? colorPickerRef : undefined}>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setColorPickerCalendarId(prev => prev === calendar.id ? null : calendar.id);
                                      setEmojiPickerCalendarId(null);
                                    }}
                                    className="w-7 h-7 rounded-full border-2 border-muted-foreground/30 hover:border-foreground/50 transition-colors"
                                    style={{ backgroundColor: calendar.color }}
                                    title={t.settings.changeColor}
                                  />
                                  {colorPickerCalendarId === calendar.id && (
                                    <div
                                      ref={popupRef}
                                      className={`absolute right-0 z-50 bg-popover border rounded-lg shadow-lg p-3 grid grid-cols-5 gap-2 w-56 ${popupDirection === 'up' ? 'bottom-9' : 'top-9'}`}
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                    >
                                      {COLOR_PALETTE.map((color) => (
                                        <button
                                          key={color}
                                          type="button"
                                          onClick={() => {
                                            setCalendarColor(calendar.id, color);
                                            setColorPickerCalendarId(null);
                                          }}
                                          className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                                            calendar.color === color ? 'border-foreground ring-2 ring-foreground/20' : 'border-transparent'
                                          }`}
                                          style={{ backgroundColor: color }}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic py-4 text-center">
                    {t.settings.noCalendars}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Meal Calendar Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t.mealPlanner?.mealCalendar || 'Meal Calendar'}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {t.mealPlanner?.mealCalendarHelp || 'Select which calendar to use for meal planning events.'}
                </p>
                <select
                  value={mealCalendarId}
                  onChange={(e) => setMealCalendarId(e.target.value)}
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">{t.mealPlanner?.none || 'None'}</option>
                  {calendars.map((cal) => (
                    <option key={cal.id} value={cal.id}>
                      {cal.emoji ? `${cal.emoji} ` : ''}{cal.name}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>

            {/* Weather Location */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t.settings.weatherLocation}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {t.settings.weatherLocationHelp}
                </p>
                <Input
                  value={weatherLocation}
                  onChange={(e) => setWeatherLocation(e.target.value)}
                  placeholder={t.settings.weatherLocationPlaceholder}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {!weatherLocation && (t.settings.weatherLocationDetect)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'todos' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">{t.todos.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t.todos.description}
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t.todos.selectLists}</CardTitle>
                <p className="text-sm text-muted-foreground">{t.todos.selectListsHelp}</p>
              </CardHeader>
              <CardContent>
                {todoLists.length > 0 ? (
                  <div className="space-y-4">
                    {todoLists.map((list) => {
                      const account = accounts.find(acc => acc.homeAccountId === list.accountId);
                      const settings = listSettings[list.id] || { allowTopLevelEdit: true };
                      return (
                        <div key={list.id} className="border rounded-lg p-4 space-y-3">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <Checkbox
                              checked={selectedTodoLists.includes(list.id)}
                              onCheckedChange={() => toggleList(list.id)}
                            />
                            <div className="flex-1">
                              <div className="font-medium text-foreground">{list.displayName}</div>
                              {account && (
                                <div className="text-xs text-muted-foreground">{account.username}</div>
                              )}
                            </div>
                          </label>
                          {selectedTodoLists.includes(list.id) && (
                            <label className="flex items-center gap-3 pl-8 cursor-pointer">
                              <Checkbox
                                checked={settings.allowTopLevelEdit}
                                onCheckedChange={(checked) =>
                                  setListSettings(list.id, { ...settings, allowTopLevelEdit: checked as boolean })
                                }
                              />
                              <div>
                                <div className="text-sm font-medium text-foreground">{t.todos.allowTopLevelEdit}</div>
                                <div className="text-xs text-muted-foreground">{t.todos.allowTopLevelEditHelp}</div>
                              </div>
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic py-4 text-center">
                    {t.todos.noLists}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles size={20} className="text-amber-500" />
                  {t.mealPlanner?.configureAI || 'AI Configuration'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  {t.mealPlanner?.configureAIDesc || 'Enter your Azure OpenAI credentials to enable AI features like the Imagine meal generator.'}
                </p>

                <div className="space-y-2">
                  <Label htmlFor="ai-endpoint">{t.mealPlanner?.aiEndpoint || 'Endpoint'}</Label>
                  <Input
                    id="ai-endpoint"
                    type="url"
                    value={aiConfig.endpoint}
                    onChange={e => setAiConfig(c => ({ ...c, endpoint: e.target.value }))}
                    placeholder={t.mealPlanner?.aiEndpointPlaceholder || 'https://your-resource.openai.azure.com'}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t.mealPlanner?.aiEndpointHelp || 'The base URL of your Azure OpenAI resource.'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ai-key">{t.mealPlanner?.aiKey || 'API Key'}</Label>
                  <Input
                    id="ai-key"
                    type="password"
                    value={aiConfig.apiKey}
                    onChange={e => setAiConfig(c => ({ ...c, apiKey: e.target.value }))}
                    placeholder={t.mealPlanner?.aiKeyPlaceholder || 'Your API key'}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t.mealPlanner?.aiKeyHelp || 'Your API key is stored locally in your browser only.'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ai-deployment">{t.mealPlanner?.aiDeployment || 'Deployment name'}</Label>
                  <Input
                    id="ai-deployment"
                    value={aiConfig.deployment}
                    onChange={e => setAiConfig(c => ({ ...c, deployment: e.target.value }))}
                    placeholder={t.mealPlanner?.aiDeploymentPlaceholder || 'gpt-4o'}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t.mealPlanner?.aiDeploymentHelp || 'The name of your model deployment (e.g. gpt-4o, gpt-4o-mini).'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => {
                      saveOpenAIConfig(aiConfig);
                      setAiConfigSaved(true);
                      setTimeout(() => setAiConfigSaved(false), 2000);
                    }}
                    disabled={!aiConfig.endpoint || !aiConfig.apiKey || !aiConfig.deployment}
                  >
                    {aiConfigSaved ? (
                      <><Check size={16} className="mr-2" />{t.mealPlanner?.aiConfigSaved || 'Saved!'}</>
                    ) : (
                      <><Save size={16} className="mr-2" />{t.actions?.save || 'Save'}</>
                    )}
                  </Button>
                  {aiConfig.endpoint && aiConfig.apiKey && aiConfig.deployment && !aiConfigSaved && (
                    <span className="text-xs text-muted-foreground">
                      {t.mealPlanner?.aiConfigSaved ? '' : ''}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'general' && (
          <div className="space-y-6">
            {/* App Settings */}
            <Card>
              <CardHeader>
                <CardTitle>{t.settings.applicationSettings}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="calendarName">{t.settings.calendarName}</Label>
                  <Input
                    type="text"
                    id="calendarName"
                    value={calendarName}
                    onChange={(e) => setCalendarName(e.target.value)}
                    placeholder={t.settings.calendarNamePlaceholder}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t.settings.calendarNameHelp}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">{t.settings.languageLabel}</Label>
                  <select
                    id="language"
                    value={selectedLocale}
                    onChange={(e) => handleLocaleChange(e.target.value as Locale)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {Object.entries(localeNames).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    {t.settings.languageHelp}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>{t.settings.theme}</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(themes).map(([key, theme]) => {
                      const isSelected = selectedTheme === key;
                      return (
                        <Button
                          key={key}
                          variant="outline"
                          onClick={() => handleThemeChange(key as ThemeName)}
                          className={`p-4 h-auto ${
                            isSelected
                              ? 'border-primary bg-primary/10'
                              : 'hover:bg-muted'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex-shrink-0"
                              style={{ backgroundColor: `hsl(${theme.colors.primary})` }}
                            />
                            <div className="text-left">
                              <div className={`font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                {theme.label}
                              </div>
                            </div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t.settings.themeHelp}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* App Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t.settings.about}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">{t.settings.appName}</strong> - {t.settings.appDescription}
                </p>
                <p>{t.settings.version} 1.0.0</p>
                <Separator className="my-4" />
                <p className="text-xs">
                  {t.settings.aboutDescription}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
