from flask import Flask, Blueprint
from flask_cors import CORS
from app.extensions import db
from app.blueprints import register_blueprints

def create_app():
    app = Flask(__name__)
    CORS(app)

    # Load configuration
    app.config.from_object('app.config.Config')
    
    # Initialize extensions
    # db.init_app(app)
    # migrate.init_app(app, db)
    
    # Register blueprints
    register_blueprints(app)

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def catch_all(path):
        return 'You want path: %s' % path
    
    return app
