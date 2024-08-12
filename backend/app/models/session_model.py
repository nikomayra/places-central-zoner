from extensions import db
import datetime

class Session(db.Model):
    # id = db.Column(db.String(500), primary_key=True)
    # user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    # expiration = db.Column(db.DateTime, nullable=False)
    # Add other fields as needed

    # Temporary variable for development prior to db
    id = ''
    user_id = 0
    experation = datetime.utcnow()
