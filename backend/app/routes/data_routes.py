from flask import Blueprint, request
from app.controllers.data_controller import search_places, cluster_data
# from app.middleware import token_required

data_bp = Blueprint('data', __name__)

@data_bp.route('/search-places', methods=['POST'])
# @token_required
def search_places_route():
    return search_places(request)

@data_bp.route('/cluster', methods=['POST'])
# @token_required
def cluster_route():
    return cluster_data(request)
