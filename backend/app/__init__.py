from flask import Flask, send_from_directory
from flask_cors import CORS
from app.extensions import db, migrate
from app.blueprints import register_blueprints
import os

def create_app():
    app = Flask(__name__, static_folder='dist')
    CORS(app)

    # Load configuration
    app.config.from_object('app.config.Config')
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Register blueprints
    register_blueprints(app)

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def catch_all(path):
        return 'You want path: %s' % path
    # def serve_frontend(path):
    #     if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
    #         return send_from_directory(app.static_folder, path)
    #     else:
    #         return send_from_directory(app.static_folder, 'index.html')
    
    return app
