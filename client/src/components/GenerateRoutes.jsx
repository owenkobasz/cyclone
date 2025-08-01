// components/GenerateRoutes.jsx
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Section from "./Section";
import Heading from "./Heading";
import Button from "./Button";
import MapComponent from "./MapComponent";
import RoutePreferences from "./RoutePreferences";
import CueSheet from "./CueSheet";
import StatsCard from "./StatsCard";

const GenerateRoutes = () => {
  // Ref for scrolling to results
  const resultsRef = useRef(null);

  // State management
  const [preferences, setPreferences] = useState({
    startingPoint: '',
    endingPoint: '',
    distanceTarget: 20,
    elevationTarget: 1000,
    bikeLanes: false,
    pointsOfInterest: false,
    avoidHills: false
  });

  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [cueSheet, setCueSheet] = useState([]);
  const [unitSystem, setUnitSystem] = useState("imperial");
  const [stats, setStats] = useState({ distanceKm: null, elevationM: null });
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGeneratedRoute, setHasGeneratedRoute] = useState(false);

  const handleGenerateRoute = async () => {
    if (!location) {
      setError("Please set a location first");
      return;
    }

    setIsGenerating(true);
    setStats({ distanceKm: null, elevationM: null });
    setCueSheet([]);

    try {
      // Simulate API call - replace with actual route generation logic
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock data - replace with actual API response
      setStats({
        distanceKm: preferences.distanceTarget * 1.60934, // Convert miles to km
        elevationM: preferences.elevationTarget * 0.3048 // Convert feet to meters
      });
      
      setCueSheet([
        "Head north on Main Street",
        "Turn right onto Oak Avenue", 
        "Continue straight for 2.5 miles",
        "Turn left onto Bike Trail",
        "Follow trail for 5 miles",
        "Return to starting point"
      ]);
      
      setHasGeneratedRoute(true);
      
      // Scroll to results after generation
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 300);
      
    } catch (err) {
      setError("Failed to generate route. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Check if user has entered preferences (at least location inputs or route has been generated)
  const hasPreferences = preferences.startingPoint || preferences.endingPoint || location;

  return (

    <Section id="generate-routes">
      <div className="container relative z-10">
        <Heading title="Generate Custom Routes" />
        {/* Main Planning Section */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Left - Route Preferences (1/3) */}
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
              disabled={isGenerating || !location}
            >
              {isGenerating ? "Generating Route..." : "Generate Route"}
            </Button>
          </motion.div>

          {/* Right - Map Component (2/3) */}
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
            />
          </motion.div>
        </div>

        {hasGeneratedRoute && (
          <motion.div
            ref={resultsRef}
            className="grid lg:grid-cols-2 gap-8"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Left - Stats */}
            <div className="space-y-6">
              <StatsCard 
                stats={stats}
                unitSystem={unitSystem}
                setUnitSystem={setUnitSystem}
              />
              
              {stats.distanceKm && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <Button className="w-full" href="#" white>
                    Export GPX
                  </Button>
                </motion.div>
              )}
            </div>

            {/* Right - Cue Sheet */}
            <div>
              <CueSheet cueSheet={cueSheet} />
            </div>
          </motion.div>
        )}
      </div>
    </Section>
  );
};

export default GenerateRoutes;
