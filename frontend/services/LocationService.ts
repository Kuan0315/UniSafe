import * as Location from 'expo-location';
import { Alert } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
  heading?: number;
  speed?: number;
}

export interface LocationUpdate {
  userId: string;
  location: LocationData;
  timestamp: number;
  isEmergency: boolean;
}

export class LocationService {
  private static locationSubscription: Location.LocationSubscription | null = null;
  private static isTracking = false;
  private static updateInterval = 10000; // 10 seconds
  private static trustedContacts: string[] = [];

  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to provide safety features like Follow Me and emergency location sharing.'
        );
        return false;
      }

      const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus.status !== 'granted') {
        console.log('Background location permission not granted');
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  static async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
        heading: location.coords.heading,
        speed: location.coords.speed,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  static async startLocationTracking(
    userId: string,
    onLocationUpdate?: (location: LocationUpdate) => void
  ): Promise<boolean> {
    if (this.isTracking) {
      console.log('Location tracking already active');
      return true;
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return false;
      }

      this.isTracking = true;
      
      // Start location updates
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: this.updateInterval,
          distanceInterval: 10,
          showsBackgroundLocationIndicator: true,
        },
        (location) => {
          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp,
            heading: location.coords.heading,
            speed: location.coords.speed,
          };

          const locationUpdate: LocationUpdate = {
            userId,
            location: locationData,
            timestamp: Date.now(),
            isEmergency: false,
          };

          // Send to backend/trusted contacts
          this.shareLocationWithTrustedContacts(locationUpdate);
          
          // Call callback if provided
          if (onLocationUpdate) {
            onLocationUpdate(locationUpdate);
          }
        }
      );

      console.log('Location tracking started');
      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      this.isTracking = false;
      return false;
    }
  }

  static async stopLocationTracking(): Promise<void> {
    try {
      if (this.locationSubscription) {
        await this.locationSubscription.remove();
        this.locationSubscription = null;
      }
      this.isTracking = false;
      console.log('Location tracking stopped');
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  }

  static async shareLocationWithTrustedContacts(locationUpdate: LocationUpdate): Promise<void> {
    try {
      // TODO: Implement backend API call to share location
      // This would typically send the location to your backend
      // which then notifies trusted contacts via push notifications
      
      console.log('Sharing location with trusted contacts:', {
        userId: locationUpdate.userId,
        location: locationUpdate.location,
        timestamp: new Date(locationUpdate.timestamp).toISOString(),
      });

      // Mock implementation - replace with actual backend call
      // await api.post('/location/share', locationUpdate);
    } catch (error) {
      console.error('Error sharing location:', error);
    }
  }

  static async shareEmergencyLocation(
    userId: string,
    emergencyType: string = 'SOS'
  ): Promise<void> {
    try {
      const currentLocation = await this.getCurrentLocation();
      if (!currentLocation) {
        Alert.alert('Error', 'Unable to get your current location');
        return;
      }

      const emergencyUpdate: LocationUpdate = {
        userId,
        location: currentLocation,
        timestamp: Date.now(),
        isEmergency: true,
      };

      // Share emergency location immediately
      await this.shareLocationWithTrustedContacts(emergencyUpdate);

      // TODO: Also send to emergency services
      // await this.notifyEmergencyServices(emergencyUpdate, emergencyType);

      console.log('Emergency location shared:', emergencyUpdate);
    } catch (error) {
      console.error('Error sharing emergency location:', error);
      Alert.alert('Error', 'Failed to share emergency location');
    }
  }

  static setTrustedContacts(contacts: string[]): void {
    this.trustedContacts = contacts;
  }

  static getTrustedContacts(): string[] {
    return this.trustedContacts;
  }

  static isLocationTrackingActive(): boolean {
    return this.isTracking;
  }

  static async getLocationHistory(
    userId: string,
    startTime: number,
    endTime: number
  ): Promise<LocationUpdate[]> {
    try {
      // TODO: Implement backend API call to get location history
      // This would typically fetch from your backend database
      
      console.log('Getting location history for user:', userId, {
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      });

      // Mock implementation - replace with actual backend call
      // const response = await api.get(`/location/history/${userId}`, {
      //   params: { startTime, endTime }
      // });
      // return response.data;

      return [];
    } catch (error) {
      console.error('Error getting location history:', error);
      return [];
    }
  }

  static async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (results.length > 0) {
        const result = results[0];
        const address = [
          result.street,
          result.city,
          result.region,
          result.country,
        ]
          .filter(Boolean)
          .join(', ');
        
        return address || 'Unknown location';
      }

      return 'Unknown location';
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return 'Unknown location';
    }
  }
}

// Example usage:
// await LocationService.requestPermissions();
// await LocationService.startLocationTracking('user123', (update) => {
//   console.log('Location update:', update);
// });
// await LocationService.shareEmergencyLocation('user123', 'SOS');
