import React, { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';

const LocationInput: React.FC = () => {
  const [locations, setLocations] = useState<string[]>(['']);
  const maxInputs = 5;

  const handleChange = (index: number, value: string) => {
    const newLocations = [...locations];
    newLocations[index] = value;
    setLocations(newLocations);
  };

  const handleAddLocationInput = () => {
    if (locations.length >= maxInputs) {
      window.alert('Reached max inputs...');
    } else {
      const newLocations = [...locations];
      newLocations[locations.length] = '';
      setLocations(newLocations);
    }
  };

  const handleSearch = () => {
    // Logic to handle search
    console.log(locations);
  };

  return (
    <Box display='flex' flexDirection='column' gap={2}>
      {locations.map((location, index) => (
        <TextField
          key={index}
          label={`Location ${index + 1}`}
          value={location}
          onChange={(e) => handleChange(index, e.target.value)}
          variant='outlined'
        />
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
