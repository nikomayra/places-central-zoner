from app.routes.auth_routes import auth_bp
# from app.routes.user_routes import user_bp
from app.routes.data_routes import data_bp

def register_blueprints(app):
    app.register_blueprint(auth_bp, url_prefix='/api')
    # app.register_blueprint(user_bp)
    app.register_blueprint(data_bp, url_prefix='/api')
