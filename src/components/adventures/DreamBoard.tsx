import React, { useState, useCallback } from 'react';
import { Compass, Sparkles, Plus, X, MapPin, Bot, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { useAdventure } from '../../contexts/AdventureContext';
import { useLocale } from '../../contexts/LocaleContext';
import type { TripSuggestion } from '../../types/adventure.types';

export const DreamBoard: React.FC = () => {
  const {
    dreamDestinations,
    suggestions,
    isGenerating,
    addDreamDestination,
    removeDreamDestination,
    generateTripSuggestions,
    clearSuggestions,
  } = useAdventure();
  const { t } = useLocale();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  const resetForm = useCallback(() => {
    setName('');
    setReason('');
    setLat('');
    setLng('');
    setShowForm(false);
  }, []);

  const handleAddDream = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;

      addDreamDestination({
        name: name.trim(),
        description: '',
        latitude: parseFloat(lat) || 0,
        longitude: parseFloat(lng) || 0,
        reason: reason.trim(),
        addedBy: 'me',
        suggestedBy: 'manual',
      });

      resetForm();
    },
    [name, reason, lat, lng, addDreamDestination, resetForm],
  );

  const handleAddSuggestionToDreams = useCallback(
    (suggestion: TripSuggestion) => {
      addDreamDestination({
        name: suggestion.destination,
        description: suggestion.description,
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
        reason: suggestion.whyGreatForFamily,
        addedBy: 'AI',
        suggestedBy: 'ai',
      });
    },
    [addDreamDestination],
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-semibold text-foreground">
          {t.adventures.dreamDestinations}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm((prev) => !prev)}
            className="touch-target"
          >
            <Plus size={16} />
            {t.adventures.addDream}
          </Button>
          <Button
            size="sm"
            onClick={generateTripSuggestions}
            disabled={isGenerating}
            className="touch-target"
          >
            <Sparkles size={16} />
            {isGenerating ? t.adventures.generating : t.adventures.aiSuggest}
          </Button>
        </div>
      </div>

      {/* Inline add form */}
      {showForm && (
        <form
          onSubmit={handleAddDream}
          className="bg-card rounded-xl shadow-card p-4 border border-border space-y-3"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">{t.adventures.addDream}</h4>
            <button
              type="button"
              onClick={resetForm}
              className="touch-target p-1 rounded-md hover:bg-accent transition-colors"
              aria-label="Close"
            >
              <X size={18} className="text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dream-name">{t.adventures.dreamName}</Label>
            <Input
              id="dream-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.adventures.dreamNamePlaceholder}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dream-reason">{t.adventures.dreamReason}</Label>
            <Textarea
              id="dream-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t.adventures.dreamReasonPlaceholder}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dream-lat">{t.adventures.latitude}</Label>
              <Input
                id="dream-lat"
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dream-lng">{t.adventures.longitude}</Label>
              <Input
                id="dream-lng"
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={!name.trim()}>
              {t.adventures.addDream}
            </Button>
          </div>
        </form>
      )}

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles size={16} className="text-yellow-500" />
              {t.adventures.suggestTrips}
            </h4>
            <Button variant="ghost" size="sm" onClick={clearSuggestions}>
              <X size={14} />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl shadow-card p-4 border border-blue-200 dark:border-blue-800"
              >
                <h5 className="font-semibold text-sm text-foreground mb-1">
                  {suggestion.destination}
                </h5>
                <p className="text-xs text-muted-foreground mb-2">
                  {suggestion.description}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                  {suggestion.whyGreatForFamily}
                </p>
                {suggestion.kidsActivities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {suggestion.kidsActivities.map((activity) => (
                      <span
                        key={activity}
                        className="inline-block bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-[10px] px-1.5 py-0.5 rounded-full"
                      >
                        {activity}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground mb-3">
                  Best time: {suggestion.bestTimeToVisit}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full touch-target"
                  onClick={() => handleAddSuggestionToDreams(suggestion)}
                >
                  <Plus size={14} />
                  {t.adventures.addToDreams}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dream destination cards */}
      {dreamDestinations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dreamDestinations.map((dest) => (
            <div
              key={dest.id}
              className="bg-card rounded-xl shadow-card p-4 border border-border group relative"
            >
              <button
                onClick={() => removeDreamDestination(dest.id)}
                className="absolute top-2 right-2 touch-target p-1 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-destructive/10 transition-all"
                aria-label={t.adventures.deletePin}
              >
                <X size={16} className="text-destructive" />
              </button>

              <div className="flex items-start gap-2 mb-2">
                <MapPin size={18} className="text-blue-500 mt-0.5 shrink-0" />
                <h5 className="font-semibold text-sm text-foreground">{dest.name}</h5>
              </div>

              {dest.reason && (
                <p className="text-xs text-muted-foreground mb-3">{dest.reason}</p>
              )}

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  <User size={10} />
                  {dest.addedBy}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${
                    dest.suggestedBy === 'ai'
                      ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                      : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                  }`}
                >
                  {dest.suggestedBy === 'ai' ? <Bot size={10} /> : <User size={10} />}
                  {dest.suggestedBy}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !showForm &&
        suggestions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Compass size={48} className="text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm max-w-xs">
              {t.adventures.noAdventures}
            </p>
          </div>
        )
      )}
    </div>
  );
};
