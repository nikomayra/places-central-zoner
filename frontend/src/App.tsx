import { useState, useEffect, useMemo } from 'react';
import { Stack, Divider, Snackbar, Alert } from '@mui/material';
import PlaceNamesInput from './components/PlaceNamesInput';
import MapComponent from './components/MapComponent';
import HeaderInfoComponent from './components/HeaderInfoComponent';
import PreferenceComponent from './components/PreferenceComponent';
import AnalyzeComponent from './components/AnalyzeComponent';
import { APIProvider } from '@vis.gl/react-google-maps';
import useAlert from './hooks/useAlert';
import { PlaceLocation, LatLng, Cluster } from './interfaces/interfaces';

const App: React.FC = () => {
  const { alert, showAlert, hideAlert } = useAlert();
  const [searchCenter, setSearchCenter] = useState<LatLng>({
    lat: 47.608013,
    lng: -122.335167,
  });
  const [searchRadius, setSearchRadius] = useState<number>(5); // Default 5 mile radius
  const [placeLocations, setPlaceLocations] = useState<PlaceLocation[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [preference, setPreference] = useState<number>(0);

  const memoizedPlaceLocations = useMemo(
    () => placeLocations,
    [placeLocations]
  );
  const memoizedClusters = useMemo(() => clusters, [clusters]);

  useEffect(() => {
    setClusters([]);
  }, [placeLocations]);

  return (
    <Stack
      direction='column'
      divider={<Divider orientation='horizontal' flexItem />}
      spacing={2}
      m={3}
      mb={9}
    >
      <HeaderInfoComponent />
      <APIProvider
        apiKey={import.meta.env.VITE_APP_GOOGLE_MAPS_API_KEY as string}
      >
        <MapComponent
          placeLocations={memoizedPlaceLocations}
          searchCenter={searchCenter}
          setSearchCenter={setSearchCenter}
          searchRadius={searchRadius}
          setSearchRadius={setSearchRadius}
          clusters={memoizedClusters}
          showAlert={showAlert}
        />
        <PlaceNamesInput
          setPlaceLocations={setPlaceLocations}
          searchCenter={searchCenter}
          searchRadius={searchRadius}
          showAlert={showAlert}
        />
      </APIProvider>
      <PreferenceComponent
        preference={preference}
        setPreference={setPreference}
      />
      <AnalyzeComponent
        placeLocations={memoizedPlaceLocations}
        preference={preference}
        clusters={memoizedClusters}
        setClusters={setClusters}
        showAlert={showAlert}
      />
      {alert && (
        <Snackbar open={!!alert} autoHideDuration={5000} onClose={hideAlert}>
          <Alert
            onClose={hideAlert}
            severity={alert.severity}
            sx={{ width: '100%' }}
          >
            {alert.message}
          </Alert>
        </Snackbar>
      )}
    </Stack>
  );
};

export default App;
