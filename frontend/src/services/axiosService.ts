import axios from 'axios';
const baseUrl = '/api/';

const searchPlaces = async (placeNames: string[]) => {
  const place_names = JSON.stringify({ placeNames: placeNames });
  const res = await axios.postForm(`${baseUrl}/search-places`, place_names);
  return res.data;
};

//const setSearchArea =
//const analyzePlaces =

export default { searchPlaces };
