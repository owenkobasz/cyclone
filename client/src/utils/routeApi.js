// Utility for calling the route generation backend

export async function generateRoute(preferences) {
  console.log(`API call: generate-route - target_distance=${preferences.distance_target}km`);
  
  // Map frontend field names to backend field names
  const backendPreferences = {
    start_lat: parseFloat(preferences.start_lat),
    start_lon: parseFloat(preferences.start_lon),
    end_lat: parseFloat(preferences.end_lat),
    end_lon: parseFloat(preferences.end_lon),
    target_distance: parseFloat(preferences.distance_target) * 1.60934, // Convert miles to kilometers
    max_elevation_gain: parseFloat(preferences.elevation_target) * 0.3048, // Convert feet to meters
    avoid_hills: preferences.avoid_hills,
    use_bike_lanes: preferences.bike_lanes,
  };

  const response = await fetch('http://localhost:8000/api/generate-route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(backendPreferences)
  });
  if (!response.ok) {
    throw new Error('Failed to generate route');
  }
  return await response.json();
} 

export async function generateRouteWithGPT(preferences) {
  const backendPreferences = {
    start_lat: parseFloat(preferences.start_lat),
    start_lon: parseFloat(preferences.start_lon),
    end_lat: parseFloat(preferences.end_lat),
    end_lon: parseFloat(preferences.end_lon),
    target_distance: parseFloat(preferences.distance_target) * 1.60934,
    max_elevation_gain: parseFloat(preferences.elevation_target) * 0.3048,
    avoid_hills: preferences.avoid_hills,
    use_bike_lanes: preferences.bike_lanes,
  };

  const response = await fetch('http://localhost:8000/api/generate-route-gpt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(backendPreferences)
  });
  if (!response.ok) {
    throw new Error('Failed to generate GPT-assisted route');
  }
  return await response.json();
} 

export async function generateRouteWithGPTGraphHopper(preferences) {
  const backendPreferences = {
    start_lat: parseFloat(preferences.start_lat),
    start_lon: parseFloat(preferences.start_lon),
    end_lat: parseFloat(preferences.end_lat),
    end_lon: parseFloat(preferences.end_lon),
    target_distance: parseFloat(preferences.distance_target) * 1.60934,
    max_elevation_gain: parseFloat(preferences.elevation_target) * 0.3048,
    avoid_hills: preferences.avoid_hills,
    use_bike_lanes: preferences.bike_lanes,
  };

  const response = await fetch('http://localhost:8000/api/generate-route-gpt-graphhopper', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(backendPreferences)
  });
  if (!response.ok) {
    throw new Error('Failed to generate GPT+GraphHopper route');
  }
  return await response.json();
} 