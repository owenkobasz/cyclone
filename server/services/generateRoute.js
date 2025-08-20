const { generateGPTRoute, parseWaypointsFromGPT } = require('./gptPromptIntegration');
const { getValhallaRoute } = require('./valhallaRequest');
const { getGraphHopperRoute, formatGraphHopperResponse } = require('./graphHopperRequest');
const { getOpenElevation } = require('./openElevationRequest');
const { callPythonBackend } = require('./pythonBackup');
const { calculateRouteDifficulty } = require('../utils/calculationsUtils');
const { ROUTING_APIS } = require('../config/config');
const axios = require('axios');

/**
 * Generate route with waypoints using primary routing API (Valhalla) and fallback (GraphHopper)
 */
async function generateRouteWithWaypoints(waypoints, options, gptResponse = null, start = null, end = null) {
  try {
    // Use Valhalla as primary routing API
    const routeData = await getValhallaRoute(waypoints, options);
    
    return routeData;
  } catch (error) {
    console.error('Valhalla routing failed, falling back to GraphHopper:', error.message);
    
    // Fallback to GraphHopper if Valhalla fails
    if (!ROUTING_APIS.GRAPHHOPPER.key) {
      throw new Error('Both Valhalla and GraphHopper failed, and no GraphHopper API key available');
    }
    
    // Re-parse waypoints specifically for GraphHopper if we have the original GPT response
    let graphhopperWaypoints = waypoints;
    if (gptResponse && start && end) {
      console.log('Re-parsing waypoints for GraphHopper with 5-waypoint limit');
      const gptResult = parseWaypointsFromGPT(gptResponse, start, end, 'graphhopper');
      graphhopperWaypoints = gptResult.waypoints;
      console.log(`GraphHopper waypoints: ${graphhopperWaypoints.length} waypoints`);
    } else {
      console.log('Using original waypoints for GraphHopper (may exceed limit)');
    }
    
    // Build GraphHopper URL with the waypoints
    const baseUrl = ROUTING_APIS.GRAPHHOPPER.url;
    let url = `${baseUrl}?vehicle=bike&key=${ROUTING_APIS.GRAPHHOPPER.key}&instructions=true&calc_points=true&type=json`;
    
    // Add each waypoint as a point parameter
    graphhopperWaypoints.forEach(waypoint => {
      url += `&point=${encodeURIComponent(`${waypoint.lat},${waypoint.lon}`)}`;
    });
    
    console.log('GraphHopper fallback URL:', url);
    console.log('Waypoints for GraphHopper:', graphhopperWaypoints);
    
    const response = await axios.get(url, { timeout: 15000 });
    
    if (response.data.paths && response.data.paths.length > 0) {
      const route = response.data.paths[0];
      const routeData = await formatGraphHopperResponse(route, options);
      routeData.data_source = 'graphhopper_gpt_fallback';
  
      
      return routeData;
    }
    
    throw new Error('No valid route found with waypoints');
  }
}

/**
 * Main route generation function
 */
async function generateRoute(userPreferences) {
  try {
    const { start, end, options: userOptions, userLocation } = userPreferences;
    
    // Extract route options with defaults
    const {
      route_type,
      target_distance, 
      use_bike_lanes, 
      avoid_traffic,
      avoid_hills, 
      starting_point_name,
      destination_name,
      custom_description,
      routing_backend = 'gpt_powered',
      unit_system
    } = userOptions || {};

    console.log('Route generation request:', {
      start,
      end,
      route_type,
      target_distance,
      routing_backend,
      unit_system
    });

    const options = {
      route_type,
      target_distance: parseFloat(target_distance),
      use_bike_lanes,
      avoid_traffic,
      avoid_hills,
      starting_point_name,
      destination_name,
      custom_description,
      routing_backend,
      unit_system
    };

    let routeData;
    let gptMetadata = {};

    // Handle different routing backends
    if (routing_backend === 'python_osm') {
      console.log('Using Python OSM backend...');
      try {
        routeData = await callPythonBackend(start, end, options);
        routeData.data_source = 'python_osm';
      } catch (error) {
        console.error('Python OSM backend failed, falling back to GPT-powered routing:', error.message);
        routing_backend = 'gpt_powered';
      }
    }

    if (routing_backend === 'gpt_powered' || !routeData) {
      console.log('Using GPT-powered routing...');
      
      try {
        // Generate route using GPT for waypoints
        const gptResult = await generateGPTRoute(start, end, options);
        
        // Store GPT metadata
        gptMetadata = {
          gpt_description: gptResult.gptDescription,
          gpt_difficulty: gptResult.gptDifficulty,
          gpt_route_name: gptResult.gptRouteName,
          waypoints_count: gptResult.waypoints.length
        };
        
        // Generate actual route with GPT waypoints
        routeData = await generateRouteWithWaypoints(
          gptResult.waypoints, 
          options, 
          gptResult.gptResponse, 
          start, 
          end
        );
        
        if (!routeData.data_source) {
          routeData.data_source = 'valhalla_gpt';
        }
        
      } catch (error) {
        console.error('GPT-powered routing failed:', error.message);
        
        // Final fallback: direct routing without waypoints
        console.log('Falling back to direct routing without waypoints...');
        
        try {
          let fallbackWaypoints;
          
          if (end) {
            // Point-to-point route
            fallbackWaypoints = [start, end];
            routeData = await generateRouteWithWaypoints(fallbackWaypoints, options);
            routeData.data_source = 'direct_fallback';
            
            gptMetadata = {
              gpt_description: 'Direct route due to GPT failure',
              gpt_difficulty: 'Not specified',
              gpt_route_name: 'Direct Route',
              waypoints_count: fallbackWaypoints.length
            };
          } else {
            // For loop routes without GPT waypoints, we can't generate a meaningful route
            throw new Error('Loop route generation requires GPT waypoints');
          }
          
        } catch (fallbackError) {
          console.error('All routing methods failed:', fallbackError.message);
          throw new Error(`All routing methods failed: ${fallbackError.message}`);
        }
      }
    }

    // Add calculated difficulty
    routeData.calculated_difficulty = calculateRouteDifficulty(routeData, options);
    
    // Add GPT metadata to response
    if (Object.keys(gptMetadata).length > 0) {
      routeData.gpt_metadata = gptMetadata;
    }

    console.log('Route generation successful:', {
      distance: `${Number(routeData.total_length_km).toFixed(2)} km`,
      elevation: `${routeData.total_elevation_gain}m`,
      source: routeData.data_source,
      difficulty: routeData.calculated_difficulty
    });

    return routeData;

  } catch (error) {
    console.error('Route generation error:', error);
    throw error;
  }
}

module.exports = {
  generateRoute,
  generateRouteWithWaypoints
};
