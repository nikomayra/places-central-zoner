import axios from 'axios';
import { PlaceLocation, LatLng } from '../interfaces/interfaces';
//import { CodeResponse } from '@react-oauth/google';

const baseUrl = '/api';

const searchPlaces = async (
  placeNames: string[],
  searchCenter: LatLng,
  searchRadius: number,
  id_token: string
) => {
  const data = {
    placeNames: placeNames,
    searchCenter: searchCenter,
    searchRadius: searchRadius,
  };
  const res = await axios.post(`${baseUrl}/search-places`, data, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${id_token}`,
    },
  });
  return res.data;
};

const analyzePlaces = async (
  placeLocations: PlaceLocation[],
  userPreference: number,
  id_token: string
) => {
  //console.log('/cluster - placeLocations: ', placeLocations);
  const res = await axios.post(`${baseUrl}/cluster`, placeLocations, {
    headers: {
      'Content-Type': 'application/json',
      'User-Preference': userPreference,
      Authorization: `Bearer ${id_token}`,
    },
  });
  return res.data;
};

/* const authGoogle = async (codeResponse: CodeResponse) => {
  const data = {
    code: codeResponse.code,
  };
  const res = await axios.post(`${baseUrl}/auth-code`, data);
  return res.data;
};

const refreshAuthToken = async (refreshToken: string) => {
  const data = {
    refresh_token: refreshToken,
  };
  const res = await axios.post(`${baseUrl}/refresh-token`, data);
  return res.data;
}; */

const authUser = async (id_token: string) => {
  const config = {
    headers: {
      Authorization: `Bearer ${id_token}`,
    },
  };
  return await axios.post(`${baseUrl}/auth-user`, undefined, config);
};

export default {
  analyzePlaces,
  searchPlaces,
  //authGoogle,
  //refreshAuthToken,
  authUser,
};
