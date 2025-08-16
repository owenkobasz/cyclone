import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom"; // Add useLocation
import Section from "./Section";
import Heading from "./Heading";
import Button from "./Button";
import MapComponent from "./MapComponent";
import RoutePreferences from "./RoutePreferences";
import CueSheet from "./CueSheet";
import RouteStats from "./RouteStats";
import { generateRoute } from "../utils/routeApi";

const GenerateRoutes = () => {
  const navigate = useNavigate();
  const { state } = useLocation(); // Get location state

  // State management
  const [location, setLocation] = useState(null);
  const [preferences, setPreferences] = useState({
    startingPoint: "",
    startingPointCoords: null,
    endingPoint: "",
    endingPointCoords: null,
    distanceTarget: 20,
    elevationTarget: 1000,
    routeType: "scenic",
    bikeLanes: false,
    pointsOfInterest: false,
    avoidHills: false,
    avoidHighTraffic: false,
    preferGreenways: false,
    includeScenic: false,
    unitSystem: "imperial",
  });

  const [routeData, setRouteData] = useState(null);
  const [stats, setStats] = useState({ distanceKm: null, elevationM: null });
  const [elevationProfile, setElevationProfile] = useState([]);
  const [elevationStats, setElevationStats] = useState(null);
  const [instructions, setInstructions] = useState([]);
  const [unitSystem, setUnitSystem] = useState("imperial");
  const [hasGeneratedRoute, setHasGeneratedRoute] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const resultsRef = useRef(null);
  const [cueSheet, setCueSheet] = useState([]);

  useEffect(() => {
    const selectedRoute = state?.selectedRoute;
    if (selectedRoute) {
      // Transform selectedRoute to match MapComponent's routeData format
      const transformedRouteData = {
        route: selectedRoute.waypoints || [], // Assuming waypoints is [{ lat, lon }, ...]
        total_length_km: selectedRoute.rawStats.distanceKm || 0,
        total_length_formatted:
          selectedRoute.total_length_formatted ||
          (selectedRoute.rawStats.distanceKm
            ? `${selectedRoute.rawStats.distanceKm.toFixed(1)} km`
            : `${(selectedRoute.rawStats.distanceKm || 0).toFixed(1)} km`),
      };

      // Update states
      setRouteData(transformedRouteData);
      if (state?.rawStats) {
        setStats(state.rawStats);
      } else {
        setStats({
          distanceKm: transformedRouteData.total_length_km,
          distanceFormatted: transformedRouteData.total_length_formatted,
          elevationM: selectedRoute.rawStats.elevationM || 0,
          totalRideTime: selectedRoute.rawStats.totalRideTimeMin || null,
        })
      };
      setElevationProfile(selectedRoute.elevation_profile || []);
      setElevationStats(selectedRoute.elevation_stats || null);
      setInstructions(selectedRoute.instructions || []);
      if (state?.cueSheet?.length) {
        setCueSheet(state.cueSheet);
      } else {
        setCueSheet(
          selectedRoute.instructions?.length > 0
            ? selectedRoute.instructions
            : [
              `Start your route`,
              `Route distance: ${transformedRouteData.total_length_formatted}`,
              `Arrive at destination`,
            ]
        );
      }
      setHasGeneratedRoute(true);
      setUnitSystem(selectedRoute.unitSystem || "imperial");

      // Scroll to results section
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [state]);

  const handleGenerateRoute = async () => {
    const hasLocation = location || preferences.startingPointCoords;
    const hasCoordinates = location?.lat || preferences.startingPointCoords?.lat;

    if (!hasLocation || !hasCoordinates) {
      setError(
        <div>
          <div>Please set a starting location. You can either:</div>
          <div style={{ marginTop: "8px" }}>
            • Enter a starting point in the text box
          </div>
          <div style={{ marginTop: "8px" }}>
            • Click on the crosshair icon on the map to set your location
          </div>
          <div style={{ marginTop: "8px" }}>
            • Enable location services to use your current location
          </div>
        </div>
      );
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const routePreferences = {
        ...preferences,
        startLat: preferences.startingPointCoords?.lat || location?.lat,
        startLon: preferences.startingPointCoords?.lng || location?.lng,
        endLat: preferences.endingPointCoords?.lat,
        endLon: preferences.endingPointCoords?.lng,
        location: location,
      };

      const data = await generateRoute(routePreferences);
      setRouteData(data);
      console.log('Route data received from backend:', data);
      console.log('Route coordinates:', data.route);
      console.log('Route length:', data.route ? data.route.length : 'No route array');
      
      setStats({
        distanceKm: data.total_distance_km || data.total_length_km || null,
        distanceFormatted: data.total_length_formatted || null,
        elevationM: data.elevation_gain_m || data.total_elevation_gain || null,
        totalRideTime: data.total_ride_time || null,
        difficulty: data.difficulty || null
      });
      setElevationProfile(data.elevation_profile || []);
      setElevationStats(data.elevation_stats || null);
      
      // Update unit system from preferences
      setUnitSystem(preferences.unitSystem || 'imperial');
      
      // Set instructions from API response
      if (data.instructions && data.instructions.length > 0) {
        setInstructions(data.instructions);
        setCueSheet([]); 
      } else {
        const destinationText = preferences.endingPoint || 'your destination';
        const generatedCueSheet = [
          `Start your route`,
          `Route distance: ${data.total_length_formatted || `${(data.total_distance_km || data.total_length_km || 0).toFixed(2)} km`}`,
          `Arrive at ${destinationText}`
        ];
        setCueSheet(generatedCueSheet);
        setInstructions([]);
      }

      setHasGeneratedRoute(true);

      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err) {
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (err.message === "LOCATION_REQUIRED") {
        errorMessage = "Please provide a starting location. You can:\n• Enter an address in the Starting Point field\n• Click the 'Current Location'option in the dropdown menu to use your current location\n• Click on the crosshair icon on the map to set your precise location";
      } else if (err.message === "INVALID_COORDINATES") {
        errorMessage = "The provided coordinates are invalid or outside the supported area. Please check your starting and ending locations.";
      } else if (err.message === "SERVER_ERROR") {
        errorMessage =
          "The route generation service is currently experiencing issues. Please try again in a few moments.";
      } else if (err.message === "NETWORK_ERROR") {
        errorMessage =
          "Unable to connect to the route generation service. Please check your internet connection and try again.";
      } else if (
        err.message.includes("Failed to fetch") ||
        err.message.includes("Connection refused")
      ) {
        errorMessage =
          "Unable to connect to the route generation service. Please check if the backend server is running on localhost:8000.";
      }
      setError(errorMessage);
      console.error("Route generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const hasPreferences =
    preferences.startingPoint || preferences.endingPoint || location;

  return (
    <Section id="generate-routes">
      <div className="container relative z-10">
        <Heading title="Generate Custom Routes" />

        {/* Main Planning Section */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Left - Route Preferences */}
          <motion.div
            className="lg:col-span-1 space-y-6"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
          >
            <RoutePreferences
              preferences={preferences}
              setPreferences={setPreferences}
              userLocation={location}
            />
            <Button
              className="w-full"
              onClick={handleGenerateRoute}
              disabled={
                isGenerating || (!location && !preferences.startingPointCoords)
              }
            >
              {isGenerating ? (
                <div className="flex items-center gap-3">
                  <span>Generating Route</span>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                "Generate Route"
              )}
            </Button>

            {/* Error Display */}
            {error && (
              <motion.div
                className="p-4 bg-gradient-to-r from-color-3/5 to-color-3/10 border border-color-3/20 rounded-xl backdrop-blur-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-color-3/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-color-3"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-color-3 mb-1">
                      ⚠️ Route Generation Error
                    </h4>
                    <div className="text-xs text-n-3">{error}</div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Right - Map Component */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
          >
            <MapComponent
              location={location}
              setLocation={setLocation}
              error={error}
              setError={setError}
              routeData={routeData}
              isGenerating={isGenerating}
            />
          </motion.div>
        </div>

        {hasGeneratedRoute && (
          <motion.div
            ref={resultsRef}
            className="grid lg:grid-cols-3 gap-8"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Left - Stats */}
            <div className="space-y-6">
              <RouteStats
                stats={stats}
                unitSystem={unitSystem}
                setUnitSystem={setUnitSystem}
                elevationProfile={elevationProfile}
                elevationStats={elevationStats}
              />
              {stats.distanceKm && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="space-y-3"
                >
                  <Button
                    className="w-full"
                    onClick={() => {
                      console.log("Exporting route as GPX...");
                    }}
                    white
                  >
                    Export GPX
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => {
                      console.log("Sharing route...");
                    }}
                    outline
                  >
                    Share Route
                  </Button>
                </motion.div>
              )}
            </div>

            {/* Right - Cue Sheet */}
            <div>
              <CueSheet cueSheet={cueSheet} instructions={instructions} />
            </div>
          </motion.div>
        )}
      </div>
    </Section>
  );
};

export default GenerateRoutes;