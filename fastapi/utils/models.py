"""
Data models for Cyclone Route API.

This module contains all Pydantic models used for request/response validation
and data transfer throughout the API.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Literal, Dict, Any
from enum import Enum

# =============================================================================
# ENUMS
# =============================================================================

class RouteType(str, Enum):
    """Available route types for route generation."""
    LOOP = "loop"
    OUT_AND_BACK = "out_and_back"
    FIGURE_8 = "figure_8"

class SurfaceType(str, Enum):
    """Surface type preferences for route generation."""
    PAVED = "paved"
    UNPAVED = "unpaved"
    MIXED = "mixed"

# =============================================================================
# CORE ROUTE MODELS
# =============================================================================

class RoutePreferences(BaseModel):
    """Model for route generation preferences."""
    
    # Location coordinates
    start_lat: float = Field(..., description="Starting latitude", ge=-90, le=90)
    start_lon: float = Field(..., description="Starting longitude", ge=-180, le=180)
    end_lat: Optional[float] = Field(None, description="Ending latitude (for non-loop routes)", ge=-90, le=90)
    end_lon: Optional[float] = Field(None, description="Ending longitude (for non-loop routes)", ge=-180, le=180)
    
    # Route specifications
    target_distance: float = Field(..., description="Target distance in kilometers", gt=0, le=200)
    route_type: RouteType = Field(RouteType.LOOP, description="Type of route to generate")
    
    # Preference options
    prefer_bike_lanes: bool = Field(False, description="Whether to prefer bike lanes")
    prefer_unpaved: bool = Field(False, description="Whether to prefer unpaved surfaces")
    target_elevation_gain: Optional[float] = Field(None, description="Target elevation gain in meters", ge=0, le=5000)
    max_elevation_gain: Optional[float] = Field(None, description="Maximum elevation gain in meters", ge=0, le=5000)
    avoid_highways: bool = Field(True, description="Whether to avoid highways")
    
    # Route generation parameters
    max_segment_length: float = Field(5.0, description="Maximum segment length in kilometers", gt=0, le=20)
    min_segment_length: float = Field(0.5, description="Minimum segment length in kilometers", gt=0, le=5)

class FrontendRoutePreferences(BaseModel):
    """Model that matches the frontend preferences format exactly."""
    
    # Location fields
    startingPoint: str = Field("", description="Starting point text input")
    startingPointCoords: Optional[Dict[str, float]] = Field(None, description="Starting point coordinates {lat, lng}")
    endingPoint: str = Field("", description="Ending point text input")
    endingPointCoords: Optional[Dict[str, float]] = Field(None, description="Ending point coordinates {lat, lng}")
    
    # Route preferences
    distanceTarget: float = Field(20, description="Target distance in miles", gt=0, le=100)
    elevationTarget: float = Field(1000, description="Target elevation gain in feet", ge=0, le=10000)
    routeType: str = Field("scenic", description="Route type preference")
    
    # Surface and safety preferences
    bikeLanes: bool = Field(False, description="Whether to prefer bike lanes")
    pointsOfInterest: bool = Field(False, description="Whether to include points of interest")
    avoidHills: bool = Field(False, description="Whether to avoid hills")
    avoidHighTraffic: bool = Field(False, description="Whether to avoid high traffic areas")
    preferGreenways: bool = Field(False, description="Whether to prefer greenways and trails")
    includeScenic: bool = Field(False, description="Whether to prioritize scenic routes")
    
    # Frontend-specific (not used in routing)
    unitSystem: str = Field("imperial", description="Unit system preference")
    
    # Optional: direct coordinate inputs (for backward compatibility)
    startLat: Optional[float] = Field(None, description="Direct start latitude input")
    startLon: Optional[float] = Field(None, description="Direct start longitude input")
    endLat: Optional[float] = Field(None, description="Direct end latitude input")
    endLon: Optional[float] = Field(None, description="Direct end longitude input")

# =============================================================================
# REQUEST MODELS
# =============================================================================

class FrontendRouteGenerationRequest(BaseModel):
    """Model for frontend route generation requests that accepts frontend preferences directly."""
    
    preferences: FrontendRoutePreferences
    include_metadata: bool = Field(True, description="Whether to include additional metadata")
    optimize_for: Optional[Literal["distance", "elevation", "scenic", "fastest"]] = Field(
        None, description="Optimization preference"
    )

# =============================================================================
# RESPONSE MODELS
# =============================================================================

class RouteResponse(BaseModel):
    """Model for route response."""
    
    # Core route data
    route: List[Dict[str, Any]] = Field(..., description="List of route coordinates with optional elevation")
    total_distance_km: float = Field(..., description="Total route distance in kilometers")
    elevation_gain_m: float = Field(..., description="Total elevation gain in meters")
    waypoints_count: int = Field(..., description="Number of waypoints in the route")
    route_type: str = Field(..., description="Type of route generated")
    success: bool = Field(True, description="Whether route generation was successful")
    
    # Elevation data
    elevation_profile: List[Dict[str, float]] = Field(..., description="Elevation profile data points")
    elevation_stats: Dict[str, float] = Field(..., description="Comprehensive elevation statistics")
    
    # Optional metadata
    estimated_duration_minutes: Optional[float] = Field(None, description="Estimated cycling duration in minutes")
    difficulty_rating: Optional[str] = Field(None, description="Estimated difficulty rating")
    surface_breakdown: Optional[Dict[str, float]] = Field(None, description="Breakdown of surface types")
    routing_method: Optional[str] = Field(None, description="Method used for route generation")

class ElevationPoint(BaseModel):
    """Model for elevation profile data points."""
    
    index: int = Field(..., description="Point index in the route")
    lat: float = Field(..., description="Latitude coordinate")
    lon: float = Field(..., description="Longitude coordinate")
    elevation: float = Field(..., description="Elevation in meters")
    distance_km: float = Field(..., description="Cumulative distance from start in kilometers")

class ElevationStats(BaseModel):
    """Model for comprehensive elevation statistics."""
    
    min_elevation: float = Field(..., description="Minimum elevation in meters")
    max_elevation: float = Field(..., description="Maximum elevation in meters")
    avg_elevation: float = Field(..., description="Average elevation in meters")
    elevation_gain: float = Field(..., description="Total elevation gain in meters")
    elevation_loss: float = Field(..., description="Total elevation loss in meters")
    total_climb: float = Field(..., description="Total climbing (gain + loss) in meters")

# =============================================================================
# ERROR AND UTILITY MODELS
# =============================================================================

class ErrorResponse(BaseModel):
    """Model for error responses."""
    
    error: str = Field(..., description="Human-readable error message")
    error_code: str = Field(..., description="Machine-readable error code")
    success: bool = Field(False, description="Whether the operation was successful")
    details: Optional[Dict] = Field(None, description="Additional error details")

class RouteMetadata(BaseModel):
    """Model for route metadata."""
    
    estimated_duration_minutes: float
    difficulty_rating: str
    surface_breakdown: Dict[str, float]
    elevation_profile: List[Dict[str, float]]
    waypoint_details: List[Dict[str, Any]] 