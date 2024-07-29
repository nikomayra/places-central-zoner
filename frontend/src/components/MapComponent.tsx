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
  lat: number;
  lng: number;
};

interface MapComponentProps {
  placeLocations: PlaceLocation[];
}
// 1609.34 meters = miles
const MapComponent: React.FC<MapComponentProps> = ({ placeLocations }) => {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);
  const [searchCenter, setSearchCenter] = useState<PlaceLocation>({
    lat: 47.608013,
    lng: -122.335167,
  });
  const [searchRadius, setRadius] = useState<number>(5); // Default 5 mile radius
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const places = useMapsLibrary('places');

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
        console.log('PLACE CHANGED...');
        const place = autocompleteRef.current?.getPlace();
        if (place?.geometry?.location) {
          const location = place.geometry.location;
          setSearchCenter({ lat: location.lat(), lng: location.lng() });
        }
      });
    }
  }, [places]);

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

  /* SANTIAGO, CHILE BOX
    east: -33.6546303
    north: -70.8298707
    south: -70.8394937
    west: -33.3328737
   */

  return (
    <Box
      display='flex'
      flexDirection='column'
      gap={2}
      sx={{
        border: '3px solid #1976d2',
        padding: '15px',
        borderRadius: '10px',
      }}
    >
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
            position={{ lat: loc.lat, lng: loc.lng }}
            title={'AdvancedMarker with customized pin.'}
            clickable={true}
            onClick={() => console.log('Marker Clicked!!')}
          >
            <Pin
              background={'#22ccff'}
              borderColor={'#1976d2'}
              glyphColor={'#0f677a'}
            ></Pin>
          </AdvancedMarker>
        ))}
      </Map>
    </Box>
  );
};

export default MapComponent;
