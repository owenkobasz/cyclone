// components/RoutePreferences.jsx
import Card from './ui/Card';
import Header from './ui/Header';
import Input from './ui/Input';
import Button from "./ui/Button.jsx";
import React from "react";

export default function RoutePreferences({ preferences, setPreferences }) {
    const handleChange = (field) => (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setPreferences((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <Card>
            <Header level={2}>Route Preferences</Header>
            <div className="space-y-2">
                <label className="block">
                    {/* TODO: currently only acceptsmanually entered lat/lon as a string, need to use an API for smarter loaction, then convert to lat/long */}
                    {/* TODO: integrate google autocomplete - https://www.npmjs.com/package/react-google-autocomplete?activeTab=readme */}
                    <input type="text" placeholder="Start Latitude" value={preferences.start_lat || ''} onChange={handleChange('start_lat')} className="w-full px-3 py-2"  />
                </label>
                <label className="block">
                     {/* TODO: integrate google autocomplete */}
                    <input type="text" placeholder="Start Longitude" value={preferences.start_lon || ''} onChange={handleChange('start_lon')} className="w-full px-3 py-2"  />
                </label>
                <label className="block">
                    <input type="text" placeholder="End Latitude" value={preferences.end_lat || ''} onChange={handleChange('end_lat')} className="w-full px-3 py-2"  />
                </label>
                <label className="block">
                    <input type="text" placeholder="End Longitude" value={preferences.end_lon || ''} onChange={handleChange('end_lon')} className="w-full px-3 py-2"  />
                </label>
            </div>
            <div className="space-y-1">
                <label className="font-medium block">Distance: {preferences.distance_target} mi</label>
                <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min="0"
                        max="125"
                        step="5"
                        value={preferences.distance_target || 0}
                        onChange={handleChange('distance_target')}
                        className="w-full"
                    />
                </div>
            </div>
            <div className="space-y-1">
                {/* TODO1: make the units consistent */}
                {/* TODO2: add option for numerical input */}
                <label className="font-medium block">Elevation: {preferences.elevation_target} ft</label>
                <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min="0"
                        max="10000"
                        step="100"
                        value={preferences.elevation_target || 0}
                        onChange={handleChange('elevation_target')}
                        className="w-full"
                    />
                </div>
            </div>

            <div className="space-y-2">
                {/* TODO: Make this a popout of some kind */}
                <h2 className="font-medium block py-3">Additional Options:</h2>
                <label className="block">
                    <input type="checkbox" className="mr-2" checked={preferences.bike_lanes} onChange={handleChange('bike_lanes')} />
                    Prioritize bike lanes
                </label>
                <label className="block">
                    <input type="checkbox" className="mr-2" checked={preferences.points_of_interest} onChange={handleChange('points_of_interest')} />
                    Points of interest
                </label>
                <label className="block">
                    <input type="checkbox" className="mr-2" checked={preferences.avoid_hills} onChange={handleChange('avoid_hills')} />
                    Avoid hills
                </label>
            </div>




        </Card>
    );
}
