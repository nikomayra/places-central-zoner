from app.models import User, Session
from app.extensions import db
from  datetime import datetime, timedelta
from flask import jsonify

def add_user(user_id):
    # print(f'User ID: {user_id}, type: {type(user_id)}')
    user = User.query.filter_by(id=user_id).first()
    if not user:
        # Create a new user entry if not exists
        user = User(
            id=user_id
        )
        db.session.add(user)
        db.session.commit()
        print(f'Added User {user_id}')
    else:
        print('User already exists in database.')

def add_session(session_id, user_id, session_exp):
    session = Session.query.filter_by(user_id=user_id).first()

    # If session already exists, remove it
    # Happens on re-login prior to token expiration or 
    # if user doesn't log out and token expires prior to next login
    if session:
        print(f'Removing previous Session: {session.id} for user {session.user_id}.')
        db.session.delete(session)
    else:
        print(f'No Session exists in database for user {user_id}.')

    session = Session(
        id=session_id,
        user_id=user_id,
        expiration=session_exp
    )
    db.session.add(session)
    db.session.commit()
    print(f'Added Session {session_id} for user {user_id}, expires on {datetime.fromtimestamp(session_exp)}')


# def remove_user(user_id):
#     # Temp without db
#     User.id = 0
#     User.clusters = []
#     User.searched_places = []
#     print('Removed User: ', user_id)

def remove_session(session_id):
    session = Session.query.filter_by(id=session_id).first()
    if session:
        db.session.delete(session)
        db.session.commit()
        print(f'Removed Session {session_id}')
        return True
    else:
        print(f'Session {session_id} not found in database.')
        return False


# user.token = token
# user.token_expiration = datetime.now(datetime.UTC) + timedelta(hours=1)
# db.session.commit()