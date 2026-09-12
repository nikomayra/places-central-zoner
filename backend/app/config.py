
from dotenv import load_dotenv
import os

load_dotenv()

class Config:
    GOOGLE_PLACES_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')
    GOOGLE_MAPS_BROWSER_API_KEY = os.getenv(
        'GOOGLE_MAPS_BROWSER_API_KEY',
        os.getenv('VITE_APP_GOOGLE_MAPS_API_KEY'),
    )
    RATELIMIT_STORAGE_URI = os.getenv('RATELIMIT_STORAGE_URI', 'memory://')
