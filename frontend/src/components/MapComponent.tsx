import React, { useEffect, useRef, useState } from 'react';
import { Slider, Box, Tooltip, TextField } from '@mui/material';
import { TrackChanges } from '@mui/icons-material';
import {
  Map,
  useMap,
  AdvancedMarker,
  //Pin,
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
  radius: number;
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
  const circlesRef = useRef<google.maps.Circle[]>([]);

  const predefinedColors = [
    'hsl(0, 80%, 50%)', // Red
    'hsl(30, 80%, 50%)', // Orange
    'hsl(60, 80%, 50%)', // Yellow
    'hsl(120, 80%, 50%)', // Green
    'hsl(180, 80%, 50%)', // Cyan
    'hsl(240, 80%, 50%)', // Blue
    'hsl(300, 80%, 50%)', // Purple
    //'hsl(360, 70%, 50%)', // Red again to show it's a loop
    // Add more colors if needed
  ];

  const getLighterColor = (color: string, lightness: number): string => {
    if (!color) return `hsl(0, 0%, 0%)`; // Default to black if color is undefined
    const hslColor = `hsl(${color.slice(4, -6)}, ${lightness}%)`;
    //console.log('hslColor: ', hslColor);
    return hslColor;
  };

  const getRandomColor = (() => {
    // Shuffle function to randomize colors
    const shuffleArray = (array: string[]): string[] => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };

    let shuffledColors = shuffleArray([...predefinedColors]);
    let index = 0;

    return (): string => {
      if (index >= shuffledColors.length) {
        shuffledColors = shuffleArray([...predefinedColors]);
        index = 0;
      }
      return shuffledColors[index++];
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
        strokeOpacity: 0.6,
        strokeColor: '#ffffff',
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

  useEffect(() => {
    if (!map) return;

    // Clear existing circles
    circlesRef.current.forEach((circle) => circle.setMap(null));
    circlesRef.current = [];

    // Add new circles
    clusters.forEach((cluster) => {
      const circle = new google.maps.Circle({
        map,
        fillOpacity: 0.2,
        fillColor: '#f50057',
        strokeOpacity: 1,
        strokeColor: '#f50057',
        strokeWeight: 3,
        center: { lat: cluster.center.lat, lng: cluster.center.lng },
        radius: cluster.radius,
        zIndex: 1000,
      });

      circlesRef.current.push(circle);
    });

    // Cleanup function to remove circles when the component unmounts
    return () => {
      circlesRef.current.forEach((circle) => circle.setMap(null));
      circlesRef.current = [];
    };
  }, [map, clusters]);

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
          <Tooltip title='Search Area Bias (miles)'>
            <TrackChanges style={{ flexGrow: 0 }} />
          </Tooltip>
          <Slider
            aria-label='Search Area'
            value={searchRadius}
            onChange={(_, value) => setSearchRadius(value as number)}
            valueLabelDisplay='auto'
            shiftStep={1}
            step={1}
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
        defaultBounds={{
          east: -33.6546303,
          north: -70.8298707,
          south: -70.8394937,
          west: -33.3328737,
        }}
        //center={searchCenter}
        //defaultZoom={10}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        zoomControl={false}
        streetViewControl={false}
        fullscreenControl={false}
        mapTypeControl={false}
        mapTypeId={'hybrid'}
      >
        {placeLocations.map((loc) => (
          <AdvancedMarker
            key={loc.name + loc.lat + loc.lng}
            position={{ lat: loc.lat, lng: loc.lng }}
            title={loc.name + ':\n\n lat: ' + loc.lat + ' lng: ' + loc.lng}
            zIndex={1}
          >
            <div
              style={{
                width: '15px',
                height: '15px',
                borderRadius: '50%',
                backgroundColor: placeColors[loc.name],
                border: `2px solid ${getLighterColor(
                  placeColors[loc.name],
                  20
                )}`,
                opacity: clusters.length > 0 ? 0.6 : 1,
                zIndex: '1',
              }}
            />
            {/* <Pin
              background={getLighterColor(
                placeColors[loc.name],
                clusters.length > 0 ? 80 : 50
              )}
              borderColor={'#080808'}
              glyphColor={'#080808'}
              scale={0.7}
            ></Pin> */}
          </AdvancedMarker>
        ))}
        {clusters.map((cluster, index) => (
          <AdvancedMarker
            key={`Zone - ${index}`}
            position={{ lat: cluster.center.lat, lng: cluster.center.lng }}
            zIndex={1000}
            //style={{ transform: 'translate(-50%, -100%)' }}
          >
            <svg
              viewBox='0 0 100 100'
              xmlns='http://www.w3.org/2000/svg'
              style={{ width: '15px', height: '15px' }}
            >
              <polygon
                points='50,10 90,50 50,90 10,50'
                fill='#f50057'
                stroke='#080808'
                strokeWidth='2'
              />
            </svg>
          </AdvancedMarker>
        ))}
      </Map>
    </Box>
  );
};

export default MapComponent;
