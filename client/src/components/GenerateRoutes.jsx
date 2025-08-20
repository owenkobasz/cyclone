import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import Section from "./design/Section";
import Heading from "./ui/HeadingAnimation";
import Button from "./Button";
import MapComponent from "./MapComponent";
import RoutePreferences from "./RoutePreferences";
import CueSheet from "./CueSheet";
import RouteStats from "./RouteStats";
import { generateRoute, generateGpxFile } from "../utils/routeApi";
import { useAuth } from "../contexts/AuthContext";
import { useUnits } from "../contexts/UnitsContext";
import { kmToUi, distLabel } from "../utils/units";
import SaveAndExport from "./SaveAndExport";

const GenerateRoutes = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { user } = useAuth();
  const { units } = useUnits();

  // State management
  const [location, setLocation] = useState(null);
  const [preferences, setPreferences] = useState({
    startingPoint: "",
    startingPointCoords: null,
    endingPoint: "",
    endingPointCoords: null,
    distanceTarget: 10.0,
    routeType: "scenic",
    customDescription: "",
    bikeLanes: false,
    pointsOfInterest: false,
    avoidHills: false,
    avoidHighTraffic: false,
    preferGreenways: false,
    includeScenic: false,
  });

  const [routeData, setRouteData] = useState(null);
  const [stats, setStats] = useState({ distanceKm: null, elevationM: null });
  const [elevationProfile, setElevationProfile] = useState([]);
  const [elevationStats, setElevationStats] = useState(null);
  const [instructions, setInstructions] = useState([]);
  const [hasGeneratedRoute, setHasGeneratedRoute] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const resultsRef = useRef(null);
  const [cueSheet, setCueSheet] = useState([]);

  useEffect(() => {
    const selectedRoute = state?.selectedRoute;
    if (selectedRoute && (state?.fromRouteGeneration || state?.fromProfile)) {
      // Transform selectedRoute to match MapComponent's routeData format
      const transformedRouteData = {
        route: selectedRoute.waypoints || [], // Assuming waypoints is [{ lat, lon }, ...]
        total_length_km: selectedRoute.rawStats.distanceKm || 0,
        total_length_formatted:
          selectedRoute.total_length_formatted ||
          (selectedRoute.rawStats.distanceKm
            ? `${kmToUi(selectedRoute.rawStats.distanceKm, units).toFixed(1)} ${distLabel(units)}`
            : `${kmToUi(selectedRoute.rawStats.distanceKm || 0, units).toFixed(1)} ${distLabel(units)}`),
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
          routeName: selectedRoute.gpt_metadata?.gpt_route_name || null,
          routeDescription: selectedRoute.gpt_metadata?.gpt_description || null
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

      // Scroll to results section only when coming from route generation
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [state]);

  // When user selects a Starting Point, recenter the map and show a pin
  useEffect(() => {
    if (preferences?.startingPointCoords?.lat && preferences?.startingPointCoords?.lng) {
      setLocation([preferences.startingPointCoords.lat, preferences.startingPointCoords.lng]);
    }
  }, [preferences?.startingPointCoords]);

  // When user selects an Ending Point, update the map to show both pins
  useEffect(() => {
    if (preferences?.endingPointCoords?.lat && preferences?.endingPointCoords?.lng) {
      // If we have both start and end points, center the map to show both
      if (preferences?.startingPointCoords?.lat && preferences?.startingPointCoords?.lng) {
        const startLat = preferences.startingPointCoords.lat;
        const startLng = preferences.startingPointCoords.lng;
        const endLat = preferences.endingPointCoords.lat;
        const endLng = preferences.endingPointCoords.lng;

        // Calculate center point between start and end
        const centerLat = (startLat + endLat) / 2;
        const centerLng = (startLng + endLng) / 2;
        setLocation([centerLat, centerLng]);
      }
    }
  }, [preferences?.endingPointCoords]);

  const handleGenerateRoute = async () => {
    const hasLocation = location || preferences.startingPointCoords;
    const hasCoordinates = location?.lat || preferences.startingPointCoords?.lat;

    if (!hasLocation) {
      setError("Please provide at least a starting location or enable precise location.");
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
        unitSystem: distLabel(units), // Pass current unit system ('mi' or 'km')
      };

      const data = await generateRoute(routePreferences);
      setRouteData(data);
      console.log('Route data received from backend:', data);
      console.log('Route coordinates:', data.route);
      console.log('Route length:', data.route ? data.route.length : 'No route array');

      setStats({
        distanceKm: data.total_distance_km || data.total_length_km || data.total_distance || null,
        distanceFormatted: data.total_length_formatted || 
          (data.total_distance && data.total_distance_unit ? 
            `${data.total_distance.toFixed(2)} ${data.total_distance_unit}` : null),
        elevationM: data.elevation_gain_m || data.total_elevation_gain || null,
        totalRideTime: data.total_ride_time || null,
        difficulty: data.difficulty || null,
        routeName: data.gpt_metadata?.gpt_route_name || null,
        routeDescription: data.gpt_metadata?.gpt_description || null
      });
      setElevationProfile(data.elevation_profile || []);
      setElevationStats(data.elevation_stats || null);

      // Set instructions from API response
      if (data.instructions && data.instructions.length > 0) {
        setInstructions(data.instructions);
        setCueSheet([]);
      } else {
        const destinationText = preferences.endingPoint || 'your destination';
        
        let distanceFormatted;
        if (data.total_distance && data.total_distance_unit) {
          distanceFormatted = `${data.total_distance.toFixed(2)} ${data.total_distance_unit}`;
        } else {
          const distanceKm = data.total_distance_km || data.total_length_km || 0;
          distanceFormatted = data.total_length_formatted || `${kmToUi(distanceKm, units).toFixed(2)} ${distLabel(units)}`;
        }
        
        const generatedCueSheet = [
          `Start your route`,
          `Route distance: ${distanceFormatted}`,
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
        errorMessage = "Please provide a starting location. You can either enter an address or click the 'Current Location' option to use your current location.";
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
              endingPointCoords={preferences.endingPointCoords}
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
                </motion.div>
              )}
            </div>

            {/* Center - Cue Sheet */}
            <div>
              <CueSheet cueSheet={cueSheet} instructions={instructions} />
            </div>
            {/* Right - Save and Export */}
            <div>
              <SaveAndExport 
                routeData={routeData}
                stats={stats}
                cueSheet={cueSheet}
                preferences={preferences}
              />
            </div>
          </motion.div>
        )}
      </div>
    </Section>
  );
};

export default GenerateRoutes;