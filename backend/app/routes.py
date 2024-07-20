from flask import Blueprint, request, jsonify
import requests
import os

bp = Blueprint('routes', __name__)

GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')

@bp.route('/search', methods=['POST'])
def search():
    data = request.json
    
    stores = data['stores']
    location = data['location']
    
    central_locations = get_central_locations(stores, location)
    
    return jsonify(central_locations)

def get_central_locations(stores, location):
    # Use Google Places API to get coordinates of each store
    store_locations = []
    for store in stores:
        response = requests.get(
            'https://maps.googleapis.com/maps/api/place/textsearch/json',
            params={'query': store + ' in ' + location, 'key': GOOGLE_API_KEY}
        )
        results = response.json().get('results')
        if results:
            store_locations.append(results[0]['geometry']['location'])
    
    if len(store_locations) < 3:
        return {"error": "Not enough store locations found"}
    
    # Calculate central locations using some logic
    # Placeholder logic
    central_locations = [{"lat": 40.712776, "lng": -74.005974, "radius": 1000}]
    
    return {
        "central_locations": central_locations
    }
