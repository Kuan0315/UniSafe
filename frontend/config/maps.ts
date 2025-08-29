export const MAPS_CONFIG = {
  // Replace with your actual Google Maps API key
  GOOGLE_MAPS_API_KEY: 'AIzaSyCWVQznQKDcmgdKc6nWlEgqZlGkh0nKeFI',
  
  // Default map region (Malaysia - centered on KL area)
  DEFAULT_REGION: {
    latitude: 3.1390,
    longitude: 101.6869,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
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
