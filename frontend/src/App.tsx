import { useMemo, useState } from 'react';
import { Alert, Divider, Snackbar, Stack } from '@mui/material';
import { APIProvider } from '@vis.gl/react-google-maps';

import AnalyzeComponent from './components/AnalyzeComponent';
import HeaderInfoComponent from './components/HeaderInfoComponent';
import MapComponent from './components/MapComponent';
import PlaceNamesInput from './components/PlaceNamesInput';
import PreferenceComponent from './components/PreferenceComponent';
import useAlert from './hooks/useAlert';
import { Cluster, LatLng, PlaceLocation } from './interfaces/interfaces';


const App: React.FC<{ googleMapsApiKey: string }> = ({ googleMapsApiKey }) => {
  const { alert, showAlert, hideAlert } = useAlert();
  const [searchCenter, setSearchCenter] = useState<LatLng>({
    lat: 47.608013,
    lng: -122.335167,
  });
  const [searchRadius, setSearchRadius] = useState<number>(5);
  const [placeLocations, setPlaceLocations] = useState<PlaceLocation[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [preference, setPreference] = useState<number>(0.5);
  const [placeColors, setPlaceColors] = useState<{ [key: string]: string }>({});

  const memoizedPlaceLocations = useMemo(
    () => placeLocations,
    [placeLocations]
  );
  const memoizedClusters = useMemo(() => clusters, [clusters]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <Stack
        direction='column'
        divider={<Divider orientation='horizontal' flexItem />}
        spacing={2}
        m={3}
        mb={9}
        sx={{
          justifyContent: 'center',
          maxWidth: '800px',
          textAlign: 'center',
        }}
      >
        <HeaderInfoComponent />
        <APIProvider apiKey={googleMapsApiKey}>
          <MapComponent
            placeLocations={memoizedPlaceLocations}
            searchCenter={searchCenter}
            setSearchCenter={setSearchCenter}
            searchRadius={searchRadius}
            setSearchRadius={setSearchRadius}
            clusters={memoizedClusters}
            showAlert={showAlert}
            placeColors={placeColors}
            setPlaceColors={setPlaceColors}
          />
          <PlaceNamesInput
            placeLocations={placeLocations}
            setPlaceLocations={setPlaceLocations}
            setClusters={setClusters}
            searchCenter={searchCenter}
            searchRadius={searchRadius}
            showAlert={showAlert}
            placeColors={placeColors}
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
          <Snackbar open={!!alert} autoHideDuration={4000} onClose={hideAlert}>
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
    </div>
  );
};

export default App;
