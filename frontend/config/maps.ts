import Constants from 'expo-constants';

export const MAPS_CONFIG = {
  GOOGLE_MAPS_API_KEY: Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
  DEFAULT_REGION: {
    latitude: 3.1201,
    longitude: 101.6544,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  },
  
  // Map styling options
  MAP_STYLE: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
};