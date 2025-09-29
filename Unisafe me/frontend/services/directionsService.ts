import { MAPS_CONFIG } from '../config/maps';

export interface DirectionStep {
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  instructions: string;
  maneuver?: string;
  start_location: { lat: number; lng: number };
  end_location: { lat: number; lng: number };
}

export interface DirectionRoute {
  legs: Array<{
    distance: { text: string; value: number };
    duration: { text: string; value: number };
    steps: DirectionStep[];
    start_address: string;
    end_address: string;
  }>;
  overview_polyline: {
    points: string;
  };
  summary: string;
  warnings: string[];
}

export interface DirectionsResponse {
  routes: DirectionRoute[];
  status: string;
  error_message?: string;
}

export interface Coordinate {
  latitude: number;
  longitude: number;
}

class DirectionsService {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api/directions/json';

  constructor() {
    this.apiKey = MAPS_CONFIG.GOOGLE_MAPS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Google Maps API key not found for Directions Service');
    }
  }

  /**
   * Get directions between two points
   */
  async getDirections(
    origin: Coordinate,
    destination: Coordinate,
    mode: 'driving' | 'walking' | 'transit' | 'bicycling' = 'walking',
    avoidHighways = false,
    waypoints?: Coordinate[]
  ): Promise<DirectionsResponse> {
    try {
      const originParam = `${origin.latitude},${origin.longitude}`;
      const destinationParam = `${destination.latitude},${destination.longitude}`;
      
      let waypointsParam = '';
      if (waypoints && waypoints.length > 0) {
        const waypointsList = waypoints.map(wp => `${wp.latitude},${wp.longitude}`).join('|');
        waypointsParam = `&waypoints=${waypointsList}`;
      }

      const avoidParam = avoidHighways ? '&avoid=highways' : '';
      
      const url = `${this.baseUrl}?origin=${originParam}&destination=${destinationParam}&mode=${mode}${waypointsParam}${avoidParam}&key=${this.apiKey}`;
      
      console.log('Fetching directions:', { origin, destination, mode });
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(`Directions API error: ${data.status} - ${data.error_message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching directions:', error);
      throw error;
    }
  }

  /**
   * Get safe route with incident avoidance
   */
  async getSafeRoute(
    origin: Coordinate,
    destination: Coordinate,
    incidents: Array<{ location: Coordinate; type: string; severity: string }>,
    mode: 'driving' | 'walking' | 'transit' | 'bicycling' = 'walking'
  ): Promise<DirectionsResponse> {
    try {
      // Filter high-risk incidents
      const highRiskIncidents = incidents.filter(
        incident => incident.severity === 'high' || 
        ['assault', 'robbery', 'harassment'].includes(incident.type)
      );

      // Generate waypoints to avoid high-risk areas
      const safeWaypoints = this.generateSafeWaypoints(origin, destination, highRiskIncidents);

      return await this.getDirections(origin, destination, mode, true, safeWaypoints);
    } catch (error) {
      console.error('Error getting safe route:', error);
      // Fallback to regular route
      return await this.getDirections(origin, destination, mode, true);
    }
  }

  /**
   * Generate waypoints to avoid dangerous areas
   */
  private generateSafeWaypoints(
    origin: Coordinate,
    destination: Coordinate,
    incidents: Array<{ location: Coordinate; type: string; severity: string }>
  ): Coordinate[] {
    const waypoints: Coordinate[] = [];
    const dangerRadius = 0.005; // ~500 meters

    // Simple avoidance logic - create waypoints that detour around incident clusters
    const midpoint = {
      latitude: (origin.latitude + destination.latitude) / 2,
      longitude: (origin.longitude + destination.longitude) / 2,
    };

    // Check if midpoint is near any incidents
    const nearbyIncidents = incidents.filter(incident => 
      this.getDistance(midpoint, incident.location) < dangerRadius
    );

    if (nearbyIncidents.length > 0) {
      // Add detour waypoint
      const detourOffset = 0.003; // ~300 meters
      const detourWaypoint = {
        latitude: midpoint.latitude + (Math.random() > 0.5 ? detourOffset : -detourOffset),
        longitude: midpoint.longitude + (Math.random() > 0.5 ? detourOffset : -detourOffset),
      };
      waypoints.push(detourWaypoint);
    }

    return waypoints;
  }

  /**
   * Calculate distance between two coordinates (rough approximation)
   */
  private getDistance(coord1: Coordinate, coord2: Coordinate): number {
    const latDiff = coord1.latitude - coord2.latitude;
    const lngDiff = coord1.longitude - coord2.longitude;
    return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
  }

  /**
   * Decode polyline from Google Directions API
   */
  decodePolyline(encoded: string): Coordinate[] {
    const poly = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      
      do {
        b = encoded.charAt(index++).charCodeAt(0) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      
      const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      
      do {
        b = encoded.charAt(index++).charCodeAt(0) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      
      const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      poly.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5
      });
    }

    return poly;
  }
}

export const directionsService = new DirectionsService();