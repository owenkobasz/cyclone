import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Button from "./Button";
import { generateGpxFile, saveRoute } from "../utils/routeApi";
import { useAuth } from "../contexts/AuthContext";

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
        const routeName = routeData?.gpt_metadata?.gpt_route_name || null;
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
            const routeName = routeData?.gpt_metadata?.gpt_route_name || null;
            console.log("Route name for export:", routeName);
            const data = await saveRoute({
                routeName: routeData.routeName || routeName,
                waypoints: routeData.route || [],
                rawStats: stats,
                cueSheet,
                preferences,
            });

            alert("Route saved successfully!");
            console.log("Saved route:", data.route);
        } catch (err) {
            console.error("Save route error:", err);
            alert("Failed to save route: " + err.message);
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
            className="relative p-6 bg-n-8/40 backdrop-blur-sm rounded-2xl border border-n-2/20 transition-all duration-300 hover:border-color-1/50 hover:shadow-[0_0_25px_rgba(172,108,255,0.3)] hover:scale-105"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.1, ease: "easeOut" }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
        >
            <h3 className="h3 mb-4 text-n-1">Save & Export</h3>
            
            <div>
                <div className="mt-4 space-y-3">
                    <Button
                        className="w-full"
                        onClick={handleSaveRoute}
                        disabled={!shouldAllowSave}
                    >
                        {getSaveButtonText()}
                    </Button>
                    <Button
                        className="w-full"
                        onClick={handleExportGpx}
                        disabled={!shouldAllowExport}
                        white
                    >
                        {getExportButtonText()}
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}