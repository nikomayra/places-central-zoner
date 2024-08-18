from flask import jsonify, current_app
from google.auth.transport.requests import Request
from google.oauth2 import id_token
from app.services.auth_service import add_user, add_session, remove_session
import cachecontrol, requests

# Cached session setup for Google token verification
session = requests.session()
cached_session = cachecontrol.CacheControl(session)
request_adapter = Request(session=cached_session)

def login_user(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'message': 'Token is missing'}), 401
    token = auth_header.split(' ')[1]
    try:
        user_info = id_token.verify_oauth2_token(token, request_adapter, current_app.config['GOOGLE_CLIENT_ID'])
        add_user(user_info['sub'])
        add_session(user_info['jti'], user_info['sub'], user_info['exp'])
        return jsonify({'username': user_info['name'], 'token_exp': user_info['exp']}), 200
    except ValueError as error:
        return jsonify({'message': 'Token is invalid or expired', 'error': str(error)}), 401
    

def logout_user(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'message': 'Token is missing'}), 401
    token = auth_header.split(' ')[1]
    try:
        user_info = id_token.verify_oauth2_token(token, request_adapter, current_app.config['GOOGLE_CLIENT_ID'])
        removed = remove_session(user_info['jti'])
        if not removed:
            return jsonify({'message': f'Session {session_id} not found in database.'}), 401
        return jsonify({'message': 'User logged out; session closed.'}), 200
    except ValueError as error:
        return jsonify({'message': 'Token is invalid or expired', 'error': str(error)}), 401
