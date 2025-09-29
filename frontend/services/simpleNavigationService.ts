import { Linking, Platform } from 'react-native';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

class SimpleNavigationService {
  /**
   * Open device's native maps app for navigation
   * No API key needed - uses device's built-in navigation
   */
  async openNativeNavigation(
    destination: Coordinate,
    destinationLabel?: string,
    origin?: Coordinate
  ): Promise<void> {
    try {
      let url: string;

      if (Platform.OS === 'ios') {
        // Open Apple Maps on iOS
        if (origin) {
          url = `http://maps.apple.com/?saddr=${origin.latitude},${origin.longitude}&daddr=${destination.latitude},${destination.longitude}`;
        } else {
          url = `http://maps.apple.com/?daddr=${destination.latitude},${destination.longitude}`;
        }
        
        if (destinationLabel) {
          url += `&q=${encodeURIComponent(destinationLabel)}`;
        }
      } else {
        // Open Google Maps on Android
        if (origin) {
          url = `google.navigation:q=${destination.latitude},${destination.longitude}&mode=w`; // w = walking
        } else {
          url = `geo:${destination.latitude},${destination.longitude}?q=${destination.latitude},${destination.longitude}`;
        }
        
        if (destinationLabel) {
          url += `(${encodeURIComponent(destinationLabel)})`;
        }
      }

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback to web Google Maps
        const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Error opening navigation:', error);
      throw error;
    }
  }

  /**
   * Open Google Maps specifically (web or app)
   */
  async openGoogleMaps(
    destination: Coordinate,
    origin?: Coordinate,
    mode: 'driving' | 'walking' | 'transit' | 'bicycling' = 'walking'
  ): Promise<void> {
    try {
      let url: string;

      if (origin) {
        url = `https://www.google.com/maps/dir/?api=1&origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&travelmode=${mode}`;
      } else {
        url = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}&travelmode=${mode}`;
      }

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        throw new Error('Cannot open Google Maps');
      }
    } catch (error) {
      console.error('Error opening Google Maps:', error);
      throw error;
    }
  }

  /**
   * Get a simple straight-line route for display purposes only
   * No API calls needed - just draws a line between points
   */
  getSimpleRoute(origin: Coordinate, destination: Coordinate): Coordinate[] {
    // Simple interpolation for display purposes
    const steps = 10;
    const route: Coordinate[] = [];
    
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      route.push({
        latitude: origin.latitude + (destination.latitude - origin.latitude) * ratio,
        longitude: origin.longitude + (destination.longitude - origin.longitude) * ratio,
      });
    }
    
    return route;
  }

  /**
   * Calculate approximate distance between two points (in km)
   * Uses Haversine formula - no API needed
   */
  calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.latitude)) * Math.cos(this.toRadians(coord2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Estimate walking time based on distance
   * Assumes average walking speed of 5 km/h
   */
  estimateWalkingTime(distanceKm: number): string {
    const hours = distanceKm / 5; // 5 km/h average walking speed
    const minutes = Math.round(hours * 60);
    
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const simpleNavigationService = new SimpleNavigationService();