import { appConfig } from '../config/app.config';
import type { Recipe } from '../types/meal.types';
import type { TripSuggestion } from '../types/adventure.types';

export class OpenAIService {
  private endpoint: string;
  private apiKey: string;
  private deployment: string;
  private apiVersion: string;

  constructor() {
    this.endpoint = appConfig.openai.endpoint;
    this.apiKey = appConfig.openai.apiKey;
    this.deployment = appConfig.openai.deployment;
    this.apiVersion = appConfig.openai.apiVersion;
  }

  async generateRecipes(ingredients: string[]): Promise<Recipe[]> {
    if (!this.endpoint || !this.apiKey || !this.deployment) {
      throw new Error('Azure OpenAI is not configured. Please check your environment variables.');
    }

    const url = `${this.endpoint}/openai/deployments/${this.deployment}/chat/completions?api-version=${this.apiVersion}`;

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
          'api-key': this.apiKey,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a helpful cooking assistant that suggests creative recipes.',
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

  async generateTripSuggestions(kidAge: number, interests: string[]): Promise<TripSuggestion[]> {
    if (!this.endpoint || !this.apiKey || !this.deployment) {
      throw new Error('Azure OpenAI is not configured. Please check your environment variables.');
    }

    const url = `${this.endpoint}/openai/deployments/${this.deployment}/chat/completions?api-version=${this.apiVersion}`;

    const prompt = `You are a family travel advisor. Suggest 3 amazing family-friendly travel destinations for a family with a ${kidAge}-year-old child. The family enjoys: ${interests.join(', ')}. For each destination, provide the name, a vivid description of why it's special, why it's great specifically for this family, the best time of year to visit, latitude and longitude coordinates, and 3-4 fun activities for kids. Format as JSON array: [{ destination, description, whyGreatForFamily, bestTimeToVisit, kidsActivities: string[], latitude: number, longitude: number }]`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a family travel advisor that suggests amazing destinations.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.8,
          max_tokens: 2500,
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

      const suggestionsData = this.parseJsonArrayFromResponse(content);

      return suggestionsData.map(
        (suggestion: any): TripSuggestion => ({
          id: this.generateId(),
          destination: suggestion.destination,
          description: suggestion.description,
          whyGreatForFamily: suggestion.whyGreatForFamily,
          bestTimeToVisit: suggestion.bestTimeToVisit,
          kidsActivities: suggestion.kidsActivities,
          latitude: suggestion.latitude,
          longitude: suggestion.longitude,
          createdAt: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error('Failed to generate trip suggestions:', error);
      throw error;
    }
  }

  async generateDailySpark(kidAge: number, interests: string[]): Promise<{ type: string; content: string }> {
    if (!this.endpoint || !this.apiKey || !this.deployment) {
      throw new Error('Azure OpenAI is not configured. Please check your environment variables.');
    }

    const url = `${this.endpoint}/openai/deployments/${this.deployment}/chat/completions?api-version=${this.apiVersion}`;

    const prompt = `You are a loving family connection coach. Generate a single family conversation starter or fun activity for a family with a ${kidAge}-year-old child who enjoys: ${interests.join(', ')}. Return JSON: { "type": "conversation_starter" or "activity", "content": "the suggestion" }`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a loving family connection coach that creates meaningful moments.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.9,
          max_tokens: 500,
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

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to generate daily spark:', error);
      throw error;
    }
  }

  async generateFunNightPlan(gameNames: string[], kidAge: number): Promise<any> {
    if (!this.endpoint || !this.apiKey || !this.deployment) {
      throw new Error('Azure OpenAI is not configured. Please check your environment variables.');
    }

    const url = `${this.endpoint}/openai/deployments/${this.deployment}/chat/completions?api-version=${this.apiVersion}`;

    const prompt = `You are a fun family night planner. The family has a ${kidAge}-year-old child and owns these board games: ${gameNames.join(', ')}. Pick the best game for tonight, suggest a matching dinner recipe that's fun to make together, and recommend a family activity or movie to end the evening. Return JSON: { "game": { "name": "game name", "reason": "why this game tonight" }, "dinner": { "name": "recipe name", "description": "brief description", "ingredients": ["..."], "instructions": ["..."] }, "activity": { "type": "movie" or "activity", "name": "suggestion name", "description": "why it's perfect" } }`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a fun family night planner that creates memorable evenings.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.8,
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

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to generate fun night plan:', error);
      throw error;
    }
  }

  private parseJsonArrayFromResponse(content: string): any[] {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse JSON array:', error);
      throw new Error('Failed to parse AI response. Please try again.');
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
    return Boolean(this.endpoint && this.apiKey && this.deployment);
  }
}

export const openaiService = new OpenAIService();
