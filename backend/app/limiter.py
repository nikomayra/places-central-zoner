from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    get_remote_address,
    storage_uri=None
)

def create_limiter(app):
    # Use internal memory in development, UNCOMMENT FOR PRODUCTION WITH RENDER.COM
    limiter._storage_uri = app.config['RATELIMIT_STORAGE_URL']
    limiter.init_app(app)
    return limiter