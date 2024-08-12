from flask import jsonify, current_app, Response
from google.auth.transport.requests import Request
from google.oauth2 import id_token
from app.models.user_model import User
from app.models.session_model import Session
import datetime

def login_user(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'message': 'Token is missing'}), 401
    token = auth_header.split(' ')[1]
    try:
        user_info = id_token.verify_oauth2_token(token, Request(), current_app.config['GOOGLE_CLIENT_ID'])
        # Temp without db
        User.id = int(user_info['sub']),
        User.email = user_info['email'],
        User.name = user_info['name'],
        User.session_id = user_info['jti'],
        User.session_experation = datetime.datetime.fromtimestamp(user_info['exp'])
    except ValueError as error:
        return jsonify({'message': 'Token is invalid or expired', 'error': str(error)}), 401
    return jsonify({'username': user_info['name'], 'token_exp': user_info['exp']})

def logout_user(request):
    return []


# def token_required(f):
#     @wraps(f)
#     def validation_decorator(*args, **kwargs):
#         auth_header = request.headers.get('Authorization')
#         if not auth_header:
#             return jsonify({'message': 'Token is missing'}), 401
#         token = auth_header.split(' ')[1]
#         try:
#             user_info = id_token.verify_oauth2_token(token, Request(), current_app.config['GOOGLE_CLIENT_ID'])
#         except ValueError as error:
#             return jsonify({'message': 'Token is invalid or expired', 'error': str(error)}), 401
#         return f(user_info, *args, **kwargs)
#     return validation_decorator