from flask import jsonify, current_app, request
from google.auth.transport.requests import Request
from google.oauth2 import id_token
from functools import wraps
import cachecontrol, requests, datetime
from app.models import User, Session
from app.extensions import db
import time

# Cached session setup for Google token verification
session = requests.session()
cached_session = cachecontrol.CacheControl(sess=session)
request_adapter = Request(session=cached_session)

def session_required(f):
    @wraps(f)
    def session_authenticator(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'authenticated': False,'message': 'Token is missing'}), 401
        token = auth_header.split(' ')[1]

        try:
            user_info = id_token.verify_oauth2_token(token, request_adapter, current_app.config['GOOGLE_CLIENT_ID'])
            
            session_record = Session.query.filter_by(user_id=user_info['sub']).first()

            if not session_record or session_record.expiration < int(time.time()):
                return jsonify({'authenticated': False, 'message': 'Session expired or invalid'}), 401

        except ValueError as error:
            return jsonify({'authenticated': False,'message': 'Token is invalid or expired', 'error': str(error)}), 401

        return f(*args, **kwargs)
    return session_authenticator