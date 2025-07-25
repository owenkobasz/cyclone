// Utility for calling the route generation backend

export async function generateRoute(preferences) {
  const response = await fetch('http://localhost:8000/api/generate-custom-route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preferences)
  });
  if (!response.ok) {
    throw new Error('Failed to generate route');
  }
  return await response.json();
} 