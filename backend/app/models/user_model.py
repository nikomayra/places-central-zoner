# from app.extensions import db
import datetime

# db.Model
class User():
    # id = db.Column(db.Integer, primary_key=True)
    # email = db.Column(db.String(120), unique=True, nullable=False)
    # name = db.Column(db.String(120), unique=False, nullable=False)
    # session_id = db.Column(db.String(500), unique=True, nullable=False)
    # session_expiration = db.Column(db.DateTime, nullable=False)
    # Add other fields as needed

    # Temporary variable for development prior to db
    id = 0
    searched_places = []
    clusters = []
    # session_expiration = datetime.datetime.now(datetime.UTC)