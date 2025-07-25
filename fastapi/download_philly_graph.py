import osmnx as ox
from tqdm import tqdm

print("Downloading Philadelphia bike network...")
G = ox.graph_from_place("Philadelphia, Pennsylvania, USA", network_type="bike")

# rogress visualization: show progress as we process edges
edges = list(G.edges)
print(f"Processing {len(edges)} edges...")
for _ in tqdm(edges, desc="Saving edges to disk"):
    pass  

ox.save_graphml(G, "philly_bike.graphml")
print("Graph saved as philly_bike.graphml")