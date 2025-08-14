"""
Configuration management for Cyclone Route API.

This module handles all configuration settings including environment variables,
logging configuration, and API settings.
"""

import os
from typing import Optional

# =============================================================================
# LOGGING CONFIGURATION
# =============================================================================
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
LOG_TO_FILE = os.getenv("LOG_TO_FILE", "false").lower() == "true"
LOG_FILE = os.getenv("LOG_FILE", "cyclone_api.log")

# =============================================================================
# API CONFIGURATION
# =============================================================================
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))

# =============================================================================
# GRAPH CONFIGURATION (Legacy - not used in v2.0)
# =============================================================================
GRAPH_FILE = os.getenv("GRAPH_FILE", "philly_bike.graphml")

# =============================================================================
# CORS CONFIGURATION
# =============================================================================
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

# =============================================================================
# GRAPHHOPPER API CONFIGURATION
# =============================================================================
GRAPHHOPPER_API_KEY = os.getenv("GRAPHHOPPER_API_KEY")
GRAPHHOPPER_BASE_URL = os.getenv("GRAPHHOPPER_BASE_URL", "https://graphhopper.com/api/1")

# =============================================================================
# OPENAI API CONFIGURATION
# =============================================================================
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")  # Default to GPT-4o-mini, can be overridden to GPT-5 nano

# =============================================================================
# CONFIGURATION FUNCTIONS
# =============================================================================

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

def get_openai_api_key() -> Optional[str]:
    """Get the OpenAI API key from environment variables."""
    return OPENAI_API_KEY

def get_openai_base_url() -> str:
    """Get the OpenAI base URL from environment variables."""
    return OPENAI_BASE_URL

def get_openai_model() -> str:
    """Get the OpenAI model from environment variables."""
    return OPENAI_MODEL 