# places-central-zoner

### Description:

Places Central Zoner is a web application that finds central zones which each contain at least one of each searched location within a minimized radius. For example, search for LA Fitness, Chipotle and Starbucks within the greater Seattle area and it will draw circular zones with a center point which is at a minimum distance to each of those three stores. In other words, this app helps find geographical areas which are minimally near at least one of each searched place. When I was living out of my car the original need was to find ideal areas to situate myself such that I had access to a multitude of places.

## Tech Stack Combination:

**Frontend:** React with TypeScript and Material-UI for the user interface.  
**Backend:** Flask for the backend logic and API.  
**Database:** PostgreSQL using Supabase for user state management.
**Authentication:** Google's OAuth2.0 Implicit Flow with react-OAuth/Google npm & google-oauth python libraries
**Mapping and Geolocation:** Google Maps Javascript & Places API
**Deployment:** Render.com for hosting and managing the application.

For searched places results refinement I use several passes to try to reduce API places results to the core intended places per the user. A couple cases could be typing in Walgreens and getting Walgreens Photo & Walgreens Pharmacy which create new types of places and in turn disrupts the effectiveness of the clustering. Another edge case would be if we searched for LA Fitness in Gainesville, FL where there are no LA Fitnesses, the results would return other places with "Fitness" in their names disrupting the clustering. 

For clustering the searched places I use a mixture of 3 different techniques (Brute force combinations, DBScan & KMeans with iterative refinement) for clustering and return the best results evaluated by a combination of metrics partially influenced by the user.

## How to use
1. Enter search center and adjust radius (miles).
2. Enter between 2 and 5 different locations.
3. Press "Search" to mark them in the search area.
4. Adjust quality as needed & press "Analyze" to find central-zoned locations.

## Visual usage/examples

TBD


## Potential future improvements

- Update from the Autocomplete widget to the Autocomplete API webservice method to have control to implement deboouncing on user inputs reducing API calls.
- Use vanilla google Maps JS instead of vis.gl library for fewer libraries.
- User fewer libraries in general for fewer dependencies.
- Further enhance the searched places results refinement by using place categories from the Google API and provide the user a dropdown list.
- Refactor frontend for greater modularity and scalability.
- Implement more robust error handling.
- More thoroughly comment code.
