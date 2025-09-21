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
import * as Location from 'expo-location';
import { MAPS_CONFIG } from '../../config/maps';
import GeofencingService, { University } from '../../services/GeofencingService';
import { speakPageTitle, speakButtonAction } from '../../services/SpeechService';
import { openGoogleMaps } from '../../services/NavigationService';
import UniversitySelector from '../../components/UniversitySelector';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';


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
  const [currentUniversity, setCurrentUniversity] = useState<University | null>(null);
  const [region, setRegion] = useState(MAPS_CONFIG.DEFAULT_REGION);
  const [isFullScreenMap, setIsFullScreenMap] = useState(false);
  const [destination, setDestination] = useState<string>('');
  const [useSafeRoute, setUseSafeRoute] = useState(true);


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

  const getIncidentIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    const iconName = incidentIcons[type as keyof typeof incidentIcons];
    return iconName || 'alert-circle-outline';
  };

  const getIncidentColor = (type: string) => {
    return incidentColors[type as keyof typeof incidentColors] || '#FF3B30';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* University Selector */}
      <UniversitySelector
        onUniversityChange={setCurrentUniversity}
        currentUniversity={currentUniversity}
      />

      {/* Filter Bar */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterChip, selectedIncidentType === 'all' && styles.filterChipActive]}
            onPress={() => setSelectedIncidentType('all')}
          >
            <Text style={[styles.filterText, selectedIncidentType === 'all' && styles.filterTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {Object.keys(incidentIcons).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.filterChip, selectedIncidentType === type && styles.filterChipActive]}
              onPress={() => setSelectedIncidentType(type)}
            >
              <Ionicons 
                name={getIncidentIcon(type)} 
                size={16} 
                color={selectedIncidentType === type ? '#fff' : getIncidentColor(type)} 
              />
              <Text style={[styles.filterText, selectedIncidentType === type && styles.filterTextActive]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search + Toggle Row */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <GooglePlacesAutocomplete
            placeholder="Search destination..."
            debounce={200}
            fetchDetails={true}
            onFail={(error) => console.error("Places API Error:", error)}
            onNotFound={() => console.warn("No places found")}
            query={{
              key: MAPS_CONFIG.GOOGLE_MAPS_API_KEY,
              language: 'en',
            }}
            textInputProps={{
              autoCorrect: false,
              placeholderTextColor: "#999",
              onFocus: () => console.log("Input focused"),
            }}
            onPress={(data, details = null) => {
              if (!details?.geometry) {
                console.warn("No geometry returned:", data, details);
                return;
              }

              const { lat, lng } = details.geometry.location;
              setDestination(data.description);

              if (useSafeRoute) {
                setShowSafeRoute(true);
                Alert.alert("Safe Route", `Showing safest route to ${data.description}`);
                // TODO: Add safe route calculation here
              } else {
                openGoogleMaps(lat, lng);
              }
            }}
            predefinedPlaces={[]}
            listViewDisplayed="auto"  // 👈 add here
            currentLocation={false}
            renderRow={(rowData) => (
              <View style={{ padding: 10, borderBottomWidth: 0.5, borderColor: "#ccc" }}>
                <Text>{rowData.description || "No description"}</Text>
              </View>
            )}  
            styles={{
              container: { flex: 1 },
              textInput: {
                height: 36,
                fontSize: 14,
                backgroundColor: "transparent", // since container already styled
              },
              listView: {
                backgroundColor: '#fff',
                zIndex: 20,
                elevation: 3,
              },
            }}
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleDestinationSearch}
          >
            <Ionicons name="search" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.toggleButton, useSafeRoute && styles.toggleActive]}
          onPress={() => setUseSafeRoute(!useSafeRoute)}
        >
          <Ionicons name="shield-checkmark" size={18} color={useSafeRoute ? "#fff" : "#007AFF"}/>
          <Text style={[styles.toggleText, useSafeRoute && styles.toggleTextActive]}>
            Safest
          </Text>
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
            currentUniversity={currentUniversity}
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

      {/* Control Buttons */}
      <View style={styles.controlButtons}>

        {/* Fullscreen toggle */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setIsFullScreenMap(true)}
        >
          <Ionicons name="expand" size={24} color="#007AFF" />
        </TouchableOpacity>

        {/* Center on User Location */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={centerOnUserLocation}
        >
          <Ionicons name="locate" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

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
              currentUniversity={currentUniversity}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    margin: 16,
    borderRadius: 16,
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
  controlButtons: {
    position: 'absolute',
    right: 20,
    bottom: 125,
    gap: 12,
  },
  controlButton: {
    width: 50,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  controlButtonActive: {
    backgroundColor: '#34C759',
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
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    zIndex: 10, // keep dropdown visible
  },
  searchContainer: {
    flex: 1, // takes up all space before button
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 20,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8, // spacing before button
  },
  searchButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  toggleActive: {
    backgroundColor: '#007AFF',
  },
  toggleText: {
    marginLeft: 4,
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#fff',
  },
});