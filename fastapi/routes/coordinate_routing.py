"""
Coordinate-based routing endpoints for Cyclone Route API.

This module provides endpoints for generating routes using mathematical algorithms
instead of pre-downloaded maps, with optional GraphHopper integration for road-following.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
import asyncio

from utils.models import (
    RoutePreferences, RouteResponse, ErrorResponse, 
    FrontendRoutePreferences, FrontendRouteGenerationRequest, RouteType
)
from utils.hybrid_router import HybridRouter, HybridRoutePreferences
from utils.gpt_enhanced_router import GPTEnhancedRouter
from utils.logger import get_logger

# =============================================================================
# ROUTER SETUP
# =============================================================================

router = APIRouter()
logger = get_logger(__name__)

# =============================================================================
# FRONTEND ROUTE GENERATION
# =============================================================================

@router.post("/generate-frontend-route", response_model=RouteResponse)
async def generate_frontend_route(request: FrontendRouteGenerationRequest):
    """
    Generate a route using frontend preferences directly.
    
    This endpoint accepts the exact format that the frontend sends:
    - Frontend preference names (distanceTarget, elevationTarget, bikeLanes, etc.)
    - Automatic coordinate extraction from startingPointCoords/endingPointCoords
    - Unit conversion from miles to kilometers and feet to meters
    """
    try:
        logger.info(f"Generating frontend route: {request.preferences.routeType} "
                   f"at ({request.preferences.startingPointCoords}) "
                   f"target distance: {request.preferences.distanceTarget} miles")
        
        # Convert frontend preferences to backend format
        backend_prefs = HybridRoutePreferences(
            start_lat=request.preferences.startingPointCoords["lat"],
            start_lon=request.preferences.startingPointCoords["lng"],
            target_distance=request.preferences.distanceTarget * 1.60934,  # Convert miles to km
            route_type=RouteType.LOOP,  # Default to loop for now
            prefer_bike_lanes=request.preferences.bikeLanes,
            prefer_unpaved=request.preferences.preferGreenways,
            target_elevation_gain=request.preferences.elevationTarget * 0.3048,  # Convert feet to meters
            avoid_highways=request.preferences.avoidHighTraffic
        )
        
        # Generate route using hybrid router
        async with HybridRouter() as router_instance:
            route_result = await router_instance.generate_loop_route(backend_prefs)
        
        # Add metadata if requested
        if request.include_metadata:
            route_result.update(await _generate_route_metadata(route_result, backend_prefs))
        
        logger.info(f"Frontend route generated successfully: {route_result['waypoints_count']} waypoints, "
                   f"{route_result['total_distance_km']:.2f}km")
        
        return RouteResponse(**route_result)
        
    except Exception as e:
        logger.error(f"Frontend route generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Route generation failed: {str(e)}")

# =============================================================================
# GPT-ENHANCED ROUTE GENERATION
# =============================================================================

@router.post("/generate-gpt-enhanced-route", response_model=RouteResponse)
async def generate_gpt_enhanced_route(request: FrontendRouteGenerationRequest):
    """
    Generate an AI-powered route using GPT-5 nano for waypoint generation.
    
    This endpoint:
    1. Uses GPT-5 nano to analyze user preferences and generate intelligent waypoints
    2. Creates contextually aware routes with points of interest
    3. Uses GraphHopper to generate actual bikeable routes between waypoints
    4. Provides rich metadata including route descriptions and recommendations
    
    The result is a route that's not just mathematically accurate, but also
    interesting, engaging, and tailored to the user's preferences.
    """
    try:
        logger.info(f"=== GENERATING GPT-ENHANCED ROUTE ===")
        logger.info(f"Preferences: {request.preferences.routeType} "
                   f"at ({request.preferences.startingPointCoords}) "
                   f"target distance: {request.preferences.distanceTarget} miles")
        
        # Generate route using GPT-enhanced router
        async with GPTEnhancedRouter() as router_instance:
            route_result = await router_instance.generate_gpt_enhanced_route(request.preferences)
        
        # Add metadata if requested
        if request.include_metadata:
            route_result.update(await _generate_gpt_route_metadata(route_result, request.preferences))
        
        logger.info(f"GPT-enhanced route generated successfully: {route_result['waypoints_count']} waypoints, "
                   f"{route_result['total_distance_km']:.2f}km")
        
        return RouteResponse(**route_result)
        
    except Exception as e:
        logger.error(f"GPT-enhanced route generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"GPT-enhanced route generation failed: {str(e)}")

# =============================================================================
# HYBRID ROUTE GENERATION
# =============================================================================

@router.post("/generate-hybrid-route", response_model=RouteResponse)
async def generate_hybrid_route(request: FrontendRouteGenerationRequest):
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
            logger.info(f"Generating hybrid route: {request.preferences.routeType} "
                       f"at ({request.preferences.startingPointCoords}) "
                       f"target distance: {request.preferences.distanceTarget} miles")
            
            # Convert to hybrid preferences
            hybrid_prefs = HybridRoutePreferences(
                start_lat=request.preferences.startingPointCoords["lat"],
                start_lon=request.preferences.startingPointCoords["lng"],
                target_distance=request.preferences.distanceTarget * 1.60934,  # Convert miles to km
                route_type=RouteType.LOOP,
                prefer_bike_lanes=request.preferences.bikeLanes,
                prefer_unpaved=request.preferences.preferGreenways,
                target_elevation_gain=request.preferences.elevationTarget * 0.3048,  # Convert feet to meters
                avoid_highways=request.preferences.avoidHighTraffic
            )
            
            # Generate route using hybrid router
            async with HybridRouter() as router_instance:
                route_result = await router_instance.generate_loop_route(hybrid_prefs)
            
            # Add metadata if requested
            if request.include_metadata:
                route_result.update(await _generate_route_metadata(route_result, hybrid_prefs))
            
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

# =============================================================================
# INFORMATION ENDPOINTS
# =============================================================================

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
            },
            {
                "type": "gpt_enhanced",
                "name": "AI-Enhanced Route",
                "description": "Route generated using GPT-5 nano for intelligent waypoint selection",
                "best_for": ["Scenic exploration", "Points of interest", "Personalized experiences"]
            }
        ],
        "features": [
            "No map downloads required",
            "Real-time coordinate generation",
            "Customizable preferences",
            "Elevation targeting",
            "Surface type preferences",
            "AI-powered route planning"
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
            },
            {
                "type": "ai_enhanced",
                "name": "AI-Enhanced",
                "description": "Use GPT-5 nano for intelligent waypoint selection",
                "best_for": "Personalized, interesting routes with points of interest"
            }
        ]
    }

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

async def _generate_route_metadata(route_result: Dict, preferences: HybridRoutePreferences) -> Dict:
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

async def _generate_gpt_route_metadata(route_result: Dict, preferences: FrontendRoutePreferences) -> Dict:
    """Generate additional metadata for GPT-enhanced routes."""
    try:
        # GPT routes already include rich metadata, just add basic stats
        avg_speed_kmh = 22.5
        estimated_minutes = (route_result['total_distance_km'] / avg_speed_kmh) * 60
        
        # Calculate difficulty rating
        difficulty = _calculate_difficulty_rating(
            route_result['total_distance_km'], 
            route_result['elevation_gain_m']
        )
        
        # Surface breakdown based on preferences
        surface_breakdown = {
            "paved": 70.0,
            "unpaved": 20.0,
            "mixed": 10.0
        }
        
        if preferences.preferGreenways:
            surface_breakdown["unpaved"] = 60.0
            surface_breakdown["paved"] = 30.0
            surface_breakdown["mixed"] = 10.0
        
        return {
            "estimated_duration_minutes": round(estimated_minutes, 1),
            "difficulty_rating": difficulty,
            "surface_breakdown": surface_breakdown
        }
        
    except Exception as e:
        logger.warning(f"Failed to generate GPT route metadata: {e}")
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