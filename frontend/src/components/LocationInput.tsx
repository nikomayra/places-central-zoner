import React, { useState } from 'react';
import { TextField, Button, Box, IconButton } from '@mui/material';
import { Delete } from '@mui/icons-material';

const LocationInput: React.FC = () => {
  const [locations, setLocations] = useState<string[]>(['', '']);
  const maxLocations = 5;
  const minLocations = 2;

  const handleChange = (index: number, value: string) => {
    const newLocations = [...locations];
    newLocations[index] = value;
    setLocations(newLocations);
  };

  const handleAddLocationInput = () => {
    if (locations.length >= maxLocations) {
      window.alert('Reached max inputs...');
    } else {
      const newLocations = [...locations];
      newLocations[locations.length] = '';
      setLocations(newLocations);
    }
  };

  const handleSearch = () => {
    if (locations.length < minLocations) {
      window.alert('Minimum 2 locations...');
    } else {
      // Logic to handle search
      console.log(locations);
    }
  };

  const handleDeleteLocationInput = (index: number) => {
    setLocations((prevLocations) =>
      prevLocations.filter((_, i) => i !== index)
    );
  };

  return (
    <Box display='flex' flexDirection='column' gap={2}>
      {locations.map((location, index) => (
        <Box display='flex' flexDirection='row' gap={1} key={index}>
          <TextField
            label={`Location ${index + 1}`}
            value={location}
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

export default LocationInput;
