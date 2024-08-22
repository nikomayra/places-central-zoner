from flask import Flask
from flask_cors import CORS
from app.extensions import db, migrate
from app.blueprints import register_blueprints
from .config import Config
from app.limiter import create_limiter

def create_app():
    app = Flask(__name__, static_folder='dist')
    CORS(app)
    
    # Load configuration
    app.config.from_object(Config)
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # Init limiter
    create_limiter(app)
    
    # Register blueprints
    register_blueprints(app)

    # if needed....
    # @app.route('/', defaults={'path': ''})
    # @app.route('/<path:path>')
    # def catch_all(path):
    #     return 'You want path: %s' % path
    
    return app
