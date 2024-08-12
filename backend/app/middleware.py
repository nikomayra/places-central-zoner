from flask import request, jsonify, current_app
from google.auth.transport.requests import Request
from google.oauth2 import id_token
from functools import wraps

def token_required(f):
    @wraps(f)
    def validation_decorator(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'message': 'Token is missing'}), 401
        token = auth_header.split(' ')[1]
        try:
            user_info = id_token.verify_oauth2_token(token, Request(), current_app.config['GOOGLE_CLIENT_ID'])
        except ValueError as error:
            return jsonify({'message': 'Token is invalid or expired', 'error': str(error)}), 401
        return f(user_info, *args, **kwargs)
    return validation_decorator