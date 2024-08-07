import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Snackbar,
  Alert,
  Button,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
  ListItem,
  ListItemText,
} from '@mui/material';
import PlaceNamesInput from './components/PlaceNamesInput';
import MapComponent from './components/MapComponent';
//import AnalyzeComponent from './components/AnalyzeComponent';
import { APIProvider } from '@vis.gl/react-google-maps';
import useAlert from './hooks/useAlert';
import axiosService from './services/axiosService';
import { FixedSizeList, ListChildComponentProps } from 'react-window';

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
  radius: number;
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
  const [preference, setPreference] = useState<number>(0);

  useEffect(() => {
    setClusters([]);
  }, [placeLocations]);

  const handlePreference = (
    _event: React.MouseEvent<HTMLElement>,
    newPreference: number | null
  ) => {
    if (newPreference !== null) {
      setPreference(newPreference);
    }
  };

  const handleAnalyze = async () => {
    try {
      setToggleAnalyzeProgressBar(true);
      const clusterResults = await axiosService.analyzePlaces(
        placeLocations,
        preference
      );
      //console.log('Clusters: ', clusterResults);
      setClusters(clusterResults);
      setToggleAnalyzeProgressBar(false);
    } catch (error) {
      showAlert('error', 'Analyze failed.');
      setToggleAnalyzeProgressBar(false);
    }
  };

  const clusterList = (props: ListChildComponentProps) => {
    const { index, style } = props;

    return (
      <ListItem style={style} key={index} component='div' disablePadding>
        <ListItemText
          key={`Clusters - ${index}`}
          primary={`Central Zone ${index + 1}`}
          secondary={`Radius (mi.): ${(
            clusters[index].radius / 1609.34
          ).toPrecision(3)}, WCSS Score: ${clusters[index].wcss.toPrecision(
            3
          )}`}
        />
      </ListItem>
    );
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
          <Box display='flex' flexDirection='column' gap={1}>
            {Object.entries(clusters).length > 0 && (
                <span style={{ fontWeight: 'bold' }}>Analysis Results:</span>
              ) && (
                <FixedSizeList
                  height={150}
                  width={'100%'}
                  itemSize={46}
                  itemCount={clusters.length}
                  overscanCount={5}
                  style={{ border: '1px solid grey', borderRadius: '5px' }}
                >
                  {clusterList}
                </FixedSizeList>
              )}
            {toggleAnalyzeProgressBar && <LinearProgress color='warning' />}
            <h4 style={{ margin: '0', textAlign: 'center' }}>
              Quality Preference
            </h4>
            <p
              style={{
                margin: '0',
                textAlign: 'center',
                fontStyle: 'italic',
                fontSize: 'small',
              }}
            >
              More quality = less quantity and visa-versa
            </p>
            <ToggleButtonGroup
              value={preference}
              exclusive
              onChange={handlePreference}
              aria-label='user preference'
              color='warning'
              size='small'
              sx={{ justifyContent: 'center' }}
              fullWidth={true}
            >
              <ToggleButton value={-2} aria-label='-2'>
                <h3 style={{ margin: '0' }}>--</h3>
              </ToggleButton>
              <ToggleButton value={-1} aria-label='-1'>
                <h3 style={{ margin: '0' }}>-</h3>
              </ToggleButton>
              <ToggleButton value={0} aria-label='0'>
                <h3 style={{ margin: '0' }}>o</h3>
              </ToggleButton>
              <ToggleButton value={1} aria-label='1'>
                <h3 style={{ margin: '0' }}>+</h3>
              </ToggleButton>
              <ToggleButton value={2} aria-label='2'>
                <h3 style={{ margin: '0' }}>++</h3>
              </ToggleButton>
            </ToggleButtonGroup>
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
