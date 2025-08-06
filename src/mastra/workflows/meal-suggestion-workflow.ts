import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { Agent } from '@mastra/core/agent';
import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
})
const llm = openrouter("anthropic/claude-sonnet-4");

const recommendationAgent = new Agent({
  name: 'Meal Recommendation Agent',
  model: llm,
  instructions: `
        You are a food recommendation expert who creates personalized meal suggestions based on user preferences and available restaurants.

        Analyze the user preferences and restaurant data to provide comprehensive meal recommendations.

        Structure your response exactly as follows:

        🍽️ PERSONALIZED MEAL RECOMMENDATIONS
        ════════════════════════════════════

        📍 Location: [User's location]
        🕐 Current Time: [Current time for meal context]

        🏆 TOP RECOMMENDATIONS
        ──────────────────────

        🥇 [Restaurant Name] - [Cuisine Type]
        ⭐ Rating: [X.X]/5.0 | 🚚 Delivery: [X-X min] | 💰 Price: [Range]
        📍 Address: [Restaurant address]
        
        🍴 RECOMMENDED DISHES:
        • [Dish 1] - [Brief description and why it matches preferences]
        • [Dish 2] - [Brief description and why it matches preferences]
        • [Dish 3] - [Brief description and why it matches preferences]

        🥈 [Restaurant Name] - [Cuisine Type]
        ⭐ Rating: [X.X]/5.0 | 🚚 Delivery: [X-X min] | 💰 Price: [Range]
        📍 Address: [Restaurant address]
        
        🍴 RECOMMENDED DISHES:
        • [Dish 1] - [Brief description and why it matches preferences]
        • [Dish 2] - [Brief description and why it matches preferences]

        🥉 [Restaurant Name] - [Cuisine Type]
        ⭐ Rating: [X.X]/5.0 | 🚚 Delivery: [X-X min] | 💰 Price: [Range]
        📍 Address: [Restaurant address]
        
        🍴 RECOMMENDED DISHES:
        • [Dish 1] - [Brief description and why it matches preferences]

        💡 PERSONALIZATION NOTES
        ───────────────────────
        • [Explain how recommendations match user preferences]
        • [Note any dietary restrictions considered]
        • [Mention budget considerations]
        • [Highlight health preferences addressed]

        🚀 QUICK ORDER TIPS
        ───────────────────
        • [Tip 1 for ordering]
        • [Tip 2 for delivery optimization]
        • [Tip 3 for cost savings]

        Guidelines:
        - Prioritize restaurants that best match user preferences
        - Consider delivery time for meal timing
        - Factor in ratings and price range
        - Provide specific dish recommendations with reasoning
        - Keep descriptions concise but informative
        - Always explain why each recommendation fits their preferences
      `,
});

const userPreferencesSchema = z.object({
  location: z.string(),
  cuisine: z.string().optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  budget: z.string().optional(),
  healthPreference: z.string().optional(),
  mealType: z.string().optional(),
});

const restaurantSchema = z.object({
  id: z.string(),
  name: z.string(),
  cuisine: z.string(),
  rating: z.number(),
  deliveryTime: z.string(),
  priceRange: z.string(),
  popularDishes: z.array(z.string()),
  address: z.string(),
  isOpen: z.boolean(),
});

const searchRestaurantsStep = createStep({
  id: 'search-restaurants',
  description: 'Search for restaurants based on user preferences and location',
  inputSchema: userPreferencesSchema,
  outputSchema: z.object({
    restaurants: z.array(restaurantSchema),
    location: z.string(),
    userPreferences: userPreferencesSchema,
  }),
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    // Call the search function directly
    const { searchRestaurants } = await import('../tools/restaurant-search-tool');
    
    const result = await searchRestaurants({
      location: inputData.location,
      cuisine: inputData.cuisine,
      dietaryRestrictions: inputData.dietaryRestrictions,
      budget: inputData.budget,
      healthPreference: inputData.healthPreference,
    });

    return {
      restaurants: result.restaurants,
      location: result.location,
      userPreferences: inputData,
    };
  },
});

const generateRecommendationsStep = createStep({
  id: 'generate-recommendations',
  description: 'Generate personalized meal recommendations based on restaurants and user preferences',
  inputSchema: z.object({
    restaurants: z.array(restaurantSchema),
    location: z.string(),
    userPreferences: userPreferencesSchema,
  }),
  outputSchema: z.object({
    recommendations: z.string(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    const { restaurants, location, userPreferences } = inputData;

    const prompt = `Generate personalized meal recommendations for a user with the following preferences:
      
      User Preferences:
      - Location: ${userPreferences.location}
      - Cuisine: ${userPreferences.cuisine || 'Any'}
      - Dietary Restrictions: ${userPreferences.dietaryRestrictions?.join(', ') || 'None'}
      - Budget: ${userPreferences.budget || 'Any'}
      - Health Preference: ${userPreferences.healthPreference || 'Any'}
      - Meal Type: ${userPreferences.mealType || 'Any'}

      Available Restaurants:
      ${JSON.stringify(restaurants, null, 2)}

      Please provide comprehensive meal recommendations following the exact format specified in your instructions.`;

    const response = await recommendationAgent.stream([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    let recommendationsText = '';

    for await (const chunk of response.textStream) {
      process.stdout.write(chunk);
      recommendationsText += chunk;
    }

    return {
      recommendations: recommendationsText,
    };
  },
});

const mealSuggestionWorkflow = createWorkflow({
  id: 'meal-suggestion-workflow',
  inputSchema: userPreferencesSchema,
  outputSchema: z.object({
    recommendations: z.string(),
  }),
})
  .then(searchRestaurantsStep)
  .then(generateRecommendationsStep);

mealSuggestionWorkflow.commit();

export { mealSuggestionWorkflow }; 