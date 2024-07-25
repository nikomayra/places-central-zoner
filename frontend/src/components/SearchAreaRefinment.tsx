//import { useState } from 'react';
import { Slider, Box, Tooltip, TextField } from '@mui/material';
import { TrackChanges } from '@mui/icons-material';

interface SearchAreaRefinmentProps {
  searchCenterName: string;
  setSearchCenterName: React.Dispatch<React.SetStateAction<string>>;
  searchRadius: number;
  setRadius: React.Dispatch<React.SetStateAction<number>>;
}

const SearchAreaRefinment: React.FC<SearchAreaRefinmentProps> = ({
  searchCenterName,
  setSearchCenterName,
  searchRadius,
  setRadius,
}) => {
  return (
    <Box
      display='flex'
      flexDirection='row'
      gap={2}
      //style={{ border: '1px solid grey', borderRadius: '6px', padding: '2px' }}
    >
      <TextField
        label={`Search Center`}
        value={searchCenterName}
        onChange={(e) => setSearchCenterName(e.target.value)}
        variant='outlined'
        style={{ flexGrow: 0.3 }}
      />
      <Box
        display='flex'
        flexDirection='row'
        gap={1}
        style={{ flexGrow: 1, alignItems: 'center' }}
      >
        <Tooltip title='Search Radius (miles)'>
          <TrackChanges style={{ flexGrow: 0 }} />
        </Tooltip>
        <Slider
          aria-label='Search Radius'
          value={searchRadius}
          onChange={(_, value) => setRadius(value as number)}
          valueLabelDisplay='auto'
          shiftStep={5}
          step={2}
          marks={false}
          min={1}
          max={26}
          style={{ flexGrow: 1 }}
        />
      </Box>
    </Box>
  );
};

export default SearchAreaRefinment;
