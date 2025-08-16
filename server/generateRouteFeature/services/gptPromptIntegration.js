const axios = require('axios');
const { OPENAI_API_KEY, OPENAI_API_URL } = require('../../config/config');
const { calculateDistance } = require('../utils/calculationsUtils');

/**
 * Calculate distance requirements based on target distance
 */
function calculateDistanceRequirements(targetMiles, unitSystem) {
  // Distance category thresholds for guidance
  const distanceCategories = {
    short: { min: 0, max: 3, waypoints: { min: 2, max: 3 }, spacing: "0.5-1 mile apart" },
    medium: { min: 3, max: 8, waypoints: { min: 3, max: 5 }, spacing: "1-2 miles apart" },
    long: { min: 8, max: 15, waypoints: { min: 4, max: 6 }, spacing: "2-3 miles apart" },
    extraLong: { min: 15, max: 1000, waypoints: { min: 5, max: 8 }, spacing: "3-5 miles apart" }
  };
  
  let category;
  for (const [catName, catData] of Object.entries(distanceCategories)) {
    if (targetMiles >= catData.min && targetMiles < catData.max) {
      category = catData;
      break;
    }
  }
  
  if (!category) {
    category = distanceCategories.extraLong;
  }
  
  // Generate distance guidance text
  let distanceGuidance;
  if (targetMiles < 5) {
    distanceGuidance = `For shorter routes like this ${targetMiles}-mile ride, waypoints should be closer together to ensure you hit the target distance. Consider local loops, neighborhood circuits, or nearby park connections.`;
  } else if (targetMiles < 10) {
    distanceGuidance = `For medium-distance routes like this ${targetMiles}-mile ride, balance interesting destinations with practical routing. Consider connecting 2-3 notable areas or landmarks.`;
  } else {
    distanceGuidance = `For longer routes like this ${targetMiles}-mile ride, focus on major destinations and landmarks. Each waypoint should represent a significant milestone in the journey.`;
  }
  
  return {
    minWaypoints: category.waypoints.min,
    maxWaypoints: category.waypoints.max,
    waypointSpacing: category.spacing,
    distanceGuidance,
    targetMiles
  };
}

/**
 * Generate GPT prompt for route planning
 */
function generateGPTPrompt(start, end, options) {
  const {
    route_type = 'scenic',
    target_distance = 5.0,
    use_bike_lanes = true,
    avoid_traffic = false,
    avoid_hills = false,
    starting_point_name,
    destination_name,
    unit_system = 'imperial'
  } = options;
  
  // Calculate distance requirements based on target distance
  const distanceReqs = calculateDistanceRequirements(target_distance, unit_system);
  
  // Convert target distance to the chosen unit for display
  const targetDistance = unit_system === 'imperial' ? 
    `${target_distance} miles` : 
    `${(target_distance * 1.60934).toFixed(1)} kilometers`;
  
  // Build starting and ending location descriptions
  const startLocation = starting_point_name || `coordinates ${start.lat}, ${start.lon}`;
  const endLocation = end && destination_name ? 
    destination_name : 
    end ? `coordinates ${end.lat}, ${end.lon}` : startLocation;
  
  // Advanced options toggle description
  let advancedOptionsToggle = [];
  if (use_bike_lanes) advancedOptionsToggle.push('prioritizing bike lanes');
  if (avoid_traffic) advancedOptionsToggle.push('avoiding high traffic areas');
  if (avoid_hills) advancedOptionsToggle.push('avoiding hills');
  if (options.elevation_focus) advancedOptionsToggle.push('with elevation focus');
  
  const toggleOptions = advancedOptionsToggle.length > 0 ? 
    `focused on ${advancedOptionsToggle.join(' and ')}` : 
    'I don\'t have specific preferences for bike lanes, traffic, elevation, or hills';
  
  // Route type description
  let routeTypeDescription;
  switch (route_type) {
    case 'scenic':
      routeTypeDescription = 'focused on scenic rides with beautiful views, landscapes, and interesting landmarks';
      break;
    case 'nature':
      routeTypeDescription = 'focused on nature (parks, trails and optimized for green spaces), zero repeated paths, low traffic roads that lead to nature destinations';
      break;
    case 'fitness':
      routeTypeDescription = 'challenging routes and focused on elevation training for fitness enthusiasts';
      break;
    case 'urban':
      routeTypeDescription = 'focused on exploring city streets, urban attractions, new neighborhoods, local culture, and hidden gems';
      break;
    default:
      routeTypeDescription = 'focused on scenic rides with beautiful views and landscapes';
  }
  
  const systemPrompt = `You are a cycling route planning expert. Generate a bicycle route with specific waypoints that can be used to create turn-by-turn directions.

IMPORTANT: You must respond with a JSON object containing:
1. "waypoints": An array of coordinate objects with "lat" and "lon" properties (${distanceReqs.minWaypoints}-${distanceReqs.maxWaypoints} waypoints)
2. "difficulty": A string rating ("Easy", "Moderate", "Challenging", "Expert")
3. "description": A brief description of the route highlights

CRITICAL REQUIREMENTS FOR ${targetDistance} ROUTES:
- The first waypoint MUST be the exact starting location provided: ${start.lat}, ${start.lon}
- The last waypoint MUST be the exact ending location provided: ${end ? `${end.lat}, ${end.lon}` : `${start.lat}, ${start.lon}`}
- Only provide intermediate waypoints that are most iconic and align with the user's route type specification
- ${distanceReqs.distanceGuidance}
- Intermediate waypoints should be ${distanceReqs.waypointSpacing}
- For loop routes (same start/end), create waypoints that form a circuit back to the starting point
- Consider the route type when placing intermediate waypoints (scenic = parks/views, urban = neighborhoods, etc.)
- CRITICAL: The waypoints must be spaced far enough apart to actually create a ${targetDistance} route when connected by roads

The waypoints should create a route that matches both the requested distance and route type preferences.`;

  const userPrompt = `Generate me a bike route ${toggleOptions}. I want to get from ${startLocation} to ${endLocation}. The total distance of the route should be approximately ${targetDistance}. I want my bike ride to be ${routeTypeDescription}.

DISTANCE REQUIREMENTS: This is a ${targetDistance} route request (${distanceReqs.targetMiles.toFixed(1)} miles). ${distanceReqs.distanceGuidance}

WAYPOINT SPECIFICATIONS:
- Start at: ${start.lat}, ${start.lon} (EXACT coordinates required)
- End at: ${end ? `${end.lat}, ${end.lon}` : `${start.lat}, ${start.lon}`} (EXACT coordinates required)
- Place ${distanceReqs.minWaypoints}-${distanceReqs.maxWaypoints} intermediate waypoints ${distanceReqs.waypointSpacing}
- Each waypoint should align with the ${route_type} route type

CRITICAL: Make sure your waypoints are spread out enough to actually create a ${targetDistance} route when connected by roads. Roads add significant distance compared to straight-line distances.`;

  return { systemPrompt, userPrompt };
}

/**
 * Call OpenAI API with prompts
 */
async function callOpenAI(prompts) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const response = await axios.post(OPENAI_API_URL, {
      model: 'gpt-4.1-nano', 
      messages: [
        {
          role: 'system',
          content: prompts.systemPrompt
        },
        {
          role: 'user',
          content: prompts.userPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API call failed:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Parse waypoints from GPT response
 */
function parseWaypointsFromGPT(gptResponse, start, end, routingAPI = 'valhalla') {
  try {
    console.log('Raw GPT response:', gptResponse.substring(0, 200) + '...');
    
    // Try to parse JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(gptResponse);
    } catch (parseError) {
      console.log('Direct JSON parsing failed, trying to extract and clean JSON from response');
      // If direct JSON parsing fails, try to extract JSON from the response
      // Handle cases where GPT might include explanatory text before/after JSON
      let jsonMatch = gptResponse.match(/\{[\s\S]*?\}(?=\s*$|\s*```|\s*\n\n)/);
      if (jsonMatch) {
        console.log('Found JSON match:', jsonMatch[0].substring(0, 100) + '...');
        // Clean the JSON by removing JavaScript-style comments
        let cleanedJson = jsonMatch[0]
          .replace(/\/\/.*$/gm, '')  // Remove single-line comments
          .replace(/\/\*[\s\S]*?\*\//g, '')  // Remove multi-line comments
          .replace(/,\s*}/g, '}')  // Remove trailing commas before }
          .replace(/,\s*]/g, ']');  // Remove trailing commas before ]
        
        console.log('Cleaned JSON:', cleanedJson.substring(0, 200) + '...');
        parsedResponse = JSON.parse(cleanedJson);
      } else {
        // Try another pattern for JSON extraction
        const alternateMatch = gptResponse.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (alternateMatch) {
          console.log('Found JSON in code block:', alternateMatch[1].substring(0, 100) + '...');
          // Clean the JSON by removing comments
          let cleanedJson = alternateMatch[1]
            .replace(/\/\/.*$/gm, '')  // Remove single-line comments
            .replace(/\/\*[\s\S]*?\*\//g, '')  // Remove multi-line comments
            .replace(/,\s*}/g, '}')  // Remove trailing commas before }
            .replace(/,\s*]/g, ']');  // Remove trailing commas before ]
          
          parsedResponse = JSON.parse(cleanedJson);
        } else {
          throw new Error('No valid JSON found in GPT response');
        }
      }
    }
    
    if (!parsedResponse.waypoints || !Array.isArray(parsedResponse.waypoints)) {
      throw new Error('Invalid waypoints format in GPT response');
    }
    
    // Validate waypoints
    const gptWaypoints = parsedResponse.waypoints.filter(wp => 
      wp.lat && wp.lon && 
      typeof wp.lat === 'number' && 
      typeof wp.lon === 'number'
    );
    
    if (gptWaypoints.length < 2) {
      throw new Error('Not enough valid waypoints in GPT response');
    }
    
    // Log what GPT provided
    console.log('GPT provided waypoints:', gptWaypoints);
    console.log('Routing API:', routingAPI);
    
    // Ensure start and end points are preserved
    const preservedWaypoints = [];
    
    // Always start with the original start point
    preservedWaypoints.push({ lat: start.lat, lon: start.lon });
    
    // Handle intermediate waypoints based on routing API
    if (routingAPI === 'graphhopper') {
      // For GraphHopper: Limit to 5 waypoints total (start + 3 intermediate + end)
      // Let GPT decide which intermediate waypoints are most important
      const intermediateWaypoints = gptWaypoints.slice(1, -1);
      if (intermediateWaypoints.length > 3) {
        console.log(`GraphHopper limit: Using first 3 of ${intermediateWaypoints.length} intermediate waypoints from GPT`);
        preservedWaypoints.push(...intermediateWaypoints.slice(0, 3));
      } else {
        preservedWaypoints.push(...intermediateWaypoints);
      }
    } else {
      // For Valhalla: Use all intermediate waypoints
      const intermediateWaypoints = gptWaypoints.slice(1, -1);
      preservedWaypoints.push(...intermediateWaypoints);
    }
    
    // Always end with the original end point (or start point for loops)
    const endPoint = end ? { lat: end.lat, lon: end.lon } : { lat: start.lat, lon: start.lon };
    preservedWaypoints.push(endPoint);
    
    // Calculate estimated straight-line distance between waypoints for debugging
    let estimatedDistance = 0;
    for (let i = 0; i < preservedWaypoints.length - 1; i++) {
      const distance = calculateDistance(preservedWaypoints[i], preservedWaypoints[i + 1]);
      estimatedDistance += distance;
    }
    const estimatedDistanceKm = estimatedDistance / 1000;
    const estimatedDistanceMiles = estimatedDistanceKm * 0.621371;
    
    console.log(`Straight-line distance between waypoints: ${estimatedDistanceKm.toFixed(2)} km (${estimatedDistanceMiles.toFixed(2)} miles) - for debugging only`);
    console.log(`Note: Actual route distance will be longer as it follows roads and paths`);
    console.log(`GPT generated route description: ${parsedResponse.description || 'No description provided'}`);
    console.log(`GPT suggested difficulty: ${parsedResponse.difficulty || 'Not specified'}`);
    
    return {
      waypoints: preservedWaypoints,
      gptDescription: parsedResponse.description || 'No description provided',
      gptDifficulty: parsedResponse.difficulty || 'Not specified'
    };
  } catch (error) {
    console.error('Error parsing GPT response:', error);
    // Fallback: return start and end points only
    return {
      waypoints: [
        { lat: start.lat, lon: start.lon },
        end ? { lat: end.lat, lon: end.lon } : { lat: start.lat, lon: start.lon }
      ],
      gptDescription: 'Fallback route due to GPT parsing error',
      gptDifficulty: 'Not specified'
    };
  }
}

/**
 * Generate route using GPT for waypoints
 */
async function generateGPTRoute(start, end, options) {
  try {
    console.log('Generating GPT-based route...');
    console.log('Start:', start);
    console.log('End:', end);
    console.log('Options:', options);
    
    // Generate prompts for GPT
    const prompts = generateGPTPrompt(start, end, options);
    console.log('System prompt length:', prompts.systemPrompt.length);
    console.log('User prompt length:', prompts.userPrompt.length);
    
    // Call GPT API
    const gptResponse = await callOpenAI(prompts);
    console.log('GPT response received, length:', gptResponse.length);
    
    // Parse waypoints from GPT response
    const gptResult = parseWaypointsFromGPT(gptResponse, start, end, 'valhalla');
    console.log('Parsed waypoints:', gptResult.waypoints.length);
    
    return {
      waypoints: gptResult.waypoints,
      gptResponse: gptResponse,
      gptDescription: gptResult.gptDescription,
      gptDifficulty: gptResult.gptDifficulty
    };
  } catch (error) {
    console.error('GPT route generation failed:', error);
    throw error;
  }
}

module.exports = {
  generateGPTRoute,
  generateGPTPrompt,
  callOpenAI,
  parseWaypointsFromGPT,
  calculateDistanceRequirements
};
