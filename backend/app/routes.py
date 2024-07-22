from flask import Blueprint, request, jsonify
import requests
import os
import json
from sklearn.cluster import KMeans
import numpy as np
from itertools import combinations

bp = Blueprint('routes', __name__)

GOOGLE_PLACES_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')

@bp.route('/search', methods=['GET'])
def search():
    # data = request.json
    # Example data structure: 
    # {place_names': ['LA Fitness', 'Chipotle', 'Starbucks'], 
    # 'search_center': 'New York, NY',
    # 'search_radius'
    # }
    
    place_names = ['LA Fitness', 'chipotle', 'starbucks'] # data['stores']
    search_center = [47.645163, -122.335534] # data['location']
    search_radius = 50
    maxResultantCount = 10


    locations = get_places_data(place_name, search_center,search_radius, maxResultantCount)
    # central_locations = get_central_locations(location_names, search_center, search_radius, maxResultantCount)
    
    return jsonify(locations)

# Returns json of places: displayName.text, id, location.latitude & longitude
def get_places_data(place_name, search_center, search_radius, maxResultantCount):
    url = 'https://places.googleapis.com/v1/places:searchText'
    data = {'textQuery': place_name,
                  'locationBias':{
                      "circle":{
                          "center":{
                              "latitude":search_center[0],
                              "longitude":search_center[1]
                              },
                              "radius":search_radius}},
                  'maxResultCount': maxResultantCount}
    headers = {'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
                'X-Goog-FieldMask': 'places.displayName,places.location'}

    json_data = json.dumps(data)

    response = requests.post(url, data=json_data, headers=headers)

    if response.status_code == 200:
        data = response.json()
        return data
    return response.raise_for_status()


# Initial clustering using KMeans
def initial_clustering(coords, max_clusters):
    kmeans = KMeans(n_clusters=max_clusters, random_state=0).fit(coords)
    return kmeans.labels_, kmeans.cluster_centers_

# Refine clusters to ensure each cluster has at least one of each place type
def refine_clusters(labels, coords, place_info, place_types):
    clusters = {i: [] for i in range(max(labels) + 1)}
    for label, coord, info in zip(labels, coords, place_info):
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

# Calculate the within-cluster sum of squares (WCSS) for a cluster
def calculate_wcss(cluster_points):
    coords = np.array([[p['lat'], p['lon']] for p in cluster_points])
    centroid = np.mean(coords, axis=0)
    return np.sum((coords - centroid) ** 2)

# Dynamically determine the maximum number of clusters
def dynamic_max_clusters(total_points, place_types):
    # Start with an initial high estimate
    avg_points_per_cluster = 10  # Adjust based on your data
    initial_clusters = max(10, len(place_types) * 2)
    return min(total_points // avg_points_per_cluster, total_points, initial_clusters)

# Iteratively refine clusters to minimize WCSS and ensure the presence of all place types
def iterative_refinement(initial_clusters, coords, place_info, place_types, max_iters=100):
    best_clusters = initial_clusters
    best_wcss = sum(calculate_wcss(cluster) for cluster in initial_clusters)
    
    for _ in range(max_iters):
        new_clusters = refine_clusters(labels, coords, place_info, place_types)
        new_wcss = sum(calculate_wcss(cluster) for cluster in new_clusters)
        
        if new_wcss < best_wcss:
            best_wcss = new_wcss
            best_clusters = new_clusters
        else:
            break  # Converged
    
    return best_clusters

@bp.route('/cluster', methods=['POST'])
def cluster_points():
    data = request.json
    places = data['places']
    
    # Extract place types and coordinates
    place_types = set(place['displayName']['text'] for place in places)
    points = np.array([[place['location']['latitude'], place['location']['longitude']] for place in places])
    place_info = [{'lat': place['location']['latitude'], 'lon': place['location']['longitude'], 'name': place['displayName']['text']} for place in places]
    
    total_points = len(places)
    max_clusters = dynamic_max_clusters(total_points, place_types)
    
    # Initial clustering
    initial_labels, _ = initial_clustering(points, max_clusters)
    initial_clusters = refine_clusters(initial_labels, points, place_info, place_types)
    
    # Iterative refinement to optimize clusters
    refined_clusters = iterative_refinement(initial_clusters, points, place_info, place_types)
    
    # Calculate and rank clusters by WCSS
    cluster_scores = []
    for cluster in refined_clusters:
        wcss = calculate_wcss(cluster)
        cluster_scores.append({
            'points': cluster,
            'wcss': wcss
        })
    
    cluster_scores.sort(key=lambda x: x['wcss'])
    
    response = []
    for i, cluster in enumerate(cluster_scores):
        response.append({
            'cluster': i,
            'points': cluster['points'],
            'wcss': cluster['wcss']
        })
    
    return jsonify(response)