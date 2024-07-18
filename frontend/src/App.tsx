import React from 'react';
import { Container, Box } from '@mui/material';
import LocationInput from './components/LocationInput';
import MapComponent from './components/MapComponent';

const HomePage: React.FC = () => {
  return (
    <Container>
      <Box display='flex' flexDirection='column' gap={4} mt={4}>
        <LocationInput />
        <MapComponent />
      </Box>
    </Container>
  );
};

export default HomePage;
