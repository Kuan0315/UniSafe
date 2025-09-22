import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, Polyline, Circle, Polygon, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { directionsService, Coordinate, DirectionsResponse } from '../services/directionsService';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

interface GoogleMapsViewProps {
  userLocation: { latitude: number; longitude: number } | null;
  region?: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
  incidents: Array<{
    id: number;
    type: string;
    title: string;
    description: string;
    location: { latitude: number; longitude: number };
    time: string;
    severity: string;
  }>;
  showSafeRoute: boolean;
  onMapPress?: (latitude: number, longitude: number) => void;
  destination?: { latitude: number; longitude: number; name?: string };
  useSafeRoute?: boolean;
  onFullscreen?: () => void;
  routePolyline?: { latitude: number; longitude: number }[];
  routeInfo?: {
    distanceMeters?: number;
    durationSecs?: number;
    safetyScore?: number;
  };
}

export default function GoogleMapsView({ 
  userLocation, 
  incidents, 
  showSafeRoute, 
  onMapPress,
  region,
  destination,
  useSafeRoute = false,
  onFullscreen,
  routePolyline,
  routeInfo,
}: GoogleMapsViewProps) {
  const { user } = useAuth();
  const currentUniversity = user?.university;
  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
  const [directionsRoute, setDirectionsRoute] = useState<Coordinate[]>([]);
  // const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [loadingDirections, setLoadingDirections] = useState(false);

  // Default to Kuala Lumpur if no location provided
  const defaultRegion: Region = {
    latitude: userLocation?.latitude || currentUniversity?.center?.latitude || 3.1201,
    longitude: userLocation?.longitude || currentUniversity?.center?.longitude || 101.6544,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const currentRegion = region || defaultRegion;

  // Center map on user location when it changes
  useEffect(() => {
    if (mapReady && userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, [userLocation, mapReady]);

  // Get directions when destination changes
  /*
  useEffect(() => {
    if (destination && userLocation && mapReady) {
      getDirectionsToDestination();
    }
  }, [destination, userLocation, useSafeRoute, mapReady]);

  const getDirectionsToDestination = async () => {
    if (!destination || !userLocation) return;

    setLoadingDirections(true);
    try {
      const origin: Coordinate = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      };
      
      const dest: Coordinate = {
        latitude: destination.latitude,
        longitude: destination.longitude,
      };

      let response: DirectionsResponse;
      
      if (useSafeRoute) {
        // Use safe route with incident avoidance
        response = await directionsService.getSafeRoute(origin, dest, incidents, 'walking');
      } else {
        // Use regular route
        response = await directionsService.getDirections(origin, dest, 'walking');
      }

      if (response.routes.length > 0) {
        const route = response.routes[0];
        const polylinePoints = directionsService.decodePolyline(route.overview_polyline.points);
        setDirectionsRoute(polylinePoints);
        
        // Set route info
        if (route.legs.length > 0) {
          setRouteInfo({
            distance: route.legs[0].distance.text,
            duration: route.legs[0].duration.text,
          });
        }

        // Fit map to show entire route
        if (mapRef.current) {
          const coordinates = [origin, dest, ...polylinePoints];
          mapRef.current.fitToCoordinates(coordinates, {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          });
        }
      }
    } catch (error) {
      console.error('Error getting directions:', error);
      Alert.alert('Directions Error', 'Unable to get directions. Please try again.');
    } finally {
      setLoadingDirections(false);
    }
  };
  */

  // Get incident marker color based on severity and type
  const getIncidentColor = (type: string, severity: string) => {
    const severityColors = {
      high: '#FF3B30',
      medium: '#FF9500', 
      low: '#FFCC00'
    };
    
    const typeColors = {
      theft: '#FF9500',
      harassment: '#FF3B30',
      accident: '#007AFF',
      suspicious: '#FF6B35',
      fire: '#FF2D55',
      emergency: '#FF0000'
    };

    return severityColors[severity as keyof typeof severityColors] || 
           typeColors[type as keyof typeof typeColors] || 
           '#FF3B30';
  };

  // Safe route coordinates (example path)
  const safeRouteCoordinates = showSafeRoute && userLocation ? [
    userLocation,
    { latitude: userLocation.latitude + 0.001, longitude: userLocation.longitude + 0.001 },
    { latitude: userLocation.latitude + 0.002, longitude: userLocation.longitude - 0.001 },
    { latitude: userLocation.latitude + 0.003, longitude: userLocation.longitude + 0.002 },
  ] : [];

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    onMapPress?.(latitude, longitude);
  };

  const handleIncidentPress = (incident: any) => {
    Alert.alert(
      incident.title,
      `${incident.description}\n\nTime: ${incident.time}\nSeverity: ${incident.severity}`,
      [{ text: 'OK' }]
    );
  };

  const toggleMapType = () => {
    setMapType(current => {
      switch (current) {
        case 'standard': return 'satellite';
        case 'satellite': return 'hybrid';
        case 'hybrid': return 'standard';
        default: return 'standard';
      }
    });
  };

  const centerOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const centerOnUniversity = () => {
    if (currentUniversity && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentUniversity.center?.latitude || 3.1201,
        longitude: currentUniversity.center?.longitude || 101.6544,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 1000);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={currentRegion}
        mapType={mapType}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        rotateEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
        onMapReady={() => setMapReady(true)}
        onPress={handleMapPress}
        customMapStyle={[
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]}
      >
        {/* User Location Marker - Simple Blue Dot */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Your Location"
            description="Current position"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.userDot} />
          </Marker>
        )}

        {/* University Coverage Circle */}
        {currentUniversity && (
          <>
            <Circle
              center={currentUniversity.center || currentUniversity.location}
              radius={(currentUniversity.coverageRadius || 2) * 1000} // Convert km to meters
              strokeColor="rgba(255, 149, 0, 0.3)"
              fillColor="rgba(255, 149, 0, 0.1)"
              strokeWidth={2}
            />

            {/* Campus Boundary */}
            <Polygon
              coordinates={currentUniversity.campusBoundary || []}
              strokeColor="rgba(52, 199, 89, 0.8)"
              fillColor="rgba(52, 199, 89, 0.1)"
              strokeWidth={3}
            />

            {/* University Center Marker */}
            <Marker
              coordinate={currentUniversity.center || currentUniversity.location}
              title={currentUniversity.name}
              description="University Campus"
            >
              <View style={styles.universityMarker}>
                <Ionicons name="school" size={24} color="white" />
              </View>
            </Marker>
          </>
        )}

        {/* Incident Markers */}
        {incidents.map((incident) => (
          <Marker
            key={incident.id}
            coordinate={incident.location}
            title={incident.title}
            description={incident.description}
            onPress={() => handleIncidentPress(incident)}
          >
            <View style={[
              styles.incidentMarker,
              { backgroundColor: getIncidentColor(incident.type, incident.severity) }
            ]}>
              <Ionicons 
                name={getIncidentIcon(incident.type)} 
                size={20} 
                color="white" 
              />
            </View>
          </Marker>
        ))}

        {/* Destination Marker - Simple Red Dot */}
        {destination && (
          <Marker
            coordinate={destination}
            title={destination.name || "Destination"}
            description="Your destination"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.destinationDot} />
          </Marker>
        )}

        {/* New Selected Route Polyline-new */}
        {routePolyline && routePolyline.length > 0 && (
          <Polyline
            coordinates={routePolyline}
            strokeColor={useSafeRoute ? "#34C759" : "#007AFF"}
            strokeWidth={6}
            geodesic={true}
          />
        )}

        {/* Directions Route-old */}
        {directionsRoute.length > 0 && (
          <Polyline
            coordinates={directionsRoute}
            strokeColor={useSafeRoute ? "#34C759" : "#007AFF"}
            strokeWidth={5}
            geodesic={true}
            lineDashPattern={useSafeRoute ? undefined : [10, 10]}
          />
        )}

        {/* Safe Route (legacy - keeping for compatibility) */}
        {showSafeRoute && safeRouteCoordinates.length > 0 && !directionsRoute.length && (
          <Polyline
            coordinates={safeRouteCoordinates}
            strokeColor="#34C759"
            strokeWidth={4}
            geodesic={true}
          />
        )}
      </MapView>

      {/* Map Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={toggleMapType}
        >
          <Ionicons name="layers" size={24} color="#007AFF" />
        </TouchableOpacity>

        {userLocation && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={centerOnUser}
          >
            <Ionicons name="locate" size={24} color="#007AFF" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {
            if (onFullscreen) {
              onFullscreen();
            }
          }}
        >
          <Ionicons name="expand" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Route Info Display */}
      {routeInfo && (
        <View style={styles.routeInfo}>
          {routeInfo.durationSecs !== undefined && (
            <View style={styles.routeInfoRow}>
              <Ionicons name="time" size={16} color="#666" />
              <Text style={styles.routeInfoText}>
                {Math.ceil((routeInfo.durationSecs || 0) / 60)} mins
              </Text>
            </View>
          )}
          {routeInfo.distanceMeters !== undefined && (
            <View style={styles.routeInfoRow}>
              <Ionicons name="location" size={16} color="#666" />
              <Text style={styles.routeInfoText}>
                {(routeInfo.distanceMeters / 1000).toFixed(2)} km
              </Text>
            </View>
          )}
          {useSafeRoute && (
            <View style={styles.safeRouteBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#fff" />
              <Text style={styles.safeRouteText}>Safe Route</Text>
            </View>
          )}
        </View>
      )}

      {/* Loading Indicator */}
      {loadingDirections && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Getting directions...</Text>
        </View>
      )}

      {/* Map Type Indicator */}
      <View style={styles.mapTypeIndicator}>
        <Text style={styles.mapTypeText}>
          {mapType.charAt(0).toUpperCase() + mapType.slice(1)}
        </Text>
      </View>
    </View>
  );
}

// Helper function to get appropriate icon for incident type
function getIncidentIcon(type: string): keyof typeof Ionicons.glyphMap {
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    theft: 'bag',
    harassment: 'warning',
    accident: 'car',
    suspicious: 'eye',
    fire: 'flame',
    emergency: 'alert-circle',
    assault: 'person',
    vandalism: 'hammer'
  };
  
  return iconMap[type] || 'alert-circle';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: width,
    height: height,
  },
  userMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    overflow: 'hidden', // Ensures perfect circle
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  universityMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    overflow: 'hidden', // Ensures perfect circle
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  incidentMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    overflow: 'hidden', // Ensures perfect circle
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  destinationMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    overflow: 'hidden', // Ensures perfect circle
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  controls: {
    position: 'absolute',
    top: 50,
    right: 15,
    flexDirection: 'column',
    gap: 10,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // Ensures perfect circle
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  mapTypeIndicator: {
    position: 'absolute',
    bottom: 100,
    left: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  mapTypeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  routeInfo: {
    position: 'absolute',
    top: 50,
    left: 15,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 140,
  },
  routeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  routeInfoText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  safeRouteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  safeRouteText: {
    marginLeft: 4,
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -60 }, { translateY: -10 }],
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  loadingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  userDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  destinationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});