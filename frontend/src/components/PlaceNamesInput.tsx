import React, { useState, useCallback } from 'react';
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
import { PlaceLocation, LatLng } from '../interfaces/interfaces';
import axiosService from '../services/axiosService';

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
  const [requestCount, setRequestCount] = useState(0);
  const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(false);

  const levenshtein = useCallback((a: string, b: string): number => {
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
  }, []);

  const calculateNameCount = useCallback(
    (places: PlaceLocation[]): { [key: string]: number } => {
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
    },
    []
  );

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
        //console.log(`${placeNames[i]}+${placeNames[j]}=${likeScore}`);
        if (likeScore <= 2) {
          // guessing at a threshold...
          return false;
        }
      }
    }
    return true;
  }, [levenshtein, placeNames]);

  const handleSearch = useCallback(async () => {
    try {
      //Try to prevent very similar names prior to API calls.
      if (!verifyPlaceNames()) {
        showAlert('error', 'Very similar names not allowed.');
        return;
      }

      // Rate limiting for search button
      if (isButtonDisabled) {
        showAlert('error', 'Too many requests. Please wait a moment.');
        return;
      }

      setRequestCount((prevCount) => prevCount + 1);

      // 5 requests/min limit
      if (requestCount >= 5) {
        setIsButtonDisabled(true);
        setRequestCount(0);
        setTimeout(() => setIsButtonDisabled(false), 60000);
      }

      setToggleSearchProgessBar(true);
      setPlaceLocations([]);
      const placeLocations: PlaceLocation[] = await axiosService.searchPlaces(
        placeNames,
        searchCenter,
        searchRadius
      );

      // If we ended up with less than 2 places error out..
      const placeCount: { [key: string]: number } =
        calculateNameCount(placeLocations);

      if (Object.entries(placeCount).length < 2) {
        showAlert('error', 'Fail: Less than 2 places found.');
        setToggleSearchProgessBar(false);
        return;
      }

      setToggleSearchProgessBar(false);
      showAlert('success', 'Search completed successfully!');
      console.log('Saved - placeLocations: ', placeLocations);
      setPlaceLocations(placeLocations);
      setNameCount(placeCount);
    } catch (error) {
      console.error('Error during search:', error);
      showAlert('error', 'Search failed.');
      setToggleSearchProgessBar(false);
    }
  }, [
    calculateNameCount,
    isButtonDisabled,
    placeNames,
    requestCount,
    searchCenter,
    searchRadius,
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
        Search
      </Button>
    </Box>
  );
};

export default PlaceNamesInput;
