import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  StyleSheet as RNStyleSheet,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GoogleMapsView from '../../components/GoogleMapsView';
import PlacesSearch from '../../components/PlacesSearch';
import AppHeader from '../../components/AppHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  severity: 'low' | 'medium' | 'high';
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
  // Test incidents for SRJK(C) Bukit Siput area (near coordinates 2.4858831, 102.8460264)
  {
    id: 4,
    type: 'theft',
    title: 'Phone Theft - Bukit Siput',
    description: 'Phone stolen near main road to school',
    location: { latitude: 2.4820, longitude: 102.8475 }, // Along likely route
    time: '45 mins ago',
    severity: 'medium',
  },
  {
    id: 5,
    type: 'harassment',
    title: 'Harassment - School Area',
    description: 'Verbal harassment reported near SRJK area',
    location: { latitude: 2.4845, longitude: 102.8465 }, // Close to school
    time: '1.5 hours ago',
    severity: 'high',
  },
  {
    id: 6,
    type: 'suspicious',
    title: 'Suspicious Activity',
    description: 'Suspicious person loitering near Jalan Abdul Hamid',
    location: { latitude: 2.4830, longitude: 102.8450 }, // Alternative route area
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
  const [showLocationDetails, setShowLocationDetails] = useState(false);
  const [showRouteOptions, setShowRouteOptions] = useState(false);
  const [availableRoutes, setAvailableRoutes] = useState<any[]>([]);


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

  // --- Helper: decode polyline (Google polyline -> array of {lat, lng}) ---
  function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
    // Standard Google polyline decoder
    let index = 0, lat = 0, lng = 0, coordinates = [];

    while (index < encoded.length) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      coordinates.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return coordinates;
  }

  // --- Helper: Haversine for distance between two coords (meters) ---
  function haversineMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
    const R = 6371000; // meters
    const toRad = (deg: number) => deg * Math.PI / 180;
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);

    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const aVal = sinDLat * sinDLat + sinDLon * sinDLon * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
    return R * c;
  }

  // --- Compute safety score for a route polyline given incidents ---
  // Lower is safer. Penalty increases when route passes near incidents.
  function computeSafetyScore(routeCoords: { latitude: number; longitude: number }[], incidents: Incident[], routeId?: string) {
    // parameters you can tune:
    const PENALTY_BASE = { low: 5, medium: 15, high: 40 }; // penalty weight by severity
    const NEARBY_THRESHOLD_METERS = 200; // consider incident affecting route within 200m
    let score = 0;
    let incidentsNearRoute = [];

    // sample every Nth point to limit compute cost
    const sampleStep = Math.max(1, Math.floor(routeCoords.length / 200)); // keep up to ~200 samples
    
    console.log(`🔒 Computing safety score for ${routeId || 'route'} with ${routeCoords.length} points (sampling every ${sampleStep})`);
    
    for (let i = 0; i < routeCoords.length; i += sampleStep) {
      const pt = routeCoords[i];
      for (const inc of incidents) {
        const d = haversineMeters(pt, inc.location);
        if (d <= NEARBY_THRESHOLD_METERS) {
          // Closer incidents yield slightly bigger penalty: linear falloff to threshold
          const proximityFactor = 1 - (d / NEARBY_THRESHOLD_METERS); // 1.0 if at same point, 0.0 at threshold
          const base = PENALTY_BASE[inc.severity];
          const penalty = base * proximityFactor;
          score += penalty;
          
          incidentsNearRoute.push({
            incident: inc.title,
            severity: inc.severity,
            distance: Math.round(d),
            penalty: Math.round(penalty * 100) / 100
          });
        }
      }
    }
    
    console.log(`🔒 ${routeId || 'Route'} safety analysis:`, {
      totalScore: Math.round(score * 100) / 100,
      incidentsNearby: incidentsNearRoute.length,
      details: incidentsNearRoute
    });
    
    return score;
  }

  // --- Fetch directions from Google Directions API ---
  async function fetchDirections(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }, mode: 'driving' | 'bicycling' | 'walking') {
    const apiKey = MAPS_CONFIG.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY is missing in MAPS_CONFIG');
    }

    // Build URL
    // Use alternatives=true to get candidate routes
    // For driving, request departure_time=now to get duration_in_traffic
    const originStr = `${origin.lat},${origin.lng}`;
    const destStr = `${destination.lat},${destination.lng}`;
    const baseUrl = 'https://maps.googleapis.com/maps/api/directions/json';
    const params = new URLSearchParams({
      origin: originStr,
      destination: destStr,
      mode, // treat motorbike as driving in Directions API
      alternatives: 'true',
      key: apiKey
    });

    // if driving, include departure_time to consider traffic
    if (mode === 'driving') {
      params.append('departure_time', 'now');
      // Add traffic_model optional param if needed (best_guess)
      params.append('traffic_model', 'best_guess');
    }

    const url = `${baseUrl}?${params.toString()}`;

    const resp = await fetch(url);
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Directions API error: ${resp.status} ${text}`);
    }
    const data = await resp.json();
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Directions API returned status ${data.status}`);
    }
    return data; // will contain routes[]
  }

  // --- Main planner: get candidate routes, score them, choose fastest or safest ---
  async function planRoutesAndSelect(
    originLatLng: { lat: number; lng: number },
    destLatLng: { lat: number; lng: number },
    mode: 'driving' | 'bicycling' | 'walking',
    routeType: 'fastest' | 'safest',
    incidents: Incident[]
  ) {
    console.log(`🗺️ Planning ${routeType} route (${mode}) with ${incidents.length} incidents to consider`);
    
    // fetch directions
    const raw = await fetchDirections(originLatLng, destLatLng, mode);
    const candidates = (raw.routes || []).map((r: any, index: number) => {
      const coords = decodePolyline(r.overview_polyline?.points || '');
      // prefer duration_in_traffic if provided
      const leg = (r.legs && r.legs[0]) ? r.legs[0] : null;
      const duration = leg ? (leg.duration ? leg.duration.value : null) : null;
      const distance = leg ? (leg.distance ? leg.distance.value : null) : null;
      const durationInTraffic = leg && leg.duration_in_traffic ? leg.duration_in_traffic.value : null;
      return {
        raw: r,
        coords,
        distanceMeters: distance,
        durationSecs: duration,
        durationInTrafficSecs: durationInTraffic,
        routeId: `Route ${index + 1}`,
      };
    });

    if (!candidates.length) {
      console.log('❌ No route candidates found');
      return null;
    }

    console.log(`📍 Found ${candidates.length} route candidates`);

    // Score each candidate
    const scored = candidates.map((c: any) => {
      const safetyScore = computeSafetyScore(c.coords, incidents, c.routeId);
      // pick the most meaningful travel time: duration_in_traffic (if driving) else duration
      const travelTime = (mode === 'driving' && c.durationInTrafficSecs) ? c.durationInTrafficSecs : c.durationSecs;
      return {
        ...c,
        safetyScore,
        travelTime,
      };
    });

    // Log all route comparisons
    console.log('📊 Route Comparison:');
    scored.forEach((route: any, index: number) => {
      console.log(`${route.routeId}:`, {
        distance: `${Math.round(route.distanceMeters/1000*100)/100} km`,
        duration: `${Math.ceil((route.travelTime || 0)/60)} mins`,
        safetyScore: Math.round(route.safetyScore * 100) / 100,
        polylinePoints: route.coords.length
      });
    });

    // Selection logic
    let chosen;
    if (routeType === 'fastest') {
      // pick minimum travelTime; if equal, pick smallest safetyScore
      scored.sort((a: any, b: any) => {
        if ((a.travelTime || 0) !== (b.travelTime || 0)) return (a.travelTime || 0) - (b.travelTime || 0);
        return a.safetyScore - b.safetyScore;
      });
      chosen = scored[0];
      console.log(`🏃 Selected FASTEST route: ${chosen.routeId} (${Math.ceil((chosen.travelTime || 0)/60)} mins, safety: ${Math.round(chosen.safetyScore * 100) / 100})`);
    } else { // safest
      // pick minimum safetyScore; if equal, pick fastest among them
      scored.sort((a: any, b: any) => {
        if (a.safetyScore !== b.safetyScore) return a.safetyScore - b.safetyScore;
        return (a.travelTime || 0) - (b.travelTime || 0);
      });
      chosen = scored[0];
      console.log(`🛡️ Selected SAFEST route: ${chosen.routeId} (safety: ${Math.round(chosen.safetyScore * 100) / 100}, ${Math.ceil((chosen.travelTime || 0)/60)} mins)`);
    }

    // build route info to give to map UI
    const routeInfo = {
      distanceMeters: chosen.distanceMeters,
      durationSecs: chosen.travelTime,
      safetyScore: chosen.safetyScore,
      polyline: chosen.coords,
      rawRoute: chosen.raw,
    };

    return routeInfo;
  }

  // --- TEST FUNCTION: Debug routing issues ---
  const testRoute = async () => {
    if (!userLocation || !previewLocation) {
      Alert.alert('Test', 'Need both user location and destination');
      return;
    }

    try {
      console.log('🧪 Testing route from:', userLocation.coords, 'to:', previewLocation);
      
      const plan = await planRoutesAndSelect(
        { lat: userLocation.coords.latitude, lng: userLocation.coords.longitude },
        { lat: previewLocation.latitude, lng: previewLocation.longitude },
        'walking',
        'fastest',
        mockIncidents
      );

      if (plan) {
        console.log('✅ Route found:', {
          distance: `${Math.round(plan.distanceMeters/1000*100)/100} km`,
          duration: `${Math.ceil((plan.durationSecs || 0)/60)} mins`,
          polylinePoints: plan.polyline.length,
          firstFewPoints: plan.polyline.slice(0, 3),
          lastFewPoints: plan.polyline.slice(-3),
          safetyScore: plan.safetyScore
        });
        
        Alert.alert('Route Test', `Found route!\nDistance: ${Math.round(plan.distanceMeters/1000*100)/100} km\nPoints: ${plan.polyline.length}\nSafety Score: ${Math.round(plan.safetyScore * 100) / 100}`);
      } else {
        console.log('❌ No route found');
        Alert.alert('Route Test', 'No route found');
      }
    } catch (error: any) {
      console.error('🚫 Route test error:', error);
      Alert.alert('Route Test Error', error.message || 'Unknown error');
    }
  };

  // --- COMPREHENSIVE TEST: Compare fastest vs safest routes ---
  const testBothRoutes = async () => {
    if (!userLocation || !previewLocation) {
      Alert.alert('Test', 'Need both user location and destination');
      return;
    }

    try {
      console.log('🔬 COMPREHENSIVE ROUTE TEST - Comparing Fastest vs Safest');
      console.log('📍 From:', userLocation.coords);
      console.log('📍 To:', previewLocation);
      console.log('🚨 Active incidents:', mockIncidents.map(inc => `${inc.title} (${inc.severity}) at ${inc.location.latitude}, ${inc.location.longitude}`));
      
      // Test fastest route
      console.log('\n🏃 TESTING FASTEST ROUTE:');
      const fastestPlan = await planRoutesAndSelect(
        { lat: userLocation.coords.latitude, lng: userLocation.coords.longitude },
        { lat: previewLocation.latitude, lng: previewLocation.longitude },
        transportMode === 'motorbike' ? 'driving' : transportMode,
        'fastest',
        mockIncidents
      );

      // Test safest route
      console.log('\n🛡️ TESTING SAFEST ROUTE:');
      const safestPlan = await planRoutesAndSelect(
        { lat: userLocation.coords.latitude, lng: userLocation.coords.longitude },
        { lat: previewLocation.latitude, lng: previewLocation.longitude },
        transportMode === 'motorbike' ? 'driving' : transportMode,
        'safest',
        mockIncidents
      );

      // Compare results
      if (fastestPlan && safestPlan) {
        console.log('\n📊 FINAL COMPARISON:');
        console.log('Fastest Route:', {
          distance: `${Math.round(fastestPlan.distanceMeters/1000*100)/100} km`,
          duration: `${Math.ceil((fastestPlan.durationSecs || 0)/60)} mins`,
          safetyScore: Math.round(fastestPlan.safetyScore * 100) / 100,
          polylinePoints: fastestPlan.polyline.length
        });
        console.log('Safest Route:', {
          distance: `${Math.round(safestPlan.distanceMeters/1000*100)/100} km`,
          duration: `${Math.ceil((safestPlan.durationSecs || 0)/60)} mins`,
          safetyScore: Math.round(safestPlan.safetyScore * 100) / 100,
          polylinePoints: safestPlan.polyline.length
        });

        const timeDiff = Math.ceil(((safestPlan.durationSecs || 0) - (fastestPlan.durationSecs || 0))/60);
        const safetyDiff = Math.round((fastestPlan.safetyScore - safestPlan.safetyScore) * 100) / 100;

        Alert.alert('Route Comparison', 
          `Fastest Route: ${Math.ceil((fastestPlan.durationSecs || 0)/60)} mins, Safety: ${Math.round(fastestPlan.safetyScore * 100) / 100}\n\n` +
          `Safest Route: ${Math.ceil((safestPlan.durationSecs || 0)/60)} mins, Safety: ${Math.round(safestPlan.safetyScore * 100) / 100}\n\n` +
          `Time difference: ${timeDiff > 0 ? '+' : ''}${timeDiff} mins\n` +
          `Safety improvement: ${safetyDiff > 0 ? '+' : ''}${safetyDiff} points\n\n` +
          `Check console for detailed analysis!`
        );
      } else {
        console.log('❌ One or both routes failed');
        Alert.alert('Route Test', 'Failed to generate one or both routes');
      }
    } catch (error: any) {
      console.error('🚫 Route comparison test error:', error);
      Alert.alert('Route Test Error', error.message || 'Unknown error');
    }
  };

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

  const [selectedRoute, setSelectedRoute] = useState<null | {
    polyline: { latitude: number; longitude: number }[],
    distanceMeters?: number,
    durationSecs?: number,
    safetyScore?: number,
    raw?: any
  }>(null);

  return (
  <SafeAreaView style={styles.container} edges={['left', 'right']}>
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

              // Show location details first instead of transport selection
              setShowLocationDetails(true);
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
            routePolyline={selectedRoute?.polyline}
            routeInfo={{
              distanceMeters: selectedRoute?.distanceMeters,
              durationSecs: selectedRoute?.durationSecs,
              safetyScore: selectedRoute?.safetyScore
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

      {/* Location Details Panel - Step 1 */}
      {showLocationDetails && previewLocation && !showRouteOptions && (
        <View style={styles.locationDetailsPanel}>
          <View style={styles.locationDetailsHeader}>
            <View style={styles.locationDetailsInfo}>
              <Ionicons name="location" size={24} color="#007AFF" />
              <View style={styles.locationDetailsText}>
                <Text style={styles.locationDetailsName} numberOfLines={2}>
                  {previewLocation.name}
                </Text>
                <Text style={styles.locationDetailsDescription} numberOfLines={3}>
                  {previewLocation.description}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.locationDetailsCloseButton}
              onPress={() => {
                setShowLocationDetails(false);
                setPreviewLocation(null);
              }}
            >
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.getRouteButton}
            onPress={async () => {
              if (!userLocation || !previewLocation) return;
              
              setShowLocationDetails(false);
              
              try {
                // Get all route options for all transport modes
                const routePromises = [
                  { mode: 'driving' as const, icon: 'car', label: 'Car' },
                  { mode: 'walking' as const, icon: 'walk', label: 'Walk' },
                  { mode: 'bicycling' as const, icon: 'bicycle', label: 'Bike' }
                ].map(async (transport) => {
                  try {
                    const fastest = await planRoutesAndSelect(
                      { lat: userLocation.coords.latitude, lng: userLocation.coords.longitude },
                      { lat: previewLocation.latitude, lng: previewLocation.longitude },
                      transport.mode,
                      'fastest',
                      mockIncidents
                    );
                    
                    const safest = await planRoutesAndSelect(
                      { lat: userLocation.coords.latitude, lng: userLocation.coords.longitude },
                      { lat: previewLocation.latitude, lng: previewLocation.longitude },
                      transport.mode,
                      'safest',
                      mockIncidents
                    );
                    
                    return {
                      transport,
                      fastest,
                      safest
                    };
                  } catch (error) {
                    console.error(`Error getting routes for ${transport.mode}:`, error);
                    return {
                      transport,
                      fastest: null,
                      safest: null
                    };
                  }
                });
                
                const routes = await Promise.all(routePromises);
                setAvailableRoutes(routes.filter(r => r.fastest || r.safest));
                setShowRouteOptions(true);
                
              } catch (error) {
                console.error('Error getting routes:', error);
                Alert.alert('Error', 'Failed to get route options');
              }
            }}
          >
            <Ionicons name="navigate" size={20} color="#fff" />
            <Text style={styles.getRouteButtonText}>Get Routes</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Route Options Panel - Step 2 */}
      {showRouteOptions && availableRoutes.length > 0 && (
        <View style={styles.routeOptionsPanel}>
          <View style={styles.routeOptionsHeader}>
            <Text style={styles.routeOptionsTitle}>Choose Your Route</Text>
            <TouchableOpacity 
              style={styles.routeOptionsCloseButton}
              onPress={() => {
                setShowRouteOptions(false);
                setAvailableRoutes([]);
                setShowLocationDetails(true);
              }}
            >
              <Ionicons name="arrow-back" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.routeOptionsList} showsVerticalScrollIndicator={false}>
            {availableRoutes.map((routeGroup, index) => (
              <View key={index} style={styles.routeGroupContainer}>
                <View style={styles.routeGroupHeader}>
                  <Ionicons name={routeGroup.transport.icon as any} size={20} color="#007AFF" />
                  <Text style={styles.routeGroupTitle}>{routeGroup.transport.label}</Text>
                </View>
                
                {/* Fastest Route Option */}
                {routeGroup.fastest && (
                  <TouchableOpacity
                    style={styles.routeOptionItem}
                    onPress={() => {
                      setTransportMode(routeGroup.transport.mode === 'bicycling' ? 'motorbike' : routeGroup.transport.mode);
                      setRouteType('fastest');
                      setSelectedRoute({
                        polyline: routeGroup.fastest.polyline,
                        distanceMeters: routeGroup.fastest.distanceMeters,
                        durationSecs: routeGroup.fastest.durationSecs,
                        safetyScore: routeGroup.fastest.safetyScore,
                        raw: routeGroup.fastest.rawRoute,
                      });
                      setDestination(previewLocation!.name);
                      setDestinationCoords({
                        latitude: previewLocation!.latitude,
                        longitude: previewLocation!.longitude,
                        name: previewLocation!.name
                      });
                      setShowSafeRoute(true);
                      setUseSafeRoute(false);
                      setShowRouteOptions(false);
                      setShowTransportSelection(true);
                    }}
                  >
                    <View style={styles.routeOptionContent}>
                      <View style={styles.routeOptionLeft}>
                        <Ionicons name="flash" size={16} color="#FF9500" />
                        <Text style={styles.routeOptionType}>Fastest</Text>
                      </View>
                      <View style={styles.routeOptionRight}>
                        <Text style={styles.routeOptionTime}>{Math.ceil((routeGroup.fastest.durationSecs || 0)/60)} min</Text>
                        <Text style={styles.routeOptionDistance}>{Math.round((routeGroup.fastest.distanceMeters || 0)/1000*100)/100} km</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
                
                {/* Safest Route Option */}
                {routeGroup.safest && (
                  <TouchableOpacity
                    style={styles.routeOptionItem}
                    onPress={() => {
                      setTransportMode(routeGroup.transport.mode === 'bicycling' ? 'motorbike' : routeGroup.transport.mode);
                      setRouteType('safest');
                      setSelectedRoute({
                        polyline: routeGroup.safest.polyline,
                        distanceMeters: routeGroup.safest.distanceMeters,
                        durationSecs: routeGroup.safest.durationSecs,
                        safetyScore: routeGroup.safest.safetyScore,
                        raw: routeGroup.safest.rawRoute,
                      });
                      setDestination(previewLocation!.name);
                      setDestinationCoords({
                        latitude: previewLocation!.latitude,
                        longitude: previewLocation!.longitude,
                        name: previewLocation!.name
                      });
                      setShowSafeRoute(true);
                      setUseSafeRoute(true);
                      setShowRouteOptions(false);
                      setShowTransportSelection(true);
                    }}
                  >
                    <View style={styles.routeOptionContent}>
                      <View style={styles.routeOptionLeft}>
                        <Ionicons name="shield-checkmark" size={16} color="#34C759" />
                        <Text style={styles.routeOptionType}>Safest</Text>
                      </View>
                      <View style={styles.routeOptionRight}>
                        <Text style={styles.routeOptionTime}>{Math.ceil((routeGroup.safest.durationSecs || 0)/60)} min</Text>
                        <Text style={styles.routeOptionDistance}>{Math.round((routeGroup.safest.distanceMeters || 0)/1000*100)/100} km</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Compact Transportation Selection Bottom Panel - Step 3 */}
      {(showTransportSelection || selectedRoute) && previewLocation && (
        <View style={styles.compactBottomPanel}>
          {/* Header with location and close button */}
          <View style={styles.compactHeader}>
            <View style={styles.compactLocationInfo}>
              <Ionicons name="location" size={16} color="#007AFF" />
              <Text style={styles.compactLocationName} numberOfLines={1}>
                {previewLocation.name}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.compactCloseButton}
              onPress={() => {
                // Clear everything when closed
                setShowTransportSelection(false);
                setShowLocationDetails(false);
                setShowRouteOptions(false);
                setAvailableRoutes([]);
                setSelectedRoute(null);
                setShowSafeRoute(false);
                setDestination('');
                setDestinationCoords(undefined);
                setPreviewLocation(null);
              }}
            >
              <Ionicons name="close" size={18} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Compact controls row */}
          <View style={styles.compactControls}>
            {/* Transportation modes */}
            <View style={styles.compactTransportModes}>
              <TouchableOpacity
                style={[styles.compactModeButton, transportMode === 'driving' && styles.compactModeActive]}
                onPress={() => setTransportMode('driving')}
              >
                <Ionicons name="car" size={16} color={transportMode === 'driving' ? '#fff' : '#007AFF'} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.compactModeButton, transportMode === 'motorbike' && styles.compactModeActive]}
                onPress={() => setTransportMode('motorbike')}
              >
                <Ionicons name="bicycle" size={16} color={transportMode === 'motorbike' ? '#fff' : '#007AFF'} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.compactModeButton, transportMode === 'walking' && styles.compactModeActive]}
                onPress={() => setTransportMode('walking')}
              >
                <Ionicons name="walk" size={16} color={transportMode === 'walking' ? '#fff' : '#007AFF'} />
              </TouchableOpacity>
            </View>

            {/* Route type toggle */}
            <TouchableOpacity
              style={[styles.compactRouteToggle, routeType === 'safest' ? styles.compactSafestActive : styles.compactFastestActive]}
              onPress={() => setRouteType(routeType === 'safest' ? 'fastest' : 'safest')}
            >
              <Ionicons 
                name={routeType === 'safest' ? 'shield-checkmark' : 'flash'} 
                size={14} 
                color="#fff" 
              />
              <Text style={styles.compactRouteText}>
                {routeType === 'safest' ? 'Safe' : 'Fast'}
              </Text>
            </TouchableOpacity>

            {/* Navigate button */}
            <TouchableOpacity
              style={styles.compactNavigateButton}
              onPress={async () => {
                if (!previewLocation || !userLocation) {
                  Alert.alert('Error', 'Missing location or destination.');
                  return;
                }

                try {
                  const apiMode: 'driving' | 'bicycling' | 'walking' =
                    transportMode === 'motorbike' ? 'driving' : transportMode;

                  const plan = await planRoutesAndSelect(
                    { lat: userLocation.coords.latitude, lng: userLocation.coords.longitude },
                    { lat: previewLocation.latitude, lng: previewLocation.longitude },
                    apiMode,
                    routeType,
                    mockIncidents
                  );

                  if (!plan) {
                    Alert.alert('No route', 'Could not find any route to the destination.');
                    return;
                  }

                  // Set route state
                  setDestination(previewLocation.name);
                  setDestinationCoords({
                    latitude: previewLocation.latitude,
                    longitude: previewLocation.longitude,
                    name: previewLocation.name
                  });

                  setShowSafeRoute(true);
                  setUseSafeRoute(routeType === 'safest');

                  setSelectedRoute({
                    polyline: plan.polyline,
                    distanceMeters: plan.distanceMeters,
                    durationSecs: plan.durationSecs,
                    safetyScore: plan.safetyScore,
                    raw: plan.rawRoute,
                  });

                  Alert.alert('Route ready', `${routeType === 'fastest' ? 'Fastest' : 'Safest'} route selected.\nDistance: ${Math.round(plan.distanceMeters/1000*100)/100} km\nETA: ${Math.ceil((plan.durationSecs || 0)/60)} mins`);

                } catch (err: any) {
                  console.error('Routing error', err);
                  Alert.alert('Routing error', err.message || 'Unexpected error while planning route.');
                }
              }}
            >
              <Ionicons name="navigate" size={16} color="#fff" />
              <Text style={styles.compactNavigateText}>Go</Text>
            </TouchableOpacity>
          </View>

          {/* Route info (shown when route is active) */}
          {selectedRoute && (
            <View style={styles.compactRouteInfo}>
              <Text style={styles.compactRouteInfoText}>
                {Math.round((selectedRoute.distanceMeters || 0)/1000*100)/100} km • {Math.ceil((selectedRoute.durationSecs || 0)/60)} min • Safety: {Math.round((selectedRoute.safetyScore || 0) * 100) / 100}
              </Text>
            </View>
          )}
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
              region={region}
              incidents={filteredIncidents}
              showSafeRoute={showSafeRoute}
              destination={destinationCoords}
              useSafeRoute={useSafeRoute}
              onFullscreen={() => setIsFullScreenMap(true)}
              onMapPress={(latitude, longitude) => {
                console.log('Map clicked at:', { latitude, longitude });
              }}
              routePolyline={selectedRoute?.polyline}
              routeInfo={{
                distanceMeters: selectedRoute?.distanceMeters,
                durationSecs: selectedRoute?.durationSecs,
                safetyScore: selectedRoute?.safetyScore
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
  // Location Details Panel Styles - Step 1
  locationDetailsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 15,
    maxHeight: '40%',
  },
  locationDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  locationDetailsInfo: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
    gap: 12,
  },
  locationDetailsText: {
    flex: 1,
  },
  locationDetailsName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    lineHeight: 24,
  },
  locationDetailsDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  locationDetailsCloseButton: {
    padding: 4,
    marginLeft: 12,
  },
  getRouteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  getRouteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Route Options Panel Styles - Step 2
  routeOptionsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 15,
    maxHeight: '70%',
  },
  routeOptionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  routeOptionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  routeOptionsCloseButton: {
    padding: 4,
  },
  routeOptionsList: {
    flex: 1,
  },
  routeGroupContainer: {
    marginBottom: 20,
  },
  routeGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  routeGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  routeOptionItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    overflow: 'hidden',
  },
  routeOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  routeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeOptionType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  routeOptionRight: {
    alignItems: 'flex-end',
  },
  routeOptionTime: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  routeOptionDistance: {
    fontSize: 12,
    color: '#666',
  },
  // Compact Bottom Panel Styles - Step 3
  compactBottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  compactLocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  compactLocationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  compactCloseButton: {
    padding: 4,
  },
  compactControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  compactTransportModes: {
    flexDirection: 'row',
    gap: 8,
  },
  compactModeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  compactModeActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  compactRouteToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 4,
  },
  compactSafestActive: {
    backgroundColor: '#34C759',
  },
  compactFastestActive: {
    backgroundColor: '#FF9500',
  },
  compactRouteText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  compactNavigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 4,
  },
  compactNavigateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  compactRouteInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  compactRouteInfoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});