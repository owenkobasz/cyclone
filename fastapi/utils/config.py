import os
from typing import Optional

# Logging configuration
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
LOG_TO_FILE = os.getenv("LOG_TO_FILE", "false").lower() == "true"
LOG_FILE = os.getenv("LOG_FILE", "cyclone_api.log")

# API configuration
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))

# Graph configuration
GRAPH_FILE = os.getenv("GRAPH_FILE", "philly_bike.graphml")

# CORS configuration
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

# GraphHopper API configuration
GRAPHHOPPER_API_KEY = os.getenv("GRAPHHOPPER_API_KEY")
GRAPHHOPPER_BASE_URL = os.getenv("GRAPHHOPPER_BASE_URL", "https://graphhopper.com/api/1")

def get_log_level() -> str:
    """Get the configured log level."""
    valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
    if LOG_LEVEL not in valid_levels:
        return "INFO"
    return LOG_LEVEL

def should_log_to_file() -> bool:
    """Check if logging to file is enabled."""
    return LOG_TO_FILE

def get_log_file() -> str:
    """Get the log file path."""
    return LOG_FILE

def get_graphhopper_api_key() -> Optional[str]:
    """Get the GraphHopper API key from environment variables."""
    return GRAPHHOPPER_API_KEY

def get_graphhopper_base_url() -> str:
    """Get the GraphHopper base URL from environment variables."""
    return GRAPHHOPPER_BASE_URL 