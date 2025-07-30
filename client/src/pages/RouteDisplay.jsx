<<<<<<< HEAD
// pages/RouteDisplay.jsx
import React, {useState} from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import GpxLoader from '../components/GpxLoader';
import StatsCard from '../components/StatsCard';
import RoutePreferences from '../components/RoutePreferences';
import CueSheet from '../components/CueSheet';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Header from '../components/ui/Header';
import { generateRoute } from '../utils/routeApi';

function calculateRouteStats(route) {
    if (!route || route.length < 2) return { distanceKm: null, elevationM: null };
    let distanceKm = 0;
    let elevationM = 0;
    for (let i = 1; i < route.length; i++) {
        const lat1 = route[i - 1].lat, lon1 = route[i - 1].lon;
        const lat2 = route[i].lat, lon2 = route[i].lon;
        // Haversine formula for distance
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distanceKm += R * c;
        // Elevation gain (if available)
        if (route[i].elevation !== undefined && route[i - 1].elevation !== undefined) {
            const gain = route[i].elevation - route[i - 1].elevation;
            if (gain > 0) elevationM += gain;
        }
    }
    return { distanceKm, elevationM };
}

export default function RouteDisplay() {
    const [cueSheet, setCueSheet] = useState([]);
    // default units = imperial
    const [unitSystem, setUnitSystem] = useState("imperial");
    // gpx info is in metric
    const [rawStats, setRawStats] = useState({ distanceKm: null, elevationM: null });
    // name of current route
    // TODO: possible AI integration can be naming routs
    const [routeName, setRouteName] = useState("Default Route");
    const [stats, setStats] = useState({ distanceKm: null, elevationM: null });

    // route preferences/parameters
    // basic: starting point, target distance, target elevation
    // advanced: bike routes weight, poi weight
    // TODO: use location to set default starting point, otherwise make it city hall
    // TODO: default distace: 20 miles; default elevation: 1000ft
    const [preferences, setPreferences] = useState({
        start_lat: 39.95,
        start_lon: -75.16,
        end_lat: 39.98,
        end_lon: -75.20,
        distance_target: 8.0,
        elevation_target: 100,
        bike_lanes: true,
        points_of_interest: false,
        avoid_hills: true,
    });
    const [route, setRoute] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleGenerateRoute = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await generateRoute(preferences);
            setRoute(data.route);
            setRouteName(`Route (${data.total_length_km?.toFixed(2) || '?'} km)`);
            setStats(calculateRouteStats(data.route));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-base min-h-screen text-gray-800">
            <div className="w-full">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Sidebar - Route Preferences */}
                    <div className="lg:col-span-3">
                        <div className="space-y-4">
                            <RoutePreferences preferences={preferences} setPreferences={setPreferences} />
                            <Button className="w-full" onClick={handleGenerateRoute} disabled={loading}>
                                {loading ? 'Generating...' : 'Generate Route'}
                            </Button>
                            {error && <div className="text-red-600 mt-2">{error}</div>}
                        </div>
                    </div>

                    {/* Center - Map and Route Name */}
                    <div className="lg:col-span-6 flex flex-col items-center space-y-4">
                        <Header className="font-semibold text-center" level={2}>{routeName}</Header>
                        <div className="w-full h-[400px] lg:h-[500px] xl:h-[600px] rounded-xl shadow-lg overflow-hidden">
                            <MapContainer className="h-full w-full" center={[39.95, -75.16]} zoom={13}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                {route && (
                                    <>
                                        <Polyline positions={route.map(pt => [pt.lat, pt.lon])} color="blue" />
                                        {/* Start Marker */}
                                        <Marker position={[route[0].lat, route[0].lon]}>
                                            <Popup>Start</Popup>
                                        </Marker>
                                        {/* End Marker */}
                                        <Marker position={[route[route.length - 1].lat, route[route.length - 1].lon]}>
                                            <Popup>End</Popup>
                                        </Marker>
                                    </>
                                )}
                                {/* <GpxLoader onStatsReady={setRawStats} onCuesReady={setCueSheet} /> */}
                            </MapContainer>
                        </div>
                    </div>

                    {/* Right Sidebar - Stats and Cue Sheet */}
                    <div className="lg:col-span-3">
                        <div className="space-y-4">
                            <Card>
                                <StatsCard stats={stats} unitSystem={unitSystem} setUnitSystem={setUnitSystem} />
                            </Card>
                            <CueSheet cueSheet={cueSheet} />
                            <Button as="a" href="/chill_hills.gpx" download="chill_hills.gpx" className="w-full">
                                Export GPX
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
=======
// // pages/RouteDisplay.jsx
// import React, {useEffect, useState} from 'react';
// import config from '../config';

// import { MapContainer, TileLayer } from 'react-leaflet';

// // import componenets
// import GpxLoader from '../components/GpxLoader';
// import StatsCard from '../components/StatsCard';
// import RoutePreferences from '../components/RoutePreferences';
// import CueSheet from '../components/CueSheet';
// import Button from '../components/ui/Button';
// import Card from '../components/ui/Card';
// import Header from '../components/ui/Header';

// export default function RouteDisplay() {
//     const [cueSheet, setCueSheet] = useState([]);
//     // default units = imperial
//     const [unitSystem, setUnitSystem] = useState("imperial");
//     // gpx info is in metric
//     const [rawStats, setRawStats] = useState({ distanceKm: null, elevationM: null });
//     // name of current route
//     // TODO: possible AI integration can be naming routs
//     const [routeName, setRouteName] = useState("Default Route");

//     // route preferences/parameters
//     // basic: starting point, target distance, target elevation
//     // advanced: bike routes weight, poi weight
//     // TODO: use location to set default starting point, otherwise make it city hall
//     // TODO: default distace: 20 miles; default elevation: 1000ft
//     const [preferences, setPreferences] = useState({
//         startingPoint: null,
//         endingPoint: null,
//         distanceTarget: null,
//         elevationTarget: null,
//         bikeLanes: false,
//         pointsOfInterest: false,
//     });

//     // generate routes when button clicked
//     // TODO: implement, should run when triggered via button or page loads
//     useEffect(() => {
//         // TODO: create route to backend for route generation
//     }, []);

//     return (
//         <div className="bg-base min-h-screen text-gray-800">
//             <div className="w-full">
//                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
//                     {/* Left Sidebar - Route Preferences */}
//                     <div className="lg:col-span-3">
//                         <div className="space-y-4">
//                             <RoutePreferences preferences={preferences} setPreferences={setPreferences} />
//                             <Button className="w-full">
//                                 Generate Route
//                             </Button>
//                         </div>
//                     </div>

//                     {/* Center - Map and Route Name */}
//                     <div className="lg:col-span-6 flex flex-col items-center space-y-4">
//                         <Header className="font-semibold text-center" level={2}>{routeName}</Header>
//                         <div className="w-full h-[400px] lg:h-[500px] xl:h-[600px] rounded-xl shadow-lg overflow-hidden">
//                             <MapContainer className="h-full w-full" center={[39.95, -75.16]} zoom={13}>
//                                 <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
//                                 <GpxLoader onStatsReady={setRawStats} onCuesReady={setCueSheet} />
//                             </MapContainer>
//                         </div>
//                     </div>

//                     {/* Right Sidebar - Stats and Cue Sheet */}
//                     <div className="lg:col-span-3">
//                         <div className="space-y-4">
//                             <Card>
//                                 <StatsCard stats={rawStats} unitSystem={unitSystem} setUnitSystem={setUnitSystem} />
//                             </Card>
//                             <CueSheet cueSheet={cueSheet} />
//                             <Button as="a" href="/chill_hills.gpx" download="chill_hills.gpx" className="w-full">
//                                 Export GPX
//                             </Button>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }
>>>>>>> 85abfde (Home page and about section. Redesigned the UI)
