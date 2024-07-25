import { useState } from 'react';
import { Container, Box } from '@mui/material';
import PlaceNamesInput from './components/PlaceNamesInput';
import MapComponent from './components/MapComponent';
import SearchAreaRefinment from './components/SearchAreaRefinment';
import { APIProvider } from '@vis.gl/react-google-maps';

const App: React.FC = () => {
  const [placeNames, setPlaceNames] = useState<string[]>(['', '']);
  const [searchCenterName, setSearchCenterName] = useState<string>('');
  const [searchRadius, setRadius] = useState<number>(5);

  interface PlaceLocation {
    lat: number;
    lng: number;
  }
  const [placeLocations, setPlaceLocations] = useState<PlaceLocation[]>([]);
  const [searchCenter, setSearchCenter] = useState<PlaceLocation>({
    lat: 47.608013,
    lng: -122.335167,
  });

  return (
    <Container>
      <Box display='flex' flexDirection='column' gap={4} mt={4}>
        <SearchAreaRefinment
          searchCenterName={searchCenterName}
          setSearchCenterName={setSearchCenterName}
          searchRadius={searchRadius}
          setRadius={setRadius}
        />
        <PlaceNamesInput
          placeNames={placeNames}
          setPlaceNames={setPlaceNames}
        />
        <APIProvider
          apiKey={import.meta.env.VITE_APP_GOOGLE_MAPS_API_KEY as string}
        >
          <MapComponent
            placeLocations={placeLocations}
            searchCenter={searchCenter}
            searchRadius={searchRadius * 1609.34} // miles to meters
          />
        </APIProvider>
      </Box>
    </Container>
  );
};

export default App;
