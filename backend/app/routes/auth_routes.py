from flask import Blueprint, jsonify, request
from app.controllers.auth_controller import login_user, logout_user
from app.middleware import session_required
from app.limiter import limiter

auth_bp = Blueprint('auth', __name__)
limiter.limit("5 per minute")(auth_bp)

# Authenticates user's session, if unique session id exists in database & not expired.
@auth_bp.route('/auth-session', methods=['POST'])
@session_required
def auth_session(user_info):
    return jsonify({'message': f'Session is valid for {user_info["sub"]}', 'authenticated': True})

# Validates user's token then adds their session to the database
@auth_bp.route('/login', methods=['POST'])
def login():
    return login_user(request)

# Removes user's session data from the database
@auth_bp.route('/logout', methods=['POST'])
def logout():
    return logout_user(request)