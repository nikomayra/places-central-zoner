import React from 'react';
import { TextField, Button, Box, IconButton } from '@mui/material';
import { Delete } from '@mui/icons-material';
import axiosService from '../services/axiosService';

interface PlaceNamesInputProps {
  placeNames: string[];
  setPlaceNames: React.Dispatch<React.SetStateAction<string[]>>;
  showAlert: (
    severity: 'success' | 'info' | 'warning' | 'error',
    message: string
  ) => void;
}

const PlaceNamesInput: React.FC<PlaceNamesInputProps> = ({
  placeNames,
  setPlaceNames,
  showAlert,
}) => {
  const maxplaceNames = 5;
  const minplaceNames = 2;

  const handleChange = (index: number, value: string) => {
    const newplaceNames = [...placeNames];
    newplaceNames[index] = value;
    setPlaceNames(newplaceNames);
  };

  const handleAddLocationInput = () => {
    if (placeNames.length >= maxplaceNames) {
      showAlert('error', 'Reached max inputs...');
    } else {
      const newplaceNames = [...placeNames];
      newplaceNames[placeNames.length] = '';
      setPlaceNames(newplaceNames);
    }
  };

  const handleSearch = async () => {
    if (placeNames.length < minplaceNames) {
      showAlert('error', 'Minimum 2 locations...');
    } else {
      try {
        const placesLocations = await axiosService.searchPlaces(placeNames);
        showAlert('success', 'Search completed successfully!');
        console.log('placesLocations', placesLocations);
      } catch (error) {
        showAlert('error', 'Search failed.');
      }
    }
  };

  const handleDeleteLocationInput = (index: number) => {
    setPlaceNames((prevplaceNames) =>
      prevplaceNames.filter((_, i) => i !== index)
    );
  };

  return (
    <Box
      display='flex'
      flexDirection='column'
      gap={2}
      sx={{
        border: '3px solid #1976d2',
        padding: '15px',
        borderRadius: '10px',
      }}
    >
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
      <Button variant='contained' color='primary' onClick={handleSearch}>
        Search
      </Button>
    </Box>
  );
};

export default PlaceNamesInput;
