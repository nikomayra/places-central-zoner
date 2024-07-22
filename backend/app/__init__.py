from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

def create_app():
    app = Flask(__name__)
    CORS(app)
    
    app.config.from_mapping(
        SECRET_KEY=os.getenv('SECRET_KEY', 'dev_key')
    )
    
    from . import routes
    app.register_blueprint(routes.bp)
    
    return app
