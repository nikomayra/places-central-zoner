import axios from 'axios';
const baseUrl = '/api';

interface GeoLocation {
  lat: number;
  lng: number;
}

interface PlaceLocation {
  name: string;
  lat: number;
  lng: number;
}

const searchPlaces = async (
  placeNames: string[],
  searchCenter: GeoLocation,
  searchRadius: number
) => {
  const data = {
    placeNames: placeNames,
    searchCenter: searchCenter,
    searchRadius: searchRadius,
  };
  const res = await axios.post(`${baseUrl}/search-places`, data, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return res.data;
};

const analyzePlaces = async (
  placeLocations: PlaceLocation[],
  userPreference: number
) => {
  const res = await axios.post(`${baseUrl}/cluster`, placeLocations, {
    headers: {
      'Content-Type': 'application/json',
      'User-Preference': userPreference,
    },
  });
  return res.data;
};

export default { searchPlaces, analyzePlaces };
