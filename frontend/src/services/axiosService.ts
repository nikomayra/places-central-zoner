import axios from 'axios';
import { PlaceLocation, LatLng } from '../interfaces/interfaces';
const baseUrl = '/api';

const searchPlaces = async (
  placeNames: string[],
  searchCenter: LatLng,
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
  //console.log('/cluster - placeLocations: ', placeLocations);
  const res = await axios.post(`${baseUrl}/cluster`, placeLocations, {
    headers: {
      'Content-Type': 'application/json',
      'User-Preference': userPreference,
    },
  });
  return res.data;
};

export default { analyzePlaces, searchPlaces };
