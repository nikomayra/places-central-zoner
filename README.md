# places-central-zoner

### Description:

Locations Zoner is a simple web application that finds central locations which each contain all searched locations within a minimized radius. For example, search for LA Fitness, Chipotle and Starbucks within the greater Seattle area and it will draw circles with a center point which is at a minimum distance to clusters of those three stores. TBD

# Development plan:

## Tech Stack Combination:

**Frontend:** React with TypeScript and Material-UI for the user interface.  
**Backend:** Flask (Python) for the backend logic and API.  
**Database:** PostgreSQL for data storage and management.  
**Mapping and Geolocation:** Google Maps API to handle mapping, store location searches, and distance calculations.  
**Deployment:** Render.com for hosting and managing the application.

## Implementation Steps:

1. (80%) Frontend Development:

   - Set up a React project with TypeScript.
   - Integrate Material-UI.
   - Implement input fields for places names and a map component using Google Maps API.
     -Implement map search area refinement. Limit max search area and allow user to search to quickly center map. Maybe autocomplete library or other.

2. (20%) Backend Development:

   - Set up a Flask project.
   - Create endpoints to interact with the Google Places API and Distance Matrix API.
   - Implement logic to calculate the central minimum locations based on store distances.
     -Setup PostgreSQL for storing/handling backend data.

3. Mapping and Geolocation:

   - Use the Google Maps API to display the map and markers for the places.
   - Calculate the central points and draw circles representing the radius to the farthest store.
     -Use Google Maps API for drawing central zones

4. Implement OAuth and any other protection to avoid unnecessary Google API calls.

5. Use complete app and then adjust as needed...test/fix/etc.

6. Deployment:
   - Containerize the application using Docker (optional but recommended).
   - Deploy the application to Render.com, ensuring the database is configured correctly.
