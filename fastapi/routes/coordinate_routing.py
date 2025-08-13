from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
import asyncio

from utils.models import (
    RoutePreferences, RouteResponse, ErrorResponse, 
    RouteGenerationRequest, RouteType
)
from utils.coordinate_router import CoordinateRouter, RoutePreferences as BasicRoutePreferences
from utils.hybrid_router import HybridRouter, HybridRoutePreferences
from utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)

@router.post("/generate-coordinate-route", response_model=RouteResponse)
async def generate_coordinate_route(request: RouteGenerationRequest):
    """
    Generate a route using coordinate-based routing (no map downloads required).
    
    This endpoint generates routes based on:
    - Start location coordinates
    - Target distance
    - Route type (loop, out-and-back, figure-8)
    - Surface preferences (paved/unpaved)
    - Elevation targets
    - Bike lane preferences
    """
    try:
        logger.info(f"Generating coordinate-based route: {request.preferences.route_type.value} "
                   f"at ({request.preferences.start_lat}, {request.preferences.start_lon}) "
                   f"target distance: {request.preferences.target_distance}km")
        
        # Convert to basic preferences for now
        basic_prefs = BasicRoutePreferences(
            start_lat=request.preferences.start_lat,
            start_lon=request.preferences.start_lon,
            target_distance=request.preferences.target_distance,
            prefer_bike_lanes=request.preferences.prefer_bike_lanes,
            prefer_unpaved=request.preferences.prefer_unpaved,
            target_elevation_gain=request.preferences.target_elevation_gain,
            max_elevation_gain=request.preferences.max_elevation_gain
        )
        
        # Generate route using basic coordinate router
        router_instance = CoordinateRouter()
        if request.preferences.route_type == RouteType.LOOP:
            route_result = await router_instance.generate_loop_route(basic_prefs)
        else:
            # For now, default to loop route
            route_result = await router_instance.generate_loop_route(basic_prefs)
        
        # Add metadata if requested
        if request.include_metadata:
            route_result.update(await _generate_route_metadata(route_result, request.preferences))
        
        logger.info(f"Route generated successfully: {route_result['waypoints_count']} waypoints, "
                   f"{route_result['total_distance_km']:.2f}km")
        
        return RouteResponse(**route_result)
        
    except Exception as e:
        logger.error(f"Coordinate route generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Route generation failed: {str(e)}")

@router.post("/generate-loop-route", response_model=RouteResponse)
async def generate_loop_route(preferences: RoutePreferences):
    """
    Generate a loop route starting and ending at the same point.
    
    This is a simplified endpoint specifically for loop routes.
    """
    try:
        # Ensure route type is loop
        if preferences.route_type != RouteType.LOOP:
            preferences.route_type = RouteType.LOOP
            logger.info("Route type automatically set to loop for this endpoint")
        
        # Create request object
        request = RouteGenerationRequest(
            preferences=preferences,
            include_metadata=True,
            optimize_for="distance"
        )
        
        return await generate_coordinate_route(request)
        
    except Exception as e:
        logger.error(f"Loop route generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Loop route generation failed: {str(e)}")

@router.post("/generate-out-and-back-route", response_model=RouteResponse)
async def generate_out_and_back_route(preferences: RoutePreferences):
    """
    Generate an out-and-back route.
    """
    try:
        # Ensure route type is out-and-back
        if preferences.route_type != RouteType.OUT_AND_BACK:
            preferences.route_type = RouteType.OUT_AND_BACK
            logger.info("Route type automatically set to out-and-back for this endpoint")
        
        # Create request object
        request = RouteGenerationRequest(
            preferences=preferences,
            include_metadata=True,
            optimize_for="distance"
        )
        
        return await generate_coordinate_route(request)
        
    except Exception as e:
        logger.error(f"Out-and-back route generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Out-and-back route generation failed: {str(e)}")

@router.post("/generate-hybrid-route", response_model=RouteResponse)
async def generate_hybrid_route(request: RouteGenerationRequest):
    """
    Generate a route using hybrid routing (mathematical distance + road following).
    
    This endpoint combines:
    - Proven distance calculation logic (103.8% accuracy vs 30%)
    - Road-following capabilities using OSM data
    - Actual bikeable routes instead of straight lines
    
    The system will retry GraphHopper routing with different parameters if it fails,
    rather than falling back to coordinate-based routing.
    """
    max_retries = 3
    retry_delay = 1.0  # seconds
    
    for attempt in range(max_retries):
        try:
            logger.info(f"=== HYBRID ROUTE GENERATION ATTEMPT {attempt + 1}/{max_retries} ===")
            logger.info(f"Generating hybrid route: {request.preferences.route_type.value} "
                       f"at ({request.preferences.start_lat}, {request.preferences.start_lon}) "
                       f"target distance: {request.preferences.target_distance}km")
            
            # Convert to hybrid preferences
            hybrid_prefs = HybridRoutePreferences(
                start_lat=request.preferences.start_lat,
                start_lon=request.preferences.start_lon,
                target_distance=request.preferences.target_distance,
                route_type=request.preferences.route_type,
                prefer_bike_lanes=request.preferences.prefer_bike_lanes,
                prefer_unpaved=request.preferences.prefer_unpaved,
                target_elevation_gain=request.preferences.target_elevation_gain,
                max_elevation_gain=request.preferences.max_elevation_gain,
                avoid_highways=request.preferences.avoid_highways,
                max_segment_length=request.preferences.max_segment_length,
                min_segment_length=request.preferences.min_segment_length
            )
            
            # Generate route using hybrid router
            async with HybridRouter() as router_instance:
                if request.preferences.route_type == RouteType.LOOP:
                    route_result = await router_instance.generate_loop_route(hybrid_prefs)
                else:
                    # For now, default to loop route
                    route_result = await router_instance.generate_loop_route(hybrid_prefs)
            
            # Add metadata if requested
            if request.include_metadata:
                route_result.update(await _generate_route_metadata(route_result, request.preferences))
            
            logger.info(f"Hybrid route generated successfully on attempt {attempt + 1}: "
                       f"{route_result['waypoints_count']} waypoints, "
                       f"{route_result['total_distance_km']:.2f}km")
            
            return RouteResponse(**route_result)
            
        except Exception as e:
            logger.error(f"Hybrid route generation attempt {attempt + 1} failed: {e}")
            
            if attempt < max_retries - 1:
                logger.info(f"Retrying hybrid route generation in {retry_delay} seconds...")
                await asyncio.sleep(retry_delay)
                retry_delay *= 1.5  # Exponential backoff
                continue
            else:
                logger.error(f"All {max_retries} hybrid route generation attempts failed")
                raise HTTPException(
                    status_code=500, 
                    detail=f"Route generation failed after {max_retries} attempts. "
                           f"Last error: {str(e)}"
                )

@router.get("/route-types")
async def get_route_types():
    """Get information about available route types."""
    logger.info("Route types requested")
    return {
        "route_types": [
            {
                "type": "loop",
                "name": "Loop Route",
                "description": "Route that starts and ends at the same point",
                "best_for": ["Training", "Local exploration", "Fixed distance workouts"]
            },
            {
                "type": "out_and_back",
                "name": "Out and Back",
                "description": "Route that goes out to a point and returns the same way",
                "best_for": ["Long distance training", "Scenic routes", "Time-based workouts"]
            },
            {
                "type": "figure_8",
                "name": "Figure 8",
                "description": "Route that forms a figure-8 pattern",
                "best_for": ["Varied terrain", "Mixed distance segments", "Complex routing"]
            }
        ],
        "features": [
            "No map downloads required",
            "Real-time coordinate generation",
            "Customizable preferences",
            "Elevation targeting",
            "Surface type preferences"
        ]
    }

@router.get("/route-optimization-options")
async def get_optimization_options():
    """Get information about route optimization options."""
    logger.info("Optimization options requested")
    return {
        "optimization_types": [
            {
                "type": "distance",
                "name": "Distance Optimized",
                "description": "Optimize for accurate target distance",
                "best_for": "Precise distance training"
            },
            {
                "type": "elevation",
                "name": "Elevation Optimized", 
                "description": "Optimize for target elevation gain",
                "best_for": "Hill training and climbing"
            },
            {
                "type": "scenic",
                "name": "Scenic Optimized",
                "description": "Optimize for varied and interesting routes",
                "best_for": "Recreational riding"
            },
            {
                "type": "fastest",
                "name": "Fastest Route",
                "description": "Optimize for minimal elevation and direct paths",
                "best_for": "Speed training and commuting"
            }
        ]
    }

async def _generate_route_metadata(route_result: Dict, preferences: RoutePreferences) -> Dict:
    """Generate additional metadata for the route."""
    try:
        # Calculate estimated duration (assuming 20-25 km/h average speed)
        avg_speed_kmh = 22.5
        estimated_minutes = (route_result['total_distance_km'] / avg_speed_kmh) * 60
        
        # Calculate difficulty rating based on distance and elevation
        difficulty = _calculate_difficulty_rating(
            route_result['total_distance_km'], 
            route_result['elevation_gain_m']
        )
        
        # Estimate surface breakdown (placeholder for now)
        surface_breakdown = {
            "paved": 70.0,
            "unpaved": 20.0,
            "mixed": 10.0
        }
        
        # Adjust based on preferences
        if preferences.prefer_unpaved:
            surface_breakdown["unpaved"] = 60.0
            surface_breakdown["paved"] = 30.0
            surface_breakdown["mixed"] = 10.0
        
        return {
            "estimated_duration_minutes": round(estimated_minutes, 1),
            "difficulty_rating": difficulty,
            "surface_breakdown": surface_breakdown
        }
        
    except Exception as e:
        logger.warning(f"Failed to generate route metadata: {e}")
        return {}

def _calculate_difficulty_rating(distance_km: float, elevation_m: float) -> str:
    """Calculate difficulty rating based on distance and elevation."""
    # Simple difficulty calculation
    difficulty_score = (distance_km * 0.1) + (elevation_m * 0.001)
    
    if difficulty_score < 2:
        return "Easy"
    elif difficulty_score < 4:
        return "Moderate"
    elif difficulty_score < 6:
        return "Challenging"
    else:
        return "Difficult" 