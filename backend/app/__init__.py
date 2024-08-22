from flask import Flask
from flask_cors import CORS
from app.extensions import db, migrate
from app.blueprints import register_blueprints
from .config import Config
from redis import Redis
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

redis_connection = None
limiter = None

def create_app():
    app = Flask(__name__, static_folder='dist')
    CORS(app)

    # Load configuration
    app.config.from_object(Config)
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Register blueprints
    register_blueprints(app)

    # Initialize Redis connection
    global redis_connection
    redis_connection = Redis.from_url(app.config['REDIS_URL'])

    # Initialize Flask-Limiter with Redis as storage
    global limiter
    limiter = Limiter(
        get_remote_address,
        app=app,
        storage_uri=app.config['RATELIMIT_STORAGE_URL'}
    )

    # @app.route('/', defaults={'path': ''})
    # @app.route('/<path:path>')
    # def catch_all(path):
    #     return 'You want path: %s' % path
    
    return app
