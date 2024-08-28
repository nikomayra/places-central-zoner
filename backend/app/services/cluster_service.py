from sklearn.cluster import KMeans, DBSCAN
import numpy as np
from itertools import combinations
from app.utils import haversine_distance
from sklearn.metrics import pairwise_distances

def perform_clustering(places, place_names, place_latlngs, user_preference):

    place_types = set(place_names)  # Collect unique place names
    max_clusters = dynamic_max_clusters(len(place_latlngs), place_types)
    
    print('place_types: ', place_types)
    print('total_places: ', len(place_latlngs))
    print('max_clusters: ', max_clusters)

    best_method = None
    best_clusters = None
    best_score = float('-inf')

    # Apply brute-force if feasible
    if len(place_latlngs) <= 10 and len(place_types) <= 3:
        # Use brute-force clustering for very small datasets
        brute_force_clusters = brute_force_clustering(place_latlngs, places, place_types)
        BF_valid_clusters, BF_Score = evaluate_clusters(brute_force_clusters, user_preference)
        if BF_Score > best_score:
            best_method = 'Brute Force'
            best_clusters = BF_valid_clusters
            best_score = BF_Score
        print('DBSCAN BF_Score: ', BF_Score,'\n\n')
    
    # Apply DBSCAN
    dbscan_clusters = dbscan_clustering(place_latlngs, places, place_types)
    # print('DBSCAN CLUSTERS: ', dbscan_clusters,'\n\n')
    DB_valid_clusters, DB_score = evaluate_clusters(dbscan_clusters, user_preference)
    if DB_score > best_score:
        best_method = 'DBScan'
        best_clusters = DB_valid_clusters
        best_score = DB_score
    # print('DBSCAN VALID CLUSTERS: ', DB_valid_clusters,'\n\n')
    print('DBSCAN DB_score: ', DB_score,'\n\n')
    # Apply KMeans and iterative refinement
    initial_labels = kmeans_clustering(place_latlngs, max_clusters)
    kmeans_clusters = iterative_refinement(initial_labels, places, place_types)
    # print('KMEANS CLUSTERS: ', kmeans_clusters)
    KM_valid_clusters, KM_score = evaluate_clusters(kmeans_clusters, user_preference)
    if KM_score > best_score:
        best_method = 'KMeans'
        best_clusters = KM_valid_clusters
        best_score = KM_score
    print('KMEANS SCORE: ', KM_score,'\n\n')
    print('Best Method:', best_method)

    return best_clusters

# Initial clustering using KMeans
def kmeans_clustering(coords, max_clusters):
    kmeans = KMeans(n_clusters=max_clusters, random_state=0).fit(coords)
    return kmeans.labels_

# Refine clusters to ensure each cluster contains at least one of each place type
def refine_clusters(labels, places, place_types):
    clusters = {i: [] for i in range(max(labels) + 1)}

    # Organize points into clusters
    for label, place in zip(labels, places):
        clusters[label].append(place)

    refined_clusters = []
    for combo in combinations(clusters.keys(), len(place_types)):
        combined_cluster = []
        type_counts = {place_type: 0 for place_type in place_types}

        for label in combo:
            for point in clusters[label]:
                if type_counts[point['name']] < 1:
                    combined_cluster.append(point)
                    type_counts[point['name']] += 1

        if all(count >= 1 for count in type_counts.values()):
            refined_clusters.append(combined_cluster)

    return refined_clusters

# Calculate the within-cluster sum of squares (WCSS), center, radius
def calculate_wcss_center_radius(cluster_points):
    coords = np.array([[p['lat'], p['lng']] for p in cluster_points])
    centroid = np.mean(coords, axis=0)
    wcss = np.sum((coords - centroid) ** 2)

    # Calculate the radius of the circle that encompasses the points
    max_distance = max(
        haversine_distance((centroid[0], centroid[1]), (p['lat'], p['lng']))
        for p in cluster_points
    )

    return wcss, {'lat': centroid[0], 'lng': centroid[1]}, max_distance

# Dynamically determine the maximum number of clusters
def dynamic_max_clusters(total_points, place_types):
    min_clusters = len(place_types)
    max_clusters = min(total_points, len(place_types) * 10)

    if total_points > len(place_types):
        max_clusters = max(min_clusters, total_points // len(place_types))
    
    return max_clusters

# Iteratively refine clusters to minimize WCSS
def iterative_refinement(labels, places, place_types, max_iters=100):
    best_clusters = refine_clusters(labels, places, place_types)
    best_wcss = sum(calculate_wcss_center_radius(cluster)[0] for cluster in best_clusters)

    for _ in range(max_iters):
        new_clusters = refine_clusters(labels, places, place_types)
        new_wcss = sum(calculate_wcss_center_radius(cluster)[0] for cluster in new_clusters)

        if new_wcss < best_wcss:
            best_wcss = new_wcss
            best_clusters = new_clusters
        else:
            break  # Converged

    return best_clusters

# Brute-force method for very small datasets
def brute_force_clustering(coords, places, place_types):
    clusters = []
    for combo in combinations(range(len(coords)), len(place_types)):
        cluster = [places[i] for i in combo]
        types = {place['name'] for place in cluster}
        if len(types) == len(place_types):
            clusters.append(cluster)
    return clusters

def calculate_dynamic_min_samples(coords, factor=0.05):
    min_samples = max(1, int(len(coords) * factor))
    return min_samples

def calculate_dynamic_eps(coords, percentile=10):
    distances = pairwise_distances(coords)
    sorted_distances = np.sort(distances.flatten())
    eps = sorted_distances[int(len(sorted_distances) * (percentile / 100))]
    return eps

# Hierarchical clustering or DBSCAN
def dbscan_clustering(coords, places, place_types):
    eps = calculate_dynamic_eps(coords)
    min_samples = calculate_dynamic_min_samples(coords)
    db = DBSCAN(eps=eps, min_samples=min_samples).fit(coords)
    # print('DBSCAN RESULTS: ', db, '\n\n')
    labels = db.labels_
    # print('DBSCAN LABELS: ', labels, '\n\n')
    if any(label < 0 for label in labels):
        return []

    clusters = {i: [] for i in range(max(labels) + 1)}
    for label, info in zip(labels, places):
        clusters[label].append(info)
    
    refined_clusters = []
    for combo in combinations(clusters.keys(), len(place_types)):
        combined_cluster = []
        type_counts = {place_type: 0 for place_type in place_types}
        
        for label in combo:
            for point in clusters[label]:
                if type_counts[point['name']] < 1:
                    combined_cluster.append(point)
                    type_counts[point['name']] += 1
        
        if all(count >= 1 for count in type_counts.values()):
            refined_clusters.append(combined_cluster)
    
    return refined_clusters

# Function to evaluate clusters based on wcss
def evaluate_clusters(clusters, preference):
    valid_clusters = []
    failed_clusters = []
    total_wcss = 0
    count_valid = 0
    min_value = .00002
    max_value = .002
    wcss_threshold = min_value + (max_value - min_value) * preference
    print('wcss_threshold',wcss_threshold)

    # Helper function to create a unique identifier for a cluster based on its points
    def create_cluster_identifier(cluster):
        return frozenset((p['lat'], p['lng']) for p in cluster)

    # Remove duplicate clusters
    unique_clusters = list({
        create_cluster_identifier(cluster): cluster for cluster in clusters
    }.values())

    for i, cluster in enumerate(unique_clusters):
        wcss, center, radius = calculate_wcss_center_radius(cluster)
        if wcss < wcss_threshold:
            valid_clusters.append({
                'cluster': i,
                'places': cluster,
                'wcss': wcss,
                'center': center,
                'radius': radius
            })
            total_wcss += wcss
            count_valid += 1
        else:
            failed_clusters.append({
                'cluster': i,
                'places': cluster,
                'wcss': wcss,
                'center': center,
                'radius': radius
            })

    valid_clusters.sort(key=lambda x: x['wcss']) #sort in ascending order by wcss

    # If user set lowest quality setting and still didn't find any valid clusters return the next best...
    if wcss_threshold == min_value and len(valid_clusters) <= 0 and len(failed_clusters) > 0:
        failed_clusters.sort(key=lambda x: x['wcss'])
        valid_clusters.append(failed_clusters[0])
        total_wcss = valid_clusters[0]['wcss']
        count_valid = 1

    avg_wcss = total_wcss / count_valid if count_valid > 0 else float('inf')

    weight = 2

    # Calculate combined metric
    if avg_wcss == 0:
        combined_metric = float('inf')  # Handle division by zero
    elif avg_wcss == float('inf'):
        combined_metric = count_valid
    else:
        combined_metric = (count_valid ** weight) / avg_wcss


    return valid_clusters, combined_metric
