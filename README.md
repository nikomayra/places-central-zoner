## Description:

Places Central Zoner is a web application that finds central zones which each contain at least one of each searched location within a minimized radius. For example, search for LA Fitness, Chipotle and Starbucks within the greater Seattle area and it will draw circular zones with a center point which is at a minimum distance to each of those three stores. In other words, this app helps find geographical areas which are minimally near at least one of each searched place. When I was living out of my car the original need was to find ideal areas to situate myself such that I had access to a multitude of places.

## Tech Stack:

**Frontend:** React with TypeScript and Material-UI for the user interface. <br>
**Backend:** Flask for the backend logic and API. <br>
**Database:** PostgreSQL using Supabase for user state management. <br>
**Authentication:** Google's OAuth2.0 Implicit Flow with react-OAuth/Google npm & google-oauth python libraries. <br>
**Mapping and Geolocation:** Google Maps Javascript & Places API. <br>
**Deployment:** Render.com for hosting and managing the application. <br>

## How to use
1. Enter search center and adjust radius (miles). <br>
2. Enter between 2 and 5 different locations. <br>
3. Press "Search" to mark them in the search area. <br>
4. Adjust quality as needed & press "Analyze" to find central-zoned locations. <br>

## Key Features:
* Dynamic web layout with Materal-Ui
* Google OAuth 2.0 authentication implicit flow
* Persistent user state and timed sessions with expiration warning & re-login
* Search location and radius adjustments with visuals and intuitive GUI and dynamic map
* Significant search result refinement for optimal clustering analysis
* Multiple clustering analysis methods with robust evaluation for best results
* Simple UI/UX with clear results

## Visual usage/examples

### Map / Search GUI <br>
<img src="https://github.com/user-attachments/assets/4c24dd0c-4d2a-4466-8ce7-b0f45ca4952d" width="300">
<img src="https://github.com/user-attachments/assets/233a7457-cb43-4de1-9f79-3819e76609b3" width="300"><br>
* Logged in and previous state loaded from database
  * Searched locations markers, zones & zone centers, search radius bias, search center & analyzed zones per user preference
* Logout button, Map, Search center, search radius & place results GUI

#### Functional Details:
* Using Google OAuth id-token to authenticate and decode user id to pull previous state from postgres database on Supabase.
* Search center uses Google's Autocomplete widget, part of Places API
* Search button makes request to backend with search center, radius, and user input place names.
  * Backend makes text search Places API calls for each place name and then makes a best effort to reduce and refine to the exact places the user intended.
     * Avoid cases like searching for walgreens and getting walgreens pharmacy, walgreens photo, etc. Or searching for LA fitness where there is no LA fitness and getting Orange Fitness, Planet Fitness, etc. Also reduces very close points by clustering within a distance threshold - helpful once names are refined, i.e. walgreens pharmacy and walgreens photo becoming walgreens near 2 other walgreens.

Search results backend refinement excerpt:
```
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
```

### Analyze / Quality GUI <br>
<img src="https://github.com/user-attachments/assets/367cfce3-55ec-448f-942c-482ad991067b" width="300">
<img src="https://github.com/user-attachments/assets/cc2c1390-8c3b-43d3-aece-92e0aba6284f" width="300"><br>
* Search place text boxes, add/delete, search button GUI
* Quality preference toggle buttons, zone results list & analyze button GUI

#### Functional Details:
* Quality preference setting defines a factor from 0, .25, .5, .75, 1 which then defines a WCSS (within cluster squared sum) score threshold value for cluster evaluation.
   * WCSS is a measure of how tightly clustered the clusters are. It was chosen over radius because you can have zones where a few places are tightly clusters and an outlier skewing the radius.
* Analysis in the backend is a 2-3 part method. It attempts brute force, dbscan and kmeans, evaluates each methods results and returns the best results as defined by wcss filtering, duplicate removal and a combined-weighted metric score based on cluster count and average wcss score.

Backend clustering methods excerpt:
```
def perform_clustering(places, place_names, place_latlngs, user_preference):

    place_types = set(place_names)  # Collect unique place names
    max_clusters = dynamic_max_clusters(len(place_latlngs), place_types)

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
    
    # Apply DBSCAN
    dbscan_clusters = dbscan_clustering(place_latlngs, places, place_types)
    DB_valid_clusters, DB_score = evaluate_clusters(dbscan_clusters, user_preference)
    if DB_score > best_score:
        best_method = 'DBScan'
        best_clusters = DB_valid_clusters
        best_score = DB_score

    # Apply KMeans and iterative refinement
    initial_labels = kmeans_clustering(place_latlngs, max_clusters)
    kmeans_clusters = iterative_refinement(initial_labels, places, place_types)
    KM_valid_clusters, KM_score = evaluate_clusters(kmeans_clusters, user_preference)
    if KM_score > best_score:
        best_method = 'KMeans'
        best_clusters = KM_valid_clusters
        best_score = KM_score

    return best_clusters
```

## Potential future improvements

- Update from the Autocomplete widget to the Autocomplete API webservice method to have control to implement deboouncing on user inputs reducing API calls.
- Use vanilla google Maps JS instead of vis.gl library for fewer libraries.
- User fewer libraries in general for fewer dependencies.
- Further enhance the searched places results refinement by using place categories from the Google API and provide the user a dropdown list.
- Refactor frontend for greater modularity and scalability.
- Implement more robust error handling.
- More thoroughly comment code.
