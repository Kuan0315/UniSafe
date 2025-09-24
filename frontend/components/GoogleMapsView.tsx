import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, Polyline, Circle, Polygon, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

interface GoogleMapsViewProps {
  userLocation: { latitude: number; longitude: number } | null;
  userHeading?: number;
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
  origin?: { latitude: number; longitude: number; name?: string };
  useSafeRoute?: boolean;
  onFullscreen?: () => void;
  showFilterButton?: boolean;
  onFilterPress?: () => void;
  hasActiveFilter?: boolean;
  routePolyline?: { latitude: number; longitude: number }[];
  fitToRoute?: boolean;
  routeInfo?: {
    distanceMeters?: number;
    durationSecs?: number;
    safetyScore?: number;
  };
  availableRoutes?: Array<{
    transport: {
      mode: string;
      icon: string;
      label: string;
      transportKey: string;
    };
    fastest: any;
    safest: any;
  }>;
  onRouteSelect?: (route: any, routeType: 'fastest' | 'safest') => void;
}

export default function GoogleMapsView({
  userLocation,
  userHeading = 0,
  incidents,
  showSafeRoute,
  onMapPress,
  region,
  destination,
  origin,
  useSafeRoute = false,
  onFullscreen,
  showFilterButton,
  onFilterPress,
  hasActiveFilter,
  routePolyline,
  fitToRoute = false,
  routeInfo,
  availableRoutes = [],
  onRouteSelect,
}: GoogleMapsViewProps) {
  const { user } = useAuth();
  const currentUniversity = user?.university;
  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');

  // Default to user location first, then university center, then Kuala Lumpur
  const defaultRegion: Region = {
    latitude: userLocation?.latitude || 3.1201,
    longitude: userLocation?.longitude || 101.6544,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const currentRegion = region || defaultRegion;

  // Center map on user location when it changes (but not when showing full route or destination is set)
  useEffect(() => {
    if (mapReady && userLocation && mapRef.current && !fitToRoute && !destination) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, [userLocation, mapReady, fitToRoute, destination]);

  // Animate to region when it changes (for destination selection, etc.) - but not when showing full route
  useEffect(() => {
    if (mapReady && region && mapRef.current && !fitToRoute) {
      console.log('🎯 Animating map to region:', region);
      mapRef.current.animateToRegion(region, 1000);
    }
  }, [region, mapReady, fitToRoute]);

  // Fit map to show entire route when fitToRoute becomes true
  useEffect(() => {
    if (fitToRoute && routePolyline && routePolyline.length > 0 && mapReady && mapRef.current) {
      console.log('🎯 Fitting map to show full route, polyline length:', routePolyline.length);
      // Use setTimeout to ensure this runs after any other animations
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.fitToCoordinates(routePolyline, {
            edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
            animated: true,
          });
        }
      }, 200);
    }
  }, [fitToRoute]); // Only depend on fitToRoute to trigger immediately when it becomes true

  // Also fit when routePolyline becomes available while fitToRoute is true
  useEffect(() => {
    if (fitToRoute && routePolyline && routePolyline.length > 0 && mapReady && mapRef.current) {
      console.log('🎯 Fitting map to route (polyline updated), polyline length:', routePolyline.length);
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.fitToCoordinates(routePolyline, {
            edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
            animated: true,
          });
        }
      }, 200);
    }
  }, [routePolyline]); // Trigger when routePolyline changes

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
        {...(region && { region })}
        mapType={mapType}
        showsUserLocation={false}
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
        {/* User Location Marker - Blue Dot with Direction Arrow */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Your Location"
            description="Current position"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.userLocationContainer}>
              {/* Blue dot in center */}
              <View style={styles.userLocationDot} />
              {/* Direction shadow extending from the dot */}
              <View style={[
                styles.directionShadow,
                { transform: [{ rotate: `${userHeading || 0}deg` }] }
              ]} />
            </View>
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
            <Ionicons
              name={getIncidentIcon(incident.type)}
              size={24}
              color={getIncidentColor(incident.type, incident.severity)}
            />
          </Marker>
        ))}

        {/* Origin Marker - Grey Dot - positioned at route start when route is active */}
        {((routePolyline && routePolyline.length > 0) || origin) && (
          <Marker
            coordinate={routePolyline && routePolyline.length > 0 ? routePolyline[0] : origin!}
            title={(routePolyline && routePolyline.length > 0 ? "Route Start" : origin?.name) || "Starting Point"}
            description="Route starting location"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.originMarker}>
              <View style={styles.originDot} />
            </View>
          </Marker>
        )}

        {/* Destination Marker - Flag Icon */}
        {destination && (
          <Marker
            coordinate={destination}
            title={destination.name || "Destination"}
            description="Your destination"
            anchor={{ x: 0.5, y: 1 }}
          >
            <Ionicons name="flag" size={30} color="#FF3B30" />

          </Marker>
        )}

        {/* Route Option Markers - REMOVED */}

        {/* Route Polyline - Using new routing system */}
        {routePolyline && routePolyline.length > 0 && (
          <Polyline
            coordinates={routePolyline}
            strokeColor={useSafeRoute ? "#00C853" : "#007AFF"}
            strokeWidth={6}
            geodesic={true}
          />
        )}
      </MapView>

      {/* Map Controls */}
      <View style={styles.controls}>
        {showFilterButton && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={onFilterPress}
            activeOpacity={0.8}
          >
            <Ionicons name="filter" size={24} color="#007AFF" />
            {hasActiveFilter && (
              <View style={styles.filterIndicator} />
            )}
          </TouchableOpacity>
        )}

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
    theft: 'briefcase-outline',
    harassment: 'warning-outline',
    accident: 'car-outline',
    suspicious: 'eye-outline',
    fire: 'flame-outline',
    emergency: 'alert-circle-outline',
    assault: 'person-outline',
    vandalism: 'hammer-outline'
  };

  return iconMap[type] || 'alert-circle-outline';
}

// Helper function to get severity ring color
function getSeverityRingColor(severity: string): string {
  const severityColors: Record<string, string> = {
    high: '#FF3B30',    // Red
    medium: '#FF9500',  // Orange  
    low: '#34C759'      // Green
  };

  return severityColors[severity] || '#FF9500';
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
    top: 160,
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
  controlButtonActive: {
    backgroundColor: '#007AFF',
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
  routeOptionMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
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
  userLocationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  userLocationDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  arrowBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 5,
  },
  directionShadow: {
    position: 'absolute',
    top: 8, // Start from the bottom of the blue dot
    left: 8, // Center horizontally
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 20, // Length of the shadow
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(0, 122, 255, 0.9)', // More opaque blue for better visibility
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  flagContainer: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 4,
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
  originMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#666',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  originDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#666',
    borderWidth: 1,
    borderColor: 'white',
  },
  filterIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF9500',
  },
});