
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { mealSuggestionWorkflow } from './workflows/meal-suggestion-workflow';
import { mealSuggestionAgent } from './agents/meal-suggestion-agent';
import { preferenceCollectionAgent } from './agents/preference-collection-agent';
import { locationAnalysisAgent } from './agents/location-analysis-agent';
import { recommendationSynthesisAgent } from './agents/recommendation-synthesis-agent';
import { budgetOptimizationAgent } from './agents/budget-optimization-agent';
import { mealSuggestionNetwork } from './networks/meal-suggestion-network';
import { VercelDeployer } from "@mastra/deployer-vercel";

export const mastra = new Mastra({
  workflows: { mealSuggestionWorkflow },
  agents: { 
    mealSuggestionAgent,
    preferenceCollectionAgent,
    locationAnalysisAgent,
    recommendationSynthesisAgent,
    budgetOptimizationAgent,
  },
  vnext_networks: {
    'meal-suggestion-network': mealSuggestionNetwork,
  },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into a persistent SQLite database
    url: "file:../mastra.db",
  }) as any,
  logger: new PinoLogger({
    name: 'DoorDash Meal Suggestion Network',
    level: 'info',
  }),
  deployer: new VercelDeployer(),
});
