import aiohttp
import asyncio
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from .logger import get_logger

logger = get_logger(__name__)

@dataclass
class GraphHopperConfig:
    """Configuration for GraphHopper routing."""
    api_key: str = "demo"  # Default to demo key
    base_url: str = "https://graphhopper.com/api/1"
    vehicle: str = "bike"  # Default to bike routing
    locale: str = "en"
    instructions: bool = False
    elevation: bool = True
    optimize: bool = False
    points_encoded: bool = False
    calc_points: bool = True
    snap_preventions: List[str] = None
    
    def __post_init__(self):
        if self.snap_preventions is None:
            self.snap_preventions = ["motorway", "trunk"]

@dataclass
class RoutePoint:
    """A point in a route with coordinates and metadata."""
    lat: float
    lon: float
    elevation: Optional[float] = None
    time: Optional[int] = None
    distance: Optional[float] = None

@dataclass
class RouteSegment:
    """A segment of a route between two points."""
    start: RoutePoint
    end: RoutePoint
    distance: float
    time: int
    instructions: List[str] = None

class GraphHopperClient:
    """
    GraphHopper API client for generating bikeable routes.
    
    This client:
    1. Takes mathematical waypoints from our hybrid router
    2. Generates smooth, bikeable routes between them using GraphHopper
    3. Maintains the excellent distance accuracy from our mathematical logic
    4. Creates fluid, realistic cycling routes
    """
    
    def __init__(self, config: GraphHopperConfig = None):
        self.config = config or GraphHopperConfig()
        self.session: Optional[aiohttp.ClientSession] = None
        self.logger = get_logger(__name__)
        
        # Rate limiting
        self.max_requests_per_minute = 100
        self.request_times = []
        
    async def __aenter__(self):
        """Async context manager entry."""
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self.session:
            await self.session.close()
    
    async def route_between_waypoints(self, waypoints: List[Tuple[float, float]], 
                                    preferences: Dict) -> List[RoutePoint]:
        """
        Generate a smooth route between mathematical waypoints.
        
        Args:
            waypoints: List of (lat, lon) tuples from mathematical generation
            preferences: Route preferences (bike lanes, unpaved, etc.)
            
        Returns:
            List of RoutePoint objects forming a smooth, bikeable route
        """
        try:
            self.logger.info(f"=== GRAPHHOPPER ROUTING STARTED ===")
            self.logger.info(f"Routing between {len(waypoints)} waypoints")
            
            if len(waypoints) < 2:
                self.logger.warning("Need at least 2 waypoints for routing")
                return [RoutePoint(lat, lon) for lat, lon in waypoints]
            
            # Generate route segments between consecutive waypoints
            route_points = []
            total_distance = 0.0
            
            for i in range(len(waypoints) - 1):
                start_point = waypoints[i]
                end_point = waypoints[i + 1]
                
                self.logger.info(f"Routing segment {i+1}: ({start_point[0]:.6f}, {start_point[1]:.6f}) "
                               f"to ({end_point[0]:.6f}, {end_point[1]:.6f})")
                
                # Route between these two points
                segment_points = await self._route_segment(
                    start_point, end_point, preferences
                )
                
                if segment_points:
                    # Add segment points (excluding the start to avoid duplication)
                    if i == 0:
                        route_points.extend(segment_points)
                    else:
                        route_points.extend(segment_points[1:])
                    
                    # Calculate segment distance
                    segment_distance = self._calculate_segment_distance(segment_points)
                    total_distance += segment_distance
                    
                    self.logger.info(f"Segment {i+1} completed: {len(segment_points)} points, "
                                   f"{segment_distance:.2f}km")
                else:
                    # Fallback: add direct waypoint if routing fails
                    self.logger.warning(f"Routing failed for segment {i+1}, using direct waypoint")
                    if i == 0:
                        route_points.append(RoutePoint(start_point[0], start_point[1]))
                    route_points.append(RoutePoint(end_point[0], end_point[1]))
            
            self.logger.info(f"=== GRAPHHOPPER ROUTING COMPLETE ===")
            self.logger.info(f"Total route points: {len(route_points)}")
            self.logger.info(f"Total distance: {total_distance:.2f}km")
            
            return route_points
            
        except Exception as e:
            self.logger.error(f"GraphHopper routing failed: {e}", exc_info=True)
            # Fallback to original waypoints
            return [RoutePoint(lat, lon) for lat, lon in waypoints]
    
    async def _route_segment(self, start: Tuple[float, float], 
                            end: Tuple[float, float], 
                            preferences: Dict) -> Optional[List[RoutePoint]]:
        """Route between two waypoints using GraphHopper."""
        try:
            # Check rate limiting
            await self._check_rate_limit()
            
            # Build GraphHopper API request
            params = self._build_routing_params(start, end, preferences)
            
            # Make API request
            url = f"{self.config.base_url}/route"
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return self._parse_route_response(data)
                else:
                    error_text = await response.text()
                    self.logger.warning(f"GraphHopper API error {response.status}: {error_text}")
                    return None
                    
        except Exception as e:
            self.logger.error(f"Error routing segment: {e}")
            return None
    
    def _build_routing_params(self, start: Tuple[float, float], 
                             end: Tuple[float, float], 
                             preferences: Dict) -> Dict:
        """Build parameters for GraphHopper routing API."""
        params = {
            "key": self.config.api_key,
            "vehicle": self.config.vehicle,
            "locale": self.config.locale,
            "instructions": str(self.config.instructions).lower(),
            "elevation": str(self.config.elevation).lower(),
            "optimize": str(self.config.optimize).lower(),
            "points_encoded": str(self.config.points_encoded).lower(),
            "calc_points": str(self.config.calc_points).lower(),
            "point": [
                f"{start[0]},{start[1]}",
                f"{end[0]},{end[1]}"
            ]
        }
        
        # Add bike-specific preferences
        if preferences.get("prefer_bike_lanes"):
            params["bike_network"] = "true"
        
        if preferences.get("prefer_unpaved"):
            params["bike_network"] = "true"
            params["bike_network_type"] = "mtb"
        
        # Note: snap_prevention parameter removed due to API compatibility issues
        # Will implement highway avoidance through other means in future versions
        
        return params
    
    def _parse_route_response(self, data: Dict) -> List[RoutePoint]:
        """Parse GraphHopper route response into RoutePoint objects."""
        try:
            self.logger.info(f"GraphHopper response structure: {list(data.keys())}")
            
            if "paths" not in data or not data["paths"]:
                self.logger.warning("No paths found in GraphHopper response")
                return []
            
            path = data["paths"][0]
            self.logger.info(f"Path structure: {list(path.keys())}")
            
            points = []
            
            # Extract points from the path
            if "points" in path:
                points_data = path["points"]
                self.logger.info(f"Points structure: {list(points_data.keys())}")
                
                if "coordinates" in points_data:
                    coords = points_data["coordinates"]
                    self.logger.info(f"Coordinates type: {type(coords)}, length: {len(coords) if hasattr(coords, '__len__') else 'N/A'}")
                    
                    if coords and len(coords) > 0:
                        self.logger.info(f"First coordinate: {coords[0]}, type: {type(coords[0])}")
                    
                    for i, coord in enumerate(coords):
                        try:
                            self.logger.debug(f"Processing coordinate {i}: {coord}, type: {type(coord)}")
                            
                            # Handle different coordinate formats from GraphHopper
                            if isinstance(coord, list) and len(coord) >= 2:
                                # GraphHopper returns [lon, lat, elevation] format
                                if len(coord) >= 3:
                                    lon, lat, elevation = coord[0], coord[1], coord[2]
                                    # Validate elevation data
                                    if elevation is not None and isinstance(elevation, (int, float)):
                                        self.logger.debug(f"Coordinate {i} has elevation: {elevation}m")
                                    else:
                                        elevation = None
                                else:
                                    lon, lat = coord[0], coord[1]
                                    elevation = None
                            elif isinstance(coord, dict):
                                # Alternative format: {"lat": x, "lon": y}
                                lat = coord.get("lat", coord.get("y", 0))
                                lon = coord.get("lon", coord.get("x", 0))
                                elevation = coord.get("elevation", None)
                            else:
                                # Skip invalid coordinates
                                self.logger.warning(f"Skipping invalid coordinate {i}: {coord}, type: {type(coord)}")
                                continue
                            
                            # Extract time and distance if available
                            time = None
                            distance = None
                            
                            # Safely access time array
                            if "time" in path:
                                time_array = path["time"]
                                if isinstance(time_array, list) and i < len(time_array):
                                    time = time_array[i]
                                else:
                                    self.logger.debug(f"Time array not accessible for index {i}: {type(time_array)}")
                            
                            # Safely access distance array
                            if "distance" in path:
                                distance_array = path["distance"]
                                if isinstance(distance_array, list) and i < len(distance_array):
                                    distance = distance_array[i]
                                else:
                                    self.logger.debug(f"Distance array not accessible for index {i}: {type(distance_array)}")
                            
                            point = RoutePoint(
                                lat=lat,
                                lon=lon,
                                elevation=elevation,
                                time=time,
                                distance=distance
                            )
                            points.append(point)
                            
                        except Exception as e:
                            self.logger.error(f"Error parsing coordinate {i}: {e}, coord: {coord}, type: {type(coord)}")
                            continue
                else:
                    self.logger.warning("No coordinates found in points data")
            else:
                self.logger.warning("No points found in path")
            
            self.logger.info(f"Successfully parsed {len(points)} route points from GraphHopper")
            
            # Log elevation data summary
            elevation_points = [p for p in points if p.elevation is not None]
            if elevation_points:
                elevations = [p.elevation for p in elevation_points]
                self.logger.info(f"Elevation data available for {len(elevation_points)}/{len(points)} points")
                self.logger.info(f"Elevation range: {min(elevations):.1f}m to {max(elevations):.1f}m")
            else:
                self.logger.warning("No elevation data available in route response")
            
            return points
            
        except Exception as e:
            self.logger.error(f"Error parsing GraphHopper response: {e}")
            self.logger.error(f"Response data: {data}")
            return []
    
    async def get_elevation_profile(self, route_points: List[RoutePoint]) -> List[Dict[str, float]]:
        """Extract elevation profile from route points."""
        elevation_profile = []
        
        for i, point in enumerate(route_points):
            if point.elevation is not None:
                # Calculate cumulative distance
                cumulative_distance = 0.0
                if i > 0:
                    cumulative_distance = self._calculate_segment_distance(route_points[:i+1])
                
                elevation_profile.append({
                    "index": i,
                    "lat": point.lat,
                    "lon": point.lon,
                    "elevation": point.elevation,
                    "distance_km": cumulative_distance
                })
        
        return elevation_profile
    
    def calculate_elevation_gain(self, route_points: List[RoutePoint]) -> float:
        """Calculate total elevation gain from route points."""
        if len(route_points) < 2:
            return 0.0
        
        total_gain = 0.0
        elevation_points = [p for p in route_points if p.elevation is not None]
        
        if len(elevation_points) < 2:
            self.logger.warning("Insufficient elevation data for accurate calculation")
            return 0.0
        
        for i in range(len(elevation_points) - 1):
            current_elev = elevation_points[i].elevation
            next_elev = elevation_points[i + 1].elevation
            
            if current_elev is not None and next_elev is not None:
                gain = next_elev - current_elev
                if gain > 0:  # Only count positive elevation changes
                    total_gain += gain
        
        self.logger.info(f"Calculated elevation gain: {total_gain:.1f}m")
        return round(total_gain, 1)
    
    def calculate_elevation_stats(self, route_points: List[RoutePoint]) -> Dict[str, float]:
        """Calculate comprehensive elevation statistics."""
        elevation_points = [p for p in route_points if p.elevation is not None]
        
        if not elevation_points:
            return {
                "min_elevation": 0.0,
                "max_elevation": 0.0,
                "avg_elevation": 0.0,
                "elevation_gain": 0.0,
                "elevation_loss": 0.0,
                "total_climb": 0.0
            }
        
        elevations = [p.elevation for p in elevation_points]
        min_elev = min(elevations)
        max_elev = max(elevations)
        avg_elev = sum(elevations) / len(elevations)
        
        # Calculate elevation gain/loss
        elevation_gain = 0.0
        elevation_loss = 0.0
        
        for i in range(len(elevation_points) - 1):
            current_elev = elevation_points[i].elevation
            next_elev = elevation_points[i + 1].elevation
            
            if current_elev is not None and next_elev is not None:
                change = next_elev - current_elev
                if change > 0:
                    elevation_gain += change
                else:
                    elevation_loss += abs(change)
        
        total_climb = elevation_gain + elevation_loss
        
        return {
            "min_elevation": round(min_elev, 1),
            "max_elevation": round(max_elev, 1),
            "avg_elevation": round(avg_elev, 1),
            "elevation_gain": round(elevation_gain, 1),
            "elevation_loss": round(elevation_loss, 1),
            "total_climb": round(total_climb, 1)
        }
    
    async def _check_rate_limit(self):
        """Check and enforce rate limiting."""
        now = asyncio.get_event_loop().time()
        
        # Remove old requests (older than 1 minute)
        self.request_times = [t for t in self.request_times if now - t < 60]
        
        # Check if we're at the limit
        if len(self.request_times) >= self.max_requests_per_minute:
            # Wait until we can make another request
            wait_time = 60 - (now - self.request_times[0])
            if wait_time > 0:
                self.logger.info(f"Rate limit reached, waiting {wait_time:.1f} seconds")
                await asyncio.sleep(wait_time)
        
        # Add current request time
        self.request_times.append(now)
    
    def _calculate_segment_distance(self, points: List[RoutePoint]) -> float:
        """Calculate total distance of a route segment."""
        if len(points) < 2:
            return 0.0
        
        total = 0.0
        for i in range(len(points) - 1):
            total += self._haversine_distance(
                (points[i].lat, points[i].lon),
                (points[i + 1].lat, points[i + 1].lon)
            )
        
        return total
    
    def _haversine_distance(self, coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
        """Calculate distance between two coordinates."""
        import math
        
        lat1, lon1 = coord1
        lat2, lon2 = coord2
        
        R = 6371.0  # Earth radius in km
        
        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)
        
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        
        a = (math.sin(dlat / 2) ** 2 + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c 