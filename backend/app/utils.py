import math
import numpy as np

# Algorithm to compare 2 strings returning number of operations to convert a to b
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

# Calculates NE and SW points of square around circle
# radius in meters
def calculate_bounding_box(center, radius):
    lat, lng = center
    radius_in_km = radius * .001  # Convert meters to kilometers

    # Earth’s radius in kilometers
    earth_radius = 6371.0

    # Latitude delta
    lat_delta = radius_in_km / earth_radius
    lat_delta_deg = math.degrees(lat_delta) * .8 #10% smaller to closer match the circle

    # Longitude delta, compensate for shrinking earth radius in latitude
    lng_delta_deg = math.degrees(radius_in_km / (earth_radius * math.cos(math.radians(lat))))

    # Define the bounding box
    northeast = (min(lat + lat_delta_deg, 90), min(lng + lng_delta_deg, 180))
    southwest = (max(lat - lat_delta_deg, -90), max(lng - lng_delta_deg, -180))

    return northeast, southwest

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
