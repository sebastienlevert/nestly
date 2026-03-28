import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { openaiService } from '../services/openai.service';
import type { FridgeItem, Recipe, MealContextType } from '../types/meal.types';
import { StorageService } from '../services/storage.service';
import { cacheService } from '../services/idb-cache.service';
import { useLocale } from './LocaleContext';

const MealContext = createContext<MealContextType | undefined>(undefined);

export const useMeal = () => {
  const context = useContext(MealContext);
  if (!context) {
    throw new Error('useMeal must be used within a MealProvider');
  }
  return context;
};

interface MealProviderProps {
  children: ReactNode;
}

export const MealProvider: React.FC<MealProviderProps> = ({ children }) => {
  const { locale } = useLocale();
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data from storage on mount (IndexedDB first, fallback to localStorage)
  useEffect(() => {
    (async () => {
      const cachedItems = await cacheService.get<FridgeItem[]>('meal:fridge');
      const cachedRecipes = await cacheService.get<Recipe[]>('meal:recipes');
      if (cachedItems) {
        setFridgeItems(cachedItems.data);
      } else {
        setFridgeItems(StorageService.getFridgeInventory());
      }
      if (cachedRecipes) {
        setRecipes(cachedRecipes.data);
      } else {
        setRecipes(StorageService.getSavedRecipes());
      }
    })();
  }, []);

  // Save to storage whenever data changes
  useEffect(() => {
    StorageService.setFridgeInventory(fridgeItems);
    cacheService.set('meal:fridge', fridgeItems);
  }, [fridgeItems]);

  useEffect(() => {
    StorageService.setSavedRecipes(recipes);
    cacheService.set('meal:recipes', recipes);
  }, [recipes]);

  const addFridgeItem = (item: Omit<FridgeItem, 'id' | 'addedDate'>) => {
    const newItem: FridgeItem = {
      ...item,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      addedDate: new Date().toISOString(),
    };
    setFridgeItems(prev => [...prev, newItem]);
  };

  const removeFridgeItem = (itemId: string) => {
    setFridgeItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateFridgeItem = (itemId: string, updates: Partial<FridgeItem>) => {
    setFridgeItems(prev =>
      prev.map(item => (item.id === itemId ? { ...item, ...updates } : item))
    );
  };

  const generateRecipes = async (ingredients: string[]): Promise<Recipe[]> => {
    if (ingredients.length === 0) {
      throw new Error('Please add some ingredients first');
    }

    if (!openaiService.isConfigured()) {
      throw new Error(
        'Azure OpenAI is not configured. Please add your credentials to the .env file.'
      );
    }

    setIsGenerating(true);
    setError(null);

    try {
      const generatedRecipes = await openaiService.generateRecipes(ingredients, locale);
      setRecipes(prev => [...generatedRecipes, ...prev]);
      return generatedRecipes;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate recipes';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveRecipe = (recipe: Recipe) => {
    setRecipes(prev => {
      const existingIndex = prev.findIndex(r => r.id === recipe.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = recipe;
        return updated;
      }
      return [recipe, ...prev];
    });
  };

  const toggleFavorite = (recipeId: string) => {
    setRecipes(prev =>
      prev.map(recipe =>
        recipe.id === recipeId ? { ...recipe, isFavorite: !recipe.isFavorite } : recipe
      )
    );
  };

  const deleteRecipe = (recipeId: string) => {
    setRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
  };

  const addRecipeToCalendar = async (_recipe: Recipe, _dateTime: Date): Promise<void> => {
    try {
      // For now, we'll need to get the calendar and account from somewhere
      // This is a simplified version - you might want to let the user select
      throw new Error('Please use the calendar page to add meals to your calendar');
    } catch (err: any) {
      throw new Error(err.message || 'Failed to add recipe to calendar');
    }
  };

  const value: MealContextType = {
    fridgeItems,
    recipes,
    isGenerating,
    error,
    addFridgeItem,
    removeFridgeItem,
    updateFridgeItem,
    generateRecipes,
    saveRecipe,
    toggleFavorite,
    deleteRecipe,
    addRecipeToCalendar,
  };

  return <MealContext.Provider value={value}>{children}</MealContext.Provider>;
};
