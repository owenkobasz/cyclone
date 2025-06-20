// pages/RouteDisplay.jsx
import React, {useEffect, useState} from 'react';
import config from '../config';

import { MapContainer, TileLayer } from 'react-leaflet';

// import componenets
import GpxLoader from '../components/GpxLoader';
import StatsCard from '../components/StatsCard';
import RoutePreferences from '../components/RoutePreferences';
import CueSheet from '../components/CueSheet';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Header from '../components/ui/Header';

export default function RouteDisplay() {
    const [cueSheet, setCueSheet] = useState([]);
    // default units = imperial
    const [unitSystem, setUnitSystem] = useState("imperial");
    // gpx info is in metric
    const [rawStats, setRawStats] = useState({ distanceKm: null, elevationM: null });
    // name of current route
    // TODO: possible AI integration can be naming routs
    const [routeName, setRouteName] = useState("Default Route");

    // route preferences/parameters
    // basic: starting point, target distance, target elevation
    // advanced: bike routes weight, poi weight
    // TODO: use location to set default starting point, otherwise make it city hall
    // TODO: default distace: 20 miles; default elevation: 1000ft
    const [preferences, setPreferences] = useState({
        startingPoint: null,
        endingPoint: null,
        distanceTarget: null,
        elevationTarget: null,
        bikeLanes: false,
        pointsOfInterest: false,
    });

    // generate routes when button clicked
    useEffect(() => {
        // TODO: create route to backend for route generation
    }, []);

    return (
        <div className="bg-base min-h-screen text-gray-800">
            <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-4 p-4">
                <div>
                    <Card className="mb-4">
                        <StatsCard stats={rawStats} unitSystem={unitSystem} setUnitSystem={setUnitSystem} />
                    </Card>
                    <CueSheet cueSheet={cueSheet} />
                </div>
                <div className="col-span-3 flex flex-col items-center space-y-2">
                    <Header className="font-semibold" level={2}>{routeName}</Header>
                    <MapContainer className="h-[300px] md:h-[400px] w-full rounded-xl shadow-md z-0" center={[39.95, -75.16]} zoom={13}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <GpxLoader onStatsReady={setRawStats} onCuesReady={setCueSheet} />
                    </MapContainer>
                </div>
                <div className="col-span-1">
                    <RoutePreferences preferences={preferences} setPreferences={setPreferences} />
                    {/* TODO: Swap current filler for actual button
                    Step 1: Export the current route.
                    Step 2: Be able to save the route in the user's library.
                    */}
                    <Button as="a" href="/chill_hills.gpx" download="chill_hills.gpx">
                        Export GPX
                    </Button>
                </div>
            </div>
        </div>
    );
}
