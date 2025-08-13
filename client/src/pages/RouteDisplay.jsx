// pages/RouteDisplay.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import RouteStats from '../components/RouteStats';
import MapComponent from '../components/MapComponent';
import Button from '../components/Button';

const RouteDisplay = () => {
    const location = useLocation();
    const [routeData, setRouteData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (location.state?.routeData) {
            console.log("🗺️ === ROUTE DISPLAY COMPONENT ===");
            console.log("📥 Received route data from navigation:", location.state.routeData);
            
            const data = location.state.routeData;
            console.log("📊 Route Data Breakdown:");
            console.log(`   • Route Type: ${data.route_type}`);
            console.log(`   • Total Distance: ${data.total_length_km} km`);
            console.log(`   • Waypoints Count: ${data.waypoints_count}`);
            console.log(`   • Success: ${data.success}`);
            
            if (data.route && Array.isArray(data.route)) {
                console.log(`   • Route Coordinates: ${data.route.length} points`);
                console.log("   • First coordinate:", data.route[0]);
                console.log("   • Last coordinate:", data.route[data.route.length - 1]);
                
                // Log coordinate density
                if (data.route.length > 100) {
                    console.log("   • 🚴 HIGH DENSITY: Smooth, bikeable route with many waypoints");
                } else if (data.route.length > 50) {
                    console.log("   • 🚴 MEDIUM DENSITY: Good route detail");
                } else if (data.route.length > 20) {
                    console.log("   • 🚴 MODERATE DENSITY: Basic route detail");
                } else {
                    console.log("   • ⚠️ LOW DENSITY: May be mathematical waypoints only");
                }
            }
            
            setRouteData(data);
        }
    }, [location.state]);

    const handleGenerateNewRoute = () => {
        console.log("🔄 User requested new route generation");
        // Navigate back to route generation
        window.history.back();
    };

    if (!routeData) {
        console.log("❌ No route data available for display");
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white mb-4">No Route Data</h1>
                    <p className="text-blue-200 mb-6">Please generate a route first.</p>
                    <Button onClick={handleGenerateNewRoute} className="bg-blue-600 hover:bg-blue-700">
                        Generate Route
                    </Button>
                </div>
            </div>
        );
    }

    console.log("🎨 Rendering RouteDisplay with data:", routeData);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
            <div className="container mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-4">
                        Your Cycling Route
                    </h1>
                    <p className="text-blue-200 text-lg">
                        {routeData.route_type === 'loop' ? 'Loop Route' : 'Point-to-Point Route'}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Route Statistics */}
                    <div className="lg:col-span-1">
                        <RouteStats routeData={routeData} />
                    </div>

                    {/* Map Display */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-lg p-4">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Route Map</h2>
                            <MapComponent route={routeData.route} />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="text-center mt-8">
                    <Button 
                        onClick={handleGenerateNewRoute}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                    >
                        Generate New Route
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default RouteDisplay;
