from pydantic import BaseModel, Field
from typing import Optional

class RoutePreferences(BaseModel):
    """Model for route generation preferences."""
    start_lat: float = Field(..., description="Starting latitude", ge=-90, le=90)
    start_lon: float = Field(..., description="Starting longitude", ge=-180, le=180)
    end_lat: float = Field(..., description="Ending latitude", ge=-90, le=90)
    end_lon: float = Field(..., description="Ending longitude", ge=-180, le=180)
    avoid_hills: Optional[bool] = Field(False, description="Whether to avoid hills")
    use_bike_lanes: Optional[bool] = Field(True, description="Whether to prefer bike lanes")
    target_distance_distance: Optional[float] = Field(None, description="Target distance in kilometers", ge=0)
    max_elevation_gain: Optional[float] = Field(None, description="Maximum elevation gain in meters", ge=0)

class RouteResponse(BaseModel):
    """Model for route response."""
    route: list
    total_length_km: float
    distance_diff_km: Optional[float]
    start_node: int
    end_node: int
    num_nodes: int
    num_edges: int
    route_nodes: int
    success: bool = True

class ErrorResponse(BaseModel):
    """Model for error responses."""
    error: str
    error_code: str
    success: bool = False 