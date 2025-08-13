// calls the route generation backend
import locationService from './locationService.js';

export const generateRoute = async (preferences) => {
    try {
        console.log("🚀 === ROUTE GENERATION STARTED ===");
        console.log("📋 Frontend Preferences:", preferences);
        
        const startLat = preferences.startLat || "39.9526";
        const startLon = preferences.startLon || "-75.1652";
        const routeType = preferences.routeType === "outandback" ? "out_and_back" : "loop";
        
        console.log("📍 Start Location:", { lat: startLat, lon: startLon });
        console.log("🎯 Route Type:", routeType);
        console.log("📏 Target Distance:", preferences.distanceTarget, "km");
        
        // Transform frontend preferences to backend format
        const backendPreferences = {
            start_lat: parseFloat(startLat),
            start_lon: parseFloat(startLon),
            end_lat: parseFloat(preferences.endLat) || null,
            end_lon: parseFloat(preferences.endLon) || null,
            target_distance: parseFloat(preferences.distanceTarget) || 20.0,
            route_type: routeType,
            prefer_bike_lanes: preferences.bikeLanes !== false,
            prefer_unpaved: preferences.preferUnpaved || false,
            target_elevation_gain: preferences.elevationTarget || null,
            max_elevation_gain: preferences.maxElevation || null,
            avoid_highways: preferences.avoidHighTraffic || true,
            max_segment_length: 5.0,
            min_segment_length: 0.5
        };
        
        console.log("🔧 Backend Preferences:", backendPreferences);
        
        // Use the new hybrid endpoint for smooth, bikeable routes
        const response = await fetch('http://localhost:8000/api/generate-hybrid-route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                preferences: backendPreferences,
                include_metadata: true,
                optimize_for: preferences.routeType || "scenic"
            })
        });
        
        console.log("📡 API Response Status:", response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ API Error Response:", errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const routeData = await response.json();
        console.log("🎉 === ROUTE DATA RECEIVED ===");
        console.log("📊 Raw Route Data:", routeData);
        
        // Log route statistics
        console.log("📈 Route Statistics:");
        console.log(`   • Total Distance: ${routeData.total_distance_km} km`);
        console.log(`   • Waypoints Count: ${routeData.waypoints_count}`);
        console.log(`   • Route Type: ${routeData.route_type}`);
        console.log(`   • Success: ${routeData.success}`);
        console.log(`   • Elevation Gain: ${routeData.elevation_gain_m} m`);
        
        // Log elevation data if available
        if (routeData.elevation_profile) {
            console.log(`   • Elevation Profile: ${routeData.elevation_profile.length} data points`);
        }
        
        if (routeData.elevation_stats) {
            console.log("   • Elevation Stats:");
            console.log(`     - Min: ${routeData.elevation_stats.min_elevation} m`);
            console.log(`     - Max: ${routeData.elevation_stats.max_elevation} m`);
            console.log(`     - Avg: ${routeData.elevation_stats.avg_elevation} m`);
            console.log(`     - Gain: ${routeData.elevation_stats.elevation_gain} m`);
            console.log(`     - Loss: ${routeData.elevation_stats.elevation_loss} m`);
            console.log(`     - Total Climbing: ${routeData.elevation_stats.total_climb} m`);
        }
        
        if (routeData.estimated_duration_minutes) {
            console.log(`   • Estimated Duration: ${routeData.estimated_duration_minutes} minutes`);
        }
        
        if (routeData.difficulty_rating) {
            console.log(`   • Difficulty Rating: ${routeData.difficulty_rating}`);
        }
        
        // Log route coordinates (first few and last few)
        if (routeData.route && routeData.route.length > 0) {
            console.log("🗺️ Route Coordinates:");
            console.log(`   • Total Coordinates: ${routeData.route.length}`);
            
            if (routeData.route.length <= 10) {
                // Show all coordinates if 10 or fewer
                routeData.route.forEach((coord, index) => {
                    console.log(`     ${index}: (${coord.lat}, ${coord.lon})`);
                });
            } else {
                // Show first 5 and last 5 coordinates
                console.log("   • First 5 coordinates:");
                for (let i = 0; i < 5; i++) {
                    const coord = routeData.route[i];
                    console.log(`     ${i}: (${coord.lat}, ${coord.lon})`);
                }
                
                console.log("   • ...");
                
                console.log("   • Last 5 coordinates:");
                for (let i = routeData.route.length - 5; i < routeData.route.length; i++) {
                    const coord = routeData.route[i];
                    console.log(`     ${i}: (${coord.lat}, ${coord.lon})`);
                }
            }
        }
        
        // Calculate distance accuracy
        const targetDistance = parseFloat(preferences.distanceTarget) || 20.0;
        const actualDistance = routeData.total_distance_km;
        const accuracy = (actualDistance / targetDistance) * 100;
        const difference = actualDistance - targetDistance;
        
        console.log("🎯 Distance Accuracy Analysis:");
        console.log(`   • Target Distance: ${targetDistance} km`);
        console.log(`   • Actual Distance: ${actualDistance} km`);
        console.log(`   • Difference: ${difference > 0 ? '+' : ''}${difference.toFixed(2)} km`);
        console.log(`   • Accuracy: ${accuracy.toFixed(1)}%`);
        
        // Quality assessment
        console.log("⭐ Route Quality Assessment:");
        if (routeData.waypoints_count > 100) {
            console.log("   • 🚴 EXCELLENT: High-density route with smooth curves");
        } else if (routeData.waypoints_count > 50) {
            console.log("   • 🚴 GOOD: Medium-density route with good detail");
        } else if (routeData.waypoints_count > 20) {
            console.log("   • 🚴 FAIR: Moderate-density route");
        } else {
            console.log("   • ⚠️ BASIC: Low-density route (may be mathematical only)");
        }
        
        if (accuracy >= 90 && accuracy <= 110) {
            console.log("   • 📏 EXCELLENT: Distance accuracy within 10%");
        } else if (accuracy >= 80 && accuracy <= 120) {
            console.log("   • 📏 GOOD: Distance accuracy within 20%");
        } else {
            console.log("   • 📏 BASIC: Distance accuracy outside 20% range");
        }
        
        // Transform the response for frontend compatibility
        const transformedRouteData = {
            route: routeData.route,
            total_length_km: routeData.total_distance_km,
            total_length_formatted: `${routeData.total_distance_km.toFixed(1)} km`,
            total_elevation_gain: routeData.elevation_gain_m,
            waypoints_count: routeData.waypoints_count,
            route_type: routeData.route_type,
            success: routeData.success,
            estimated_duration_minutes: routeData.estimated_duration_minutes,
            difficulty_rating: routeData.difficulty_rating,
            surface_breakdown: routeData.surface_breakdown
        };
        
        console.log("🔄 Transformed Route Data:", transformedRouteData);
        console.log("✅ === ROUTE GENERATION COMPLETE ===");
        
        return transformedRouteData;
        
    } catch (error) {
        console.error("💥 Route generation failed:", error);
        throw error;
    }
}; 