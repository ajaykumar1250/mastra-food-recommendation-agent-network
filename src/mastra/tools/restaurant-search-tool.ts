import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  priceRange: string;
  popularDishes: string[];
  address: string;
  isOpen: boolean;
}

interface GeocodingResponse {
  results: {
    latitude: number;
    longitude: number;
    name: string;
  }[];
}

export const restaurantSearchTool = createTool({
  id: 'search-restaurants',
  description: 'Search for DoorDash restaurants near a location based on cuisine preferences',
  inputSchema: z.object({
    location: z.string().describe('City or address to search for restaurants'),
    cuisine: z.string().optional().describe('Preferred cuisine type (e.g., Italian, Chinese, Mexican)'),
    dietaryRestrictions: z.array(z.string()).optional().describe('Dietary restrictions (e.g., vegetarian, vegan, gluten-free)'),
    budget: z.string().optional().describe('Budget range (budget-friendly, mid-range, premium)'),
    healthPreference: z.string().optional().describe('Health preference (healthy, comfort-food, balanced)'),
  }),
  outputSchema: z.object({
    restaurants: z.array(z.object({
      id: z.string(),
      name: z.string(),
      cuisine: z.string(),
      rating: z.number(),
      deliveryTime: z.string(),
      priceRange: z.string(),
      popularDishes: z.array(z.string()),
      address: z.string(),
      isOpen: z.boolean(),
    })),
    location: z.string(),
  }),
  execute: async ({ context }) => {
    return await searchRestaurants(context);
  },
});

export const searchRestaurants = async (params: {
  location: string;
  cuisine?: string;
  dietaryRestrictions?: string[];
  budget?: string;
  healthPreference?: string;
}) => {
  // First, geocode the location
  const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(params.location)}&count=1`;
  const geocodingResponse = await fetch(geocodingUrl);
  const geocodingData = (await geocodingResponse.json()) as GeocodingResponse;

  if (!geocodingData.results?.[0]) {
    throw new Error(`Location '${params.location}' not found`);
  }

  const { latitude, longitude, name } = geocodingData.results[0];

  // Use OpenTripMap API to get real restaurant data
  const restaurants = await getOpenTripMapRestaurants({
    latitude,
    longitude,
    cuisine: params.cuisine,
    dietaryRestrictions: params.dietaryRestrictions,
    budget: params.budget,
    healthPreference: params.healthPreference,
  });

  return {
    restaurants,
    location: name,
  };
};

const getOpenTripMapRestaurants = async (params: {
  latitude: number;
  longitude: number;
  cuisine?: string;
  dietaryRestrictions?: string[];
  budget?: string;
  healthPreference?: string;
}): Promise<Restaurant[]> => {
  try {
    // OpenTripMap API is free and provides restaurant data
    const radius = 10000; // 10km radius (increased for better coverage)
    const limit = 50; // Increased limit
    
    // Use a valid API key or get one from OpenTripMap
    const apiKey = '5ae2e3f221c38a28845f05b66d45696fd7691176373e5e47a6a34b0b';
    
    let url = `https://api.opentripmap.com/0.1/en/places/radius?radius=${radius}&lon=${params.longitude}&lat=${params.latitude}&limit=${limit}&apikey=${apiKey}`;
    
    // Start with general restaurants, then filter later
    url += '&kinds=restaurants';

    const response = await fetch(url);
    const data = await response.json();

    console.log('OpenTripMap API Response:', {
      url: url.split('apikey=')[0] + 'apikey=***', // Hide API key in logs
      featuresCount: data.features?.length || 0,
      location: `${params.latitude}, ${params.longitude}`,
      radius: radius
    });

    if (!data.features || data.features.length === 0) {
      // Try a broader search without cuisine filtering
      const broaderUrl = `https://api.opentripmap.com/0.1/en/places/radius?radius=${radius}&lon=${params.longitude}&lat=${params.latitude}&limit=${limit}&apikey=${apiKey}&kinds=restaurants,fast_food,cafe`;
      const broaderResponse = await fetch(broaderUrl);
      const broaderData = await broaderResponse.json();
      
             if (!broaderData.features || broaderData.features.length === 0) {
         throw new Error(`No restaurants found in this area. Please try a larger city or different location.`);
       }
      
      // Use the broader results
      data.features = broaderData.features;
    }

    // Transform OpenTripMap data to our format
    const restaurants: Restaurant[] = data.features.map((place: any) => ({
      id: place.properties.xid,
      name: place.properties.name,
      cuisine: extractCuisineFromTags(place.properties.kinds),
      rating: generateRating(),
      deliveryTime: generateDeliveryTime(),
      priceRange: generatePriceRange(params.budget),
      popularDishes: generatePopularDishesFromCuisine(extractCuisineFromTags(place.properties.kinds)),
      address: place.properties.address?.road || 'Address not available',
      isOpen: true, // Assume open since we don't have this data
    }));

    // Filter and sort results
    return filterAndSortRestaurants(restaurants, params);

  } catch (error) {
    console.error('OpenTripMap API error:', error);
    throw new Error(`Failed to fetch restaurant data: ${error.message}`);
  }
};

const getCuisineKinds = (cuisine: string): string[] => {
  const cuisineMap: Record<string, string[]> = {
    italian: ['restaurants', 'italian_restaurants'],
    chinese: ['restaurants', 'chinese_restaurants'],
    mexican: ['restaurants', 'mexican_restaurants'],
    american: ['restaurants', 'american_restaurants'],
    japanese: ['restaurants', 'japanese_restaurants'],
    indian: ['restaurants', 'indian_restaurants'],
    thai: ['restaurants', 'thai_restaurants'],
    mediterranean: ['restaurants', 'mediterranean_restaurants'],
    korean: ['restaurants', 'korean_restaurants'],
    french: ['restaurants', 'french_restaurants'],
  };
  return cuisineMap[cuisine.toLowerCase()] || ['restaurants'];
};

const extractCuisineFromTags = (kinds: string): string => {
  if (!kinds) return 'American';
  const kindArray = kinds.split(',');
  
  // Check for specific cuisine types
  if (kindArray.includes('italian_restaurants')) return 'Italian';
  if (kindArray.includes('chinese_restaurants')) return 'Chinese';
  if (kindArray.includes('mexican_restaurants')) return 'Mexican';
  if (kindArray.includes('japanese_restaurants')) return 'Japanese';
  if (kindArray.includes('indian_restaurants')) return 'Indian';
  if (kindArray.includes('thai_restaurants')) return 'Thai';
  if (kindArray.includes('korean_restaurants')) return 'Korean';
  if (kindArray.includes('french_restaurants')) return 'French';
  
  // Check for general restaurant types
  if (kindArray.includes('fast_food')) return 'American';
  if (kindArray.includes('cafe')) return 'American';
  if (kindArray.includes('bar')) return 'American';
  
  return 'American';
};

const generateRating = (): number => {
  return Math.round((Math.random() * 1.5 + 3.5) * 10) / 10; // 3.5 to 5.0
};

const generatePriceRange = (budget?: string): string => {
  switch (budget) {
    case 'budget-friendly':
      return '$';
    case 'mid-range':
      return '$$';
    case 'premium':
      return '$$$';
    default:
      return Math.random() > 0.5 ? '$$' : '$';
  }
};

const generatePopularDishesFromCuisine = (cuisine: string): string[] => {
  return generatePopularDishes([{ title: cuisine }]);
};

const extractCuisine = (categories: any[]): string => {
  if (!categories || categories.length === 0) return 'American';
  return categories[0].title;
};

const generateDeliveryTime = (): string => {
  const min = Math.floor(Math.random() * 20) + 15; // 15-35 minutes
  const max = min + Math.floor(Math.random() * 15) + 5; // 5-20 minutes more
  return `${min}-${max} min`;
};

const generatePopularDishes = (categories: any[]): string[] => {
  const cuisine = extractCuisine(categories).toLowerCase();
  const dishMap: Record<string, string[]> = {
    italian: ['Margherita Pizza', 'Spaghetti Carbonara', 'Bruschetta', 'Tiramisu'],
    chinese: ['Kung Pao Chicken', 'Sweet and Sour Pork', 'Fried Rice', 'Wonton Soup'],
    mexican: ['Street Tacos', 'Burrito Bowl', 'Quesadilla', 'Guacamole'],
    american: ['Classic Burger', 'Cheese Fries', 'Milkshake', 'Onion Rings'],
    japanese: ['California Roll', 'Salmon Nigiri', 'Miso Soup', 'Tempura'],
    indian: ['Butter Chicken', 'Naan Bread', 'Biryani', 'Tikka Masala'],
    thai: ['Pad Thai', 'Green Curry', 'Tom Yum Soup', 'Mango Sticky Rice'],
    mediterranean: ['Hummus', 'Falafel', 'Greek Salad', 'Baklava'],
    korean: ['Bibimbap', 'Korean BBQ', 'Kimchi', 'Bulgogi'],
    french: ['Croissant', 'Coq au Vin', 'Ratatouille', 'Crème Brûlée'],
  };

  return dishMap[cuisine] || ['Chef Special', 'House Favorite', 'Popular Dish', 'Signature Item'];
};

const filterAndSortRestaurants = (restaurants: Restaurant[], params: any): Restaurant[] => {
  let filtered = restaurants;

  // Filter by cuisine if specified (more flexible matching)
  if (params.cuisine) {
    const cuisineLower = params.cuisine.toLowerCase();
    filtered = filtered.filter(restaurant => {
      const restaurantCuisine = restaurant.cuisine.toLowerCase();
      return restaurantCuisine.includes(cuisineLower) || 
             cuisineLower.includes(restaurantCuisine) ||
             (cuisineLower === 'chinese' && restaurantCuisine === 'american') || // Include American for Chinese preference
             (cuisineLower === 'italian' && restaurantCuisine === 'american');   // Include American for Italian preference
    });
  }

  // Filter by dietary restrictions
  if (params.dietaryRestrictions?.includes('vegetarian')) {
    filtered = filtered.filter(restaurant => 
      restaurant.cuisine === 'Vegetarian' || restaurant.cuisine === 'Healthy'
    );
  }

  // Filter by budget
  if (params.budget) {
    filtered = filtered.filter(restaurant => {
      switch (params.budget) {
        case 'budget-friendly':
          return restaurant.priceRange === '$';
        case 'mid-range':
          return restaurant.priceRange === '$$';
        case 'premium':
          return restaurant.priceRange === '$$$' || restaurant.priceRange === '$$$$';
        default:
          return true;
      }
    });
  }

  // Filter by health preference
  if (params.healthPreference === 'healthy') {
    filtered = filtered.filter(restaurant => 
      restaurant.cuisine === 'Healthy' || restaurant.cuisine === 'Vegetarian'
    );
  }

  // Return top 5 restaurants sorted by rating
  return filtered
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);
};

 