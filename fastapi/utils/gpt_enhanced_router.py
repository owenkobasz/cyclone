"""
GPT-enhanced router that combines AI-generated waypoints with GraphHopper routing.

This router:
1. Uses GPT-5 nano to generate intelligent, contextually aware waypoints
2. Passes those waypoints to GraphHopper for actual route generation
3. Combines AI intelligence with real road data for optimal routes
"""

import asyncio
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
import os

from .logger import get_logger
from .models import FrontendRoutePreferences, RouteType
from .gpt_waypoint_generator import GPTWaypointGenerator, GPTRoutePlan
from .graphhopper_client import GraphHopperClient, GraphHopperConfig, RoutePoint

# =============================================================================
# DATA MODELS
# =============================================================================

@dataclass
class GPTEnhancedRoutePreferences:
    """Preferences for GPT-enhanced route generation."""
    
    # Location
    start_lat: float
    start_lon: float
    
    # Route specifications
    target_distance: float
    route_type: RouteType = RouteType.LOOP
    
    # Preferences
    prefer_bike_lanes: bool = False
    prefer_unpaved: bool = False
    target_elevation_gain: Optional[float] = None
    avoid_highways: bool = True
    
    # GPT-specific preferences
    include_points_of_interest: bool = True
    prefer_scenic_routes: bool = True
    avoid_high_traffic: bool = True

# =============================================================================
# GPT ENHANCED ROUTER CLASS
# =============================================================================

class GPTEnhancedRouter:
    """
    GPT-enhanced router that combines AI intelligence with GraphHopper routing.
    
    This router:
    1. Uses GPT-5 nano to generate intelligent, contextually aware waypoints
    2. Passes those waypoints to GraphHopper for actual route generation
    3. Combines AI intelligence with real road data for optimal routes
    """
    
    def __init__(self):
        self.logger = get_logger(__name__)
        self.gpt_generator = GPTWaypointGenerator()
        self.graphhopper_client: Optional[GraphHopperClient] = None
        
        # GraphHopper configuration
        self.graphhopper_config = GraphHopperConfig(
            api_key=os.getenv("GRAPHHOPPER_API_KEY", "demo"),
            vehicle="bike",
            elevation=True,
            calc_points=True
        )
        
    async def __aenter__(self):
        """Async context manager entry."""
        self.graphhopper_client = GraphHopperClient(self.graphhopper_config)
        await self.graphhopper_client.__aenter__()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self.graphhopper_client:
            await self.graphhopper_client.__aexit__(exc_type, exc_val, exc_tb)
    
    # =============================================================================
    # MAIN ROUTE GENERATION
    # =============================================================================
    
    async def generate_gpt_enhanced_route(self, preferences: FrontendRoutePreferences) -> Dict:
        """
        Generate a route using GPT for waypoint generation and GraphHopper for routing.
        
        This combines:
        - AI intelligence for interesting, contextually aware waypoints
        - GraphHopper for actual road-following and elevation data
        - User preferences for personalized route experience
        """
        try:
            self.logger.info(f"=== STARTING GPT-ENHANCED ROUTE GENERATION ===")
            self.logger.info(f"Preferences: {preferences.distanceTarget} miles, {preferences.elevationTarget} ft, {preferences.routeType}")
            
            # Step 1: Generate intelligent waypoints using GPT
            self.logger.info("Step 1: Generating intelligent waypoints using GPT...")
            gpt_route_plan = await self.gpt_generator.generate_intelligent_route(preferences)
            
            if not gpt_route_plan.waypoints:
                raise ValueError("GPT failed to generate waypoints")
            
            self.logger.info(f"GPT generated {len(gpt_route_plan.waypoints)} intelligent waypoints")
            
            # Step 2: Convert GPT waypoints to GraphHopper route
            self.logger.info("Step 2: Converting GPT waypoints to GraphHopper route...")
            try:
                route_points = await self._generate_graphhopper_route(gpt_route_plan, preferences)
                routing_method = "gpt_enhanced_graphhopper"
                self.logger.info("Successfully generated GraphHopper route from GPT waypoints")
            except Exception as e:
                self.logger.warning(f"GraphHopper routing failed: {e}")
                self.logger.info("Falling back to direct GPT waypoints...")
                
                # Fallback: Use GPT waypoints directly
                route_points = [RoutePoint(wp.lat, wp.lon) for wp in gpt_route_plan.waypoints]
                routing_method = "gpt_enhanced_fallback"
                self.logger.info("Using GPT waypoints directly as fallback")
            
            # Step 3: Calculate final route statistics
            self.logger.info("Step 3: Calculating final route statistics...")
            total_distance = self._calculate_total_distance(route_points)
            elevation_gain = await self._calculate_elevation_gain(route_points)
            elevation_profile = await self._get_elevation_profile(route_points)
            elevation_stats = await self._get_elevation_stats(route_points)
            
            self.logger.info(f"Final route: {len(route_points)} waypoints, {total_distance:.2f}km")
            self.logger.info(f"Distance accuracy: {(total_distance/(preferences.distanceTarget * 1.60934))*100:.1f}%")
            self.logger.info(f"Elevation gain: {elevation_gain:.1f}m")
            
            # Step 4: Format response with GPT metadata
            self.logger.info("Step 4: Formatting response with GPT metadata...")
            route_coords = []
            for i, wp in enumerate(route_points):
                # Find corresponding GPT waypoint if available
                gpt_waypoint = None
                if i < len(gpt_route_plan.waypoints):
                    gpt_waypoint = gpt_route_plan.waypoints[i]
                
                coord = {
                    "lat": wp.lat,
                    "lon": wp.lon,
                    "elevation": wp.elevation if wp.elevation is not None else 0.0,
                    "index": i
                }
                
                # Add GPT metadata if available
                if gpt_waypoint:
                    coord.update({
                        "name": gpt_waypoint.name,
                        "description": gpt_waypoint.description,
                        "reasoning": gpt_waypoint.reasoning,
                        "category": gpt_waypoint.category,
                        "estimated_duration_minutes": gpt_waypoint.estimated_duration_minutes
                    })
                
                route_coords.append(coord)
            
            # Get GPT route metadata
            gpt_metadata = self.gpt_generator.get_route_metadata(gpt_route_plan)
            
            self.logger.info("=== GPT-ENHANCED ROUTE GENERATION COMPLETE ===")
            
            return {
                "route": route_coords,
                "total_distance_km": total_distance,
                "elevation_gain_m": elevation_gain,
                "elevation_profile": elevation_profile,
                "elevation_stats": elevation_stats,
                "waypoints_count": len(route_points),
                "route_type": "gpt_enhanced",
                "success": True,
                "routing_method": routing_method,
                
                # GPT-specific metadata
                "gpt_metadata": gpt_metadata,
                "route_description": gpt_route_plan.route_description,
                "highlights": gpt_route_plan.highlights,
                "recommendations": gpt_route_plan.recommendations,
                "waypoint_categories": [wp.category for wp in gpt_route_plan.waypoints]
            }
            
        except Exception as e:
            self.logger.error(f"GPT-enhanced route generation failed: {e}", exc_info=True)
            raise
    
    # =============================================================================
    # GRAPHHOPPER INTEGRATION
    # =============================================================================
    
    async def _generate_graphhopper_route(self, gpt_route_plan: GPTRoutePlan, 
                                        preferences: FrontendRoutePreferences) -> List[RoutePoint]:
        """Generate GraphHopper route from GPT waypoints."""
        if not self.graphhopper_client:
            raise Exception("GraphHopper client not available")
        
        # Convert GPT waypoints to coordinate tuples
        waypoint_coords = self.gpt_generator.get_waypoint_coordinates(gpt_route_plan)
        
        # Convert preferences to GraphHopper format
        graphhopper_prefs = {
            "prefer_bike_lanes": preferences.bikeLanes,
            "prefer_unpaved": preferences.preferGreenways,
            "avoid_highways": preferences.avoidHighTraffic
        }
        
        # Generate route using GraphHopper
        route_points = await self.graphhopper_client.route_between_waypoints(
            waypoint_coords, graphhopper_prefs
        )
        
        if not route_points:
            raise Exception("GraphHopper failed to generate route")
        
        return route_points
    
    # =============================================================================
    # UTILITY FUNCTIONS
    # =============================================================================
    
    def _calculate_total_distance(self, waypoints: List[RoutePoint]) -> float:
        """Calculate total distance of the route."""
        if len(waypoints) < 2:
            return 0.0
        
        total = 0.0
        for i in range(len(waypoints) - 1):
            total += self._haversine_distance(
                (waypoints[i].lat, waypoints[i].lon), 
                (waypoints[i+1].lat, waypoints[i+1].lon)
            )
        
        return total
    
    async def _calculate_elevation_gain(self, waypoints: List[RoutePoint]) -> float:
        """Calculate total elevation gain of the route."""
        if not waypoints or not self.graphhopper_client:
            return 0.0
        
        try:
            elevation_gain = self.graphhopper_client.calculate_elevation_gain(waypoints)
            self.logger.info(f"Calculated elevation gain using GraphHopper data: {elevation_gain}m")
            return elevation_gain
        except Exception as e:
            self.logger.warning(f"Failed to calculate elevation using GraphHopper: {e}")
            return 0.0
    
    async def _get_elevation_profile(self, waypoints: List[RoutePoint]) -> List[Dict[str, float]]:
        """Get elevation profile for the route."""
        if not waypoints or not self.graphhopper_client:
            return []
        
        try:
            elevation_profile = await self.graphhopper_client.get_elevation_profile(waypoints)
            self.logger.info(f"Generated elevation profile with {len(elevation_profile)} points")
            return elevation_profile
        except Exception as e:
            self.logger.warning(f"Failed to generate elevation profile: {e}")
            return []
    
    async def _get_elevation_stats(self, waypoints: List[RoutePoint]) -> Dict[str, float]:
        """Get comprehensive elevation statistics for the route."""
        if not waypoints or not self.graphhopper_client:
            return {
                "min_elevation": 0.0,
                "max_elevation": 0.0,
                "avg_elevation": 0.0,
                "elevation_gain": 0.0,
                "elevation_loss": 0.0,
                "total_climb": 0.0
            }
        
        try:
            elevation_stats = self.graphhopper_client.calculate_elevation_stats(waypoints)
            self.logger.info(f"Generated elevation stats: {elevation_stats}")
            return elevation_stats
        except Exception as e:
            self.logger.warning(f"Failed to generate elevation stats: {e}")
            return {
                "min_elevation": 0.0,
                "max_elevation": 0.0,
                "avg_elevation": 0.0,
                "elevation_gain": 0.0,
                "elevation_loss": 0.0,
                "total_climb": 0.0
            }
    
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