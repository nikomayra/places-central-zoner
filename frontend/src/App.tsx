import { useState } from 'react';
import { Container, Box, Snackbar, Alert } from '@mui/material';
import PlaceNamesInput from './components/PlaceNamesInput';
import MapComponent from './components/MapComponent';
import { APIProvider } from '@vis.gl/react-google-maps';
import useAlert from './hooks/useAlert';

const App: React.FC = () => {
  const { alert, showAlert, hideAlert } = useAlert();
  const [placeNames, setPlaceNames] = useState<string[]>(['', '']);

  interface PlaceLocation {
    lat: number;
    lng: number;
  }
  const [placeLocations, setPlaceLocations] = useState<PlaceLocation[]>([]);

  return (
    <Container style={{ marginBottom: '50px' }}>
      <h2>Places Central-Zoner</h2>
      <p style={{ fontStyle: 'italic' }}>
        By <a href='https://nikomayra.github.io/'>@nikomayra</a>
      </p>
      <p style={{ fontStyle: 'italic' }}>
        1. Enter search center and adjust radius (miles).
        <br />
        2. Enter between 2 and 5 different locations.
        <br />
        3. Press "Search" to mark them in the search area.
        <br />
        4. Press "Analyze" to find central-zoned locations.
      </p>
      <Box display='flex' flexDirection='column' gap={2} mt={4}>
        <APIProvider
          apiKey={import.meta.env.VITE_APP_GOOGLE_MAPS_API_KEY as string}
        >
          <MapComponent placeLocations={placeLocations} />
        </APIProvider>
        <PlaceNamesInput
          placeNames={placeNames}
          setPlaceNames={setPlaceNames}
          showAlert={showAlert}
        />
      </Box>
      {alert && (
        <Snackbar open={!!alert} autoHideDuration={6000} onClose={hideAlert}>
          <Alert
            onClose={hideAlert}
            severity={alert.severity}
            sx={{ width: '100%' }}
          >
            {alert.message}
          </Alert>
        </Snackbar>
      )}
    </Container>
  );
};

export default App;
