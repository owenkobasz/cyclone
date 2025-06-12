// pages/RouteDisplay.jsx
import { MapContainer, TileLayer } from 'react-leaflet';
import { useState } from 'react';
import GpxLoader from '../components/GpxLoader';
import StatsCard from '../components/StatsCard';
import RoutePreferences from '../components/RoutePreferences';
import CueSheet from '../components/CueSheet';

export default function RouteDisplay() {
    const [cueSheet, setCueSheet] = useState([]);
    // default units = imperial
    const [unitSystem, setUnitSystem] = useState("imperial");
    // gpx info is in metric
    const [rawStats, setRawStats] = useState({ distanceKm: null, elevationM: null });
    // name of current route
    // NOTE: possible AI integration can be naming routs
    const [routeName, setRouteName] = useState("Default Route");


    return (
        <div className="bg-base min-h-screen text-gray-800">
            <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-4 p-4">
                <div>
                    <StatsCard stats={rawStats} unitSystem={unitSystem} setUnitSystem={setUnitSystem} />
                    <RoutePreferences />
                </div>
                <div className="col-span-3 flex flex-col items-center space-y-2">
                    <div className="font-semibold"> {routeName}</div>
                    <MapContainer className="h-[300px] md:h-[400px] w-full rounded-xl shadow-md z-0" center={[39.95, -75.16]} zoom={13}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <GpxLoader onStatsReady={setRawStats} onCuesReady={setCueSheet} />
                    </MapContainer>
                </div>
                <div className="col-span-1">
                    <CueSheet cueSheet={cueSheet} />
                    <a href="/chill_hills.gpx" download="chill_hills.gpx"
                       className="block w-full text-center px-4 py-2 mt-2  rounded shadow hover:bg-[#3bc6df] transition">
                        Export GPX
                    </a>
                </div>
            </div>
        </div>
    );
}
