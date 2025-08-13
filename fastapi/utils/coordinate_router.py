import math
import random
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
import asyncio
import aiohttp
from .logger import get_logger

logger = get_logger(__name__)

@dataclass
class Coordinate:
    lat: float
    lon: float
    
    def distance_to(self, other: 'Coordinate') -> float:
        """Calculate distance to another coordinate in kilometers."""
        return haversine_distance(self.lat, self.lon, other.lat, other.lon)

@dataclass
class RoutePreferences:
    start_lat: float
    start_lon: float
    target_distance: float
    prefer_bike_lanes: bool = False
    prefer_unpaved: bool = False
    target_elevation_gain: Optional[float] = None
    max_elevation_gain: Optional[float] = None

class CoordinateRouter:
    """Coordinate-based router that generates routes without pre-downloaded maps."""
    
    def __init__(self):
        self.logger = get_logger(__name__)
        # Default parameters for route generation
        self.min_segment_length = 0.5  # km
        self.max_segment_length = 3.0  # km
        self.elevation_api_key = None  # Will be set from environment
    
    async def generate_loop_route(self, preferences: RoutePreferences) -> Dict:
        """
        Generate a loop route starting and ending at the same point.
        
        Args:
            preferences: Route preferences including start location and target distance
            
        Returns:
            Dict containing route coordinates and metadata
        """
        try:
            self.logger.info(f"=== STARTING LOOP ROUTE GENERATION ===")
            self.logger.info(f"Start location: ({preferences.start_lat}, {preferences.start_lon})")
            self.logger.info(f"Target distance: {preferences.target_distance}km")
            self.logger.info(f"Bike lane preference: {preferences.prefer_bike_lanes}")
            self.logger.info(f"Unpaved preference: {preferences.prefer_unpaved}")
            
            start_coord = Coordinate(preferences.start_lat, preferences.start_lon)
            
            # Generate route waypoints
            self.logger.info("Generating loop waypoints...")
            waypoints = await self._generate_loop_waypoints(start_coord, preferences)
            
            if not waypoints:
                raise ValueError("Could not generate valid route waypoints")
            
            self.logger.info(f"Generated {len(waypoints)} waypoints")
            for i, wp in enumerate(waypoints):
                self.logger.info(f"  Waypoint {i}: ({wp.lat:.6f}, {wp.lon:.6f})")
            
            # Calculate route statistics
            self.logger.info("Calculating route statistics...")
            total_distance = self._calculate_total_distance(waypoints)
            elevation_gain = await self._calculate_elevation_gain(waypoints)
            
            self.logger.info(f"Total distance: {total_distance:.2f}km")
            self.logger.info(f"Elevation gain: {elevation_gain:.1f}m")
            self.logger.info(f"Distance accuracy: {(total_distance/preferences.target_distance)*100:.1f}%")
            
            # Format response
            route_coords = [{"lat": wp.lat, "lon": wp.lon} for wp in waypoints]
            
            self.logger.info("=== LOOP ROUTE GENERATION COMPLETE ===")
            
            return {
                "route": route_coords,
                "total_distance_km": total_distance,
                "elevation_gain_m": elevation_gain,
                "waypoints_count": len(waypoints),
                "route_type": "loop",
                "success": True
            }
            
        except Exception as e:
            self.logger.error(f"Loop route generation failed: {e}", exc_info=True)
            raise
    
    async def _generate_loop_waypoints(self, start: Coordinate, preferences: RoutePreferences) -> List[Coordinate]:
        """Generate waypoints for a loop route."""
        self.logger.info("=== GENERATING LOOP WAYPOINTS ===")
        waypoints = [start]
        current_distance = 0.0
        current_coord = start
        
        # Calculate optimal segment length based on target distance
        target_segments = max(4, int(preferences.target_distance / 4))  # Aim for 4km segments for longer routes
        optimal_segment_length = preferences.target_distance / target_segments
        
        # Adjust segment length constraints for better distance accuracy
        self.max_segment_length = max(3.0, optimal_segment_length * 1.5)
        self.min_segment_length = min(1.0, optimal_segment_length * 0.5)
        
        self.logger.info(f"Target segments: {target_segments}")
        self.logger.info(f"Optimal segment length: {optimal_segment_length:.2f}km")
        self.logger.info(f"Adjusted max segment: {self.max_segment_length:.2f}km")
        self.logger.info(f"Adjusted min segment: {self.min_segment_length:.2f}km")
        
        # Generate waypoints until we're close to target distance
        segment_count = 0
        while current_distance < preferences.target_distance * 0.7:  # Allow more room for return
            segment_count += 1
            self.logger.info(f"--- Generating segment {segment_count} ---")
            self.logger.info(f"Current distance: {current_distance:.2f}km")
            self.logger.info(f"Remaining to target: {preferences.target_distance - current_distance:.2f}km")
            
            # Generate next waypoint
            next_coord = self._generate_next_waypoint(
                current_coord, 
                preferences.target_distance - current_distance,
                preferences
            )
            
            if not next_coord:
                self.logger.warning("Failed to generate next waypoint, stopping")
                break
                
            waypoints.append(next_coord)
            segment_distance = current_coord.distance_to(next_coord)
            current_distance += segment_distance
            
            self.logger.info(f"Generated waypoint: ({next_coord.lat:.6f}, {next_coord.lon:.6f})")
            self.logger.info(f"Segment distance: {segment_distance:.2f}km")
            self.logger.info(f"Total distance so far: {current_distance:.2f}km")
            
            current_coord = next_coord
            
            # Check if we can return to start with reasonable accuracy
            return_distance = current_coord.distance_to(start)
            total_estimated = current_distance + return_distance
            
            self.logger.info(f"Return distance to start: {return_distance:.2f}km")
            self.logger.info(f"Total estimated route: {total_estimated:.2f}km")
            
            # Stop if we're close to target (within 10% tolerance)
            if abs(total_estimated - preferences.target_distance) <= preferences.target_distance * 0.1:
                self.logger.info(f"Target distance reached within 10% tolerance")
                break
            
            # Also stop if we're getting too long
            if total_estimated > preferences.target_distance * 1.3:
                self.logger.info(f"Route getting too long ({total_estimated:.2f}km > {preferences.target_distance * 1.3:.2f}km), stopping")
                break
        
        # Add return to start if possible
        if len(waypoints) > 1:
            waypoints.append(start)
            self.logger.info("Added return to start point")
        
        self.logger.info(f"=== LOOP WAYPOINTS COMPLETE: {len(waypoints)} waypoints ===")
        return waypoints
    
    def _generate_next_waypoint(self, current: Coordinate, remaining_distance: float, 
                               preferences: RoutePreferences) -> Optional[Coordinate]:
        """Generate the next waypoint based on preferences."""
        self.logger.info(f"  Generating next waypoint from ({current.lat:.6f}, {current.lon:.6f})")
        self.logger.info(f"  Remaining distance: {remaining_distance:.2f}km")
        
        # Calculate optimal segment length based on remaining distance and target
        if remaining_distance > 10:  # For longer remaining distances
            segment_length = min(remaining_distance * 0.4, self.max_segment_length)
            self.logger.info(f"  Long distance segment: {remaining_distance * 0.4:.2f}km (capped at {self.max_segment_length:.2f}km)")
        else:  # For shorter remaining distances, be more precise
            segment_length = min(remaining_distance * 0.6, self.max_segment_length)
            self.logger.info(f"  Short distance segment: {remaining_distance * 0.6:.2f}km (capped at {self.max_segment_length:.2f}km)")
        
        # Ensure minimum segment length
        segment_length = max(segment_length, self.min_segment_length)
        self.logger.info(f"  Final segment length: {segment_length:.2f}km")
        
        # Generate multiple candidate waypoints
        candidates = []
        self.logger.info(f"  Generating 15 candidate waypoints...")
        
        for i in range(15):  # Increase candidate count for better selection
            # Random direction with some preference for continuing current direction
            angle = random.uniform(0, 2 * math.pi)
            
            # Calculate new coordinate
            new_lat, new_lon = self._move_coordinate(
                current.lat, current.lon, angle, segment_length
            )
            
            # Validate coordinate
            if self._is_valid_coordinate(new_lat, new_lon):
                candidate = Coordinate(new_lat, new_lon)
                score = self._score_waypoint(candidate, current, preferences)
                candidates.append((candidate, score))
                
                if i < 3:  # Log first few candidates for debugging
                    self.logger.info(f"    Candidate {i+1}: ({new_lat:.6f}, {new_lon:.6f}) - Score: {score:.3f}")
            else:
                self.logger.debug(f"    Candidate {i+1}: Invalid coordinate ({new_lat:.6f}, {new_lon:.6f})")
        
        # Return best candidate
        if candidates:
            candidates.sort(key=lambda x: x[1], reverse=True)
            best_candidate = candidates[0][0]
            best_score = candidates[0][1]
            self.logger.info(f"  Selected best candidate: ({best_candidate.lat:.6f}, {best_candidate.lon:.6f}) - Score: {best_score:.3f}")
            return best_candidate
        
        self.logger.warning("  No valid candidates generated")
        return None
    
    def _move_coordinate(self, lat: float, lon: float, angle: float, distance_km: float) -> Tuple[float, float]:
        """Move a coordinate by a given distance and angle."""
        self.logger.debug(f"    Moving coordinate ({lat:.6f}, {lon:.6f}) by {distance_km:.2f}km at angle {math.degrees(angle):.1f}°")
        
        # Earth radius in km
        R = 6371.0
        
        # Convert to radians
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
        
        new_lat = math.degrees(new_lat_rad)
        new_lon = math.degrees(new_lon_rad)
        
        self.logger.debug(f"    New coordinate: ({new_lat:.6f}, {new_lon:.6f})")
        
        return new_lat, new_lon
    
    def _is_valid_coordinate(self, lat: float, lon: float) -> bool:
        """Check if coordinate is valid."""
        return -90 <= lat <= 90 and -180 <= lon <= 180
    
    def _score_waypoint(self, candidate: Coordinate, current: Coordinate, 
                        preferences: RoutePreferences) -> float:
        """Score a waypoint candidate based on preferences."""
        score = 0.0
        
        # Distance score (prefer closer to target)
        distance = current.distance_to(candidate)
        score += 1.0 / (1.0 + distance)
        
        # Direction score (prefer forward movement)
        if len(preferences.__dict__) > 2:  # If we have previous waypoints
            # This would be enhanced with actual direction calculation
            pass
        
        # Elevation preference (if specified)
        if preferences.target_elevation_gain:
            # This would be enhanced with actual elevation calculation
            pass
        
        return score
    
    def _calculate_total_distance(self, waypoints: List[Coordinate]) -> float:
        """Calculate total distance of the route."""
        if len(waypoints) < 2:
            return 0.0
        
        total = 0.0
        for i in range(len(waypoints) - 1):
            total += waypoints[i].distance_to(waypoints[i + 1])
        
        return total
    
    async def _calculate_elevation_gain(self, waypoints: List[Coordinate]) -> float:
        """Calculate total elevation gain of the route."""
        # This would integrate with an elevation API
        # For now, return a placeholder
        return 0.0

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance between two points on Earth."""
    R = 6371.0  # Earth radius in kilometers
    
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