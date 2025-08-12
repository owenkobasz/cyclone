import networkx as nx
import random
from typing import List, Optional, Tuple
from .node_utils import distance_heuristic
from .logger import get_logger

logger = get_logger(__name__)

def cycling_edge_weight(u, v, d, preferences):
    """
    Calculate edge weight for cycling routes based on preferences.
    
    Args:
        u: Source node
        v: Target node
        d: Edge data
        preferences: Route preferences object
        
    Returns:
        float: Calculated edge weight
    """
    # Base cost = length (km)
    length = d.get('length', 1) / 1000.0

    # Penalize non-bike lanes if requested
    bike_penalty = 0
    if preferences.use_bike_lanes:
        if not any(tag in d for tag in ('cycleway', 'cycleway_left', 'cycleway_right')):
            bike_penalty = 1.0

    # Elevation penalty/reward
    elev_gain = max(0, d.get('grade', 0))
    if preferences.avoid_hills:
        elevation_penalty = elev_gain * 10.0
    else:
        elevation_penalty = -elev_gain * 10.0

    return length + bike_penalty + elevation_penalty

def run_custom_astar(G, start_node: int, end_node: int, preferences) -> Optional[List[int]]:
    """
    Run A* algorithm with custom edge weights.
    
    Args:
        G: NetworkX graph
        start_node (int): Starting node ID
        end_node (int): Ending node ID
        preferences: Route preferences object
        
    Returns:
        Optional[List[int]]: Path as list of node IDs, or None if no path found
    """
    try:
        logger.debug(f"Running A* from {start_node} to {end_node}")
        path = nx.astar_path(
            G,
            start_node,
            end_node,
            heuristic=lambda u, v: distance_heuristic(u, v, G),
            weight=lambda u, v, d: cycling_edge_weight(u, v, d, preferences)
        )
        logger.debug(f"A* found path with {len(path)} nodes")
        return path
    except nx.NetworkXNoPath:
        logger.warning(f"No path found by A* from {start_node} to {end_node}")
        return None
    except Exception as e:
        logger.error(f"A* algorithm failed: {e}")
        return None

def find_via_node_for_target(G, start: int, end: int, target_km: float) -> Optional[int]:
    """
    Find a node 'via' such that dist(start→via) + dist(via→end) is as close to target_km as possible.
    
    Args:
        G: NetworkX graph
        start (int): Starting node ID
        end (int): Ending node ID
        target_km (float): Target distance in kilometers
        
    Returns:
        Optional[int]: Best via node ID, or None if not found
    """
    logger.debug(f"Finding via node for target distance {target_km}km from {start} to {end}")
    target_m = target_km * 1000.0
    cutoff = target_m * 1.5

    # Dijkstra from start and end, weighted by 'length' (meters)
    dist_from_start = nx.single_source_dijkstra_path_length(G, start, cutoff=cutoff, weight='length')
    dist_from_end = nx.single_source_dijkstra_path_length(G, end, cutoff=cutoff, weight='length')

    best_node, best_diff = None, float('inf')
    for node, d1 in dist_from_start.items():
        d2 = dist_from_end.get(node)
        if d2 is None:
            continue
        total = d1 + d2
        diff = abs(total - target_m)
        if diff < best_diff:
            best_diff, best_node = diff, node

    if best_node:
        logger.debug(f"Found via node {best_node} with difference {best_diff:.0f}m")
    else:
        logger.warning("No suitable via node found")
    
    return best_node

def random_route(G, start: int, target_km: float, max_attempts: int = 1000) -> Optional[List[int]]:
    """
    Generate a random path starting and ending at 'start', as close as possible to target_km.
    
    Args:
        G: NetworkX graph
        start (int): Starting/ending node ID
        target_km (float): Target distance in kilometers
        max_attempts (int): Maximum attempts to find a route
        
    Returns:
        Optional[List[int]]: Path as list of node IDs, or None if not found
    """
    logger.debug(f"Generating random route from {start} with target {target_km}km")
    target_m = target_km * 1000
    for attempt in range(max_attempts):
        path = [start]
        total_length = 0
        current = start
        visited = set([start])
        while total_length < target_m:
            neighbors = [n for n in G.neighbors(current) if n not in visited]
            if not neighbors:
                break
            next_node = random.choice(neighbors)
            edge_data = G[current][next_node][0]
            total_length += edge_data.get('length', 1)
            path.append(next_node)
            visited.add(next_node)
            # Try to close the loop if close to target
            if abs(total_length - target_m) < 200 and next_node == start:
                logger.debug(f"Random route found on attempt {attempt + 1}: {len(path)} nodes, {total_length/1000:.2f}km")
                return path
        # If not a loop, return the path if close enough
        if abs(total_length - target_m) < 200:
            logger.debug(f"Random route found on attempt {attempt + 1}: {len(path)} nodes, {total_length/1000:.2f}km")
            return path
    
    logger.warning(f"Random route generation failed after {max_attempts} attempts")
    return None

def dfs_paths_for_target_ptp(G, start: int, end: int, target_km: float, 
                            max_depth: int = 40, tolerance: float = 0.2, 
                            max_routes: int = 10) -> List[List[int]]:
    """
    DFS to find up to max_routes point-to-point paths from start to end as close as possible to target_km.
    
    Args:
        G: NetworkX graph
        start (int): Starting node ID
        end (int): Ending node ID
        target_km (float): Target distance in kilometers
        max_depth (int): Maximum search depth
        tolerance (float): Distance tolerance as fraction of target
        max_routes (int): Maximum number of routes to find
        
    Returns:
        List[List[int]]: List of paths, each as list of node IDs
    """
    logger.debug(f"DFS search for target distance {target_km}km from {start} to {end}")
    target_m = target_km * 1000
    valid_routes = []

    def dfs(current: int, path: List[int], total_length: float, depth: int):
        if len(valid_routes) >= max_routes:
            return
        if depth > max_depth:
            return
        if current == end and len(path) > 1 and abs(total_length - target_m) < tolerance * target_m:
            valid_routes.append(list(path))
            logger.debug(f"Found valid route: {len(path)} nodes, {total_length/1000:.2f}km")
            return
        for neighbor in G.neighbors(current):
            if neighbor in path:
                continue
            edge_data = G[current][neighbor][0]
            length = edge_data.get('length', 1)
            if total_length + length > target_m * (1 + tolerance):
                continue
            path.append(neighbor)
            dfs(neighbor, path, total_length + length, depth + 1)
            path.pop()

    dfs(start, [start], 0, 0)
    logger.info(f"DFS found {len(valid_routes)} valid routes for target distance {target_km}km")
    return valid_routes 