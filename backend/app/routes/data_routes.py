from flask import Blueprint, request
from app.controllers.data_controller import search_places, cluster_data, latest_state
from app.middleware import session_required

data_bp = Blueprint('data', __name__)

@data_bp.route('/search-places', methods=['POST'])
@session_required
def search_places_route(user_info):
    return search_places(user_info, request)

@data_bp.route('/cluster', methods=['POST'])
@session_required
def cluster_route(user_info):
    return cluster_data(user_info, request)

@data_bp.route('/latest-state', methods=['GET'])
@session_required
def latest_state_route(user_info):
    return latest_state(user_info)