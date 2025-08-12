from fastapi import APIRouter, HTTPException, Depends
from typing import List
import random

from utils.models import RoutePreferences, RouteResponse, ErrorResponse
from utils.node_utils import find_nearest_nodes
from utils.response_formatter import format_route_response, format_error_response
from utils.routing_algorithms import (
    run_custom_astar, 
    dfs_paths_for_target_ptp,
    random_route
)
from utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)

# Global graph variable - will be set by dependency injection
G_PHILLY = None

def get_graph():
    """Dependency to get the graph."""
    if G_PHILLY is None:
        logger.error("Graph not loaded - cannot process routing requests")
        raise HTTPException(status_code=500, detail="Graph not loaded")
    return G_PHILLY

def set_graph(graph):
    """Set the global graph variable."""
    global G_PHILLY
    G_PHILLY = graph
    logger.info(f"Graph set in router with {len(graph.nodes)} nodes and {len(graph.edges)} edges")

@router.post("/generate-custom-route", response_model=RouteResponse)
async def generate_custom_route(
    preferences: RoutePreferences,
    G = Depends(get_graph)
):
    """
    Generate a custom route based on preferences.
    
    This endpoint supports:
    - Direct A* routing between two points
    - Target distance routing with multiple path options
    - Custom preferences for bike lanes and hill avoidance
    """
    try:
        logger.info(f"Generating custom route from ({preferences.start_lat}, {preferences.start_lon}) to ({preferences.end_lat}, {preferences.end_lon})")
        
        start_node, end_node = find_nearest_nodes(
            G, preferences.start_lat, preferences.start_lon, 
            preferences.end_lat, preferences.end_lon
        )
        
        logger.info(f"Found nearest nodes: start={start_node}, end={end_node}")

        # If a target distance is given, use the point-to-point DFS approach
        if preferences.target_distance_distance:
            logger.info(f"Using target distance routing with target: {preferences.target_distance_distance}km")
            valid_routes = dfs_paths_for_target_ptp(
                G, start_node, end_node, preferences.target_distance_distance
            )
            if valid_routes:
                path = random.choice(valid_routes)
                logger.info(f"Found {len(valid_routes)} valid routes, selected one with {len(path)} nodes")
            else:
                logger.info("No valid target distance routes found, falling back to A*")
                # Fallback to direct A*
                path = run_custom_astar(G, start_node, end_node, preferences)
        else:
            logger.info("Using direct A* routing")
            # No target specified, just direct A*
            path = run_custom_astar(G, start_node, end_node, preferences)

        if not path:
            logger.warning("No route found between the specified points")
            raise HTTPException(status_code=404, detail="No route found between the specified points")

        # Calculate total length
        total_length = sum(
            G[u][v][0].get('length', 1) / 1000.0
            for u, v in zip(path[:-1], path[1:])
        )
        
        logger.info(f"Route generated successfully: {len(path)} nodes, {total_length:.2f}km")

        # Calculate distance difference if target was specified
        distance_diff = None
        if preferences.target_distance_distance:
            distance_diff = abs(total_length - preferences.target_distance_distance)

        return format_route_response(
            G, path, start_node, end_node, total_length, distance_diff
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Route generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Route generation failed: {str(e)}")

@router.post("/generate-loop-route", response_model=RouteResponse)
async def generate_loop_route(
    start_lat: float,
    start_lon: float,
    target_distance: float,
    G = Depends(get_graph)
):
    """
    Generate a loop route starting and ending at the same point.
    
    Args:
        start_lat: Starting latitude
        start_lon: Starting longitude  
        target_distance: Target distance in kilometers
    """
    try:
        logger.info(f"Generating loop route at ({start_lat}, {start_lon}) with target distance: {target_distance}km")
        
        start_node, _ = find_nearest_nodes(G, start_lat, start_lon, start_lat, start_lon)
        logger.info(f"Found nearest node for loop route: {start_node}")
        
        path = random_route(G, start_node, target_distance)
        
        if not path:
            logger.warning(f"No loop route found for target distance: {target_distance}km")
            raise HTTPException(status_code=404, detail="No loop route found for the specified distance")

        # Calculate total length
        total_length = sum(
            G[u][v][0].get('length', 1) / 1000.0
            for u, v in zip(path[:-1], path[1:])
        )
        
        logger.info(f"Loop route generated successfully: {len(path)} nodes, {total_length:.2f}km")

        return format_route_response(
            G, path, start_node, start_node, total_length
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Loop route generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Loop route generation failed: {str(e)}")

@router.get("/route-options")
async def get_route_options():
    """
    Get information about available routing options and algorithms.
    """
    logger.info("Route options requested")
    return {
        "algorithms": [
            "A* with custom edge weights",
            "DFS for target distance routing", 
            "Random loop generation"
        ],
        "preferences": [
            "Bike lane preference",
            "Hill avoidance",
            "Target distance specification"
        ],
        "features": [
            "Custom edge weighting based on elevation and bike infrastructure",
            "Multiple route options for target distances",
            "Loop route generation"
        ]
    } 