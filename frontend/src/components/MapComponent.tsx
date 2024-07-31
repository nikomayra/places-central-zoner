import React, { useEffect, useRef, useState } from 'react';
import { Slider, Box, Tooltip, TextField } from '@mui/material';
import { TrackChanges } from '@mui/icons-material';
import {
  Map,
  AdvancedMarker,
  Pin,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';

type PlaceLocation = {
  name: string;
  lat: number;
  lng: number;
};

interface GeoLocation {
  lat: number;
  lng: number;
}

interface Cluster {
  center: GeoLocation;
  cluster: number;
  places: PlaceLocation[];
  wcss: number;
}

interface MapComponentProps {
  placeLocations: PlaceLocation[];
  searchCenter: GeoLocation;
  setSearchCenter: React.Dispatch<React.SetStateAction<GeoLocation>>;
  searchRadius: number;
  setSearchRadius: React.Dispatch<React.SetStateAction<number>>;
  clusters: Cluster[];
}
// 1609.34 meters = miles
const MapComponent: React.FC<MapComponentProps> = ({
  placeLocations,
  searchCenter,
  setSearchCenter,
  searchRadius,
  setSearchRadius,
  clusters,
}) => {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const places = useMapsLibrary('places');
  const [placeColors, setPlaceColors] = useState<{ [key: string]: string }>({});

  // Utility function to convert HSL color to HSLA with a given alpha
  const getColorWithAlpha = (color: string, alpha: number): string => {
    if (!color) return `hsla(0, 0%, 0%, ${alpha})`; // Default to black if color is undefined
    return color.replace('hsl', 'hsla').replace(')', `, ${alpha})`);
  };

  const renderClusterPin = () => (
    <svg
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <circle cx='12' cy='12' r='10' fill='red' />
    </svg>
  );

  const getRandomColor = (() => {
    let lastHue = Math.random() * 360;

    return (): string => {
      const hueDifference = 137; // Using a golden angle to get distinct hues
      lastHue = (lastHue + hueDifference) % 360;
      const saturation = 70; // Keep saturation constant
      const lightness = 50; // Keep lightness constant

      return `hsl(${lastHue}, ${saturation}%, ${lightness}%)`;
    };
  })();

  // Autocomplete useEffect for dynamically changing map center.
  useEffect(() => {
    if (!places || !inputRef.current) return;

    // Initialize autocomplete only if it's not already initialized
    if (!autocompleteRef.current) {
      const options = {
        fields: ['geometry', 'name'],
        types: ['(cities)'],
      };

      autocompleteRef.current = new google.maps.places.Autocomplete(
        inputRef.current,
        options
      );

      autocompleteRef.current.addListener('place_changed', () => {
        //console.log('PLACE CHANGED...');
        const place = autocompleteRef.current?.getPlace();
        if (place?.geometry?.location) {
          const location = place.geometry.location;
          setSearchCenter({
            lat: location.lat(),
            lng: location.lng(),
          });
        }
      });
    }
  }, [places, setSearchCenter]);

  // Find & set the bounds for the 'square' map given a circle search area
  useEffect(() => {
    if (!map || !searchCenter || !searchRadius) return;

    if (!circleRef.current) {
      const circle = new google.maps.Circle({
        map,
        fillOpacity: 0,
        strokeOpacity: 0.5,
        strokeColor: '#000000',
        center: { lat: searchCenter.lat, lng: searchCenter.lng },
        radius: searchRadius * 1609.34,
      });
      circleRef.current = circle;
    } else {
      circleRef.current.setCenter({
        lat: searchCenter.lat,
        lng: searchCenter.lng,
      });
      circleRef.current.setRadius(searchRadius * 1609.34);
    }

    const bounds = circleRef.current.getBounds();
    if (bounds) {
      map.fitBounds(bounds, 0); // 0 padding
    }

    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
    };
  }, [map, searchCenter, searchRadius]);

  // Handle window resize to adjust map bounds
  useEffect(() => {
    if (!map) return;

    const handleResize = () => {
      if (circleRef.current) {
        const bounds = circleRef.current.getBounds();
        if (bounds) {
          map.fitBounds(bounds, 0); // 0 padding
        }
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);

  // Define pin colors for markers, same color for each place type
  useEffect(() => {
    const newPlaceColors: { [key: string]: string } = { ...placeColors };

    placeLocations.forEach((loc) => {
      if (!newPlaceColors[loc.name]) {
        newPlaceColors[loc.name] = getRandomColor();
      }
    });

    // Update placeColors only if there are new entries
    if (
      Object.keys(newPlaceColors).length !== Object.keys(placeColors).length
    ) {
      setPlaceColors(newPlaceColors);
    }
  }, [placeLocations, placeColors, getRandomColor]);

  return (
    <Box display='flex' flexDirection='column' gap={2}>
      <Box display='flex' flexDirection='row' gap={2}>
        <TextField
          inputRef={inputRef}
          label={`Search Center`}
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
            onChange={(_, value) => setSearchRadius(value as number)}
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
      <Map
        mapId={'154ceb3df9560bd1'}
        style={{
          width: '100%',
          aspectRatio: '1/1',
        }}
        //defaultCenter={{ lat: 47.608013, lng: -122.335167 }}
        //center={{lat: searchCenter.lat, lng: searchCenter.lon }}
        defaultBounds={{
          east: -33.6546303,
          north: -70.8298707,
          south: -70.8394937,
          west: -33.3328737,
        }}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        zoomControl={false}
        streetViewControl={false}
        fullscreenControl={false}
        mapTypeControl={false}
      >
        {placeLocations.map((loc) => (
          <AdvancedMarker
            key={loc.name + loc.lat + loc.lng}
            position={{ lat: loc.lat, lng: loc.lng }}
            title={loc.name}
          >
            <Pin
              background={getColorWithAlpha(
                placeColors[loc.name] || 'hsl(0, 0%, 0%)',
                clusters.length > 0 ? 0.3 : 1
              )}
              borderColor={'#080808'}
              glyphColor={'#080808'}
              scale={0.7}
            ></Pin>
          </AdvancedMarker>
        ))}
        {clusters.map((cluster, index) => (
          <AdvancedMarker
            key={`cluster-${index}`}
            position={{ lat: cluster.center.lat, lng: cluster.center.lng }}
            title={`Cluster center: ${cluster.center.lat}, ${cluster.center.lng}`}
          >
            {renderClusterPin()}
          </AdvancedMarker>
        ))}
      </Map>
    </Box>
  );
};

export default MapComponent;
