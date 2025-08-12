import osmnx as ox
import networkx as nx
from math import radians, cos, sin, sqrt, atan2

def find_nearest_nodes(G, start_lat: float, start_lon: float, end_lat: float, end_lon: float):
    """
    Find the nearest nodes in the graph for start and end coordinates.
    
    Args:
        G: NetworkX graph
        start_lat (float): Starting latitude
        start_lon (float): Starting longitude
        end_lat (float): Ending latitude
        end_lon (float): Ending longitude
        
    Returns:
        tuple: (start_node, end_node)
    """
    start_node = ox.distance.nearest_nodes(G, start_lon, start_lat)
    end_node = ox.distance.nearest_nodes(G, end_lon, end_lat)
    return start_node, end_node

def distance_heuristic(u, v, G):
    """
    Calculate the straight-line distance between two nodes using Haversine formula.
    
    Args:
        u: Source node ID
        v: Target node ID
        G: NetworkX graph
        
    Returns:
        float: Distance in kilometers
    """
    y1, x1 = G.nodes[u]['y'], G.nodes[u]['x']
    y2, x2 = G.nodes[v]['y'], G.nodes[v]['x']
    R = 6371.0  # Earth radius in km
    dlat = radians(y2 - y1)
    dlon = radians(x2 - x1)
    a = sin(dlat/2)**2 + cos(radians(y1)) * cos(radians(y2)) * sin(dlon/2)**2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a)) 