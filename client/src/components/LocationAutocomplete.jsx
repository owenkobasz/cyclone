import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LocationAutocomplete = ({ value, onChange, placeholder, className = "", userLocation = null }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Format location name for better display - prioritize business/location names
  const formatLocationName = (address) => {
    // First priority: Named places, businesses, and points of interest
    if (address?.name) return address.name;
    if (address?.amenity) return address.amenity;
    if (address?.shop) return address.shop;
    if (address?.tourism) return address.tourism;
    if (address?.leisure) return address.leisure;
    if (address?.office) return address.office;
    if (address?.building) return address.building;
    
    // Second priority: Specific addresses
    if (address?.house_number && address?.road) {
      return `${address.house_number} ${address.road}`;
    }
    
    // Third priority: Street names
    if (address?.road) return address.road;
    
    // Fourth priority: Area names
    if (address?.neighbourhood) return address.neighbourhood;
    if (address?.suburb) return address.suburb;
    
    // Last resort: City/town names
    if (address?.city) return address.city;
    if (address?.town) return address.town;
    if (address?.village) return address.village;
    
    return 'Location';
  };

  // Format secondary info (area, city, state) - show street address if primary is a business name
  const formatSecondaryInfo = (address) => {
    const parts = [];
    const primaryName = formatLocationName(address);
    
    // If primary name is a business/POI, show the street address first
    if ((address?.name || address?.amenity || address?.shop || address?.tourism || 
         address?.leisure || address?.office || address?.building) && 
        address?.road && !primaryName.includes(address.road)) {
      if (address?.house_number) {
        parts.push(`${address.house_number} ${address.road}`);
      } else {
        parts.push(address.road);
      }
    }
    
    // Add neighborhood if different from primary name
    if (address?.neighbourhood && address.neighbourhood !== primaryName) {
      parts.push(address.neighbourhood);
    }
    
    // Add city/town
    const city = address?.city || address?.town || address?.village;
    if (city && city !== primaryName) {
      parts.push(city);
    }
    
    // Add state
    if (address?.state) {
      parts.push(address.state);
    }
    
    return parts.slice(0, 3).join(', ');
  };

  const searchLocations = async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log("Searching for location:", query);
      
      // Build search query with location bias if user location is available
      let searchQuery = query;
      let extraParams = '';
      
      if (userLocation) {
        // Use viewbox to prioritize results near user location
        const buffer = 0.1; // Degrees buffer around user location
        extraParams = `&viewbox=${userLocation.lng-buffer},${userLocation.lat+buffer},${userLocation.lng+buffer},${userLocation.lat-buffer}&bounded=0`;
        console.log("Using location bias with user location:", userLocation);
      }
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=15&addressdetails=1&extratags=1${extraParams}`
      );
      const data = await response.json();
      console.log("Received raw suggestions:", data.length);

      let formattedSuggestions = data.map(item => {
        const primaryName = formatLocationName(item.address);
        const secondaryInfo = formatSecondaryInfo(item.address);
        const distance = userLocation ? 
          calculateDistance(userLocation.lat, userLocation.lng, parseFloat(item.lat), parseFloat(item.lon)) : null;

        // Calculate relevance score for sorting
        let relevanceScore = 0;
        
        // Boost score for named places/businesses
        if (item.address?.name || item.address?.amenity || item.address?.shop || 
            item.address?.tourism || item.address?.leisure) {
          relevanceScore += 100;
        }
        
        // Boost score for exact matches in name
        if (primaryName.toLowerCase().includes(query.toLowerCase())) {
          relevanceScore += 50;
        }
        
        // Boost score for closer distances (if user location available)
        if (distance !== null) {
          relevanceScore += Math.max(0, 25 - distance); // Closer = higher score
        }

        return {
          display_name: item.display_name,
          primary_name: primaryName,
          secondary_info: secondaryInfo,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          address: item.address,
          distance: distance,
          class: item.class,
          type: item.type,
          relevanceScore: relevanceScore
        };
      });

      // Filter out very distant results if user location is available
      if (userLocation) {
        formattedSuggestions = formattedSuggestions.filter(suggestion => 
          !suggestion.distance || suggestion.distance <= 100 // Within 100 miles
        );
      }
      
      // Sort by relevance score (descending), then by distance (ascending)
      formattedSuggestions.sort((a, b) => {
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        if (a.distance !== null && b.distance !== null) {
          return a.distance - b.distance;
        }
        if (a.distance !== null) return -1;
        if (b.distance !== null) return 1;
        return 0;
      });

      // Limit to 5 most relevant results
      const finalSuggestions = formattedSuggestions.slice(0, 5);
      setSuggestions(finalSuggestions);
      setShowSuggestions(finalSuggestions.length > 0);
      console.log("Final suggestions shown:", finalSuggestions.length, finalSuggestions);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const query = e.target.value;
    onChange(query);

    // Debounce the API call
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchLocations(query);
    }, 200);
  };

  const handleSuggestionSelect = (suggestion) => {
    onChange(suggestion.primary_name);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className={`w-full px-4 py-3 pr-10 bg-n-7 border border-n-6 rounded-xl text-n-1 placeholder-n-4 focus:border-color-1 focus:outline-none transition-colors ${className}`}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-color-1 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-1 bg-n-8 border border-n-6 rounded-xl shadow-lg max-h-60 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`px-4 py-3 cursor-pointer transition-colors border-b border-n-7 last:border-b-0 ${
                  index === selectedIndex 
                    ? 'bg-color-1/10 text-color-1' 
                    : 'hover:bg-n-7 text-n-2'
                }`}
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-base text-n-1 truncate">
                      {suggestion.primary_name}
                    </div>
                    {suggestion.secondary_info && (
                      <div className="text-xs text-n-4 truncate mt-1">
                        {suggestion.secondary_info}
                      </div>
                    )}
                  </div>
                  {suggestion.distance !== null && (
                    <div className="text-xs text-color-1 font-medium ml-2 flex-shrink-0 bg-color-1/10 px-2 py-1 rounded">
                      {suggestion.distance < 1 
                        ? `${(suggestion.distance * 5280).toFixed(0)} ft`
                        : `${suggestion.distance.toFixed(1)} mi`
                      }
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LocationAutocomplete;
