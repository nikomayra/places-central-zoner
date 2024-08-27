import { useState, useEffect, useMemo } from 'react';
import {
  Stack,
  Divider,
  Snackbar,
  Alert,
  Button,
  //CircularProgress,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import PlaceNamesInput from './components/PlaceNamesInput';
import MapComponent from './components/MapComponent';
import HeaderInfoComponent from './components/HeaderInfoComponent';
import PreferenceComponent from './components/PreferenceComponent';
import AnalyzeComponent from './components/AnalyzeComponent';
import { APIProvider } from '@vis.gl/react-google-maps';
import useAlert from './hooks/useAlert';
import useAuth from './hooks/useAuth';
import SessionExpiryModal from './components/SessionExpiryModal';
import { PlaceLocation, LatLng, Cluster } from './interfaces/interfaces';
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import axiosService from './services/axiosService';
//import axiosService from './services/axiosService';

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <SessionExpiryModal />
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
        {/* Conditionally render the app content based on authentication */}
        {isAuthenticated && <GoogleLogoutButton />}
        {isAuthenticated ? <AuthenticatedApp /> : <GoogleLoginButton />}
      </Stack>
    </div>
  );
};

// Main app content
const AuthenticatedApp: React.FC = () => {
  const { alert, showAlert, hideAlert } = useAlert();
  const [searchCenter, setSearchCenter] = useState<LatLng>({
    lat: 47.608013,
    lng: -122.335167,
  });
  const [searchRadius, setSearchRadius] = useState<number>(5); // Default 5 mile radius
  const [placeLocations, setPlaceLocations] = useState<PlaceLocation[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [preference, setPreference] = useState<number>(0);
  const [placeColors, setPlaceColors] = useState<{ [key: string]: string }>({});

  const memoizedPlaceLocations = useMemo(
    () => placeLocations,
    [placeLocations]
  );
  const memoizedClusters = useMemo(() => clusters, [clusters]);

  useEffect(() => {
    setClusters([]);
  }, [placeLocations]);

  useEffect(() => {
    // loadLatestPlaces();
    // loadLatestClusters();
    loadLatestState();
  }, []);

  const loadLatestState = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (token) {
        const {
          //clusters_state,
          searched_places_state,
          center_state,
          radius_state,
        } = await axiosService.latestState(token);
        setPlaceLocations(searched_places_state);
        //setClusters(clusters_state);
        setSearchCenter(center_state);
        setSearchRadius(radius_state);
      } else {
        console.error("Token not found, can't load last state.");
      }
    } catch (error) {
      console.error('Failed to load state from server.');
    }
  };

  return (
    <>
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
          placeColors={placeColors}
          setPlaceColors={setPlaceColors}
        />
        <PlaceNamesInput
          placeLocations={placeLocations}
          setPlaceLocations={setPlaceLocations}
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
    </>
  );
};

// Component for handling Google login
const GoogleLoginButton: React.FC = () => {
  const { login } = useAuth();

  return (
    <div
      style={{ marginLeft: 'auto', marginRight: 'auto', textAlign: 'center' }}
    >
      <h3>Sign in to access the App</h3>
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          //console.log('Credential Response');
          credentialResponse.credential
            ? login(credentialResponse.credential)
            : console.error('ID_TOKEN returned undefined...');
        }}
        onError={() => {
          console.error('Login Failed');
        }}
        theme={'filled_blue'}
        size={'large'}
        text={'signin_with'}
        width={'300'}
        //useOneTap
        //auto_select
      />
    </div>
  );
};

// Component for handling Google logout
const GoogleLogoutButton: React.FC = () => {
  const { logout, userName } = useAuth();

  const handleLogout = () => {
    googleLogout();
    const token = sessionStorage.getItem('token');
    if (!token) {
      console.error('No token found in session when trying to loggout!');
      return;
    }
    logout(token);
  };

  return (
    <div
      style={{
        marginLeft: 'auto',
        marginRight: 'auto',
        textAlign: 'center',
        marginTop: '0',
      }}
    >
      <h4>{`Logged in as ${userName}`}</h4>
      <Button
        onClick={handleLogout}
        color='error'
        variant='outlined'
        startIcon={<GoogleIcon />}
        sx={{ width: '300px' }}
      >
        Log-out
      </Button>
    </div>
  );
};

export default App;
