import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Snackbar,
  Alert,
  Button,
  LinearProgress,
} from '@mui/material';
import PlaceNamesInput from './components/PlaceNamesInput';
import MapComponent from './components/MapComponent';
//import AnalyzeComponent from './components/AnalyzeComponent';
import { APIProvider } from '@vis.gl/react-google-maps';
import useAlert from './hooks/useAlert';
import axiosService from './services/axiosService';

interface PlaceLocation {
  name: string;
  lat: number;
  lng: number;
}

interface LatLng {
  lat: number;
  lng: number;
}

interface Cluster {
  center: LatLng;
  cluster: number;
  places: PlaceLocation[];
  wcss: number;
}

const App: React.FC = () => {
  const { alert, showAlert, hideAlert } = useAlert();
  const [searchCenter, setSearchCenter] = useState<LatLng>({
    lat: 47.608013,
    lng: -122.335167,
  });
  const [searchRadius, setSearchRadius] = useState<number>(5); // Default 5 mile radius
  const [placeLocations, setPlaceLocations] = useState<PlaceLocation[]>([]);
  const [toggleAnalyzeProgressBar, setToggleAnalyzeProgressBar] =
    useState(false);
  const [clusters, setClusters] = useState<Cluster[]>([]);

  useEffect(() => {
    setClusters([]);
  }, [placeLocations]);

  const handleAnalyze = async () => {
    try {
      setToggleAnalyzeProgressBar(true);
      const clusterResults = await axiosService.analyzePlaces(placeLocations);
      console.log('Clusters: ', clusterResults);
      setClusters(clusterResults);
      setToggleAnalyzeProgressBar(false);
    } catch (error) {
      showAlert('error', 'Analyze failed.');
      setToggleAnalyzeProgressBar(false);
    }
  };

  return (
    <Container style={{ marginBottom: '50px' }}>
      {/* <div>
        <h2>Places Central-Zoner</h2>
        <p style={{ fontStyle: 'italic' }}>
          By <a href='https://nikomayra.github.io/'>@nikomayra</a>
        </p>
        <p style={{ fontStyle: 'italic' }}>
          This app helps find find geographical areas which are minimally near
          at least 1 of each searched place. When I was living out of my car the
          original need was to find ideal areas to situate myself such that I
          had access to a multitude of stores. An example was where to locate
          myself such that I was close to an LA Fitness, Chipotle & Starbucks.
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
      </div> */}
      <Box display='flex' flexDirection='column' gap={2} mt={4}>
        <Container
          sx={{
            border: '3px solid grey',
            padding: '15px',
            borderRadius: '5px',
          }}
        >
          <APIProvider
            apiKey={import.meta.env.VITE_APP_GOOGLE_MAPS_API_KEY as string}
          >
            <MapComponent
              placeLocations={placeLocations}
              searchCenter={searchCenter}
              setSearchCenter={setSearchCenter}
              searchRadius={searchRadius}
              setSearchRadius={setSearchRadius}
              clusters={clusters}
            />
            <br />
            <Box display='flex' flexDirection='column' gap={2}>
              <PlaceNamesInput
                setPlaceLocations={setPlaceLocations}
                searchCenter={searchCenter}
                searchRadius={searchRadius}
                showAlert={showAlert}
              />
            </Box>
          </APIProvider>
        </Container>
        <Container
          sx={{
            border: '3px solid grey',
            padding: '15px',
            borderRadius: '5px',
          }}
        >
          <Box display='flex' flexDirection='column' gap={2}>
            {toggleAnalyzeProgressBar && <LinearProgress color='warning' />}
            <Button variant='contained' color='warning' onClick={handleAnalyze}>
              Analyze
            </Button>
          </Box>
        </Container>
      </Box>
      {alert && (
        <Snackbar open={!!alert} autoHideDuration={3000} onClose={hideAlert}>
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
