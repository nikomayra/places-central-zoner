from app.models.user_model import User
from app.models.session_model import Session
import datetime
# from uuid import uuid4

def add_user(user_id, session_id):
    # Temp without db
    User.id = user_id
    User.session_id = session_id
    print('Added User.id:', User.id)
    print('Added User.session_id:', User.session_id)

def add_session(session_id, user_id, session_exp):
    # Temp without db
    Session.id = session_id
    Session.user_id = user_id
    Session.expiration = datetime.datetime.fromtimestamp(session_exp)
    print('Added Session: ',Session.id)
    print('Added Session.user_id: ',Session.user_id)
    print('Added Session.expiration: ',Session.expiration)

def remove_user(user_id):
    # Temp without db
    User.id = 0
    User.clusters = []
    User.searched_places = []
    print('Removed User: ', user_id)

def remove_session(session_id):
    # Temp without db
    Session.id = ''
    Session.user_id = 0
    Session.expiration = datetime.datetime.now(datetime.UTC)
    print('Removed Session: ',session_id)


# from app.utils.token_utils import generate_token, validate_token

# def validate_user_credentials(credentials):
#     # Implement user validation logic, e.g., compare with DB
#     return True

# def generate_tokens(user_credentials):
#     # Generate and return tokens (access, refresh)
#     return {
#         "access_token": generate_token(user_credentials),
#         "refresh_token": generate_token(user_credentials)
#     }
