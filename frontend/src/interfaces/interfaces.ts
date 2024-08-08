export interface LatLng {
  lat: number;
  lng: number;
}

export interface PlaceLocation {
  name: string;
  lat: number;
  lng: number;
}

export interface Cluster {
  center: LatLng;
  cluster: number;
  places: PlaceLocation[];
  wcss: number;
  radius: number;
}
