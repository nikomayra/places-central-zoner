from flask import Blueprint, request
from app.controllers.data_controller import search_places, cluster_data, latest_state
from app.middleware import session_required
from app.limiter import limiter

data_bp = Blueprint('data', __name__)

@data_bp.route('/search-places', methods=['POST'])
@limiter.limit("10 per minute")
@session_required
def search_places_route(user_info):
    return search_places(user_info, request)

@data_bp.route('/cluster', methods=['POST'])
@limiter.limit("20 per minute")
@session_required
def cluster_route(user_info):
    return cluster_data(user_info, request)

@data_bp.route('/latest-state', methods=['GET'])
@limiter.limit("20 per minute")
@session_required
def latest_state_route(user_info):
    return latest_state(user_info)