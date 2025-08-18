const axios = require('axios');
const { ROUTING_APIS } = require('../config/config');
const { decodeValhallaPolyline } = require('../utils/polylineDecoder');
const { formatDistance, formatDuration } = require('../utils/formatters');
const { getValhallaInstructionType } = require('../utils/instructionMappers');
const { getOpenElevation } = require('./openElevationRequest');

async function getValhallaRoute(waypoints, options) {
  // Build Valhalla request payload
  const locations = waypoints.map(waypoint => ({
    lat: waypoint.lat,
    lon: waypoint.lon
  }));

  const requestBody = {
    locations: locations,
    costing: 'bicycle',
    directions_options: { units: 'kilometers' },
    shape_match: 'edge_walk',
    filters: {
      attributes: ['edge.length', 'edge.speed', 'edge.elevation'],
      action: 'include'
    },
    shape: 'detailed',
    elevation: true
  };

  console.log('Valhalla request:', {
    url: ROUTING_APIS.VALHALLA.url,
    waypoints: waypoints.length,
    body: requestBody
  });

  const response = await axios.post(ROUTING_APIS.VALHALLA.url, requestBody, {
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 20000
  });

  if (response.data.trip && response.data.trip.legs) {
    return await formatValhallaResponse(response.data.trip, options);
  }

  throw new Error('No valid route found from Valhalla');
}

async function formatValhallaResponse(trip, options) {
  // Extract coordinates from all legs
  const coordinates = [];
  let totalDistance = 0;
  let totalTime = 0;
  let totalElevationGain = 0;
  const instructions = [];

  trip.legs.forEach((leg, legIndex) => {
    console.log(`Processing Valhalla leg ${legIndex}:`, {
      shape: leg.shape ? leg.shape.substring(0, 50) + '...' : 'No shape',
      shapeLength: leg.shape ? leg.shape.length : 0,
      summary: leg.summary,
      legDistance: leg.summary?.length || 0
    });
    
    if (leg.shape) {
      // Decode Valhalla polyline (6 digit precision)
      const legCoordinates = decodeValhallaPolyline(leg.shape);
      console.log(`Decoded ${legCoordinates.length} coordinates from Valhalla leg ${legIndex}`);
      console.log('First few decoded coordinates:', legCoordinates.slice(0, 3));
      
      if (legIndex === 0) {
        coordinates.push(...legCoordinates);
      } else {
        // Skip first coordinate of subsequent legs to avoid duplication
        coordinates.push(...legCoordinates.slice(1));
      }
    }

    const legDistance = leg.summary?.length || 0;
    totalDistance += legDistance; // in km for Valhalla
    totalTime += leg.summary?.time || 0; // in seconds
    
    console.log(`Leg ${legIndex} distance: ${legDistance} km, Running total: ${totalDistance} km`);
    
    // Extract elevation gain from Valhalla if available
    if (leg.summary && leg.summary.elevation_gain !== undefined) {
      totalElevationGain += leg.summary.elevation_gain; // in meters
    }

    // Process maneuvers for turn-by-turn instructions
    if (leg.maneuvers) {
      leg.maneuvers.forEach((maneuver, index) => {
        if (legIndex === 0 && index === 0) {
          // First instruction
          instructions.push({
            instruction: options.starting_point_name ? 
              `Start from ${options.starting_point_name}` : 
              'Begin your cycling route',
            distance: '0 ft',
            distance_raw: 0,
            duration: 0,
            type: 11,
            modifier: null,
          });
        } else if (maneuver.type !== 4) { // Skip destination maneuvers except the final one
          const distance = maneuver.length * 1000; // Convert km to meters for consistency
          
          instructions.push({
            instruction: maneuver.instruction || `Continue for ${distance}`,
            distance: distance,
            duration: maneuver.time,
            duration_formatted: formatDuration(maneuver.time),
            type: getValhallaInstructionType(maneuver.type),
            modifier: null,
            street_name: maneuver.street_names ? maneuver.street_names[0] : '',
          });
        }
      });
    }
  });

  // Add final destination instruction
  const finalInstruction = options.destination_name ? 
    `Arrive at ${options.destination_name}` : 
    'Arrive at your destination';
    
  instructions.push({
    instruction: finalInstruction,
    distance: '0 ft',
    distance_raw: 0,
    duration: 0,
    type: 10,
    modifier: null,
  });

  // Convert distance from km to meters 
  const totalDistanceMeters = totalDistance * 1000;

  // Always use Open Elevation API for elevation data
  let elevationGain = null;
  console.log('Using Open Elevation API for all elevation data...');
  const openElevationData = await getOpenElevation(coordinates, options);
  if (openElevationData !== null) {
    elevationGain = openElevationData;
    console.log(`Using Open Elevation data: ${elevationGain} m}`);
  } else {
    console.log('No elevation data available from Open Elevation API');
  }

  console.log(`Valhalla route coordinates: ${coordinates.length} points`);
  console.log('First few coordinates:', coordinates.slice(0, 3));
  console.log('Last few coordinates:', coordinates.slice(-3));
  console.log('Raw coordinates check - lat should be ~37-38, lon should be ~-122:', {
    firstLat: coordinates[0]?.lat,
    firstLon: coordinates[0]?.lon,
    lastLat: coordinates[coordinates.length - 1]?.lat,
    lastLon: coordinates[coordinates.length - 1]?.lon
  });

  // Debug: Log the final route data being returned to frontend
  console.log(`=== ROUTE DATA DEBUG ===`);
  console.log(`Number of legs processed: ${trip.legs.length}`);
  console.log(`total_length_km: ${totalDistance}`);
  console.log(`total_elevation_gain: ${elevationGain}`);
  console.log(`totalDistanceMeters calculation: ${totalDistance} km * 1000 = ${totalDistanceMeters} meters`);
  console.log(`========================`);

  return {
    route: coordinates,
    total_length_km: totalDistance,
    total_elevation_gain: elevationGain,
    total_ride_time: formatDuration(totalTime),
    total_ride_time_minutes: totalTime / 60,
    instructions,
    data_source: 'valhalla'
  };
}

module.exports = {
  getValhallaRoute,
  formatValhallaResponse
};
