import { useState } from 'react';
import * as Location from 'expo-location';

export default function useLocation() {
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>('Getting address...');

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      setLocationAddress('Getting address...');
      const reverseGeocodedAddress = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocodedAddress.length > 0) {
        const address = reverseGeocodedAddress[0];
        const addressParts = [
          address.name,
          address.street,
          address.city,
          address.region,
          address.postalCode,
          address.country,
        ].filter((part) => part && part.trim() !== '');

        setLocationAddress(addressParts.join(', ') || 'Address not available');
      } else {
        setLocationAddress('Address not available');
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setLocationAddress('Error getting address');
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation(location);
        await reverseGeocode(location.coords.latitude, location.coords.longitude);
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  return { currentLocation, locationAddress, reverseGeocode, requestLocationPermission };
}