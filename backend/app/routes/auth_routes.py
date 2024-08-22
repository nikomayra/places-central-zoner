from flask import Blueprint, jsonify, request
from app.controllers.auth_controller import login_user, logout_user
from app.middleware import session_required
from app import limiter

auth_bp = Blueprint('auth', __name__)
limiter.limit("25 per minute")(auth_bp)

# Authenticates user's session, if unique session id exists in database & not expired.
@auth_bp.route('/auth-session', methods=['POST'])
@session_required
def auth_session(user_info):
    return jsonify({'message': f'Session is valid for {user_info['sub']}', 'authenticated': True})

# Validates user's token then adds their session to the database
@auth_bp.route('/login', methods=['POST'])
def login():
    return login_user(request)

# Removes user's session data from the database
@auth_bp.route('/logout', methods=['POST'])
def logout():
    return logout_user(request)

















# @bp.route('/refresh-token', methods=['POST'])
# def refresh_token():
#     refresh_token = request.json.get('refresh_token')
    
#     if not refresh_token:
#         return jsonify({'error': 'Refresh token is missing'}), 400

#     try:
#         credentials = Credentials(
#             token=None,
#             refresh_token=refresh_token,
#             token_uri='https://oauth2.googleapis.com/token',
#             client_id=GOOGLE_CLIENT_ID,
#             client_secret=GOOGLE_CLIENT_SECRET
#         )
#         request_adapter = Request()
#         credentials.refresh(request_adapter)
#         new_token = credentials.token
#         new_expiry = credentials.expiry
#     except Exception as e:
#         new_token, error = None, str(e)

#     if not new_token:
#         return jsonify({'error': 'Token refresh failed', 'details': error}), 400

#     return jsonify({
#         'access_token': new_token,
#         'expires_in': new_expiry
#     })

# @bp.route('/auth-code', methods=['POST'])
# def exchange_auth_code():
#     auth_code = request.json.get('code')
#     if not auth_code:
#         return jsonify({'error': 'Authorization code is missing'}), 400
    
#     # Create a client config dictionary from environment variables
#     client_config = {
#         "web": {
#             "client_id": GOOGLE_CLIENT_ID,
#             "client_secret": GOOGLE_CLIENT_SECRET,
#             "redirect_uris": [REDIRECT_URI],
#             "auth_uri": "https://accounts.google.com/o/oauth2/auth",
#             "token_uri": "https://oauth2.googleapis.com/token"
#         }
#     }

#     # Create the Flow object
#     flow = Flow.from_client_config(client_config, scopes=[
#         'openid',
#         'https://www.googleapis.com/auth/userinfo.profile',
#         'https://www.googleapis.com/auth/userinfo.email',
#         ])
#     flow.redirect_uri = REDIRECT_URI

#     # Exchange the authorization code for tokens
#     try:
#         flow.fetch_token(code=auth_code)
#     except Exception as e:
#         return jsonify({'error': f'Token exchange failed: {str(e)}'}), 400

#     credentials = flow.credentials

#     # Respond with the tokens
#     return jsonify({
#         'access_token': credentials.token,
#         'refresh_token': credentials.refresh_token,
#         'expires_in': credentials.expiry,
#         'id_token': credentials.id_token
#     })
