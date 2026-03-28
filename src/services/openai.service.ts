import { appConfig } from '../config/app.config';
import type { Recipe } from '../types/meal.types';

const OPENAI_CONFIG_KEY = 'planner_openai_config';

export interface OpenAIConfig {
  endpoint: string;
  apiKey: string;
  deployment: string;
}

/** Read user-configured OpenAI settings from localStorage, falling back to env vars */
function getConfig(): OpenAIConfig {
  try {
    const stored = localStorage.getItem(OPENAI_CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<OpenAIConfig>;
      if (parsed.endpoint && parsed.apiKey && parsed.deployment) {
        return parsed as OpenAIConfig;
      }
    }
  } catch { /* ignore parse errors */ }

  return {
    endpoint: appConfig.openai.endpoint,
    apiKey: appConfig.openai.apiKey,
    deployment: appConfig.openai.deployment,
  };
}

export function saveOpenAIConfig(config: OpenAIConfig): void {
  localStorage.setItem(OPENAI_CONFIG_KEY, JSON.stringify(config));
}

export function loadOpenAIConfig(): OpenAIConfig {
  return getConfig();
}

export class OpenAIService {
  private apiVersion: string;

  constructor() {
    this.apiVersion = appConfig.openai.apiVersion;
  }

  async generateRecipes(ingredients: string[], locale: string = 'en'): Promise<Recipe[]> {
    const config = getConfig();
    if (!config.endpoint || !config.apiKey || !config.deployment) {
      throw new Error('Azure OpenAI is not configured. Please check your environment variables.');
    }

    const langInstruction = locale.startsWith('fr') ? 'Respond entirely in French.' : '';
    const url = `${config.endpoint}/openai/deployments/${config.deployment}/chat/completions?api-version=${this.apiVersion}`;

    const prompt = `You are a helpful cooking assistant. Based on the following ingredients, suggest 3 creative and practical recipes that can be made using these ingredients. You may assume common pantry staples (salt, pepper, oil, etc.) are available.

Ingredients available:
${ingredients.map(ing => `- ${ing}`).join('\n')}

For each recipe, provide:
1. Recipe name
2. Brief description (1-2 sentences)
3. List of ingredients with quantities
4. Step-by-step instructions
5. Estimated prep time and cook time
6. Number of servings

${langInstruction}

Format your response as valid JSON array with this structure:
[
  {
    "title": "Recipe Name",
    "description": "Brief description",
    "ingredients": ["ingredient 1", "ingredient 2", ...],
    "instructions": ["step 1", "step 2", ...],
    "prepTime": "15 minutes",
    "cookTime": "30 minutes",
    "servings": 4
  }
]`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': config.apiKey,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are a helpful cooking assistant that suggests creative recipes.${locale.startsWith('fr') ? ' Always respond in French.' : ''}`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No response from Azure OpenAI');
      }

      // Parse the JSON response
      const recipesData = this.parseRecipesFromResponse(content);

      // Convert to our Recipe type
      return recipesData.map(
        (recipe: any): Recipe => ({
          id: this.generateId(),
          title: recipe.title,
          description: recipe.description,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          prepTime: recipe.prepTime,
          cookTime: recipe.cookTime,
          servings: recipe.servings,
          createdAt: new Date().toISOString(),
          isFavorite: false,
          source: 'ai',
        })
      );
    } catch (error) {
      console.error('Failed to generate recipes:', error);
      throw error;
    }
  }

  private parseRecipesFromResponse(content: string): any[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // If no JSON array found, try parsing the entire content
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse recipes:', error);
      throw new Error('Failed to parse recipe suggestions. Please try again.');
    }
  }

  private generateId(): string {
    return `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Check if Azure OpenAI is configured
  isConfigured(): boolean {
    const config = getConfig();
    return Boolean(config.endpoint && config.apiKey && config.deployment);
  }

  /** Generate a single simple recipe for a specific meal type based on fridge contents */
  async imagineMeal(ingredients: string, mealType: 'breakfast' | 'lunch' | 'dinner', locale: string = 'en'): Promise<Recipe> {
    const config = getConfig();
    if (!config.endpoint || !config.apiKey || !config.deployment) {
      throw new Error('Azure OpenAI is not configured.');
    }

    const langInstruction = locale.startsWith('fr') ? 'Respond entirely in French.' : '';
    const url = `${config.endpoint}/openai/deployments/${config.deployment}/chat/completions?api-version=${this.apiVersion}`;

    const prompt = `Based on these ingredients in my fridge, suggest ONE simple ${mealType} recipe.

Fridge contents: ${ingredients}

You may assume common pantry staples (salt, pepper, oil, butter, flour, sugar, etc.) are available.
Keep it simple and practical for a family. ${langInstruction}
Return valid JSON with this structure:
{
  "title": "Recipe Name",
  "description": "Brief 1-2 sentence description",
  "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity"],
  "instructions": ["step 1", "step 2"],
  "prepTime": "10 minutes",
  "cookTime": "20 minutes",
  "servings": 4
}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.apiKey,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: `You are a family cooking assistant. Suggest simple, practical ${mealType} recipes. Always respond with valid JSON only, no markdown.${locale.startsWith('fr') ? ' Always respond in French.' : ''}` },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('No response from Azure OpenAI');

    // Parse single recipe object
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to parse recipe suggestion');

    const recipe = JSON.parse(jsonMatch[0]);
    return {
      id: this.generateId(),
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      createdAt: new Date().toISOString(),
      isFavorite: false,
      source: 'ai',
    };
  }
}

export const openaiService = new OpenAIService();
