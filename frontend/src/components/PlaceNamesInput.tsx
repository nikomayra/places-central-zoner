import React, { useState } from 'react';
import {
  TextField,
  Button,
  Box,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

interface PlaceLocation {
  name: string;
  lat: number;
  lng: number;
}

interface LatLng {
  lat: number;
  lng: number;
}

interface PlaceNamesInputProps {
  setPlaceLocations: React.Dispatch<React.SetStateAction<PlaceLocation[]>>;
  searchCenter: LatLng;
  searchRadius: number;
  showAlert: (
    severity: 'success' | 'info' | 'warning' | 'error',
    message: string
  ) => void;
}

const PlaceNamesInput: React.FC<PlaceNamesInputProps> = ({
  setPlaceLocations,
  searchCenter,
  searchRadius,
  showAlert,
}) => {
  const [toggleSearchProgessBar, setToggleSearchProgessBar] = useState(false);
  const [placeNames, setPlaceNames] = useState<string[]>(['', '']);
  const [nameCount, setNameCount] = useState<{ [key: string]: number }>({});
  const placesAPI = useMapsLibrary('places');
  const maxResults: number = 20; // 1-20

  // Autocomplete useEffect for dynamically changing map center.
  const placesRequest = async (placeName: string): Promise<PlaceLocation[]> => {
    if (!placesAPI) {
      console.error('Places API is not available');
      return [];
    }

    const request = {
      textQuery: placeName,
      fields: ['displayName', 'location'],
      locationRestriction: calculateBoundingBox(
        searchCenter,
        searchRadius * 1609.34
      ),
      language: 'en-US',
      maxResultCount: maxResults,
    };

    try {
      const places = await placesAPI.Place.searchByText(request);
      return places?.places
        ?.map((place) => ({
          name: place.displayName ?? '',
          lat: place.location?.lat() ?? null,
          lng: place.location?.lng() ?? null,
        }))
        .filter(
          (place) => place.lat !== null && place.lng !== null
        ) as PlaceLocation[];
    } catch (error) {
      console.error('Error fetching places:', error);
      return [];
    }
  };

  const verifyPlaceNames = (): boolean => {
    // make sure place names input aren't too similar
    // Trying to avoid case of: Chipotle & Chipotles
    // It would simplify to chipotle and analyze would fail, needs minimum 2 places
    let likeScore: number = 0;
    for (let i = 0; i < placeNames.length; i++) {
      for (let j = i + 1; j < placeNames.length; j++) {
        likeScore = levenshtein(
          placeNames[i].toLowerCase(),
          placeNames[j].toLowerCase()
        );
        //console.log(`${placeNames[i]}+${placeNames[j]}=${likeScore}`);
        if (likeScore <= 2) {
          // guessing at a threshold...
          return false;
        }
      }
    }
    return true;
  };

  const handleSearch = async () => {
    try {
      //Try to prevent very similar names prior to API calls.
      if (!verifyPlaceNames()) {
        showAlert('error', 'Very similar names not allowed.');
        return;
      }

      setToggleSearchProgessBar(true);
      setPlaceLocations([]);
      const placeLocations: PlaceLocation[] = [];
      let likeScore: number[] = [];

      for (const placeName of placeNames) {
        const pResults = await placesRequest(placeName);

        // Score how well the result names match the searched name
        // Find the best scoring result name vs searched name
        // Use that score to filter out all other results
        // Try to provide user with what they intended.
        for (const place of pResults) {
          likeScore.push(
            levenshtein(place.name.toLowerCase(), placeName.toLowerCase())
          );
        }

        const bestScore: number = Math.min(...likeScore);
        const rResults = pResults.filter((_, i) => likeScore[i] === bestScore);

        placeLocations.push(...rResults);
        likeScore = [];
      }

      // Remove duplicate - final search refinement
      // where verifyPlaceNames() still return the same location from API call,
      // like starbucks and strbock (theoretical example, not sure what API returns)
      const uniquePlaceLocations: PlaceLocation[] =
        removeDuplicatePlaces(placeLocations);

      // If after all refinement we ended up with less than 2 places error out..
      const placeCount: { [key: string]: number } =
        calculateNameCount(uniquePlaceLocations);
      //console.log('placeCount.length: ', Object.entries(placeCount).length);
      if (Object.entries(placeCount).length < 2) {
        showAlert('error', 'Fail: Less than 2 places found.');
        setToggleSearchProgessBar(false);
        return;
      }

      setToggleSearchProgessBar(false);
      showAlert('success', 'Search completed successfully!');
      setPlaceLocations(uniquePlaceLocations);
      setNameCount(placeCount);
    } catch (error) {
      console.error('Error during search:', error);
      showAlert('error', 'Search failed.');
      setToggleSearchProgessBar(false);
    }
  };

  const removeDuplicatePlaces = (places: PlaceLocation[]): PlaceLocation[] => {
    const uniquePlaces: PlaceLocation[] = [];
    const seenLocations = new Set<string>();

    places.forEach((place) => {
      const key = `${place.lat},${place.lng}`;
      if (!seenLocations.has(key)) {
        seenLocations.add(key);
        uniquePlaces.push(place);
      }
    });

    return uniquePlaces;
  };

  // Finds square box around circle for locationRestriction definition
  const calculateBoundingBox = (
    center: LatLng,
    radius: number
  ): google.maps.LatLngBounds => {
    const { lat, lng } = center;
    const radiusInKm = radius * 0.001; // Convert meters to kilometers

    // Earth's radius in kilometers
    const earthRadius = 6371.0;

    // Latitude delta
    const latDelta = radiusInKm / earthRadius;
    const latDeltaDeg = latDelta * (180 / Math.PI) * 0.9; // 10% smaller to closer match the circle

    // Longitude delta, compensate for shrinking earth radius in latitude
    const lngDeltaDeg =
      (radiusInKm / (earthRadius * Math.cos(lat * (Math.PI / 180)))) *
      (180 / Math.PI);

    // Define the bounding box
    const northeast = {
      lat: Math.min(lat + latDeltaDeg, 90),
      lng: Math.min(lng + lngDeltaDeg, 180),
    };

    const southwest = {
      lat: Math.max(lat - latDeltaDeg, -90),
      lng: Math.max(lng - lngDeltaDeg, -180),
    };

    return new google.maps.LatLngBounds(
      new google.maps.LatLng(southwest.lat, southwest.lng),
      new google.maps.LatLng(northeast.lat, northeast.lng)
    );
  };

  const calculateNameCount = (
    places: PlaceLocation[]
  ): { [key: string]: number } => {
    // Count occurrences of each place name
    const nameCount: { [key: string]: number } = {};
    places.forEach((place) => {
      const name = place.name;
      if (!nameCount[name]) {
        nameCount[name] = 0;
      }
      nameCount[name]++;
    });
    //console.log('nameCount: ', nameCount);
    return nameCount;
  };

  const levenshtein = (a: string, b: string): number => {
    const matrix = Array.from({ length: a.length }).map(() =>
      Array.from({ length: b.length }).map(() => 0)
    );

    for (let i = 0; i < a.length; i++) matrix[i][0] = i;

    for (let i = 0; i < b.length; i++) matrix[0][i] = i;

    for (let j = 0; j < b.length; j++)
      for (let i = 0; i < a.length; i++)
        matrix[i][j] = Math.min(
          (i == 0 ? 0 : matrix[i - 1][j]) + 1,
          (j == 0 ? 0 : matrix[i][j - 1]) + 1,
          (i == 0 || j == 0 ? 0 : matrix[i - 1][j - 1]) + (a[i] == b[j] ? 0 : 1)
        );

    return matrix[a.length - 1][b.length - 1];
  };

  const handleChange = (index: number, value: string) => {
    const newplaceNames = [...placeNames];
    newplaceNames[index] = value;
    setPlaceNames(newplaceNames);
  };

  const handleAddLocationInput = () => {
    if (placeNames.length >= 5) {
      showAlert('error', 'Reached max inputs.');
    } else {
      const newplaceNames = [...placeNames];
      newplaceNames[placeNames.length] = '';
      setPlaceNames(newplaceNames);
    }
  };

  const handleDeleteLocationInput = (index: number) => {
    if (placeNames.length <= 2) {
      showAlert('error', 'Reached minimum inputs.');
    } else {
      setPlaceNames((prevplaceNames) =>
        prevplaceNames.filter((_, i) => i !== index)
      );
    }
  };

  return (
    <Box display='flex' flexDirection='column' gap={2}>
      {Object.entries(nameCount).length > 0 && (
        <List
          dense={true}
          sx={{ border: '1px solid grey', borderRadius: '5px' }}
        >
          {Object.entries(nameCount).map(([place, count], index) => (
            <ListItem key={`nameCount - ${index}`}>
              <ListItemText primary={place} secondary={`Count: ${count}`} />
            </ListItem>
          ))}
        </List>
      )}
      {placeNames.map((placeName, index) => (
        <Box display='flex' flexDirection='row' gap={1} key={index}>
          <TextField
            label={`Place ${index + 1}`}
            value={placeName}
            onChange={(e) => handleChange(index, e.target.value)}
            variant='outlined'
            style={{ flexGrow: 1 }}
          />
          <IconButton
            aria-label='delete'
            size='small'
            color='error'
            style={{ flexGrow: 0 }}
            onClick={() => handleDeleteLocationInput(index)}
          >
            <Delete fontSize='small' />
          </IconButton>
        </Box>
      ))}
      <Button
        variant='outlined'
        color='secondary'
        onClick={handleAddLocationInput}
      >
        Add location...
      </Button>
      {toggleSearchProgessBar && <LinearProgress color='primary' />}
      <Button variant='contained' color='primary' onClick={handleSearch}>
        Search
      </Button>
    </Box>
  );
};

export default PlaceNamesInput;
