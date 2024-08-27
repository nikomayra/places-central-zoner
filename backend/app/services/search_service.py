import json, requests
from app.utils import calculate_bounding_box, haversine_distance
from flask import current_app
from typing import List, Dict
import re
from difflib import SequenceMatcher

def perform_search(place_names, search_center, search_radius, max_page_results):
    response_data=[]
    for placeName in place_names:
        results = []
        placeData = get_place_data(
            placeName, 
            (search_center['lat'], search_center['lng']), 
            search_radius, 
            max_page_results
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
                'rectangle': {
                    'low': {
                        'latitude': southwest[0],
                        'longitude': southwest[1]
                    },
                    'high': {
                        'latitude': northeast[0],
                        'longitude': northeast[1]
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
        print(f'HTTP error occurred: {http_err}')
    except requests.exceptions.ConnectionError as conn_err:
        print(f'Connection error occurred: {conn_err}')
    except requests.exceptions.Timeout as timeout_err:
        print(f'Timeout error occurred: {timeout_err}')
    except requests.exceptions.RequestException as req_err:
        print(f'An error occurred: {req_err}')
    return None  # Return None in case of any error

# Score how well the result names match the searched name
# Find the best scoring result name vs searched name
# Use that score to filter out all other results
# Try to provide user with what they intended.
# def refine_results(placeName, results):

#     likeScore = []
#     for place in results:
#         likeScore.append(levenshtein(place['name'].casefold(), placeName.casefold()))

#     bestScore = min(likeScore)
#     # Filter results to exclude elements where likeScore != bestScore
#     filtered_results = [place for i, place in enumerate(results) if likeScore[i] == bestScore]

#     # Remove duplicate places
#     unique_filtered_results = list({
#         (place['lat'], place['lng']): place for place in filtered_results
#     }.values())

#     return unique_filtered_results


def refine_results(place_name: str, results: List[Dict[str, str]]) -> List[Dict[str, str]]:
    # Split place names into words using a regular expression for common delimiters, excluding quotes
    def split_name(name: str) -> List[str]:
        return re.split(r'[\s\-_/\\,;:.()&]+', name.lower())

    # Stop words to ignore in the root name
    ignore_words = {'the', 'of', 'and', 'in', 'at', 'on', 'for', 'by', 'with', 'about', 'from', 'to', 'up', 'out', 'as', 'into', 'near'}

    # First Pass: Filter out results that don't have at least 90% similarity with any of the user's input words
    def has_strict_match(input_words: List[str], result_name: str) -> bool:
        for word in input_words:
            if all(SequenceMatcher(None, word.lower(), result_word).ratio() < 0.9 for result_word in split_name(result_name)):
                return False
        return True

    input_words = split_name(place_name)
    filtered_results = [result for result in results if has_strict_match(input_words, result['name'])]

    # Second Pass: Reduce names to root using common words
    if filtered_results:
        all_names = [result['name'] for result in filtered_results]
        split_names = [split_name(name) for name in all_names]
        common_words = set(split_names[0])
        for split_name in split_names[1:]:
            common_words.intersection_update(split_name)

        # Remove stop words from the common words set
        common_words.difference_update(ignore_words)

        root_name = ' '.join([word for word in split_names[0] if word in common_words])
        # similarity = SequenceMatcher(None, place_name.lower(), root_name.lower()).ratio()
        if not root_name: # or similarity >= 0.8:
            root_name = place_name

        refined_results = []
        for result in filtered_results:
            result['name'] = root_name.capitalize()
            refined_results.append(result)

    # Third Pass: Remove duplicates & cluster nearby locations
        unique_filtered_results = list({
            (place['lat'], place['lng']): place for place in refined_results
        }.values())

        clustered_results = cluster_locations(unique_filtered_results, distance_threshold=250)

        return clustered_results
    else:
        return []

# Clustering nearby locations, to meters threshold
def cluster_locations(places: List[Dict[str, str]], distance_threshold: float) -> List[Dict[str, str]]:
    clustered = []
    visited = set()

    def is_near(p1, p2, threshold):
        return haversine_distance((p1['lat'], p1['lng']), (p2['lat'], p2['lng'])) < threshold

    def get_place_id(place):
            return (place['lat'], place['lng'])

    while places:
        current_place = places.pop(0)
        current_place_id = get_place_id(current_place)
        if current_place_id in visited:
            continue
        cluster = [current_place]
        visited.add(current_place_id)
        places_to_remove = []

        for other_place in places:
            other_place_id = get_place_id(other_place)
            if is_near(current_place, other_place, distance_threshold):
                cluster.append(other_place)
                visited.add(other_place_id)
                places_to_remove.append(other_place)

        # Average the locations of the cluster
        avg_lat = sum(p['lat'] for p in cluster) / len(cluster)
        avg_lng = sum(p['lng'] for p in cluster) / len(cluster)
        clustered.append({
            'name': current_place['name'],
            'lat': avg_lat,
            'lng': avg_lng,
        })

        # Remove clustered places
        for place in places_to_remove:
            places.remove(place)

    return clustered