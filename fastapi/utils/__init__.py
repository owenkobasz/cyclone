"""
Utility modules for Cyclone Route API.

This package contains utility functions and classes used throughout the API
including logging, configuration, routing, and data models.
"""

from .config import (
    get_log_level,
    should_log_to_file,
    get_log_file,
    get_graphhopper_api_key,
    get_graphhopper_base_url
)

from .logger import (
    setup_logger,
    get_logger,
    setup_app_logging
)

from .models import (
    RouteType,
    SurfaceType,
    RoutePreferences,
    FrontendRoutePreferences,
    RouteResponse,
    ElevationPoint,
    ElevationStats,
    ErrorResponse,
    FrontendRouteGenerationRequest,
    RouteMetadata
)

from .hybrid_router import (
    HybridRouter,
    HybridRoutePreferences
)

from .graphhopper_client import (
    GraphHopperClient,
    GraphHopperConfig,
    RoutePoint
)

from .gpt_waypoint_generator import (
    GPTWaypointGenerator,
    GPTWaypoint,
    GPTRoutePlan
)

from .gpt_enhanced_router import (
    GPTEnhancedRouter,
    GPTEnhancedRoutePreferences
)

__all__ = [
    # Configuration
    "get_log_level",
    "should_log_to_file", 
    "get_log_file",
    "get_graphhopper_api_key",
    "get_graphhopper_base_url",
    
    # Logging
    "setup_logger",
    "get_logger",
    "setup_app_logging",
    
    # Models
    "RouteType",
    "SurfaceType",
    "RoutePreferences",
    "FrontendRoutePreferences",
    "RouteResponse",
    "ElevationPoint",
    "ElevationStats",
    "ErrorResponse",
    "FrontendRouteGenerationRequest",
    "RouteMetadata",
    
    # Routing
    "HybridRouter",
    "HybridRoutePreferences",
    
    # GraphHopper
    "GraphHopperClient",
    "GraphHopperConfig",
    "RoutePoint",
    
    # GPT-Powered Components
    "GPTWaypointGenerator",
    "GPTWaypoint",
    "GPTRoutePlan",
    "GPTEnhancedRouter",
    "GPTEnhancedRoutePreferences"
] 