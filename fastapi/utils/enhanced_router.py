import math
import random
import asyncio
import aiohttp
from typing import List, Dict, Tuple, Optional, Set
from dataclasses import dataclass
from enum import Enum
from .logger import get_logger
from .models import RouteType, SurfaceType

logger = get_logger(__name__)

@dataclass
class EnhancedRoutePreferences:
    start_lat: float
    start_lon: float
    target_distance: float
    route_type: RouteType = RouteType.LOOP
    prefer_bike_lanes: bool = False
    prefer_unpaved: bool = False
    target_elevation_gain: Optional[float] = None
    max_elevation_gain: Optional[float] = None
    avoid_highways: bool = True
    max_segment_length: float = 5.0  # km
    min_segment_length: float = 0.5  # km

@dataclass
class RouteSegment:
    start: Tuple[float, float]
    end: Tuple[float, float]
    distance: float
    elevation_gain: float
    surface_type: SurfaceType
    bike_lane: bool

class EnhancedCoordinateRouter:
    """Enhanced coordinate-based router with elevation and surface type consideration."""
    
    def __init__(self, elevation_api_key: Optional[str] = None):
        self.logger = get_logger(__name__)
        self.elevation_api_key = elevation_api_key
        self.session: Optional[aiohttp.ClientSession] = None
        
        # Route generation parameters
        self.max_attempts = 100
        self.elevation_tolerance = 0.1  # 10% tolerance for elevation targets
        
    async def __aenter__(self):
        """Async context manager entry."""
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self.session:
            await self.session.close()
    
    async def generate_route(self, preferences: EnhancedRoutePreferences) -> Dict:
        """Generate a route based on preferences."""
        try:
            self.logger.info(f"Generating {preferences.route_type.value} route at "
                           f"({preferences.start_lat}, {preferences.start_lon}) "
                           f"with target distance: {preferences.target_distance}km")
            
            if preferences.route_type == RouteType.LOOP:
                return await self._generate_loop_route(preferences)
            elif preferences.route_type == RouteType.OUT_AND_BACK:
                return await self._generate_out_and_back_route(preferences)
            elif preferences.route_type == RouteType.FIGURE_8:
                return await self._generate_figure_8_route(preferences)
            else:
                raise ValueError(f"Unsupported route type: {preferences.route_type}")
                
        except Exception as e:
            self.logger.error(f"Route generation failed: {e}", exc_info=True)
            raise
    
    async def _generate_loop_route(self, preferences: EnhancedRoutePreferences) -> Dict:
        """Generate a loop route."""
        start_coord = (preferences.start_lat, preferences.start_lon)
        waypoints = [start_coord]
        current_distance = 0.0
        current_coord = start_coord
        
        # Generate waypoints in a loop pattern
        for attempt in range(self.max_attempts):
            if current_distance >= preferences.target_distance * 0.8:
                break
                
            # Generate next waypoint
            next_coord = await self._generate_optimized_waypoint(
                current_coord, preferences, waypoints
            )
            
            if not next_coord:
                break
            
            # Check if we can return to start
            return_distance = self._haversine_distance(next_coord, start_coord)
            if current_distance + return_distance <= preferences.target_distance * 1.2:
                waypoints.append(next_coord)
                waypoints.append(start_coord)  # Close the loop
                break
            
            waypoints.append(next_coord)
            current_distance += self._haversine_distance(current_coord, next_coord)
            current_coord = next_coord
        
        return await self._finalize_route(waypoints, preferences)
    
    async def _generate_out_and_back_route(self, preferences: EnhancedRoutePreferences) -> Dict:
        """Generate an out-and-back route."""
        start_coord = (preferences.start_lat, preferences.start_lon)
        waypoints = [start_coord]
        
        # Calculate outbound distance
        outbound_distance = preferences.target_distance / 2
        
        # Generate outbound waypoints
        current_coord = start_coord
        current_distance = 0.0
        
        while current_distance < outbound_distance:
            next_coord = await self._generate_optimized_waypoint(
                current_coord, preferences, waypoints
            )
            
            if not next_coord:
                break
            
            segment_distance = self._haversine_distance(current_coord, next_coord)
            if current_distance + segment_distance > outbound_distance:
                # Interpolate to exact distance
                ratio = (outbound_distance - current_distance) / segment_distance
                next_coord = self._interpolate_coordinate(current_coord, next_coord, ratio)
                waypoints.append(next_coord)
                break
            
            waypoints.append(next_coord)
            current_distance += segment_distance
            current_coord = next_coord
        
        # Add return path (reverse of outbound)
        for i in range(len(waypoints) - 2, -1, -1):
            waypoints.append(waypoints[i])
        
        return await self._finalize_route(waypoints, preferences)
    
    async def _generate_figure_8_route(self, preferences: EnhancedRoutePreferences) -> Dict:
        """Generate a figure-8 route."""
        start_coord = (preferences.start_lat, preferences.start_lon)
        waypoints = [start_coord]
        
        # Split target distance between the two loops
        loop_distance = preferences.target_distance / 2
        
        # Generate first loop
        first_loop = await self._generate_small_loop(start_coord, loop_distance, preferences)
        if first_loop:
            waypoints.extend(first_loop[1:])  # Skip first point (already added)
        
        # Generate second loop
        second_loop = await self._generate_small_loop(start_coord, loop_distance, preferences)
        if second_loop:
            waypoints.extend(second_loop[1:])  # Skip first point (already added)
        
        # Close the figure-8
        waypoints.append(start_coord)
        
        return await self._finalize_route(waypoints, preferences)
    
    async def _generate_small_loop(self, center: Tuple[float, float], 
                                  target_distance: float, preferences: EnhancedRoutePreferences) -> List[Tuple[float, float]]:
        """Generate a small loop around a center point."""
        waypoints = [center]
        current_coord = center
        current_distance = 0.0
        
        # Generate 3-4 waypoints for the loop
        num_waypoints = random.randint(3, 4)
        
        for i in range(num_waypoints):
            if current_distance >= target_distance * 0.8:
                break
            
            # Generate waypoint in a circular pattern
            angle = (i + 1) * (2 * math.pi / num_waypoints)
            segment_length = target_distance / num_waypoints
            
            next_coord = self._move_coordinate(current_coord, angle, segment_length)
            waypoints.append(next_coord)
            
            current_distance += self._haversine_distance(current_coord, next_coord)
            current_coord = next_coord
        
        return waypoints
    
    async def _generate_optimized_waypoint(self, current: Tuple[float, float], 
                                         preferences: EnhancedRoutePreferences,
                                         existing_waypoints: List[Tuple[float, float]]) -> Optional[Tuple[float, float]]:
        """Generate an optimized next waypoint."""
        candidates = []
        
        for _ in range(20):  # Generate 20 candidates
            # Random direction with some preference for forward movement
            angle = random.uniform(0, 2 * math.pi)
            
            # Segment length based on remaining distance
            segment_length = random.uniform(
                preferences.min_segment_length,
                min(preferences.max_segment_length, preferences.target_distance * 0.2)
            )
            
            # Generate candidate coordinate
            candidate = self._move_coordinate(current, angle, segment_length)
            
            if self._is_valid_coordinate(candidate):
                score = self._score_waypoint_candidate(
                    candidate, current, existing_waypoints, preferences
                )
                candidates.append((candidate, score))
        
        # Return best candidate
        if candidates:
            candidates.sort(key=lambda x: x[1], reverse=True)
            return candidates[0][0]
        
        return None
    
    def _score_waypoint_candidate(self, candidate: Tuple[float, float], 
                                 current: Tuple[float, float],
                                 existing_waypoints: List[Tuple[float, float]],
                                 preferences: EnhancedRoutePreferences) -> float:
        """Score a waypoint candidate."""
        score = 0.0
        
        # Distance score (prefer reasonable segment lengths)
        distance = self._haversine_distance(current, candidate)
        if preferences.min_segment_length <= distance <= preferences.max_segment_length:
            score += 1.0
        
        # Avoid going back to existing waypoints
        min_distance_to_existing = min(
            self._haversine_distance(candidate, wp) for wp in existing_waypoints
        )
        if min_distance_to_existing > 0.1:  # At least 100m from existing
            score += 0.5
        
        # Direction preference (avoid sharp turns)
        if len(existing_waypoints) >= 2:
            prev_coord = existing_waypoints[-2]
            current_angle = self._calculate_bearing(prev_coord, current)
            new_angle = self._calculate_bearing(current, candidate)
            angle_diff = abs(new_angle - current_angle)
            
            # Prefer angles less than 90 degrees
            if angle_diff < math.pi / 2:
                score += 0.3
        
        return score
    
    def _move_coordinate(self, coord: Tuple[float, float], angle: float, distance_km: float) -> Tuple[float, float]:
        """Move a coordinate by a given distance and angle."""
        lat, lon = coord
        R = 6371.0  # Earth radius in km
        
        lat_rad = math.radians(lat)
        lon_rad = math.radians(lon)
        
        # Calculate new latitude
        new_lat_rad = math.asin(
            math.sin(lat_rad) * math.cos(distance_km / R) +
            math.cos(lat_rad) * math.sin(distance_km / R) * math.cos(angle)
        )
        
        # Calculate new longitude
        new_lon_rad = lon_rad + math.atan2(
            math.sin(angle) * math.sin(distance_km / R) * math.cos(lat_rad),
            math.cos(distance_km / R) - math.sin(lat_rad) * math.sin(new_lat_rad)
        )
        
        return math.degrees(new_lat_rad), math.degrees(new_lon_rad)
    
    def _calculate_bearing(self, start: Tuple[float, float], end: Tuple[float, float]) -> float:
        """Calculate bearing between two coordinates."""
        lat1, lon1 = math.radians(start[0]), math.radians(start[1])
        lat2, lon2 = math.radians(end[0]), math.radians(end[1])
        
        dlon = lon2 - lon1
        
        y = math.sin(dlon) * math.cos(lat2)
        x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlon)
        
        bearing = math.atan2(y, x)
        return bearing
    
    def _interpolate_coordinate(self, start: Tuple[float, float], 
                               end: Tuple[float, float], ratio: float) -> Tuple[float, float]:
        """Interpolate between two coordinates."""
        lat1, lon1 = start
        lat2, lon2 = end
        
        new_lat = lat1 + (lat2 - lat1) * ratio
        new_lon = lon1 + (lon2 - lon1) * ratio
        
        return (new_lat, new_lon)
    
    def _is_valid_coordinate(self, coord: Tuple[float, float]) -> bool:
        """Check if coordinate is valid."""
        lat, lon = coord
        return -90 <= lat <= 90 and -180 <= lon <= 180
    
    def _haversine_distance(self, coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
        """Calculate distance between two coordinates."""
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
    
    async def _finalize_route(self, waypoints: List[Tuple[float, float]], 
                             preferences: EnhancedRoutePreferences) -> Dict:
        """Finalize the route and calculate statistics."""
        if len(waypoints) < 2:
            raise ValueError("Route must have at least 2 waypoints")
        
        # Calculate total distance
        total_distance = 0.0
        for i in range(len(waypoints) - 1):
            total_distance += self._haversine_distance(waypoints[i], waypoints[i + 1])
        
        # Calculate elevation gain and profile
        elevation_gain = await self._estimate_elevation_gain(waypoints)
        elevation_profile = await self._generate_elevation_profile(waypoints)
        elevation_stats = await self._calculate_elevation_stats(waypoints)
        
        # Format response
        route_coords = []
        for lat, lon in waypoints:
            # Estimate elevation if not available
            estimated_elevation = self._estimate_elevation_at_point((lat, lon))
            coord = {
                "lat": lat,
                "lon": lon,
                "elevation": estimated_elevation
            }
            route_coords.append(coord)
        
        return {
            "route": route_coords,
            "total_distance_km": total_distance,
            "elevation_gain_m": elevation_gain,
            "elevation_profile": elevation_profile,
            "elevation_stats": elevation_stats,
            "waypoints_count": len(waypoints),
            "route_type": preferences.route_type.value,
            "success": True
        }
    
    async def _generate_elevation_profile(self, waypoints: List[Tuple[float, float]]) -> List[Dict[str, float]]:
        """Generate elevation profile for the route."""
        elevation_profile = []
        cumulative_distance = 0.0
        
        for i, waypoint in enumerate(waypoints):
            # Estimate elevation based on position (this would be enhanced with real elevation API)
            estimated_elevation = self._estimate_elevation_at_point(waypoint)
            
            elevation_profile.append({
                "index": i,
                "lat": waypoint[0],
                "lon": waypoint[1],
                "elevation": estimated_elevation,
                "distance_km": cumulative_distance
            })
            
            # Calculate distance to next waypoint
            if i < len(waypoints) - 1:
                segment_distance = self._haversine_distance(waypoint, waypoints[i + 1])
                cumulative_distance += segment_distance
        
        return elevation_profile
    
    def _estimate_elevation_at_point(self, coord: Tuple[float, float]) -> float:
        """Estimate elevation at a coordinate point."""
        # This is a placeholder - would integrate with elevation API
        # For now, generate realistic elevation based on coordinates
        lat, lon = coord
        
        # Simple elevation model (this would be replaced with real data)
        base_elevation = 50.0  # Base elevation in meters
        lat_variation = (lat - 39.0) * 1000  # Rough elevation change with latitude
        lon_variation = (lon + 75.0) * 500   # Rough elevation change with longitude
        
        # Add some realistic variation
        random_factor = (hash(f"{lat:.3f},{lon:.3f}") % 100) / 100.0
        
        estimated_elevation = base_elevation + lat_variation + lon_variation + (random_factor * 50)
        
        return max(0, estimated_elevation)
    
    async def _calculate_elevation_stats(self, waypoints: List[Tuple[float, float]]) -> Dict[str, float]:
        """Calculate comprehensive elevation statistics for the route."""
        if len(waypoints) < 2:
            return {
                "min_elevation": 0.0,
                "max_elevation": 0.0,
                "avg_elevation": 0.0,
                "elevation_gain": 0.0,
                "elevation_loss": 0.0,
                "total_climb": 0.0
            }
        
        # Get elevations for all waypoints
        elevations = [self._estimate_elevation_at_point(wp) for wp in waypoints]
        
        min_elev = min(elevations)
        max_elev = max(elevations)
        avg_elev = sum(elevations) / len(elevations)
        
        # Calculate elevation gain/loss
        elevation_gain = 0.0
        elevation_loss = 0.0
        
        for i in range(len(elevations) - 1):
            current_elev = elevations[i]
            next_elev = elevations[i + 1]
            
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
    
    async def _estimate_elevation_gain(self, waypoints: List[Tuple[float, float]]) -> float:
        """Estimate elevation gain for the route."""
        if len(waypoints) < 2:
            return 0.0
        
        # Get elevations for all waypoints
        elevations = [self._estimate_elevation_at_point(wp) for wp in waypoints]
        
        total_gain = 0.0
        for i in range(len(elevations) - 1):
            current_elev = elevations[i]
            next_elev = elevations[i + 1]
            
            gain = next_elev - current_elev
            if gain > 0:  # Only count positive elevation changes
                total_gain += gain
        
        return round(total_gain, 1) 