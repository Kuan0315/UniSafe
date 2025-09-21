import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import GoogleMapsView from '../../components/GoogleMapsView';
import PlacesSearch from '../../components/PlacesSearch';
import AppHeader from '../../components/AppHeader';
import * as Location from 'expo-location';
import { MAPS_CONFIG } from '../../config/maps';
import GeofencingService from '../../services/GeofencingService';
import { speakPageTitle, speakButtonAction } from '../../services/SpeechService';
import { openGoogleMaps } from '../../services/NavigationService';


const { width, height } = Dimensions.get('window');

interface Incident {
  id: number;
  type: string;
  title: string;
  description: string;
  location: { latitude: number; longitude: number };
  time: string;
  severity: string;
}

// Mock data for incidents
const mockIncidents: Incident[] = [
  {
    id: 1,
    type: 'theft',
    title: 'Theft Report',
    description: 'Phone stolen near Engineering Building',
    location: { latitude: 3.1201, longitude: 101.6544 },
    time: '2 hours ago',
    severity: 'medium',
  },
  {
    id: 2,
    type: 'harassment',
    title: 'Harassment Report',
    description: 'Verbal harassment near Library',
    location: { latitude: 3.1250, longitude: 101.6600 },
    time: '1 hour ago',
    severity: 'high',
  },
  {
    id: 3,
    type: 'accident',
    title: 'Accident Report',
    description: 'Minor collision in parking lot',
    location: { latitude: 3.1150, longitude: 101.6480 },
    time: '30 mins ago',
    severity: 'low',
  },
];

// Mock data for crowd density
const mockCrowdDensity = [
  { id: 1, location: { latitude: 37.78825, longitude: -122.4324 }, density: 'high', count: 45 },
  { id: 2, location: { latitude: 37.78925, longitude: -122.4344 }, density: 'medium', count: 23 },
  { id: 3, location: { latitude: 37.78725, longitude: -122.4304 }, density: 'low', count: 8 },
];

// Mock safe route
const mockSafeRoute = [
  { latitude: 3.1150, longitude: 101.6480 },
  { latitude: 3.1201, longitude: 101.6544 },
  { latitude: 3.1250, longitude: 101.6600 },
];

const incidentIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  theft: 'briefcase-outline',
  harassment: 'warning-outline',
  accident: 'car-outline',
  suspicious: 'eye-outline',
  fire: 'flame-outline',
};

const incidentColors = {
  theft: '#FF9500',
  harassment: '#FF3B30',
  accident: '#007AFF',
  suspicious: '#FF6B35',
  fire: '#FF2D55',
};

const densityColors = {
  high: '#FF3B30',
  medium: '#FF9500',
  low: '#34C759',
};

export default function MapScreen() {
  const [selectedIncidentType, setSelectedIncidentType] = useState('all');
  const [showSafeRoute, setShowSafeRoute] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState(MAPS_CONFIG.DEFAULT_REGION);
  const [isFullScreenMap, setIsFullScreenMap] = useState(false);
  const [destination, setDestination] = useState<string>('');
  const [destinationCoords, setDestinationCoords] = useState<{latitude: number; longitude: number; name?: string} | undefined>();
  const [useSafeRoute, setUseSafeRoute] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showLocationPreview, setShowLocationPreview] = useState(false);
  const [previewLocation, setPreviewLocation] = useState<{latitude: number; longitude: number; name: string; description: string} | null>(null);
  const [transportMode, setTransportMode] = useState<'driving' | 'motorbike' | 'walking'>('driving');
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const [routeType, setRouteType] = useState<'safest' | 'fastest'>('safest');
  const [showTransportSelection, setShowTransportSelection] = useState(false);


  // Speak page title on load for accessibility
  useFocusEffect(
    useCallback(() => {
      speakPageTitle('Campus Map');
    }, [])
  );

  // Request location permissions and get current location
  useEffect(() => {
    let locationSubscription: any;

    const setupLocationTracking = async () => {
      try {
        console.log('Requesting location permissions...');
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log('Location permission status:', status);
      
        if (status !== 'granted') {
          console.log('Location permission denied');
          speakButtonAction('Location permission denied. Please enable location access in settings.');
          Alert.alert('Permission denied', 'Location permission is required to show your current location on the map.');
          return;
        }

        // Set up real-time location updates
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 10 // Update if user moves 10 meters
          },
          (location) => {
            console.log('Location update:', location.coords);
            setUserLocation(location);
            setRegion({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          }
        );

        // Get initial location
        console.log('Getting initial position...');
        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        console.log('Initial location:', initialLocation.coords);
        
        setUserLocation(initialLocation);
        setRegion({
          latitude: initialLocation.coords.latitude,
          longitude: initialLocation.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });

      } catch (error) {
        console.error('Error setting up location tracking:', error);
        speakButtonAction('Unable to get your current location. Please check your location settings.');
        Alert.alert('Location Error', 'Unable to get your current location. Please check your location settings.');
      }
    };

    setupLocationTracking();

    // Cleanup subscription when component unmounts
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  const filteredIncidents = selectedIncidentType === 'all' 
    ? mockIncidents 
    : mockIncidents.filter(incident => incident.type === selectedIncidentType);

  const handleIncidentPress = (incident: any) => {
    setSelectedIncident(incident);
  };

  const handleDestinationSearch = async () => {
    if (!destination || !userLocation) {
      Alert.alert("Error", "Please enter a destination and ensure location is enabled.");
      return;
    }

    if (useSafeRoute) {
      // Your custom safe route logic (filter incidents, recalc path)
      setShowSafeRoute(true);
      Alert.alert("Safe Route", `Showing safest route to ${destination}`);
    } else {
      // Directly open Google Maps navigation
      openGoogleMaps(userLocation.coords.latitude, userLocation.coords.longitude);
    }
  };

  const centerOnUserLocation = () => {
    if (userLocation) {
      setRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const clearRoute = () => {
    setDestination('');
    setDestinationCoords(undefined);
    setShowSafeRoute(false);
  };

  const getIncidentIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    const iconName = incidentIcons[type as keyof typeof incidentIcons];
    return iconName || 'alert-circle-outline';
  };

  const getIncidentColor = (type: string) => {
    return incidentColors[type as keyof typeof incidentColors] || '#FF3B30';
  };

  return (
    <View style={styles.container}>
      <AppHeader 
        title="Map" 
        showFilterButton={true}
        onFilterPress={() => setShowFilterModal(true)}
        hasActiveFilter={selectedIncidentType !== 'all'}
      />
      
      {/* Search + Mic Row */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <PlacesSearch
            placeholder="Search destination..."
            onPlaceSelected={(place) => {
              console.log('Place selected:', place);
              
              // Set preview location data
              setPreviewLocation({
                latitude: place.latitude,
                longitude: place.longitude,
                name: place.description,
                description: place.description
              });

              // Focus map on destination
              setRegion({
                latitude: place.latitude,
                longitude: place.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              });

              // Show transportation selection bottom panel
              setShowTransportSelection(true);
            }}
            style={styles.placesSearch}
          />
          
          {destination && (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={() => {
                setDestination('');
                setDestinationCoords(undefined);
                setShowSafeRoute(false);
                setShowTransportSelection(false); // Hide transport panel
                setPreviewLocation(null); // Clear preview location
              }}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.micButton}
          onPress={() => {
            // Handle speech to text functionality
            console.log('Microphone pressed for speech to text');
            // TODO: Implement speech to text here
          }}
        >
          <Ionicons name="mic" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Google Maps */}
      <View style={styles.mapContainer}>
        {userLocation ? (
          <GoogleMapsView
            userLocation={{
              latitude: userLocation.coords.latitude,
              longitude: userLocation.coords.longitude
            }}
            region={region}
            incidents={filteredIncidents}
            showSafeRoute={showSafeRoute}
            destination={destinationCoords}
            useSafeRoute={useSafeRoute}
            onFullscreen={() => setIsFullScreenMap(true)}
            onMapPress={(latitude, longitude) => {
              console.log('Map clicked at:', { latitude, longitude });
            }}
          />
        ) : (
            <View style={styles.mapPlaceholder}>
              <Ionicons name="map" size={64} color="#007AFF" />
              <Text style={styles.mapPlaceholderText}>Loading Google Maps...</Text>
              <Text style={styles.mapPlaceholderSubtext}>
                Requesting location permissions...
              </Text>
            </View>
          )}
      </View>

      {/* Transportation Selection Bottom Panel */}
      {showTransportSelection && previewLocation && (
        <View style={styles.transportBottomPanel}>
          {/* Location Info */}
          <View style={styles.bottomLocationInfo}>
            <View style={styles.bottomLocationIcon}>
              <Ionicons name="location" size={20} color="#007AFF" />
            </View>
            <View style={styles.bottomLocationDetails}>
              <Text style={styles.bottomLocationName} numberOfLines={1}>
                {previewLocation.name}
              </Text>
              <Text style={styles.bottomLocationCoords}>
                {previewLocation.latitude.toFixed(4)}, {previewLocation.longitude.toFixed(4)}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.closePanelButton}
              onPress={() => setShowTransportSelection(false)}
            >
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Transportation Mode Selection */}
          <View style={styles.bottomTransportModes}>
            <TouchableOpacity
              style={[styles.bottomTransportButton, transportMode === 'driving' && styles.bottomTransportActive]}
              onPress={() => setTransportMode('driving')}
            >
              <Ionicons 
                name="car" 
                size={20} 
                color={transportMode === 'driving' ? '#fff' : '#007AFF'} 
              />
              <Text style={[styles.bottomTransportText, transportMode === 'driving' && styles.bottomTransportTextActive]}>
                Car
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bottomTransportButton, transportMode === 'motorbike' && styles.bottomTransportActive]}
              onPress={() => setTransportMode('motorbike')}
            >
              <Ionicons 
                name="bicycle" 
                size={20} 
                color={transportMode === 'motorbike' ? '#fff' : '#007AFF'} 
              />
              <Text style={[styles.bottomTransportText, transportMode === 'motorbike' && styles.bottomTransportTextActive]}>
                Bike
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bottomTransportButton, transportMode === 'walking' && styles.bottomTransportActive]}
              onPress={() => setTransportMode('walking')}
            >
              <Ionicons 
                name="walk" 
                size={20} 
                color={transportMode === 'walking' ? '#fff' : '#007AFF'} 
              />
              <Text style={[styles.bottomTransportText, transportMode === 'walking' && styles.bottomTransportTextActive]}>
                Walk
              </Text>
            </TouchableOpacity>
          </View>

          {/* Route Type Selection */}
          <View style={styles.bottomRouteTypes}>
            <TouchableOpacity
              style={[styles.bottomRouteButton, routeType === 'safest' && styles.bottomRouteActive]}
              onPress={() => setRouteType('safest')}
            >
              <Ionicons 
                name="shield-checkmark" 
                size={18} 
                color={routeType === 'safest' ? '#fff' : '#34C759'} 
              />
              <Text style={[styles.bottomRouteText, routeType === 'safest' && styles.bottomRouteTextActive]}>
                Safest Route
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.bottomRouteButton, 
                routeType === 'fastest' && styles.bottomRouteActive,
                routeType === 'fastest' && { borderColor: '#FF9500', backgroundColor: routeType === 'fastest' ? '#FF9500' : '#fff' }
              ]}
              onPress={() => setRouteType('fastest')}
            >
              <Ionicons 
                name="flash" 
                size={18} 
                color={routeType === 'fastest' ? '#fff' : '#FF9500'} 
              />
              <Text style={[
                styles.bottomRouteText, 
                routeType === 'fastest' && styles.bottomRouteTextActive,
                routeType === 'fastest' ? { color: '#fff' } : { color: '#FF9500' }
              ]}>
                Fastest Route
              </Text>
            </TouchableOpacity>
          </View>

          {/* Navigate Button */}
          <TouchableOpacity
            style={styles.bottomNavigateButton}
            onPress={() => {
              if (previewLocation) {
                setDestination(previewLocation.name);
                setDestinationCoords({
                  latitude: previewLocation.latitude,
                  longitude: previewLocation.longitude,
                  name: previewLocation.name
                });
                setShowSafeRoute(true);
                setUseSafeRoute(routeType === 'safest');
                setShowTransportSelection(false);
                Alert.alert(
                  "Route Planning", 
                  `Showing ${routeType} ${transportMode} route to ${previewLocation.name}`
                );
              }
            }}
          >
            <Ionicons name="navigate" size={20} color="#fff" />
            <Text style={styles.bottomNavigateText}>
              Start Navigation
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Incident Details Modal */}
      <Modal
        visible={!!selectedIncident}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedIncident(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedIncident?.title}</Text>
              <TouchableOpacity onPress={() => setSelectedIncident(null)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.incidentInfo}>
                <Ionicons 
                  name={getIncidentIcon(selectedIncident?.type || '')} 
                  size={24} 
                  color={getIncidentColor(selectedIncident?.type || '')} 
                />
                <Text style={styles.incidentType}>
                  {selectedIncident?.type ? selectedIncident.type.charAt(0).toUpperCase() + selectedIncident.type.slice(1) : ''}
                </Text>
              </View>
              
              <Text style={styles.incidentDescription}>{selectedIncident?.description}</Text>
              <Text style={styles.incidentTime}>Reported: {selectedIncident?.time}</Text>
              
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="navigate" size={20} color="#007AFF" />
                  <Text style={styles.actionButtonText}>Navigate</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="share" size={20} color="#34C759" />
                  <Text style={styles.actionButtonText}>Share</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="flag" size={20} color="#FF9500" />
                  <Text style={styles.actionButtonText}>Report</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Incidents</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.filterList}>
              <TouchableOpacity
                style={[styles.filterOption, selectedIncidentType === 'all' && styles.filterOptionSelected]}
                onPress={() => {
                  setSelectedIncidentType('all');
                  setShowFilterModal(false);
                }}
              >
                <View style={styles.filterOptionContent}>
                  <Text style={[styles.filterOptionText, selectedIncidentType === 'all' && styles.filterOptionTextSelected]}>
                    All Incidents
                  </Text>
                  {selectedIncidentType === 'all' && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </View>
              </TouchableOpacity>

              {Object.keys(incidentIcons).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.filterOption, selectedIncidentType === type && styles.filterOptionSelected]}
                  onPress={() => {
                    setSelectedIncidentType(type);
                    setShowFilterModal(false);
                  }}
                >
                  <View style={styles.filterOptionContent}>
                    <View style={styles.filterOptionLeft}>
                      <View style={[styles.filterIconContainer, { backgroundColor: getIncidentColor(type) }]}>
                        <Ionicons 
                          name={getIncidentIcon(type)} 
                          size={16} 
                          color="#fff"
                        />
                      </View>
                      <Text style={[styles.filterOptionText, selectedIncidentType === type && styles.filterOptionTextSelected]}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </View>
                    {selectedIncidentType === type && (
                      <Ionicons name="checkmark" size={20} color="#007AFF" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Location Preview Modal - DISABLED: Using bottom panel instead
      <Modal
        visible={showLocationPreview}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocationPreview(false)}
      >
        ...modal content removed for bottom panel...
      </Modal>
      */}

      {/* Fullscreen Map Modal*/}
      <Modal
        visible={isFullScreenMap}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setIsFullScreenMap(false)}
      >
        <View style={styles.fullScreenContainer}>
          {/* Close Button */}
          <View style={styles.fullScreenTopBar}>
            <TouchableOpacity 
              style={styles.fullScreenCloseButton} 
              onPress={() => setIsFullScreenMap(false)}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Fullscreen Map*/}
          {userLocation ? (
            <GoogleMapsView
              userLocation={{
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude
              }}
              incidents={filteredIncidents}
              showSafeRoute={showSafeRoute}
              destination={destinationCoords}
              useSafeRoute={useSafeRoute}
              onMapPress={(latitude, longitude) => {
                console.log('Map clicked at:', { latitude, longitude });
              }}
            />
          ) : (
            <View style={styles.mapPlaceholder}>
              <Ionicons name="map" size={64} color="#007AFF" />
              <Text style={styles.mapPlaceholderText}>Loading Google Maps...</Text>
              <Text style={styles.mapPlaceholderSubtext}>
                Requesting location permissions...
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeAreaMap: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#0056CC',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  filterButton: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 6,
  },
  filterTextActive: {
    color: '#fff',
  },
  mapContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  mapContainerNoSpacing: {
    flex: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  map: {
    flex: 1,
    borderRadius: 16,
  },
  incidentListOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: height * 0.4,
  },
  incidentMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  crowdMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  crowdCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  callout: {
    width: 200,
    padding: 12,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  calloutDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  calloutTime: {
    fontSize: 12,
    color: '#999',
  },
  filterButtonHeader: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  safetyScoreContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  safetyScoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  safetyScoreBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e1e5e9',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  safetyScoreFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 4,
  },
  safetyScoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34C759',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: height * 0.6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  modalBody: {
    gap: 16,
  },
  incidentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  incidentType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  incidentDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  incidentTime: {
    fontSize: 14,
    color: '#999',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    padding: 20,
  },
  mapPlaceholderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullScreenTopBar: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  fullScreenCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems:'center',
    justifyContent: 'center',
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  locationStatusText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    fontWeight: '500',
  },
  incidentList: {
    marginTop: 10,
  },
  incidentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  incidentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  incidentCardContent: {
    flex: 1,
  },
  incidentCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  incidentCardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  incidentCardTime: {
    fontSize: 12,
    color: '#999',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    zIndex: 10, // keep dropdown visible
  },
  searchContainer: {
    flex: 1, // takes up all space before button
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fb',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderColor: '#e8eaed',
    marginRight: 12, // spacing before mic button
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // New styles for improved search suggestions
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  suggestionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  searchIcon: {
    marginRight: 8,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  placesSearch: {
    flex: 1,
    marginRight: 8,
  },
  clearSearchButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButton: {
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    height: 50,
    borderWidth: 1.5,
    borderColor: '#e8eaed',
  },
  // Filter Modal Styles
  filterModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  filterList: {
    maxHeight: 300,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterOptionSelected: {
    backgroundColor: '#f0f9ff',
  },
  filterOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  filterOptionText: {
    fontSize: 16,
    color: '#333',
  },
  filterOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  // Location Preview Modal Styles
  locationPreviewContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  locationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  locationDetails: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 14,
    color: '#666',
  },
  transportModeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  transportModeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  transportModeButton: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: '#fff',
    minWidth: 80,
  },
  transportModeActive: {
    backgroundColor: '#007AFF',
  },
  transportModeText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  transportModeTextActive: {
    color: '#fff',
  },
  routeActions: {
    gap: 12,
  },
  showRouteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  showRouteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelRouteButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelRouteButtonText: {
    fontSize: 16,
    color: '#666',
  },
  // Bottom Transport Panel Styles
  transportBottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    maxHeight: '40%',
  },
  bottomLocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  bottomLocationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bottomLocationDetails: {
    flex: 1,
  },
  bottomLocationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  bottomLocationCoords: {
    fontSize: 12,
    color: '#666',
  },
  closePanelButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomTransportModes: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  bottomTransportButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: '#fff',
    minWidth: 80,
  },
  bottomTransportActive: {
    backgroundColor: '#007AFF',
  },
  bottomTransportText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  bottomTransportTextActive: {
    color: '#fff',
  },
  bottomRouteTypes: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  bottomRouteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#34C759',
    backgroundColor: '#fff',
    gap: 6,
  },
  bottomRouteActive: {
    backgroundColor: '#34C759',
  },
  bottomRouteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
  },
  bottomRouteTextActive: {
    color: '#fff',
  },
  bottomNavigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  bottomNavigateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});