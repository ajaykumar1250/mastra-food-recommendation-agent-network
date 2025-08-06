import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { NewAgentNetwork } from '@mastra/core/network/vNext';

import { preferenceCollectionAgent } from '../agents/preference-collection-agent';
import { locationAnalysisAgent } from '../agents/location-analysis-agent';
import { recommendationSynthesisAgent } from '../agents/recommendation-synthesis-agent';
import { budgetOptimizationAgent } from '../agents/budget-optimization-agent';
import { mealSuggestionAgent } from '../agents/meal-suggestion-agent';
import { mealSuggestionWorkflow } from '../workflows/meal-suggestion-workflow';
import { restaurantSearchTool } from '../tools/restaurant-search-tool';


const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
})

export const mealSuggestionNetwork = new NewAgentNetwork({
  id: 'meal-suggestion-network',
  name: 'DoorDash Meal Suggestion Network',
  instructions: `
    You are a sophisticated meal recommendation network that coordinates multiple specialized agents to provide the best possible food suggestions.
    
    Your network includes these specialized agents:
    
    1. **Preference Collection Agent** - Gathers comprehensive user preferences (location, cuisine, budget, dietary restrictions, etc.)
    2. **Location Analysis Agent** - Validates and optimizes location data for restaurant searches
    3. **Budget Optimization Agent** - Finds cost-effective options and money-saving strategies
    4. **Recommendation Synthesis Agent** - Creates personalized meal recommendations with detailed formatting
    5. **Meal Suggestion Agent** - The main agent that can handle general meal suggestion tasks
    6. **Restaurant Search Tool** - Direct tool for finding restaurants based on location and preferences
    
    **MANDATORY EXECUTION FLOW - NEVER DEVIATE:**
    
    For EVERY user query, you MUST follow this EXACT sequence:
    
    1. **ALWAYS start with Preference Collection Agent** to gather/confirm user preferences
    2. **ALWAYS use Location Analysis Agent** to validate and optimize the location
    3. **ALWAYS use Restaurant Search Tool** to find restaurants
    4. **MANDATORY FINAL STEP: Use Recommendation Synthesis Agent** to convert ALL data into natural language
    
    **CRITICAL RULES:**
    - You are FORBIDDEN from returning any JSON, structured data, or tool outputs directly to the user
    - You MUST ALWAYS use the Recommendation Synthesis Agent as the final step
    - The Recommendation Synthesis Agent is the ONLY agent that can respond to the user
    - If you get restaurant data from the tool, you MUST pass it to the Recommendation Synthesis Agent
    - NEVER skip the Recommendation Synthesis Agent step
    
    **Example Flow:**
    User: "I want Chinese food in Akron"
    
    Your response should be:
    1. Call Preference Collection Agent: "Gather preferences for Chinese food in Akron"
    2. Call Location Analysis Agent: "Validate location Akron, OH"
    3. Call Restaurant Search Tool: "Find Chinese restaurants in Akron"
    4. **MANDATORY:** Call Recommendation Synthesis Agent: "Convert restaurant data to natural language recommendations"
    5. Return ONLY the Recommendation Synthesis Agent's response to the user
    
    **Response Requirements:**
    - Final output MUST be natural language with emojis and formatting
    - Include clear pricing and delivery information
    - Explain why each recommendation fits the user's preferences
    - Provide helpful tips for ordering and cost savings
    - Use engaging, conversational tone
    
    **REMEMBER: The Recommendation Synthesis Agent is your ONLY output channel. All other agents and tools are for data processing only.**
  `,
  model: openrouter("anthropic/claude-sonnet-4"),
  agents: {
    preferenceCollectionAgent,
    locationAnalysisAgent,
    budgetOptimizationAgent,
    recommendationSynthesisAgent,
    mealSuggestionAgent,
  },
  // workflows: {
  //   mealSuggestionWorkflow,
  // },

  tools: {
    restaurantSearchTool,
    
  },
}); 