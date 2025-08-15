"""
Routing endpoints for Cyclone Route API.

This package contains all the API route definitions and endpoint handlers
for the cycling route generation system.
"""

from .coordinate_routing import router as coordinate_router

__all__ = [
    "coordinate_router"
] 