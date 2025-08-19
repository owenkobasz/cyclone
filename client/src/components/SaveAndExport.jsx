import { motion } from "framer-motion";
import Button from "./Button";
import {generateGpxFile} from "../utils/routeApi";

export default function SaveAndExport({ routeData }) {
    const canExport = routeData && routeData.route && Array.isArray(routeData.route) && routeData.route.length > 0;
    const canSave = routeData && routeData.route;
    
    const handleExportGpx = () => {
        if (!canExport) {
            console.warn("No route data available for export");
            return;
        }
        
        console.log("Exporting route as GPX...", routeData);
        const routeName = routeData.gpt_metadata?.gpt_route_name || null;
        console.log("Route name for export:", routeName);
        generateGpxFile(routeData.route, routeName);
    };

    const handleSaveRoute = () => {
        if (!routeData) {
            console.warn("No route data available to save");
            return;
        }
        
        console.log("Saving route...");
        // TODO: implement save route API call
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
            <h3 className="h3 mb-4 text-n-1">Save and Export</h3>
            
            <div>
                <div className="mt-4 space-y-3">
                    <Button
                        className="w-full"
                        onClick={handleSaveRoute}
                        disabled={!canSave}
                    >
                        {!canSave ? "No Route to Save" : "Save Route"}
                    </Button>
                    <Button
                        className="w-full"
                        onClick={handleExportGpx}
                        disabled={!canExport}
                        white
                    >
                        {!canExport ? "No Route to Export" : "Export GPX"}
                    </Button>
                    {/*
                <Button
                  className="w-full"
                  onClick={() => {
                    console.log("Sharing route...");
                  }}
                  disabled={!canUseRouteActions}
                  outline
                >
                  Share Route
                </Button>
                */}
                </div>
            </div>

        </motion.div>
    );
}