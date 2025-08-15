from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os

from routes.coordinate_routing import router as coordinate_router
from utils.logger import setup_app_logging, get_logger
from utils.config import get_log_level, should_log_to_file, get_log_file, CORS_ORIGINS

# Set up application logging
log_level = getattr(logging, get_log_level())
setup_app_logging(level=log_level, log_to_file=should_log_to_file(), log_file=get_log_file())
logger = get_logger(__name__)

# Create FastAPI application
app = FastAPI(
    title="Cyclone Route API", 
    version="2.0.0",
    description="Coordinate-based cycling route generation API - no map downloads required!",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(coordinate_router, prefix="/api", tags=["routing"])

@app.get("/", tags=["root"])
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Cyclone Route API v2.0", 
        "status": "running",
        "description": "Coordinate-based routing system - no maps required!",
        "endpoints": [
            "/api/generate-frontend-route",
            "/api/generate-hybrid-route",
            "/api/generate-gpt-enhanced-route",
            "/api/route-types",
            "/api/route-optimization-options",
            "/api/location"
        ],
        "documentation": "/docs"
    }

@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": "2.0.0",
        "routing_system": "coordinate-based",
        "features": [
            "No map downloads required",
            "Real-time route generation",
            "Multiple route types",
            "Elevation targeting",
            "Surface preferences",
            "Frontend preferences support",
            "GPT-5 nano powered route planning"
        ]
    }

@app.get("/migration-info", tags=["info"])
async def migration_info():
    """Information about migrating from the old graph-based system."""
    return {
        "migration": {
            "from": "Graph-based routing (OSMnx + pre-downloaded maps)",
            "to": "Coordinate-based routing (mathematical algorithms)",
            "benefits": [
                "No map downloads required",
                "Faster route generation",
                "More flexible preferences",
                "Better scalability",
                "Real-time customization"
            ],
            "breaking_changes": [
                "Removed /api/generate-custom-route endpoint",
                "New route generation parameters",
                "Updated response format"
            ]
        }
    }

@app.get("/api/location", tags=["routing"])
async def get_user_location():
    """Get user location based on IP address (fallback to Philadelphia)."""
    try:
        # For now, return default Philadelphia location
        # In production, you'd integrate with an IP geolocation service
        return {
            "success": True,
            "location": {
                "lat": 39.9526,
                "lon": -75.1652,
                "city": "Philadelphia",
                "region": "Pennsylvania",
                "country": "US",
                "place": "Philadelphia, Pennsylvania, USA"
            }
        }
    except Exception as e:
        logger.error(f"Error getting user location: {e}")
        return {
            "success": False,
            "error": "Failed to get location",
            "location": {
                "lat": 39.9526,
                "lon": -75.1652,
                "city": "Philadelphia",
                "region": "Pennsylvania",
                "country": "US",
                "place": "Philadelphia, Pennsylvania, USA"
            }
        } 
