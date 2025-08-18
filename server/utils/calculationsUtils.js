/**
 * Combines utilities for calculations including geography and route difficulty
 */

/**
 * Calculates distance between two geographical points using Haversine formula
 */
function calculateDistance(point1, point2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
  const dLon = ((point2.lon - point1.lon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.lat * Math.PI) / 180) * Math.cos((point2.lat * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates distance requirements for waypoint generation based on target distance
 */
function calculateDistanceRequirements(targetDistance) {
  let waypointSpacing, minWaypoints, maxWaypoints, distanceGuidance;
  
  if (targetMiles >= 20) {
    // Long routes (20+ miles)
    waypointSpacing = '5-10 miles apart from each other';
    minWaypoints = 3;
    maxWaypoints = 8;
    distanceGuidance = 'For this longer route, place waypoints strategically 5-10 miles apart to create a route that actually achieves the target distance when connected by roads.';
  } else if (targetMiles >= 10) {
    // Medium routes (10-20 miles)
    waypointSpacing = '3-7 miles apart from each other';
    minWaypoints = 3;
    maxWaypoints = 6;
    distanceGuidance = 'For this medium-distance route, place waypoints 3-7 miles apart to ensure the final route meets the target distance.';
  } else if (targetMiles >= 5) {
    // Short-medium routes (5-10 miles)
    waypointSpacing = '2-4 miles apart from each other';
    minWaypoints = 2;
    maxWaypoints = 5;
    distanceGuidance = 'For this route, place waypoints 2-4 miles apart to create the target distance when following roads.';
  } else {
    // Short routes (under 5 miles)
    waypointSpacing = '1-3 miles apart from each other';
    minWaypoints = 2;
    maxWaypoints = 4;
    distanceGuidance = 'For this shorter route, place waypoints 1-3 miles apart to achieve the target distance.';
  }
  
  return {
    waypointSpacing,
    minWaypoints,
    maxWaypoints,
    distanceGuidance
  };
}

/**
 * Calculates route difficulty based on distance, elevation, and options
 */
function calculateRouteDifficulty(routeData, options) {
  const {
    total_length_km,
    total_elevation_gain,
    total_ride_time_minutes
  } = routeData;
  
  let difficultyScore = 0;
  
  // Distance factor (0-30 points)
  if (total_length_km < 5) difficultyScore += 5;
  else if (total_length_km < 10) difficultyScore += 10;
  else if (total_length_km < 20) difficultyScore += 20;
  else difficultyScore += 30;
  
  // Elevation factor (0-40 points)
  const elevationPerKm = total_elevation_gain / total_length_km;
  if (elevationPerKm < 10) difficultyScore += 5;
  else if (elevationPerKm < 20) difficultyScore += 15;
  else if (elevationPerKm < 40) difficultyScore += 25;
  else difficultyScore += 40;
  
  // Route type factor (0-20 points)
  switch (options.route_type) {
    case 'fitness':
      difficultyScore += 20;
      break;
    case 'urban':
      difficultyScore += 15;
      break;
    case 'nature':
      difficultyScore += 10;
      break;
    case 'scenic':
    default:
      difficultyScore += 5;
      break;
  }
  
  // Advanced options factor (0-10 points)
  if (options.avoid_hills) difficultyScore -= 5;
  if (options.use_bike_lanes) difficultyScore -= 2;
  if (options.avoid_traffic) difficultyScore -= 2;
  if (options.elevation_focus) difficultyScore += 10;
  
  // Determine difficulty level
  if (difficultyScore < 20) return 'Easy';
  else if (difficultyScore < 40) return 'Moderate';
  else if (difficultyScore < 60) return 'Challenging';
  else return 'Expert';
}

module.exports = {
  calculateDistance,
  calculateDistanceRequirements,
  calculateRouteDifficulty
};
