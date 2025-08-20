const axios = require('axios');
const { ROUTING_APIS } = require('../config/config');
const { decodeValhallaPolyline } = require('../utils/polylineDecoder');
const { formatDuration } = require('../utils/formatters');
// const { formatDistance } = require('../utils/formatters'); // Commented out
const { getValhallaInstructionType } = require('../utils/instructionMappers');
const { getOpenElevation } = require('./openElevationRequest');

async function getValhallaRoute(waypoints, options) {
  console.log('=== STARTING VALHALLA REQUEST ===');
  
  // Build Valhalla request payload
  const locations = waypoints.map(waypoint => ({
    lat: waypoint.lat,
    lon: waypoint.lon
  }));

  // Determine Valhalla units based on user preference
  const valhallaUnits = (options.unit_system === 'mi') ? 'miles' : 'kilometers';
  console.log(`Using Valhalla units: ${valhallaUnits} (based on user preference: ${options.unit_system})`);

  console.log('=== BEFORE AXIOS REQUEST ===');
  
  const requestBody = {
    locations: locations,
    costing: 'bicycle',
    directions_options: { units: valhallaUnits },
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

  console.log('=== MAKING AXIOS REQUEST ===');

  const response = await axios.post(ROUTING_APIS.VALHALLA.url, requestBody, {
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 20000
  });

  console.log('=== AXIOS REQUEST COMPLETED ===');
  console.log('Response data trip legs:', response.data.trip ? response.data.trip.legs?.length : 'No trip data');

  if (response.data.trip && response.data.trip.legs) {
    console.log('=== CALLING formatValhallaResponse ===');
    console.log('valhallaUnits before function call:', valhallaUnits);
    const result = await formatValhallaResponse(response.data.trip, options, valhallaUnits);
    console.log('=== formatValhallaResponse COMPLETED ===');
    return result;
  }

  throw new Error('No valid route found from Valhalla');
}

async function formatValhallaResponse(trip, options, valhallaUnits) {
  console.log(`=== VALHALLA RESPONSE FORMATTING START ===`);
  console.log(`valhallaUnits parameter received:`, valhallaUnits, `(type: ${typeof valhallaUnits})`);
  console.log(`trip.legs.length:`, trip.legs ? trip.legs.length : 'trip.legs is undefined');
  console.log(`===========================================`);
  
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
    totalDistance += legDistance; // in user's preferred units (km or miles)
    totalTime += leg.summary?.time || 0; // in seconds
    
    console.log(`DEBUG: valhallaUnits parameter is:`, valhallaUnits, `(type: ${typeof valhallaUnits})`);
    const distanceUnit = valhallaUnits === 'miles' ? 'mi' : 'km';
    console.log(`Leg ${legIndex} distance: ${legDistance} ${distanceUnit}, Running total: ${totalDistance} ${distanceUnit}`);
    
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
          // Convert distance to meters for consistency
          const distance = valhallaUnits === 'miles' ? 
            maneuver.length * 1609.34 : // Convert miles to meters
            maneuver.length * 1000;     // Convert km to meters
          
          const mappedType = getValhallaInstructionType(maneuver.type);
          console.log(`Valhalla instruction mapping: type ${maneuver.type} -> ${mappedType} (${maneuver.instruction})`);
          
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

  // Convert distance to meters 
  const totalDistanceMeters = valhallaUnits === 'miles' ? 
    totalDistance * 1609.34 : // Convert miles to meters
    totalDistance * 1000;     // Convert km to meters

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
  const distanceUnit = valhallaUnits === 'miles' ? 'mi' : 'km';
  const conversionFactor = valhallaUnits === 'miles' ? '1609.34' : '1000';
  console.log(`=== ROUTE DATA DEBUG ===`);
  console.log(`Number of legs processed: ${trip.legs.length}`);
  console.log(`total_distance_raw: ${totalDistance} ${distanceUnit}`);
  console.log(`total_elevation_gain: ${elevationGain}`);
  console.log(`totalDistanceMeters calculation: ${totalDistance} ${distanceUnit} * ${conversionFactor} = ${totalDistanceMeters} meters`);
  console.log(`========================`);

  // Return distance in user's preferred units (no forced conversion to km)
  const totalDistanceUserSpecified = totalDistance; // Keep in original units requested by user
  const unitLabel = valhallaUnits === 'miles' ? 'mi' : 'km';

  return {
    route: coordinates,
    total_distance: totalDistanceUserSpecified,  
    total_distance_unit: unitLabel,          
    total_length_km: totalDistanceUserSpecified, 
    total_elevation_gain: elevationGain,
    total_ride_time: formatDuration(totalTime),
    total_ride_time_minutes: totalTime / 60,
    instructions,
    unit_system: options.unit_system,
    data_source: 'valhalla'
  };
}

module.exports = {
  getValhallaRoute,
  formatValhallaResponse
};
