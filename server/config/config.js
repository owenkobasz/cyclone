require('dotenv').config({ path: '../.env' });

// Environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || null;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o'; // Default to gpt-4o, a valid current model
const GRAPHHOPPER_API_KEY = process.env.GRAPHHOPPER_API_KEY || null;

// API URLs
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Routing API config
const ROUTING_APIS = {
  // Valhalla doesn't need API key since we're using public API (Primary) 
  VALHALLA: {
    url: 'https://valhalla1.openstreetmap.de/route',
    key: null, 
  },
  
  // GraphHopper API (Backup 500 credits per day free tier, limited to 5 locations per request)
  GRAPHHOPPER: {
    url: 'https://graphhopper.com/api/1/route',
    key: GRAPHHOPPER_API_KEY,
  },
};

const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY || null;

module.exports = {
  // Environment variables
  OPENAI_API_KEY,
  OPENAI_MODEL,
  GRAPHHOPPER_API_KEY,
  
  // API URLs
  OPENAI_API_URL,
  
  // Configuration objects
  ROUTING_APIS,
  GEOAPIFY_API_KEY
};