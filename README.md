# places-central-zoner

### Description:

Places Central Zoner is a simple web application that finds central locations which each contain all searched locations within a minimized radius. For example, search for LA Fitness, Chipotle and Starbucks within the greater Seattle area and it will draw circles with a center point which is at a minimum distance to clusters of those three stores. TBD.

# Development plan:

## Tech Stack Combination:

**Frontend:** React with TypeScript and Material-UI for the user interface.  
**Backend:** Flask (Python) for the backend logic and API.  
**Database:** PostgreSQL for data storage and management.  
**Mapping and Geolocation:** Google Maps Javascript & Places API
**Deployment:** Render.com for hosting and managing the application.

## Implementation Steps:

1. (99%) Frontend Development:

   - Set up a React project with TypeScript.
   - Integrate Material-UI.
   - Implement input fields for places names and a map component using Google Maps API.
   - Implement map search area refinement.
   - Implement UI/UX elements for visibility, readability, useability.
   - Implement data UI elements for greater understanding of results.

2. (95%) Backend Development:

   - Set up a Flask project.
   - Implement logic to calculate the central minimum locations based on store distances.
     - Using a dynamic count based system. Brute-force, DBScan, and KMeans.
   - Setup PostgreSQL for storing/handling data.

3. (95%) Mapping and Geolocation:

   - Use the Google Maps API to display the map and markers for the places/central-zones.
   - Calculate the central points and draw circles representing the radius to the farthest store.
   - Use Google Maps API for drawing central zone markers

4. (95%) Implement OAuth and any other protection to avoid unnecessary Google API calls.

5. (90%) Use complete app and then adjust as needed...test/fix/etc.

6. (95%) Deployment:
   - Containerize the application using Docker (optional but recommended).
   - Deploy the application to Render.com, ensuring the database is configured correctly.

## Potential future improvements

- Update to Autocomplete from Places (NEW) using "Data API" & Sessions.
- Use vanilla google Maps JS instead of vis.gl library stuff.
