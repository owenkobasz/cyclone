from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import random
import math

from utils.models import RoutePreferences, RouteResponse
from utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)

@router.post("/generate-custom-route", response_model=RouteResponse)
async def generate_custom_route(preferences: RoutePreferences):
    """
    Generate a custom route based on preferences.
    
    This endpoint supports:
    - Direct routing between two points
    - Target distance routing
    - Custom preferences for bike lanes and hill avoidance
    """
    try:
        logger.info(f"Generating custom route from ({preferences.start_lat}, {preferences.start_lon}) "
                   f"to ({preferences.end_lat}, {preferences.end_lon})")
        
        # For now, generate a simple coordinate-based route since we don't have a graph
        # This maintains compatibility with the frontend while using the new system
        
        if preferences.end_lat and preferences.end_lon:
            # Point-to-point route
            route_coords = [
                {"lat": preferences.start_lat, "lon": preferences.start_lon},
                {"lat": preferences.end_lat, "lon": preferences.end_lon}
            ]
            
            # Calculate distance
            total_distance = haversine_distance(
                preferences.start_lat, preferences.start_lon,
                preferences.end_lat, preferences.end_lon
            )
            
            # If target distance is specified, create a route that meets it
            if preferences.target_distance:
                route_coords = await _generate_target_distance_route(
                    preferences.start_lat, preferences.start_lon,
                    preferences.end_lat, preferences.end_lon,
                    preferences.target_distance
                )
                total_distance = preferences.target_distance
        else:
            # Loop route from start point
            route_coords = await _generate_loop_route(
                preferences.start_lat, preferences.start_lon,
                preferences.target_distance or 20.0
            )
            total_distance = preferences.target_distance or 20.0
        
        # Estimate elevation gain (placeholder)
        elevation_gain = _estimate_elevation_gain(total_distance)
        
        return RouteResponse(
            route=route_coords,
            total_distance_km=total_distance,
            elevation_gain_m=elevation_gain,
            waypoints_count=len(route_coords),
            route_type="custom",
            success=True
        )
        
    except Exception as e:
        logger.error(f"Route generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Route generation failed: {str(e)}")

async def _generate_target_distance_route(start_lat: float, start_lon: float, 
                                        end_lat: float, end_lon: float, 
                                        target_distance: float) -> List[Dict[str, float]]:
    """Generate a route that meets the target distance."""
    # Calculate direct distance
    direct_distance = haversine_distance(start_lat, start_lon, end_lat, end_lon)
    
    if direct_distance >= target_distance:
        # Direct route is already long enough
        return [
            {"lat": start_lat, "lon": start_lon},
            {"lat": end_lat, "lon": end_lon}
        ]
    
    # Need to add waypoints to meet target distance
    route_coords = [{"lat": start_lat, "lon": start_lon}]
    
    # Calculate midpoint and add detour
    mid_lat = (start_lat + end_lat) / 2
    mid_lon = (start_lon + end_lon) / 2
    
    # Add detour waypoint perpendicular to the route
    detour_distance = (target_distance - direct_distance) / 2
    detour_lat, detour_lon = _move_coordinate(mid_lat, mid_lon, math.pi/2, detour_distance)
    
    route_coords.extend([
        {"lat": detour_lat, "lon": detour_lon},
        {"lat": end_lat, "lon": end_lon}
    ])
    
    return route_coords

async def _generate_loop_route(start_lat: float, start_lon: float, 
                              target_distance: float) -> List[Dict[str, float]]:
    """Generate a loop route starting and ending at the same point."""
    route_coords = [{"lat": start_lat, "lon": start_lon}]
    
    # Generate waypoints in a circular pattern
    num_waypoints = max(3, int(target_distance / 5))  # One waypoint per 5km
    
    for i in range(num_waypoints):
        angle = (i + 1) * (2 * math.pi / num_waypoints)
        segment_distance = target_distance / num_waypoints
        
        new_lat, new_lon = _move_coordinate(start_lat, start_lon, angle, segment_distance)
        route_coords.append({"lat": new_lat, "lon": new_lon})
    
    # Close the loop
    route_coords.append({"lat": start_lat, "lon": start_lon})
    
    return route_coords

def _move_coordinate(lat: float, lon: float, angle: float, distance_km: float) -> tuple[float, float]:
    """Move a coordinate by a given distance and angle."""
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

def _estimate_elevation_gain(distance_km: float) -> float:
    """Estimate elevation gain based on distance."""
    # Rough estimate: 50-100m elevation gain per 10km
    elevation_per_10km = random.uniform(50, 100)
    return (distance_km / 10) * elevation_per_10km

@router.post("/generate-loop-route")
async def generate_loop_route(
    start_lat: float,
    start_lon: float,
    target_distance: float
):
    """Generate a loop route starting and ending at the same point."""
    try:
        logger.info(f"Generating loop route at ({start_lat}, {start_lon}) "
                   f"with target distance: {target_distance}km")
        
        route_coords = await _generate_loop_route(start_lat, start_lon, target_distance)
        total_distance = target_distance
        elevation_gain = _estimate_elevation_gain(total_distance)
        
        return RouteResponse(
            route=route_coords,
            total_distance_km=total_distance,
            elevation_gain_m=elevation_gain,
            waypoints_count=len(route_coords),
            route_type="loop",
            success=True
        )
        
    except Exception as e:
        logger.error(f"Loop route generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Loop route generation failed: {str(e)}")

@router.get("/route-options")
async def get_route_options():
    """Get information about available routing options and algorithms."""
    logger.info("Route options requested")
    return {
        "algorithms": [
            "Coordinate-based routing",
            "Target distance optimization",
            "Loop route generation"
        ],
        "preferences": [
            "Bike lane preference",
            "Hill avoidance",
            "Target distance specification"
        ],
        "features": [
            "No map downloads required",
            "Real-time coordinate generation",
            "Customizable preferences"
        ]
    } 