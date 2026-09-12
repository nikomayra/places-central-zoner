import unittest
from unittest.mock import patch

from app import create_app


class PublicRoutesTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config.update(
            TESTING=True,
            RATELIMIT_ENABLED=False,
            GOOGLE_MAPS_BROWSER_API_KEY='maps-key',
        )
        self.client = self.app.test_client()

    def test_client_config_is_loaded_at_runtime(self):
        response = self.client.get('/api/client-config')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()['google_maps_api_key'], 'maps-key')

    @patch('app.controllers.data_controller.perform_search')
    def test_place_search_is_public(self, perform_search):
        perform_search.return_value = []

        response = self.client.post('/api/search-places', json={
            'placeNames': ['coffee', 'gym'],
            'searchCenter': {'lat': 47.608013, 'lng': -122.335167},
            'searchRadius': 5,
        })

        self.assertEqual(response.status_code, 200)
        perform_search.assert_called_once()


if __name__ == '__main__':
    unittest.main()
