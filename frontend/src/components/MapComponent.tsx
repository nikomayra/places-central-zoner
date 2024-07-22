// import React from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
} from '@vis.gl/react-google-maps';

const MapComponent = () => (
  <APIProvider apiKey={import.meta.env.VITE_APP_GOOGLE_MAPS_API_KEY as string}>
    <Map
      mapId={'154ceb3df9560bd1'}
      style={{ width: '100%', height: '400px' }}
      defaultCenter={{ lat: 22.54992, lng: 0 }}
      defaultZoom={5}
      gestureHandling={'greedy'}
      disableDefaultUI={true}
    />
    <AdvancedMarker
      position={{ lat: 20, lng: 10 }}
      title={'AdvancedMarker with customized pin.'}
      clickable={true}
      onClick={() => console.log('Marker Clicked!!')}
    >
      <Pin
        background={'#22ccff'}
        borderColor={'#1e89a1'}
        glyphColor={'#0f677a'}
      ></Pin>
    </AdvancedMarker>
  </APIProvider>
);

export default MapComponent;
