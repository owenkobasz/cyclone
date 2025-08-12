import osmnx as ox
from .logger import get_logger

logger = get_logger(__name__)

def load_graph(graphml_path: str):
    """
    Load the graph from a GraphML file.
    
    Args:
        graphml_path (str): Path to the GraphML file
        
    Returns:
        networkx.Graph: Loaded graph
    """
    try:
        logger.info(f"Loading graph from {graphml_path}")
        graph = ox.load_graphml(graphml_path)
        logger.info(f"Successfully loaded graph with {len(graph.nodes)} nodes and {len(graph.edges)} edges")
        return graph
    except Exception as e:
        logger.error(f"Failed to load graph from {graphml_path}: {e}")
        raise 