// components/RoutePreferences.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import LocationAutocomplete from "./LocationAutocomplete";
import Toggle from "./Toggle";

export default function RoutePreferences({ preferences, setPreferences, userLocation = null }) {
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleChange = (field) => (value) => {
        setPreferences((prev) => ({ ...prev, [field]: value }));
    };

    const handleCheckboxChange = (field) => (e) => {
        setPreferences((prev) => ({ ...prev, [field]: e.target.checked }));
    };

    const routeTypes = [
        { id: 'scenic', label: 'Scenic rides', description: 'Beautiful views and landscapes' },
        { id: 'nature', label: 'Nature focused', description: 'Parks, trails, and green spaces' },
        { id: 'fitness', label: 'Fitness enthusiast', description: 'Challenging routes for elevation training' },
        { id: 'urban', label: 'Urban explorer', description: 'City streets and urban attractions' },
    ];

    const hasStartingPoint = preferences.startingPoint && preferences.startingPoint.trim().length > 0;

    return (
<<<<<<< HEAD
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
=======
        <motion.div
            className="relative p-6 bg-n-8/40 backdrop-blur-sm rounded-2xl border border-n-2/20 transition-all duration-300 hover:border-color-2/50"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            viewport={{ once: true }}
        >
            <h3 className="h3 mb-6 text-n-1">Route Preferences</h3>
            
            {/* Location Inputs */}
            <div className="space-y-4 mb-6">
                <div>
                    <label className="body-2 text-n-3 mb-2 block">Starting Point</label>
                    <LocationAutocomplete
                        value={preferences.startingPoint || ''}
                        onChange={handleChange('startingPoint')}
                        placeholder="e.g., City Hall, Central Park, Main Street"
                        userLocation={userLocation}
                    />
                </div>
                <div>
                    <label className="body-2 text-n-3 mb-2 block">End Location (Optional)</label>
                    <LocationAutocomplete
                        value={preferences.endingPoint || ''}
                        onChange={handleChange('endingPoint')}
                        placeholder="Leave empty for loop route"
                        userLocation={userLocation}
>>>>>>> b793827 (Generate Route UI redesign)
                    />
                </div>
            </div>

<<<<<<< HEAD
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
=======
            {/* Route Type Selection - Show after starting point is selected */}
            {hasStartingPoint && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="mb-6"
                >
                    <label className="body-2 text-n-3 mb-3 block">Route Type</label>
                    <div className="grid grid-cols-2 gap-3">
                        {routeTypes.map((type) => (
                            <motion.button
                                key={type.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleChange('routeType')(type.id)}
                                className={`p-3 rounded-xl border transition-all duration-300 text-left ${
                                    preferences.routeType === type.id
                                        ? 'border-color-1 bg-color-1/10 text-color-1'
                                        : 'border-n-6 bg-n-7/50 text-n-2 hover:border-n-5 hover:bg-n-7'
                                }`}
                            >
                                <div className="font-medium text-sm mb-1">{type.label}</div>
                                <div className="text-xs text-n-4">{type.description}</div>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Distance Target */}
            <div className="mb-6">
                <label className="body-2 text-n-3 mb-3 block">
                    Distance: <span className="text-color-1 font-semibold">{preferences.distanceTarget || 0} mi</span>
                </label>
                <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={preferences.distanceTarget || 20}
                    onChange={(e) => handleChange('distanceTarget')(e.target.value)}
                    className="w-full h-2 bg-n-6 rounded-lg appearance-none cursor-pointer slider"
                />
>>>>>>> b793827 (Generate Route UI redesign)
            </div>

            {/* Advanced Options Toggle */}
            <div className="mb-4">
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center justify-between w-full p-3 bg-n-7/50 hover:bg-n-7 rounded-xl border border-n-6 transition-all duration-300"
                >
                    <span className="body-1 text-n-2 font-semibold">Advanced Options</span>
                    <motion.svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="text-n-4"
                        animate={{ rotate: showAdvanced ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/>
                    </motion.svg>
                </button>
            </div>

            {/* Advanced Options Content */}
            <motion.div
                initial={false}
                animate={{
                    height: showAdvanced ? "auto" : 0,
                    opacity: showAdvanced ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
            >
                <div className="space-y-4 pb-4">
                    {/* Toggle Options */}
                    <div className="space-y-3">
                        <Toggle
                            checked={preferences.bikeLanes || false}
                            onChange={handleCheckboxChange('bikeLanes')}
                            label="Prioritize bike lanes"
                        />
                        <Toggle
                            checked={preferences.pointsOfInterest || false}
                            onChange={handleCheckboxChange('pointsOfInterest')}
                            label="Include points of interest"
                        />
                        <Toggle
                            checked={preferences.avoidHighTraffic || false}
                            onChange={handleCheckboxChange('avoidHighTraffic')}
                            label="Avoid high traffic areas"
                        />
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
