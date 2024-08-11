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

/* export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: Date;
  id_token?: string;
} */

export interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
  userName: string | null;
  tokenExp: number | null;
}
