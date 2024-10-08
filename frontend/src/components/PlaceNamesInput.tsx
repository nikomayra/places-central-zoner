import React, { useState, useCallback, useEffect } from 'react';
import {
  TextField,
  Button,
  Box,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import { PlaceLocation, LatLng, Cluster } from '../interfaces/interfaces';
import axiosService from '../services/axiosService';

interface PlaceNamesInputProps {
  placeLocations: PlaceLocation[];
  setPlaceLocations: React.Dispatch<React.SetStateAction<PlaceLocation[]>>;
  setClusters: React.Dispatch<React.SetStateAction<Cluster[]>>;
  searchCenter: LatLng;
  searchRadius: number;
  showAlert: (
    severity: 'success' | 'info' | 'warning' | 'error',
    message: string
  ) => void;
  placeColors: { [key: string]: string };
}

const PlaceNamesInput: React.FC<PlaceNamesInputProps> = ({
  placeLocations,
  setPlaceLocations,
  setClusters,
  searchCenter,
  searchRadius,
  showAlert,
  placeColors,
}) => {
  const [toggleSearchProgessBar, setToggleSearchProgessBar] = useState(false);
  const [placeNames, setPlaceNames] = useState<string[]>(['', '']);
  const [nameCount, setNameCount] = useState<{ [key: string]: number }>({});
  const [requestCount, setRequestCount] = useState(0);
  const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(false);

  const levenshtein = useCallback((a: string, b: string): number => {
    // Create a (a.length + 1) x (b.length + 1) matrix
    const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
      Array.from({ length: b.length + 1 }, (_, j) =>
        i === 0 ? j : j === 0 ? i : 0
      )
    );

    // Fill in the matrix
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // Deletion
          matrix[i][j - 1] + 1, // Insertion
          matrix[i - 1][j - 1] + cost // Substitution
        );
      }
    }

    return matrix[a.length][b.length];
  }, []);

  useEffect(() => {
    const nameCounts: { [key: string]: number } = {};
    placeLocations.forEach((place) => {
      const name = place.name;
      if (!nameCounts[name]) {
        nameCounts[name] = 0;
      }
      nameCounts[name]++;
    });
    setNameCount(nameCounts);
  }, [placeLocations]);

  const verifyPlaceNames = useCallback((): boolean => {
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
        console.log(`${placeNames[i]}+${placeNames[j]}=${likeScore}`);
        if (likeScore <= 2) {
          // guessing at a threshold...
          return false;
        }
      }
    }
    return true;
  }, [levenshtein, placeNames]);

  // 5 req/min MAX, 2 MIN (separate google API calls for each place)
  const rateLimiter = useCallback(() => {
    setRequestCount((prevCount) => prevCount + 1);
    const limit = Math.floor(10 / Object.entries(nameCount).length);
    if (requestCount > limit) {
      setIsButtonDisabled(true);
      setRequestCount(0);
      setTimeout(() => setIsButtonDisabled(false), 60000);
    }
  }, [nameCount, requestCount]);

  const handleSearch = useCallback(async () => {
    try {
      setToggleSearchProgessBar(true);
      setPlaceLocations([]);

      const token = sessionStorage.getItem('token');
      if (!token) {
        console.error('No token found...');
        setToggleSearchProgessBar(false);
        return;
      }

      // Ensure placeNames aren't blank and are greater than 2 characters long
      if (placeNames.every((str) => str.length < 2)) {
        showAlert(
          'warning',
          'Place names must be greater than 2 characters long.'
        );
        setToggleSearchProgessBar(false);
        return;
      }

      //Try to prevent very similar names prior to API calls.
      if (!verifyPlaceNames()) {
        showAlert('error', 'Very similar names not allowed.');
        setToggleSearchProgessBar(false);
        return;
      }

      const placeLocationsServer: PlaceLocation[] =
        await axiosService.searchPlaces(
          placeNames,
          searchCenter,
          searchRadius,
          token
        );
      setClusters([]);
      rateLimiter();

      const uniqueNames = new Set(
        placeLocationsServer.map((place) => place.name)
      );

      if (uniqueNames.size < 2) {
        showAlert('error', 'Fail: Less than 2 places found.');
        setToggleSearchProgessBar(false);
        return;
      }

      setToggleSearchProgessBar(false);
      showAlert('success', 'Search completed successfully!');
      //console.log('Saved - placeLocations: ', placeLocations);
      setPlaceLocations(placeLocationsServer);
    } catch (error) {
      console.error('Error during search:', error);
      showAlert('error', 'Search failed.');
      setToggleSearchProgessBar(false);
    }
  }, [
    placeNames,
    rateLimiter,
    searchCenter,
    searchRadius,
    setClusters,
    setPlaceLocations,
    showAlert,
    verifyPlaceNames,
  ]);

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
              <ListItemIcon>
                <div
                  style={{
                    width: '15px',
                    height: '15px',
                    borderRadius: '50%',
                    backgroundColor: placeColors[place],
                    zIndex: 1000,
                  }}
                />
              </ListItemIcon>
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
      <Button
        variant='contained'
        color='primary'
        onClick={handleSearch}
        disabled={isButtonDisabled}
      >
        {isButtonDisabled
          ? 'Search Disabled\n\nToo many requests, wait a moment.'
          : 'Search'}
      </Button>
    </Box>
  );
};

export default PlaceNamesInput;
