from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os

from routes.routing import router, set_graph
from utils.graph_loader import load_graph
from utils.logger import setup_app_logging, get_logger
from utils.config import get_log_level, should_log_to_file, get_log_file, GRAPH_FILE, CORS_ORIGINS

# Set up application logging
log_level = getattr(logging, get_log_level())
setup_app_logging(level=log_level, log_to_file=should_log_to_file(), log_file=get_log_file())
logger = get_logger(__name__)

app = FastAPI(title="Cyclone Route API", version="1.0.0")

# Enable CORS for all origins and methods
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the graph once at startup
try:
    logger.info("Starting graph loading...")
    logger.info(f"Current working directory: {os.getcwd()}")
    logger.info(f"Files in current directory: {os.listdir('.')}")
    logger.info(f"Attempting to load graph from: {GRAPH_FILE}")
    
    G_PHILLY = load_graph(GRAPH_FILE)
    logger.info(f"Graph loaded successfully with {len(G_PHILLY.nodes)} nodes and {len(G_PHILLY.edges)} edges")
    
    # Set the graph in the router
    set_graph(G_PHILLY)
    logger.info("Graph set in router successfully")
    
except Exception as e:
    logger.error(f"Failed to load graph: {e}")
    logger.error(f"Exception type: {type(e)}")
    import traceback
    logger.error(f"Traceback: {traceback.format_exc()}")
    G_PHILLY = None

# Include routers
app.include_router(router, prefix="/api", tags=["routing"])

@app.get("/")
async def root():
    return {"message": "Cyclone Route API", "status": "running"}

@app.get("/health")
async def health_check():
    if G_PHILLY is None:
        return {"status": "unhealthy", "error": "Graph not loaded"}
    return {
        "status": "healthy", 
        "graph_nodes": len(G_PHILLY.nodes), 
        "graph_edges": len(G_PHILLY.edges)
    } 