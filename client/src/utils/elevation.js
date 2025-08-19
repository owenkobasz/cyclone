// Utility functions for elevation-related operations

/**
 * Get elevation data for route coordinates
 * @param {Array} coordinates - Array of coordinates with lat and lon
 * @returns {Promise<Array>} Coordinates with elevation data
 */
export async function getElevationData(coordinates) {
  try {
    // Uses Open Elevation's API to get elevation data
    const response = await fetch('https://api.open-elevation.com/api/v1/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        locations: coordinates.map(coord => ({
          latitude: coord.lat,
          longitude: coord.lon
        }))
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.results) {
        return coordinates.map((coord, index) => ({
          ...coord,
          elevation: data.results[index]?.elevation || 0
        }));
      } else {
        throw new Error('No elevation data received');
      }
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error getting elevation data:', error);

    // Return coordinates without elevation data
    return coordinates.map(coord => ({
      ...coord,
      elevation: null
    }));
  }
}

/**
 * Calculate elevation gain from route coordinates with elevation data
 * @param {Array} routeWithElevation - Array of coordinates with elevation data
 * @returns {number} Total elevation gain
 */
export function calculateElevationGain(routeWithElevation) {
  let totalGain = 0;

  for (let i = 1; i < routeWithElevation.length; i++) {
    const prevElevation = routeWithElevation[i - 1].elevation;
    const currElevation = routeWithElevation[i].elevation;

    if (prevElevation !== null && currElevation !== null) {
      const gain = currElevation - prevElevation;
      if (gain > 0) {
        totalGain += gain;
      }
    }
  }

  return totalGain;
}
