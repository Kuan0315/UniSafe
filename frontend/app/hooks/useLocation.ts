import { useState, useEffect } from 'react';
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

    const startLocationWatching = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                // Start watching location for continuous updates
                const locationSubscription = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.High,
                        timeInterval: 5000, // Update every 5 seconds
                        distanceInterval: 10, // Update every 10 meters
                    },
                    (location) => {
                        setCurrentLocation(location);
                        reverseGeocode(location.coords.latitude, location.coords.longitude);
                    }
                );

                // Get initial location
                const initialLocation = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High
                });
                setCurrentLocation(initialLocation);
                await reverseGeocode(initialLocation.coords.latitude, initialLocation.coords.longitude);

                // Return the subscription so it can be cleaned up if needed
                return locationSubscription;
            }
        } catch (error) {
            console.error('Error starting location watching:', error);
        }
        return null;
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

    return { currentLocation, locationAddress, reverseGeocode, requestLocationPermission, startLocationWatching };
}