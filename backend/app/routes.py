from flask import Blueprint, request, jsonify
import os, math, json, requests
from sklearn.cluster import KMeans, DBSCAN
import numpy as np
from itertools import combinations
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
from google.oauth2 import id_token
from functools import wraps

bp = Blueprint('routes', __name__)

GOOGLE_PLACES_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
REDIRECT_URI = os.getenv("REDIRECT_URI", "http://localhost:5173")
MILES_TO_METERS = 1609.34

@bp.route('/', defaults={'path': ''})
@bp.route('/<path:path>')
def catch_all(path):
    return 'You want path: %s' % path

# ---------------------------------------------------------------------------------

def token_required(f):
    @wraps(f)
    def validation_decorator(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'message': 'Token is missing'}), 401
        token = auth_header.split(' ')[1]
        try:
            user_info = id_token.verify_oauth2_token(token, Request(), GOOGLE_CLIENT_ID)
        except ValueError as error:
            return jsonify({'message': 'Token is invalid or expired', 'error': str(error)}), 401
        return f(user_info, *args, **kwargs)
    return validation_decorator


@bp.route('/auth-user', methods=['POST'])
@token_required
def auth_user(user_info):

    return jsonify({'message': 'Token is valid', 'user': user_info}), 200

# ---------------------------------------------------------------------------------

# @bp.route('/refresh-token', methods=['POST'])
# def refresh_token():
#     refresh_token = request.json.get('refresh_token')
    
#     if not refresh_token:
#         return jsonify({'error': 'Refresh token is missing'}), 400

#     try:
#         credentials = Credentials(
#             token=None,
#             refresh_token=refresh_token,
#             token_uri='https://oauth2.googleapis.com/token',
#             client_id=GOOGLE_CLIENT_ID,
#             client_secret=GOOGLE_CLIENT_SECRET
#         )
#         request_adapter = Request()
#         credentials.refresh(request_adapter)
#         new_token = credentials.token
#         new_expiry = credentials.expiry
#     except Exception as e:
#         new_token, error = None, str(e)

#     if not new_token:
#         return jsonify({'error': 'Token refresh failed', 'details': error}), 400

#     return jsonify({
#         'access_token': new_token,
#         'expires_in': new_expiry
#     })

# @bp.route('/auth-code', methods=['POST'])
# def exchange_auth_code():
#     auth_code = request.json.get('code')
#     if not auth_code:
#         return jsonify({'error': 'Authorization code is missing'}), 400
    
#     # Create a client config dictionary from environment variables
#     client_config = {
#         "web": {
#             "client_id": GOOGLE_CLIENT_ID,
#             "client_secret": GOOGLE_CLIENT_SECRET,
#             "redirect_uris": [REDIRECT_URI],
#             "auth_uri": "https://accounts.google.com/o/oauth2/auth",
#             "token_uri": "https://oauth2.googleapis.com/token"
#         }
#     }

#     # Create the Flow object
#     flow = Flow.from_client_config(client_config, scopes=[
#         'openid',
#         'https://www.googleapis.com/auth/userinfo.profile',
#         'https://www.googleapis.com/auth/userinfo.email',
#         ])
#     flow.redirect_uri = REDIRECT_URI

#     # Exchange the authorization code for tokens
#     try:
#         flow.fetch_token(code=auth_code)
#     except Exception as e:
#         return jsonify({'error': f'Token exchange failed: {str(e)}'}), 400

#     credentials = flow.credentials

#     # Respond with the tokens
#     return jsonify({
#         'access_token': credentials.token,
#         'refresh_token': credentials.refresh_token,
#         'expires_in': credentials.expiry,
#         'id_token': credentials.id_token
#     })

# ---------------------------------------------------------------------------------

@bp.route('/search-places', methods=['POST'])
@token_required
def search(_):
    data = request.json
    # Example data structure: 
    # data:  {'placeNames': ['starbucks', 'chipotle'], 
    # 'searchCenter': {'lat': 47.608013, 'lng': -122.335167}, 
    # 'searchRadius': 5}

    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # print('user_info: ', user_info)
    placeNames = data.get('placeNames', [])
    searchCenter = data.get('searchCenter', {})
    searchRadius = data.get('searchRadius', 0) * MILES_TO_METERS
    maxPageResults = 20 #20 max...if you want more you use the nextPageToken for the next page results

    if not placeNames or not searchCenter or not searchRadius:
        return jsonify({'error': 'Invalid data structure'}), 400
    
    response_data=[]
    for placeName in placeNames:
        results = []
        placeData = get_place_data(
            placeName, 
            (searchCenter['lat'], searchCenter['lng']), 
            searchRadius, 
            maxPageResults
        )
        if placeData:
            for place in placeData.get('places', []):
                placeLocation = {
                    'name': place['displayName']['text'],
                    'lat': place['location']['latitude'],
                    'lng': place['location']['longitude']
                }
                results.append(placeLocation)
            response_data.extend(refine_results(placeName, results))
    
    #response_data = results
    #print(jsonify(response_data))
    return jsonify(response_data)

def levenshtein(a, b):
    matrix = [[0] * len(b) for _ in range(len(a))]

    for i in range(len(a)):
        matrix[i][0] = i

    for j in range(len(b)):
        matrix[0][j] = j

    for j in range(len(b)):
        for i in range(len(a)):
            matrix[i][j] = min(
                (matrix[i - 1][j] if i > 0 else 0) + 1,
                (matrix[i][j - 1] if j > 0 else 0) + 1,
                (matrix[i - 1][j - 1] if i > 0 and j > 0 else 0) + (0 if a[i] == b[j] else 1)
            )

    return matrix[len(a) - 1][len(b) - 1]

def refine_results(placeName, results):
    # Score how well the result names match the searched name
    # Find the best scoring result name vs searched name
    # Use that score to filter out all other results
    # Try to provide user with what they intended.
    likeScore = []
    for place in results:
        likeScore.append(levenshtein(place['name'].casefold(), placeName.casefold()))

    bestScore = min(likeScore)
    # Filter results to exclude elements where likeScore != bestScore
    filtered_results = [place for i, place in enumerate(results) if likeScore[i] == bestScore]

    # Remove duplicate places
    unique_filtered_results = list({
        (place['lat'], place['lng']): place for place in filtered_results
    }.values())

    return unique_filtered_results

def calculate_bounding_box(center, radius):
    lat, lng = center
    radius_in_km = radius * .001  # Convert meters to kilometers

    # Earth’s radius in kilometers
    earth_radius = 6371.0

    # Latitude delta
    lat_delta = radius_in_km / earth_radius
    lat_delta_deg = math.degrees(lat_delta) * .9 #10% smaller to closer match the circle

    # Longitude delta, compensate for shrinking earth radius in latitude
    lng_delta_deg = math.degrees(radius_in_km / (earth_radius * math.cos(math.radians(lat))))

    # Define the bounding box
    northeast = (min(lat + lat_delta_deg, 90), min(lng + lng_delta_deg, 180))
    southwest = (max(lat - lat_delta_deg, -90), max(lng - lng_delta_deg, -180))

    return northeast, southwest

# Returns json of places: displayName.text, location.latitude & longitude
def get_place_data(placeName, searchCenter, searchRadius, maxPageResults):
    northeast, southwest = calculate_bounding_box(searchCenter, searchRadius)
    url = 'https://places.googleapis.com/v1/places:searchText'
    data = {
            'textQuery': placeName,
            'locationRestriction':{
                "rectangle": {
                    "low": {
                        "latitude": southwest[0],
                        "longitude": southwest[1]
                    },
                    "high": {
                        "latitude": northeast[0],
                        "longitude": northeast[1]
                    }
                }
            },
            'pageSize': maxPageResults
            }
    headers = {'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
                'X-Goog-FieldMask': 'places.displayName,places.location'}

    json_data = json.dumps(data)
    #print(json_data)

    try:
        response = requests.post(url, data=json_data, headers=headers)
        response.raise_for_status()  # Raise an error for bad status codes
        data = response.json()
        return data
    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error occurred: {http_err}")
    except requests.exceptions.ConnectionError as conn_err:
        print(f"Connection error occurred: {conn_err}")
    except requests.exceptions.Timeout as timeout_err:
        print(f"Timeout error occurred: {timeout_err}")
    except requests.exceptions.RequestException as req_err:
        print(f"An error occurred: {req_err}")
    return None  # Return None in case of any error

# ---------------------------------------------------------------------------------

# Helper function to calculate the Haversine distance between two points
def haversine_distance(coord1, coord2):
    lat1, lon1 = coord1
    lat2, lon2 = coord2
    R = 6371000  # Radius of the Earth in meters
    phi1, phi2 = np.radians(lat1), np.radians(lat2)
    delta_phi = np.radians(lat2 - lat1)
    delta_lambda = np.radians(lon2 - lon1)

    a = np.sin(delta_phi / 2) ** 2 + np.cos(phi1) * np.cos(phi2) * np.sin(delta_lambda / 2) ** 2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))

    return R * c

# Initial clustering using KMeans
def initial_clustering(coords, max_clusters):
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

# Hierarchical clustering or DBSCAN for small datasets
def small_dataset_clustering(coords, places, place_types):
    db = DBSCAN(eps=0.05, min_samples=1).fit(coords)
    labels = db.labels_
    
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
    total_wcss = 0
    count_valid = 0
    wcss_threshold = .0006 - (.0003 * preference) # 0 -> .0012
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

    valid_clusters.sort(key=lambda x: x['wcss']) #sort in ascending order by wcss

    avg_wcss = total_wcss / count_valid if count_valid > 0 else float('inf')

    # Calculate combined metric
    if avg_wcss == float('inf'):
        combined_metric =  count_valid
    else:
        combined_metric = (count_valid / avg_wcss)

    return valid_clusters, combined_metric

@bp.route('/cluster', methods=['POST'])
@token_required
def cluster_points(_):
    # [
    #     {
    #         "lat": 47.662302,
    #         "lng": -122.3755124,
    #         "name": "LA Fitness"
    #     },
    #     ...
    # ]
    places = request.json
    user_preference = int(request.headers.get('User-Preference'))

    if not places:
        return jsonify({'error': 'No places provided'}), 400

    # Extract place names and locations
    place_names = [place['name'] for place in places]
    place_locations = np.array([[place['lat'], place['lng']] for place in places])
    place_types = set(place_names)  # Collect unique place names
    print('place_types: ', place_types)
    total_points = len(places)
    print('total_places: ', total_points)
    max_clusters = dynamic_max_clusters(total_points, place_types)
    print('max_clusters: ', max_clusters)

    best_method = None
    best_clusters = None
    best_score = float('-inf')

    # Apply brute-force if feasible
    if total_points <= 10 and len(place_types) <= 3:
        # Use brute-force clustering for very small datasets
        brute_force_clusters = brute_force_clustering(place_locations, places, place_types)
        BF_valid_clusters, BF_Score = evaluate_clusters(brute_force_clusters, user_preference)
        if BF_Score > best_score:
            best_method = 'Brute Force'
            best_clusters = BF_valid_clusters
            best_score = BF_Score
    
    # Apply DBSCAN
    dbscan_clusters = small_dataset_clustering(place_locations, places, place_types)
    DB_valid_clusters, DB_score = evaluate_clusters(dbscan_clusters, user_preference)
    if DB_score > best_score:
        best_method = 'DBScan'
        best_clusters = DB_valid_clusters
        best_score = DB_score

    # Apply KMeans and iterative refinement
    initial_labels = initial_clustering(place_locations, max_clusters)
    kmeans_clusters = iterative_refinement(initial_labels, places, place_types)
    KM_valid_clusters, KM_score = evaluate_clusters(kmeans_clusters, user_preference)
    if KM_score > best_score:
        best_method = 'KMeans'
        best_clusters = KM_valid_clusters
        best_score = KM_score

    print('Method:', best_method)
    # Return best clusters & method used.
    return jsonify(best_clusters)