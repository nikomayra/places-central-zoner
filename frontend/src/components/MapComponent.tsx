import React, { useEffect, useRef } from 'react';
import {
  Map,
  AdvancedMarker,
  Pin,
  useMap,
  //useMapsLibrary,
} from '@vis.gl/react-google-maps';

type PlaceLocation = {
  lat: number;
  lng: number;
};

interface MapComponentProps {
  placeLocations: PlaceLocation[];
  searchCenter: PlaceLocation;
  searchRadius: number; // in meters
}
// 1609.34 meters = miles
const MapComponent: React.FC<MapComponentProps> = ({
  placeLocations,
  searchCenter,
  searchRadius,
}) => {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);

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
        radius: searchRadius,
      });
      circleRef.current = circle;
    } else {
      circleRef.current.setCenter({
        lat: searchCenter.lat,
        lng: searchCenter.lng,
      });
      circleRef.current.setRadius(searchRadius);
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
    <Map
      mapId={'154ceb3df9560bd1'}
      style={{
        //position: 'fixed !important',
        width: '100%',
        //height:
        aspectRatio: '1/1',
        border: '3px solid #1976d2',
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
  );
};

export default MapComponent;
