import axios from 'axios';
const baseUrl = '/api';

interface GeoLocation {
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

//const setSearchArea =
//const analyzePlaces =

export default { searchPlaces };
