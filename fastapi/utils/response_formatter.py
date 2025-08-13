from typing import List, Dict, Any, Optional

def format_route_response(G, path: List, start_node: int, end_node: int, 
                         total_length: float, distance_diff: Optional[float] = None) -> Dict[str, Any]:
    """
    Format the route response for the API.
    
    Args:
        G: NetworkX graph
        path (List): List of node IDs representing the route
        start_node (int): Starting node ID
        end_node (int): Ending node ID
        total_length (float): Total route length in kilometers
        distance_diff (Optional[float]): Difference from target distance if applicable
        
    Returns:
        Dict: Formatted response
    """
    if not path:
        return {"error": "No path found"}

    route_coords = [
        {"lat": G.nodes[n]['y'], "lon": G.nodes[n]['x']}
        for n in path
    ]

    return {
        "route": route_coords,
        "total_length_km": total_length,
        "distance_diff_km": distance_diff,
        "start_node": start_node,
        "end_node": end_node,
        "num_nodes": len(G.nodes),
        "num_edges": len(G.edges),
        "route_nodes": len(path)
    }

def format_error_response(error_message: str, error_code: str = "ROUTING_ERROR") -> Dict[str, Any]:
    """
    Format error responses for the API.
    
    Args:
        error_message (str): Human-readable error message
        error_code (str): Machine-readable error code
        
    Returns:
        Dict: Formatted error response
    """
    return {
        "error": error_message,
        "error_code": error_code,
        "success": False
    } 