import React from 'react';
import { TextField, Button, Box, IconButton } from '@mui/material';
import { Delete } from '@mui/icons-material';

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
    </Box>
  );
};

export default PlaceNamesInput;
