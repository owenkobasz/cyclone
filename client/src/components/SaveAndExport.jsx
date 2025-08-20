import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Button from "./Button";
import { generateGpxFile, saveRoute } from "../utils/routeApi";
import { useAuth } from "../contexts/AuthContext";
import { ChevronDown } from 'lucide-react';

export default function SaveAndExport({
    routeData,
    stats,
    cueSheet,
    preferences,
    onSave,
    saveEndpoint = "http://localhost:3000/api/routes/plan/save",
    canSave = true,
    canExport = true,
    saveButtonText = "Save Route",
    exportButtonText = "Export GPX",
    title = "Save & Export"
}) {
    const { user } = useAuth();
    const [routeName, setRouteName] = useState(routeData?.gpt_metadata?.gpt_route_name || "");
    const [gpxName, setGpxName] = useState(routeData?.gpt_metadata?.gpt_route_name || "");
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    // Default canSave logic if not provided
    const shouldAllowSave = canSave !== undefined ? canSave : (routeData && routeData.route && user);

    // Default canExport logic if not provided
    const shouldAllowExport = canExport !== undefined ? canExport : (routeData && routeData.route && Array.isArray(routeData.route) && routeData.route.length > 0);

    const handleExportGpx = () => {
        if (!shouldAllowExport) {
            console.warn("No route data available for export");
            return;
        }

        console.log("Exporting route as GPX...", routeData);
        const routeName = gpxName || routeData?.gpt_metadata?.gpt_route_name || null;
        console.log("Route name for export:", routeName);
        generateGpxFile(routeData.route, routeName);
    };

    const handleSaveRoute = async () => {
        // If custom save handler is provided, use it
        if (onSave) {
            onSave();
            return;
        }

        // Default save logic
        if (!shouldAllowSave) {
            if (!user) {
                alert("You must be logged in to save a route.");
                return;
            }
            if (!routeData) {
                alert("No route data available to save.");
                return;
            }
            return;
        }

        console.log("Saving route...");
        try {
            const fileName = routeName.trim() !== "" ? routeName.trim() : null;
            console.log("Route name for export:", routeName);
            const data = await saveRoute({
                routeName: fileName,
                waypoints: routeData.route || [],
                rawStats: stats,
                cueSheet,
                preferences,
            });
            alert("Route saved successfully!");
        } catch (err) {
            if (err.message.includes("409")) {
                alert("That route name is already taken. Please enter a different one.");
            } else {
                console.error("Save route error:", err);
                alert("Failed to save route: " + err.message);
            }
        }
    };

    const getSaveButtonText = () => {
        if (!user) return "Login to Save";
        if (!routeData?.route) return "No Route to Save";
        return saveButtonText;
    };

    const getExportButtonText = () => {
        if (!shouldAllowExport) return "No Route to Export";
        return exportButtonText;
    };

    return (
        <motion.div
            className="relative p-4 bg-n-8/40 backdrop-blur-sm rounded-2xl border border-n-2/20 transition-all duration-300 hover:border-color-1/50 hover:shadow-[0_0_25px_rgba(172,108,255,0.3)] hover:scale-105"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.1, ease: "easeOut" }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
        >
            <h3 className="h3 mb-3 text-n-1">{title}</h3>

            {/* Route Name and Description Display */}
            {stats?.routeName && (
                <motion.div 
                    className="mb-4 p-3 bg-gradient-to-r from-color-1/10 to-color-2/10 border border-color-1/20 rounded-xl"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => stats?.routeDescription && setIsDescriptionExpanded(!isDescriptionExpanded)}
                    >
                        <h4 className="text-lg font-semibold text-color-1">{stats.routeName}</h4>
                        {stats?.routeDescription && (
                            <motion.div
                                animate={{ rotate: isDescriptionExpanded ? 180 : 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="ml-2"
                            >
                                <ChevronDown className="w-5 h-5 text-color-1" />
                            </motion.div>
                        )}
                    </div>
                    
                    {stats?.routeDescription && (
                        <motion.div
                            initial={false}
                            animate={{ 
                                height: isDescriptionExpanded ? "auto" : 0,
                                opacity: isDescriptionExpanded ? 1 : 0
                            }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                        >
                            <p className="text-sm text-n-3 mt-2 pt-2 border-t border-color-1/10">
                                {stats.routeDescription}
                            </p>
                        </motion.div>
                    )}
                </motion.div>
            )}

            <div className="space-y-3">
                {/* Save Route Section */}
                <div className="space-y-1">
                    <label htmlFor="routeName" className="body-2 text-n-3 block">
                        Save Route Name (Optional)
                    </label>
                    <div className="flex gap-3">
                        <input
                            id="routeName"
                            type="text"
                            placeholder="Enter route name..."
                            value={routeName}
                            onChange={(e) => setRouteName(e.target.value)}
                            className="w-64 px-3 py-1.5 bg-n-7 border border-n-6 rounded-xl text-n-1 placeholder-n-4 focus:border-color-1 focus:outline-none transition-all duration-300 focus:shadow-[0_0_15px_rgba(172,108,255,0.3)] focus:scale-105"
                            aria-label="Route name for saving"
                        />
                        <Button
                            onClick={handleSaveRoute}
                            disabled={!shouldAllowSave}
                            className="px-6"
                        >
                            {getSaveButtonText()}
                        </Button>
                    </div>
                </div>

                {/* Export GPX Section */}
                <div className="space-y-1">
                    <label htmlFor="gpxName" className="body-2 text-n-3 block">
                        GPX Export Name (Optional)
                    </label>
                    <div className="flex gap-3">
                        <input
                            id="gpxName"
                            type="text"
                            placeholder="Enter GPX filename..."
                            value={gpxName}
                            onChange={(e) => setGpxName(e.target.value)}
                            className="w-64 px-3 py-1.5 bg-n-7 border border-n-6 rounded-xl text-n-1 placeholder-n-4 focus:border-color-1 focus:outline-none transition-all duration-300 focus:shadow-[0_0_15px_rgba(172,108,255,0.3)] focus:scale-105"
                            aria-label="GPX filename for export"
                        />
                        <Button
                            onClick={handleExportGpx}
                            disabled={!shouldAllowExport}
                            white
                            className="px-6"
                        >
                            {getExportButtonText()}
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}