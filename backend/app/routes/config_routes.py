from flask import Blueprint, current_app, jsonify

from app.limiter import limiter


config_bp = Blueprint('config', __name__)


@config_bp.route('/client-config', methods=['GET'])
@limiter.limit('60 per minute')
def client_config():
    google_maps_api_key = current_app.config['GOOGLE_MAPS_BROWSER_API_KEY']

    if not google_maps_api_key:
        return jsonify({
            'message': 'Google Maps configuration is missing on the server.'
        }), 503

    return jsonify({'google_maps_api_key': google_maps_api_key}), 200
