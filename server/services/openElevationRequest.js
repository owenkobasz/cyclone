const axios = require('axios');

async function getOpenElevation(coordinates, options) {
  try {
    // Open Elevation API has a limit of ~1000 points per request
    // Sample coordinates if we have too many to avoid hitting limits
    let sampledCoordinates = coordinates;
    if (coordinates.length > 100) {
      // Sample every nth coordinate to get ~100 points
      const step = Math.ceil(coordinates.length / 100);
      sampledCoordinates = coordinates.filter((_, index) => index % step === 0);
      console.log(`Sampling ${sampledCoordinates.length} coordinates from ${coordinates.length} for Open Elevation`);
    }

    const requestBody = {
      locations: sampledCoordinates.map(coord => ({
        latitude: coord.lat,
        longitude: coord.lon
      }))
    };

    console.log('Open Elevation request:', {
      url: 'https://api.open-elevation.com/api/v1/lookup',
      coordinates: sampledCoordinates.length
    });

    const response = await axios.post('https://api.open-elevation.com/api/v1/lookup', requestBody, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    if (response.data && response.data.results && response.data.results.length > 0) {
      const elevations = response.data.results.map(result => result.elevation);
      let totalElevationGain = 0;
      
      // Calculate elevation gain from height differences
      for (let i = 1; i < elevations.length; i++) {
        const elevationDiff = elevations[i] - elevations[i-1];
        if (elevationDiff > 0) {
          totalElevationGain += elevationDiff;
        }
      }

      console.log(`Calculated elevation gain from Open Elevation API: ${totalElevationGain}m`);

      return totalElevationGain;
    }
    
    return null;
  } catch (error) {
    console.log('Open Elevation API failed:', error.message);
    return null;
  }
}

function throwElevationError() {
  throw new Error('Elevation data not available from the routing API. Cannot provide elevation gain information.');
}

module.exports = {
  getOpenElevation,
  throwElevationError
};
