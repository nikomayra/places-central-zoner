import json, requests
from app.utils import calculate_bounding_box, levenshtein
from flask import current_app

def perform_search(placeNames, searchCenter, searchRadius, maxPageResults):
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
    
    return response_data

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
                'X-Goog-Api-Key': current_app.config['GOOGLE_PLACES_API_KEY'],
                'X-Goog-FieldMask': 'places.displayName,places.location'}

    json_data = json.dumps(data)

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

# Score how well the result names match the searched name
# Find the best scoring result name vs searched name
# Use that score to filter out all other results
# Try to provide user with what they intended.
def refine_results(placeName, results):

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