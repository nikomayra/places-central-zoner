from flask import jsonify
from app.services.search_service import perform_search
from app.services.cluster_service import perform_clustering
import numpy as np
from app.models import User
from app.extensions import db

MILES_TO_METERS = 1609.34

# Example search_params structure: 
    # data:  {'placeNames': ['starbucks', 'chipotle'], 
    # 'searchCenter': {'lat': 47.608013, 'lng': -122.335167}, 
    # 'searchRadius': 5}
def search_places(user_info, request):
    search_params = request.json
    if not search_params:
        return jsonify({'error': 'No data provided'}), 400
    
    placeNames = search_params.get('placeNames', [])
    searchCenter = search_params.get('searchCenter', {})
    searchRadius = search_params.get('searchRadius', 0) * MILES_TO_METERS
    maxPageResults = 20 #20 max...if you want more you use the nextPageToken for the next page results

    if not placeNames or not searchCenter or not searchRadius:
        return jsonify({'error': 'Invalid data structure'}), 400

    results = perform_search(placeNames, searchCenter, searchRadius, maxPageResults)
    # return jsonify(results), 200
    user = User.query.filter_by(id=user_info['sub']).first()

    if user:
        user.searched_places = results
        user.search_center = searchCenter
        user.search_radius = search_params.get('searchRadius')
        user.clusters = [] # Clear clusters which were analyzed to the previous data
        db.session.commit()

    return jsonify(results), 200

# Example places structure:
# [
#     {
#         "lat": 47.662302,
#         "lng": -122.3755124,
#         "name": "LA Fitness"
#     },
#     ...
# ]
# Example user_preference structure:
# 0, .25, .5, .75, 1 (One of them)
def cluster_data(user_info, request):
    places = request.json
    if not places:
        return jsonify({'error': 'No places provided'}), 400
    user_preference = float(request.headers.get('User-Preference'))
    
    # Extract place data
    place_names = [place['name'] for place in places]
    place_latlngs = np.array([[place['lat'], place['lng']] for place in places])

    if not place_names or not place_latlngs.all():
        return jsonify({'error': 'Invalid data structure'}), 400

    clusters = perform_clustering(places, place_names, place_latlngs, user_preference)

    user = User.query.filter_by(id=user_info['sub']).first()

    if user:
        user.clusters = clusters
        db.session.commit()

    return jsonify(clusters), 200

def latest_state(user_info):
    user = User.query.filter_by(id=user_info['sub']).first()
    if user:
        return jsonify({'searched_places_state':user.searched_places, 'center_state':user.search_center, 'radius_state':user.search_radius}), 200
    else:
        return jsonify({'error': 'User not found; no previous state.'}), 400