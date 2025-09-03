import { Alert, Linking } from 'react-native';
import * as Location from 'expo-location';

export const openGoogleMaps = async (
  destinationLat: number,
  destinationLng: number
) => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required.');
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    const originLat = location.coords.latitude;
    const originLng = location.coords.longitude;

    const url = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destinationLat},${destinationLng}&travelmode=driving`;

    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Unable to open Google Maps.');
    }
  } catch (error) {
    console.error(error);
    Alert.alert('Error', 'An error occurred while opening Google Maps.');
  }
};