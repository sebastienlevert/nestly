import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Settings as SettingsIcon, Save, Users, Calendar as CalendarIcon, CheckSquare, Sliders, Image as ImageIcon, FolderOpen } from 'lucide-react';
import { AccountManager } from '../components/auth/AccountManager';
import { useAuth } from '../contexts/AuthContext';
import { useCalendar } from '../contexts/CalendarContext';
import { useTask } from '../contexts/TaskContext';
import { usePhoto } from '../contexts/PhotoContext';
import { useLocale } from '../contexts/LocaleContext';
import { useTheme } from '../contexts/ThemeContext';
import { StorageService } from '../services/storage.service';
import { localeNames, type Locale } from '../locales';
import { themes, type ThemeName } from '../config/themes';
import { FolderPicker } from '../components/photos/FolderPicker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

type SettingsTab = 'accounts' | 'calendars' | 'todos' | 'photos' | 'general';

export const SettingsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { reloadAccounts, accounts } = useAuth();
  const { calendars, selectedCalendars, toggleCalendar, setCalendarColor } = useCalendar();
  const { lists: todoLists, selectedLists: selectedTodoLists, toggleList, listSettings, setListSettings } = useTask();
  const { selectedFolderName } = usePhoto();
  const { locale, setLocale, t } = useLocale();
  const { themeName, setTheme } = useTheme();
  const tabParam = searchParams.get('tab');
  const validTabs = ['accounts', 'calendars', 'todos', 'photos', 'general'];
  const initialTab = (tabParam && validTabs.includes(tabParam) ? tabParam : 'accounts') as SettingsTab;
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [calendarName, setCalendarName] = useState('');
  const [selectedLocale, setSelectedLocale] = useState<Locale>(locale);
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>(themeName);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>('all');
  const [colorPickerCalendarId, setColorPickerCalendarId] = useState<string | null>(null);
  const [isFolderPickerOpen, setIsFolderPickerOpen] = useState(false);

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
    // Reload accounts when settings page mounts to pick up any new accounts from auth callback
    reloadAccounts();

    // Load settings
    const settings = StorageService.getSettings();
    setCalendarName(settings.calendarName || t.settings.appName);
    setSelectedLocale(settings.locale || 'en');
    setSelectedTheme(settings.theme || themeName);
  }, [t]);

  const handleSaveSettings = () => {
    const settings = StorageService.getSettings();
    StorageService.setSettings({ ...settings, calendarName, locale: selectedLocale, theme: selectedTheme });
    setLocale(selectedLocale);
    setTheme(selectedTheme);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);

    // Dispatch event to notify CalendarHeader of the change
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

  const filteredCalendars = selectedAccountFilter === 'all'
    ? calendars
    : calendars.filter(cal => cal.accountId === selectedAccountFilter);

  const tabs = [
    { id: 'accounts' as SettingsTab, label: t.tabs.accounts, icon: Users },
    { id: 'calendars' as SettingsTab, label: t.tabs.calendars, icon: CalendarIcon },
    { id: 'todos' as SettingsTab, label: t.tabs.todos, icon: CheckSquare },
    { id: 'photos' as SettingsTab, label: t.tabs.photos, icon: ImageIcon },
    { id: 'general' as SettingsTab, label: t.tabs.general, icon: Sliders },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b bg-background">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground flex items-center gap-3">
              <SettingsIcon size={28} />
              {t.settings.title}
            </h2>
            <p className="text-muted-foreground">{t.settings.subtitle}</p>
          </div>
          <Button
            onClick={handleSaveSettings}
            className={`flex items-center gap-2 ${
              isSaved ? 'bg-green-600 hover:bg-green-700' : ''
            }`}
          >
            <Save size={18} />
            {isSaved ? t.actions.saved : t.actions.save}
          </Button>
        </div>
      </div>

      {/* Content with Tabs */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SettingsTab)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                  <Icon size={18} />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
          {/* Accounts Tab */}
          <TabsContent value="accounts" className="space-y-6 mt-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">{t.auth.microsoftAccounts}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t.auth.microsoftAccountsHelp}
              </p>
            </div>
            <AccountManager />
          </TabsContent>

          {/* Calendars Tab */}
          <TabsContent value="calendars" className="space-y-6 mt-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">{t.settings.calendarSync}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t.settings.calendarSyncHelp}
              </p>
            </div>

            {/* Account Filter */}
            {accounts.length > 1 && (
              <Card>
                <CardContent className="pt-6">
                  <Label htmlFor="account-filter">{t.auth.filterByAccount}</Label>
                  <select
                    id="account-filter"
                    value={selectedAccountFilter}
                    onChange={(e) => setSelectedAccountFilter(e.target.value)}
                    className="w-full mt-2 flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="all">{t.auth.allAccounts}</option>
                    {accounts.map((account) => (
                      <option key={account.homeAccountId} value={account.homeAccountId}>
                        {account.username}
                      </option>
                    ))}
                  </select>
                </CardContent>
              </Card>
            )}

            {/* Calendar List */}
            <Card>
              <CardContent className="pt-6">
                {filteredCalendars.length > 0 ? (
                  <div className="space-y-3">
                    {filteredCalendars.map((calendar) => {
                      const account = accounts.find(acc => acc.homeAccountId === calendar.accountId);
                      return (
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
                            {account && (
                              <div className="text-xs text-muted-foreground">{account.username}</div>
                            )}
                            {calendar.owner && (
                              <div className="text-xs text-muted-foreground/80">{calendar.owner.address}</div>
                            )}
                          </div>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setColorPickerCalendarId(prev => prev === calendar.id ? null : calendar.id);
                              }}
                              className="w-7 h-7 rounded-full border-2 border-muted-foreground/30 hover:border-foreground/50 transition-colors"
                              style={{ backgroundColor: calendar.color }}
                              title={t.settings.changeColor}
                            />
                            {colorPickerCalendarId === calendar.id && (
                              <div
                                className="absolute right-0 top-9 z-50 bg-popover border rounded-lg shadow-lg p-3 grid grid-cols-5 gap-2 w-56"
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
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic py-4 text-center">
                    {selectedAccountFilter === 'all' ? t.settings.noCalendars : t.settings.noCalendarsForAccount}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* To Dos Tab */}
          <TabsContent value="todos" className="space-y-6 mt-6">
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
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos" className="space-y-6 mt-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">{t.photos.settingsTitle}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t.photos.settingsDescription}
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t.photos.currentFolder}</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedFolderName ? (
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border">
                    <FolderOpen size={24} className="text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{selectedFolderName}</p>
                      <p className="text-xs text-muted-foreground">{t.photos.oneDrive}</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setIsFolderPickerOpen(true)}
                    >
                      {t.photos.changeFolder}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <ImageIcon size={48} className="mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">
                      {t.photos.noFolderConfigured}
                    </p>
                    <Button onClick={() => setIsFolderPickerOpen(true)}>
                      {t.photos.selectFolder}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <FolderPicker
              isOpen={isFolderPickerOpen}
              onClose={() => setIsFolderPickerOpen(false)}
            />
          </TabsContent>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6 mt-6">
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
