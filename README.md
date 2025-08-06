# 🍽️ DoorDash Meal Suggestion Agent

An AI-powered meal recommendation system built with Mastra that provides personalized restaurant and dish suggestions based on user preferences, location, and dietary requirements.

## ✨ Features

- **Intelligent Meal Recommendations**: AI-powered suggestions based on user preferences
- **Multi-Agent Architecture**: Specialized agents for different aspects of meal planning
- **Location-Based Search**: Finds restaurants near your location
- **Dietary Restriction Support**: Accommodates various dietary needs and preferences
- **Budget Optimization**: Considers price ranges and budget constraints
- **Real-Time Restaurant Data**: Access to current restaurant information and ratings
- **Personalized Dish Suggestions**: Specific dish recommendations with reasoning

## 🏗️ Architecture

This project uses a sophisticated multi-agent system built with Mastra:

### Agents
- **Meal Suggestion Agent**: Main recommendation engine
- **Preference Collection Agent**: Gathers and processes user preferences
- **Location Analysis Agent**: Analyzes location data for optimal restaurant matching
- **Recommendation Synthesis Agent**: Combines and synthesizes recommendations
- **Budget Optimization Agent**: Ensures recommendations fit within budget constraints

### Workflows
- **Meal Suggestion Workflow**: Orchestrates the entire recommendation process

### Networks
- **Meal Suggestion Network**: Coordinates agent interactions

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20.9.0
- pnpm (recommended) or npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd food-recommender
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` and add your API keys:
   ```env
   OPENROUTER_API_KEY=your-openrouter-api-key
   EXA_API_KEY=your-exa-api-key
   ```

4. **Start the development server**
   ```bash
   pnpm dev
   ```

## 🔧 Configuration

### API Keys Required

- **OpenRouter API Key**: For AI model access (Claude Sonnet 4)
- **Exa API Key**: For web search and restaurant data

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENROUTER_API_KEY` | API key for OpenRouter (Claude Sonnet 4) | Yes |
| `EXA_API_KEY` | API key for Exa search service | Yes |

## 📖 Usage

### Basic Usage

The system accepts user preferences in the following format:

```typescript
{
  location: "San Francisco, CA",
  cuisine: "Italian", // optional
  dietaryRestrictions: ["vegetarian", "gluten-free"], // optional
  budget: "$20-40", // optional
  healthPreference: "low-carb", // optional
  mealType: "dinner" // optional
}
```

### Example Request

```typescript
import { mealSuggestionWorkflow } from './src/mastra/workflows/meal-suggestion-workflow';

const result = await mealSuggestionWorkflow.execute({
  location: "San Francisco, CA",
  cuisine: "Italian",
  dietaryRestrictions: ["vegetarian"],
  budget: "$20-40",
  mealType: "dinner"
});

console.log(result.recommendations);
```

### Sample Output

The system provides structured recommendations including:

- 🏆 Top restaurant recommendations with ratings
- 🍴 Specific dish suggestions with reasoning
- 📍 Restaurant addresses and delivery times
- 💰 Price ranges and budget considerations
- 💡 Personalization notes
- 🚀 Quick ordering tips

## 🛠️ Development

### Available Scripts

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run tests
pnpm test
```

### Project Structure

```
src/mastra/
├── agents/                    # Individual AI agents
│   ├── budget-optimization-agent.ts
│   ├── location-analysis-agent.ts
│   ├── meal-suggestion-agent.ts
│   ├── preference-collection-agent.ts
│   └── recommendation-synthesis-agent.ts
├── networks/                  # Agent networks
│   └── meal-suggestion-network.ts
├── tools/                     # Custom tools
│   └── restaurant-search-tool.ts
├── workflows/                 # Workflow definitions
│   └── meal-suggestion-workflow.ts
└── index.ts                   # Main Mastra configuration
```

## 🚀 Deployment

This project is configured for deployment on Vercel using the Mastra Vercel Deployer.

### Deploy to Vercel

1. **Build the project**
   ```bash
   pnpm build
   ```

2. **Deploy using Mastra**
   ```bash
   pnpm start
   ```

The project uses LibSQL for persistent storage and Pino for logging.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Mastra documentation](https://docs.mastra.ai)
2. Review the project structure and configuration
3. Ensure all environment variables are properly set
4. Verify API keys are valid and have sufficient credits

## 🔮 Future Enhancements

- Integration with actual DoorDash API
- Real-time menu availability
- User preference learning over time
- Integration with food delivery tracking
- Support for group ordering and preferences
- Nutritional information and health scoring 