from flask import Blueprint, request, jsonify
import os, math, json, requests
from sklearn.cluster import KMeans
import numpy as np
from itertools import combinations
from collections import OrderedDict

bp = Blueprint('routes', __name__)

GOOGLE_PLACES_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')

# @bp.route('/search-places', methods=['POST'])
# def search():
#     data = request.json
#     # Example data structure: 
#     # data:  {'placeNames': ['starbucks', 'chipotle'], 
#     # 'searchCenter': {'lat': 47.608013, 'lng': -122.335167}, 
#     # 'searchRadius': 5}

#     if not data:
#         return jsonify({'error': 'No data provided'}), 400
    
#     placeNames = data.get('placeNames', [])
#     searchCenter = data.get('searchCenter', {})
#     searchRadius = data.get('searchRadius', 0) * 1609.34 #miles to meters
#     maxPageResults = 10 #20 max...if you want more you use the nextPageToken for the next page results

#     if not placeNames or not searchCenter or not searchRadius:
#         return jsonify({'error': 'Invalid data structure'}), 400
    
#     results = []
#     for placeName in placeNames:
#         placeData = get_place_data(
#             placeName, 
#             (searchCenter['lat'], searchCenter['lng']), 
#             searchRadius, 
#             maxPageResults
#         )
#         if placeData:
#             for place in placeData.get('places', []):
#                 placeLocation = {
#                     'name': place['displayName']['text'],
#                     'lat': place['location']['latitude'],
#                     'lng': place['location']['longitude']
#                 }
#                 results.append(placeLocation)
    
#     response_data = {'places': results}
#     #print(jsonify(response_data))
#     return jsonify(response_data)

# def calculate_bounding_box(center, radius):
#     lat, lng = center
#     radius_in_km = radius * .001  # Convert meters to kilometers

#     # Earth’s radius in kilometers
#     earth_radius = 6371.0

#     # Latitude delta
#     lat_delta = radius_in_km / earth_radius
#     lat_delta_deg = math.degrees(lat_delta) * .9 #10% smaller to closer match the circle

#     # Longitude delta, compensate for shrinking earth radius in latitude
#     lng_delta_deg = math.degrees(radius_in_km / (earth_radius * math.cos(math.radians(lat))))

#     # Define the bounding box
#     northeast = (min(lat + lat_delta_deg, 90), min(lng + lng_delta_deg, 180))
#     southwest = (max(lat - lat_delta_deg, -90), max(lng - lng_delta_deg, -180))

#     return northeast, southwest

# # Returns json of places: displayName.text, location.latitude & longitude
# def get_place_data(placeName, searchCenter, searchRadius, maxPageResults):
#     northeast, southwest = calculate_bounding_box(searchCenter, searchRadius)
#     url = 'https://places.googleapis.com/v1/places:searchText'
#     data = {
#             'textQuery': placeName,
#             'locationRestriction':{
#                 "rectangle": {
#                     "low": {
#                         "latitude": southwest[0],
#                         "longitude": southwest[1]
#                     },
#                     "high": {
#                         "latitude": northeast[0],
#                         "longitude": northeast[1]
#                     }
#                 }
#             },
#             'pageSize': maxPageResults
#             }
#     headers = {'Content-Type': 'application/json',
#                 'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
#                 'X-Goog-FieldMask': 'places.displayName,places.location'}

#     json_data = json.dumps(data)
#     #print(json_data)

#     try:
#         response = requests.post(url, data=json_data, headers=headers)
#         response.raise_for_status()  # Raise an error for bad status codes
#         data = response.json()
#         return data
#     except requests.exceptions.HTTPError as http_err:
#         print(f"HTTP error occurred: {http_err}")
#     except requests.exceptions.ConnectionError as conn_err:
#         print(f"Connection error occurred: {conn_err}")
#     except requests.exceptions.Timeout as timeout_err:
#         print(f"Timeout error occurred: {timeout_err}")
#     except requests.exceptions.RequestException as req_err:
#         print(f"An error occurred: {req_err}")
#     return None  # Return None in case of any error

# ---------------------------------------------------------------------------------

# Initial clustering using KMeans
def initial_clustering(coords, max_clusters):
    kmeans = KMeans(n_clusters=max_clusters, random_state=0).fit(coords)
    return kmeans.labels_, kmeans.cluster_centers_

# Refine clusters to ensure each cluster contains at least one of each place type
def refine_clusters(labels, coords, place_names, place_types):
    clusters = {i: [] for i in range(max(labels) + 1)}

    # Organize points into clusters
    for label, name, loc in zip(labels, place_names, coords):
        clusters[label].append({'name': name, 'lat': loc[0], 'lng': loc[1]})

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

# Calculate the within-cluster sum of squares (WCSS) and the centroid for a cluster
def calculate_wcss(cluster_points):
    coords = np.array([[p['lat'], p['lng']] for p in cluster_points])
    centroid = np.mean(coords, axis=0)
    wcss = np.sum((coords - centroid) ** 2)
    return wcss, {'lat': centroid[0], 'lng': centroid[1]}

# Dynamically determine the maximum number of clusters
def dynamic_max_clusters(total_points, place_types):
    min_clusters = len(place_types)
    max_clusters = min(total_points, len(place_types) * 10)

    if total_points > len(place_types):
        max_clusters = max(min_clusters, total_points // len(place_types))
    
    return max_clusters

# Iteratively refine clusters to minimize WCSS
def iterative_refinement(labels, coords, place_names, place_types, max_iters=100):
    best_clusters = refine_clusters(labels, coords, place_names, place_types)
    best_wcss = sum(calculate_wcss(cluster)[0] for cluster in best_clusters)

    for _ in range(max_iters):
        new_clusters = refine_clusters(labels, coords, place_names, place_types)
        new_wcss = sum(calculate_wcss(cluster)[0] for cluster in new_clusters)

        if new_wcss < best_wcss:
            best_wcss = new_wcss
            best_clusters = new_clusters
        else:
            break  # Converged

    return best_clusters

@bp.route('/cluster', methods=['POST'])
def cluster_points():
    places = request.json
    # [
    #     {
    #         "lat": 47.662302,
    #         "lng": -122.3755124,
    #         "name": "LA Fitness"
    #     },
    #     ...
    # ]
    #print('places: ', places)
    
    # Extract place names and locations
    place_names = [place['name'] for place in places]
    #print('place_names: ', place_names)
    place_locations = np.array([[place['lat'], place['lng']] for place in places])
    #print('place_locations: ', place_locations)
    place_types = set(place_names)  # Collect unique place names
    print('place_types: ', place_types)
    total_points = len(places)
    print('total_places: ', total_points)
    max_clusters = dynamic_max_clusters(total_points, place_types)
    print('max_clusters: ', max_clusters)
    # Initial clustering
    initial_labels, _ = initial_clustering(place_locations, max_clusters)
    # print('initial_labels: ', initial_labels)
    # Iterative refinement to optimize clusters
    refined_clusters = iterative_refinement(initial_labels, place_locations, place_names, place_types)

    # Calculate WCSS, centroids, and prepare cluster scores
    cluster_scores = []
    for i, cluster in enumerate(refined_clusters):
        wcss, center = calculate_wcss(cluster)
        cluster_scores.append({
            'cluster': i,
            'places': cluster,
            'wcss': wcss,
            'center': center
        })
    
    # top 5, or all of them if less than 5 total
    bestClustersCount = min(5, len(cluster_scores))

    # Remove duplicates
    uniqClusters = list({(cluster['wcss'], cluster['center']['lat'], cluster['center']['lng']): cluster for cluster in cluster_scores}.values())

    # Sort clusters by WCSS
    uniqClusters.sort(key=lambda x: x['wcss'])

    # Get the top 10% clusters
    bestClusters = uniqClusters[:bestClustersCount]

    return jsonify(bestClusters)