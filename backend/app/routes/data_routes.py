from flask import Blueprint, request
from app.controllers.data_controller import search_places, cluster_data
from app.limiter import limiter

data_bp = Blueprint('data', __name__)

@data_bp.route('/search-places', methods=['POST'])
@limiter.limit("2 per minute")
def search_places_route():
    return search_places(request)

@data_bp.route('/cluster', methods=['POST'])
@limiter.limit("20 per minute")
def cluster_route():
    return cluster_data(request)
