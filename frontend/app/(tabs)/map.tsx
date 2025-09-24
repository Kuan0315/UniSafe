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
  const [region, setRegion] = useState<{ latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number } | undefined>(undefined);
  const [isFullScreenMap, setIsFullScreenMap] = useState(false);
  const [destination, setDestination] = useState<string>('');
  const [destinationCoords, setDestinationCoords] = useState<{ latitude: number; longitude: number; name?: string } | undefined>();
  const [origin, setOrigin] = useState<string>('');
  const [originCoords, setOriginCoords] = useState<{ latitude: number; longitude: number; name?: string } | undefined>();
  const [useSafeRoute, setUseSafeRoute] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showLocationPreview, setShowLocationPreview] = useState(false);
  const [previewLocation, setPreviewLocation] = useState<{ latitude: number; longitude: number; name: string; description: string } | null>(null);
  const [transportMode, setTransportMode] = useState<'driving' | 'motorbike' | 'walking'>('driving');
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const [routeType, setRouteType] = useState<'safest' | 'fastest'>('safest');
  const [userHeading, setUserHeading] = useState<number>(0);
  const [showTransportSelection, setShowTransportSelection] = useState(false);
  const [showLocationDetails, setShowLocationDetails] = useState(false);
  const [showRouteOptions, setShowRouteOptions] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [showFromLocationOptions, setShowFromLocationOptions] = useState(false);
  const [selectingOriginOnMap, setSelectingOriginOnMap] = useState(false);
  const [selectingOriginTimestamp, setSelectingOriginTimestamp] = useState<number | null>(null);
  const [fitToRoute, setFitToRoute] = useState(false);
  const [availableRoutes, setAvailableRoutes] = useState<any[]>([]);


  // Speak page title on load for accessibility
  useFocusEffect(
    useCallback(() => {
      speakPageTitle('Campus Map');
    }, [])
  );

  // Request location permissions and get current location
  useEffect(() => {
    let subscriptions: { location?: any; heading?: any } = {};

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

        // Set up heading updates for compass
        subscriptions.heading = await Location.watchHeadingAsync((heading) => {
          const newHeading = heading.trueHeading || heading.magHeading;
          setUserHeading(newHeading);
        });

        // Set up real-time location updates
        subscriptions.location = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 10, // Update if user moves 10 meters
            mayShowUserSettingsDialog: true
          },
          (location) => {
            console.log('Location update:', location.coords);
            setUserLocation(location);
            
            // Only update region if not showing full route view and no destination is set
            if (!fitToRoute && !destinationCoords) {
              setRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              });
            }

            // Update heading if available
            if (location.coords.heading !== null) {
              setUserHeading(location.coords.heading);
            }

            // Check for nearby incidents
            checkNearbyIncidents(
              location.coords.latitude,
              location.coords.longitude,
              filteredIncidents
            );
          }
        );

        // Get initial location
        console.log('Getting initial position...');
        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        console.log('Initial location:', initialLocation.coords);

        setUserLocation(initialLocation);
        // Only set initial region if not showing full route view and no destination is set
        if (!fitToRoute && !destinationCoords) {
          setRegion({
            latitude: initialLocation.coords.latitude,
            longitude: initialLocation.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }

      } catch (error) {
        console.error('Error setting up location tracking:', error);
        speakButtonAction('Unable to get your current location. Please check your location settings.');
        Alert.alert('Location Error', 'Unable to get your current location. Please check your location settings.');
      }
    };

    setupLocationTracking();

    // Cleanup subscriptions when component unmounts
    return () => {
      if (subscriptions.location) {
        subscriptions.location.remove();
      }
      if (subscriptions.heading) {
        subscriptions.heading.remove();
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
        distance: `${Math.round(route.distanceMeters / 1000 * 100) / 100} km`,
        duration: `${Math.ceil((route.travelTime || 0) / 60)} mins`,
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
      console.log(`🏃 Selected FASTEST route: ${chosen.routeId} (${Math.ceil((chosen.travelTime || 0) / 60)} mins, safety: ${Math.round(chosen.safetyScore * 100) / 100})`);
    } else { // safest
      // pick minimum safetyScore; if equal, pick fastest among them
      scored.sort((a: any, b: any) => {
        if (a.safetyScore !== b.safetyScore) return a.safetyScore - b.safetyScore;
        return (a.travelTime || 0) - (b.travelTime || 0);
      });
      chosen = scored[0];
      console.log(`🛡️ Selected SAFEST route: ${chosen.routeId} (safety: ${Math.round(chosen.safetyScore * 100) / 100}, ${Math.ceil((chosen.travelTime || 0) / 60)} mins)`);
    }

    // build route info to give to map UI
    const routeInfo = {
      distanceMeters: chosen.distanceMeters,
      durationSecs: chosen.travelTime,
      safetyScore: chosen.safetyScore,
      polyline: chosen.coords,
      rawRoute: chosen.raw,
      steps: chosen.raw.legs[0].steps,
    };

    return routeInfo;
  }

  // --- Advanced turn-by-turn navigation ---
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [nextAnnouncementDistance, setNextAnnouncementDistance] = useState<number | null>(null);

  // Function to find which step the user is currently on
  const findCurrentStep = (userLat: number, userLng: number, steps: any[]) => {
    if (!steps || steps.length === 0) return 0;

    let closestStepIndex = 0;
    let minDistance = Infinity;

    // Check distance to each step's start location
    steps.forEach((step, index) => {
      if (step.start_location) {
        const stepLat = step.start_location.lat;
        const stepLng = step.start_location.lng;
        const distance = haversineMeters(
          { latitude: userLat, longitude: userLng },
          { latitude: stepLat, longitude: stepLng }
        );

        if (distance < minDistance) {
          minDistance = distance;
          closestStepIndex = index;
        }
      }
    });

    // If we're close to the end, consider the last step
    if (closestStepIndex === steps.length - 1) {
      const lastStep = steps[steps.length - 1];
      if (lastStep.end_location) {
        const endDistance = haversineMeters(
          { latitude: userLat, longitude: userLng },
          { latitude: lastStep.end_location.lat, longitude: lastStep.end_location.lng }
        );
        // If within 50 meters of destination, navigation is complete
        if (endDistance < 50) {
          return -1; // Navigation complete
        }
      }
    }

    return closestStepIndex;
  };

  // Calculate distance between two coordinates in meters
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // Check for nearby incidents and alert user
  const checkNearbyIncidents = (userLat: number, userLng: number, incidents: Incident[]) => {
    const alertDistance = 200; // Alert when within 200 meters of an incident

    incidents.forEach(incident => {
      const distance = calculateDistance(
        userLat, userLng,
        incident.location.latitude, incident.location.longitude
      );

      if (distance <= alertDistance) {
        // Check if we haven't alerted for this incident recently
        const alertKey = `incident_${incident.id}`;
        const lastAlert = (global as any)[alertKey];

        if (!lastAlert || (Date.now() - lastAlert) > 300000) { // 5 minutes cooldown
          (global as any)[alertKey] = Date.now();

          // Show alert
          Alert.alert(
            '⚠️ Safety Alert',
            `${incident.severity.toUpperCase()} INCIDENT NEARBY:\n\n${incident.title}\n${incident.description}\n\nDistance: ${Math.round(distance)}m`,
            [
              {
                text: 'View Details',
                onPress: () => {
                  setSelectedIncident(incident);
                }
              },
              {
                text: 'Dismiss',
                style: 'cancel'
              }
            ]
          );

          // Speak alert for high severity incidents
          if (incident.severity === 'high') {
            speakPageTitle(`Warning: High severity incident nearby. ${incident.title}. ${Math.round(distance)} meters away.`);
          }
        }
      }
    });
  };

  // Function to get distance to next turn
  const getDistanceToNextTurn = (userLat: number, userLng: number, currentStep: any) => {
    if (!currentStep || !currentStep.start_location) return null;

    return haversineMeters(
      { latitude: userLat, longitude: userLng },
      { latitude: currentStep.start_location.lat, longitude: currentStep.start_location.lng }
    );
  };

  // Function to get appropriate turn icon based on instruction
  const getTurnIcon = (step: any) => {
    if (!step || !step.html_instructions) {
      return <Ionicons name="arrow-forward" size={24} color="#fff" />;
    }

    const instruction = step.html_instructions.toLowerCase();

    if (instruction.includes('turn left')) {
      return <Ionicons name="arrow-back" size={24} color="#fff" style={{ transform: [{ rotate: '90deg' }] }} />;
    } else if (instruction.includes('turn right')) {
      return <Ionicons name="arrow-forward" size={24} color="#fff" style={{ transform: [{ rotate: '90deg' }] }} />;
    } else if (instruction.includes('u-turn') || instruction.includes('make a u-turn')) {
      return <Ionicons name="refresh" size={24} color="#fff" />;
    } else if (instruction.includes('roundabout') || instruction.includes('rotary')) {
      return <Ionicons name="refresh-circle" size={24} color="#fff" />;
    } else if (instruction.includes('merge')) {
      return <Ionicons name="git-merge" size={24} color="#fff" />;
    } else if (instruction.includes('exit')) {
      return <Ionicons name="log-out" size={24} color="#fff" />;
    } else {
      // Default: continue straight
      return <Ionicons name="arrow-forward" size={24} color="#fff" />;
    }
  };

  // Enhanced speak directions with turn-by-turn
  const startTurnByTurnNavigation = async () => {
    if (!selectedRoute?.steps || selectedRoute.steps.length === 0 || !userLocation) {
      Alert.alert('No route', 'Please select a route first');
      return;
    }

    setIsNavigating(true);
    setCurrentStepIndex(0);
    setIsFullScreenMap(true); // Enable full-screen mode for navigation
    setFitToRoute(false); // During navigation, follow user location
    
    // Center map on current location for navigation
    if (userLocation) {
      setRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }

    try {
      // Announce start of navigation
      await speakPageTitle('Starting navigation. Follow the highlighted route.');

      // Set up location tracking for turn-by-turn updates
      const navigationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000, // Update every 3 seconds
          distanceInterval: 5 // Or when moved 5 meters
        },
        async (location) => {
          const userLat = location.coords.latitude;
          const userLng = location.coords.longitude;

          if (!selectedRoute?.steps || selectedRoute.steps.length === 0) return;

          const currentStep = findCurrentStep(userLat, userLng, selectedRoute.steps);

          if (currentStep === -1) {
            // Navigation complete
            await speakPageTitle('You have arrived at your destination.');
            setIsNavigating(false);
            navigationSubscription.remove();
            return;
          }

          // Update current step if changed
          if (currentStep !== currentStepIndex) {
            setCurrentStepIndex(currentStep);

            // Announce the new step
            const step = selectedRoute.steps[currentStep];
            const instruction = step.html_instructions.replace(/<[^>]*>/g, '');
            await speakPageTitle(`Now: ${instruction}`);
          }

          // Check if we need to announce upcoming turn
          const distanceToNext = getDistanceToNextTurn(userLat, userLng, selectedRoute.steps[currentStepIndex]);

          if (distanceToNext !== null) {
            // Announce at 500m, 200m, 100m, 50m, and "now"
            const announcementDistances = [500, 200, 100, 50, 0];

            for (const announceDist of announcementDistances) {
              if (distanceToNext <= announceDist &&
                (nextAnnouncementDistance === null || distanceToNext < nextAnnouncementDistance)) {

                setNextAnnouncementDistance(distanceToNext);

                if (announceDist === 0) {
                  const step = selectedRoute.steps[currentStepIndex];
                  const instruction = step.html_instructions.replace(/<[^>]*>/g, '');
                  await speakPageTitle(`${instruction}`);
                } else if (announceDist < 500) {
                  const step = selectedRoute.steps[currentStepIndex];
                  const instruction = step.html_instructions.replace(/<[^>]*>/g, '');
                  await speakPageTitle(`In ${announceDist} meters: ${instruction}`);
                }

                break;
              }
            }
          }
        }
      );

      // Store subscription for cleanup
      (global as any).navigationSubscription = navigationSubscription;

    } catch (error) {
      console.error('Error starting navigation:', error);
      Alert.alert('Navigation Error', 'Unable to start turn-by-turn navigation');
      setIsNavigating(false);
    }
  };

  // Stop navigation
  const stopNavigation = () => {
    setIsNavigating(false);
    setCurrentStepIndex(0);
    setNextAnnouncementDistance(null);
    setIsFullScreenMap(false); // Disable full-screen mode
    setShowDirections(false); // Hide directions panel when stopping navigation
    setFitToRoute(true); // Go back to showing full route when navigation stops

    if ((global as any).navigationSubscription) {
      (global as any).navigationSubscription.remove();
    }
  };

  // Speak directions functionality
  const speakDirections = async () => {
    if (!selectedRoute?.steps) {
      Alert.alert('No directions', 'Please select a route first');
      return;
    }

    try {
      let directionsText = 'Starting navigation. ';
      selectedRoute.steps.forEach((step: any, index: number) => {
        const instruction = step.html_instructions.replace(/<[^>]*>/g, ''); // Remove HTML tags
        const distance = step.distance.text;
        directionsText += `Step ${index + 1}: ${instruction}. ${distance}. `;
      });
      directionsText += 'You have arrived at your destination.';

      await speakPageTitle(directionsText);
    } catch (error) {
      console.error('Error speaking directions:', error);
      Alert.alert('Speech Error', 'Unable to speak directions');
    }
  };

  // Speak current step
  const speakCurrentStep = async () => {
    if (isNavigating && selectedRoute?.steps) {
      const currentStep = selectedRoute.steps[currentStepIndex];
      const instruction = currentStep.html_instructions.replace(/<[^>]*>/g, '');
      await speakPageTitle(`Current instruction: ${instruction}`);
    }
  };

  // Get current navigation info
  const getCurrentNavigationInfo = () => {
    if (!selectedRoute?.steps || !isNavigating) return null;

    const currentStep = selectedRoute.steps[currentStepIndex];
    const nextStep = selectedRoute.steps[currentStepIndex + 1];

    return {
      currentStep,
      nextStep,
      currentStepIndex,
      totalSteps: selectedRoute.steps.length,
      distanceToNext: nextAnnouncementDistance
    };
  };

  // --- TEST FUNCTION: Debug routing issues ---
  const testRoute = async () => {
    if (!userLocation || !previewLocation) {
      Alert.alert('Test', 'Need both user location and destination');
      return;
    }

    const currentOrigin = originCoords || {
      latitude: userLocation.coords.latitude,
      longitude: userLocation.coords.longitude,
      name: 'Current Location'
    };

    try {
      console.log('🧪 Testing route from:', currentOrigin, 'to:', previewLocation);

      const plan = await planRoutesAndSelect(
        { lat: currentOrigin.latitude, lng: currentOrigin.longitude },
        { lat: previewLocation.latitude, lng: previewLocation.longitude },
        'walking',
        'fastest',
        mockIncidents
      );

      if (plan) {
        console.log('✅ Route found:', {
          distance: `${Math.round(plan.distanceMeters / 1000 * 100) / 100} km`,
          duration: `${Math.ceil((plan.durationSecs || 0) / 60)} mins`,
          polylinePoints: plan.polyline.length,
          firstFewPoints: plan.polyline.slice(0, 3),
          lastFewPoints: plan.polyline.slice(-3),
          safetyScore: plan.safetyScore
        });

        Alert.alert('Route Test', `Found route!\nDistance: ${Math.round(plan.distanceMeters / 1000 * 100) / 100} km\nPoints: ${plan.polyline.length}\nSafety Score: ${Math.round(plan.safetyScore * 100) / 100}`);
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

    const currentOrigin = originCoords || {
      latitude: userLocation.coords.latitude,
      longitude: userLocation.coords.longitude,
      name: 'Current Location'
    };

    try {
      console.log('🔬 COMPREHENSIVE ROUTE TEST - Comparing Fastest vs Safest');
      console.log('📍 From:', currentOrigin);
      console.log('📍 To:', previewLocation);
      console.log('🚨 Active incidents:', mockIncidents.map(inc => `${inc.title} (${inc.severity}) at ${inc.location.latitude}, ${inc.location.longitude}`));

      // Test fastest route
      console.log('\n🏃 TESTING FASTEST ROUTE:');
      const fastestPlan = await planRoutesAndSelect(
        { lat: currentOrigin.latitude, lng: currentOrigin.longitude },
        { lat: previewLocation.latitude, lng: previewLocation.longitude },
        transportMode === 'motorbike' ? 'driving' : transportMode,
        'fastest',
        mockIncidents
      );

      // Test safest route
      console.log('\n🛡️ TESTING SAFEST ROUTE:');
      const safestPlan = await planRoutesAndSelect(
        { lat: currentOrigin.latitude, lng: currentOrigin.longitude },
        { lat: previewLocation.latitude, lng: previewLocation.longitude },
        transportMode === 'motorbike' ? 'driving' : transportMode,
        'safest',
        mockIncidents
      );

      // Compare results
      if (fastestPlan && safestPlan) {
        console.log('\n📊 FINAL COMPARISON:');
        console.log('Fastest Route:', {
          distance: `${Math.round(fastestPlan.distanceMeters / 1000 * 100) / 100} km`,
          duration: `${Math.ceil((fastestPlan.durationSecs || 0) / 60)} mins`,
          safetyScore: Math.round(fastestPlan.safetyScore * 100) / 100,
          polylinePoints: fastestPlan.polyline.length
        });
        console.log('Safest Route:', {
          distance: `${Math.round(safestPlan.distanceMeters / 1000 * 100) / 100} km`,
          duration: `${Math.ceil((safestPlan.durationSecs || 0) / 60)} mins`,
          safetyScore: Math.round(safestPlan.safetyScore * 100) / 100,
          polylinePoints: safestPlan.polyline.length
        });

        const timeDiff = Math.ceil(((safestPlan.durationSecs || 0) - (fastestPlan.durationSecs || 0)) / 60);
        const safetyDiff = Math.round((fastestPlan.safetyScore - safestPlan.safetyScore) * 100) / 100;

        Alert.alert('Route Comparison',
          `Fastest Route: ${Math.ceil((fastestPlan.durationSecs || 0) / 60)} mins, Safety: ${Math.round(fastestPlan.safetyScore * 100) / 100}\n\n` +
          `Safest Route: ${Math.ceil((safestPlan.durationSecs || 0) / 60)} mins, Safety: ${Math.round(safestPlan.safetyScore * 100) / 100}\n\n` +
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
    setOrigin('');
    setOriginCoords(undefined);
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
    raw?: any,
    steps?: any[]
  }>(null);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <AppHeader
        title="Map"
      />

      {/* Search Inputs - Hide when directions, route options, or transport selection panels are shown */}
      {!showDirections && !showRouteOptions && !showTransportSelection && (
        <View style={styles.searchContainer}>
          {/* From Input */}
          <View style={[styles.searchRow, { zIndex: 20, marginBottom: 10 }]}>
            <Ionicons name="location" size={20} color="#007AFF" style={styles.searchIcon} />
            <View style={styles.searchInputContainer}>
              <PlacesSearch
                placeholder="Search starting location..."
                value={origin}
                onPlaceSelected={(place) => {
                  console.log('Origin selected:', place);

                  setOrigin(place.description);
                  setOriginCoords({
                    latitude: place.latitude,
                    longitude: place.longitude,
                    name: place.description
                  });
                  setShowFromLocationOptions(false); // Hide options when place is selected
                }}
                onFocus={() => {
                  // Show location options when focused and no text is entered
                  if (!origin) {
                    setShowFromLocationOptions(true);
                  }
                }}
                onChangeText={(text: string) => {
                  setOrigin(text);
                  // Hide options when user starts typing
                  if (text.length > 0) {
                    setShowFromLocationOptions(false);
                  } else {
                    setShowFromLocationOptions(true);
                  }
                }}
                style={styles.placesSearch}
                suggestionsZIndex={1600}
              />
            </View>
          </View>

          {/* From Location Options - Show when input is focused */}
          {showFromLocationOptions && (
            <View style={styles.locationOptionsInline}>
              <TouchableOpacity
                style={styles.locationOptionInline}
                onPress={() => {
                  if (userLocation) {
                    setOrigin('Current Location');
                    setOriginCoords({
                      latitude: userLocation.coords.latitude,
                      longitude: userLocation.coords.longitude,
                      name: 'Current Location'
                    });
                    setShowFromLocationOptions(false);
                  }
                }}
              >
                <Ionicons name="locate" size={20} color="#007AFF" />
                <Text style={styles.locationOptionInlineText}>Use current location</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.locationOptionInline}
                onPress={() => {
                  console.log('Choose on map pressed, enabling selection mode');
                  setSelectingOriginOnMap(true);
                  setSelectingOriginTimestamp(Date.now());
                  setShowFromLocationOptions(false);
                  Alert.alert('Choose on Map', 'Tap on the map to select your starting location');
                }}
              >
                <Ionicons name="map" size={20} color="#007AFF" />
                <Text style={styles.locationOptionInlineText}>Choose on map</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* To Input */}
          <View style={[styles.searchRow, { zIndex: 10 }]}>
            <Ionicons name="flag" size={20} color="#007AFF" style={styles.searchIcon} />
            <View style={styles.searchInputContainer}>
              <PlacesSearch
                placeholder="Search destination..."
                value={destination}
                onPlaceSelected={(place) => {
                  console.log('🎯 Destination selected:', place);

                  // Set preview location data
                  setPreviewLocation({
                    latitude: place.latitude,
                    longitude: place.longitude,
                    name: place.description,
                    description: place.description
                  });

                  // Set destination coordinates for map marker
                  setDestinationCoords({
                    latitude: place.latitude,
                    longitude: place.longitude,
                    name: place.description
                  });
                  console.log('🚩 Flag should appear at:', { lat: place.latitude, lng: place.longitude });

                  // Focus map on destination
                  const destinationRegion = {
                    latitude: place.latitude,
                    longitude: place.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  };
                  console.log('🗺️ Setting map region to destination:', destinationRegion);
                  setRegion(destinationRegion);

                  // Show location details first instead of transport selection
                  setShowLocationDetails(true);
                }}
                onChangeText={(text: string) => {
                  setDestination(text);
                  // Clear destination marker when user starts typing new destination
                  if (!text.trim()) {
                    setDestinationCoords(undefined);
                    setPreviewLocation(null);
                    setShowLocationDetails(false);
                  }
                }}
                style={styles.placesSearch}
                suggestionsZIndex={1600}
              />
            </View>
          </View>
        </View>
      )}

      {/* Google Maps */}
      <View style={styles.mapContainer}>
        {userLocation ? (
          <GoogleMapsView
            userLocation={{
              latitude: userLocation.coords.latitude,
              longitude: userLocation.coords.longitude
            }}
            userHeading={userHeading}
            {...(region && { region })}
            incidents={filteredIncidents}
            showSafeRoute={showSafeRoute}
            destination={destinationCoords}
            origin={originCoords}
            useSafeRoute={useSafeRoute}
            onFullscreen={() => setIsFullScreenMap(true)}
            onMapPress={(latitude, longitude) => {
              const now = Date.now();
              const timeSinceSelectionEnabled = selectingOriginTimestamp ? now - selectingOriginTimestamp : Infinity;
              console.log('Map pressed, selectingOriginOnMap:', selectingOriginOnMap, 'time since enabled:', timeSinceSelectionEnabled, 'coords:', { latitude, longitude });
              
              // Ignore map presses that happen too soon after enabling selection mode (prevent spurious touches)
              if (selectingOriginOnMap && timeSinceSelectionEnabled > 500) {
                // Additional check: ignore presses that are too close to the user's current location
                // to prevent accidental presses on the user marker
                if (userLocation) {
                  const distance = Math.sqrt(
                    Math.pow(latitude - userLocation.coords.latitude, 2) +
                    Math.pow(longitude - userLocation.coords.longitude, 2)
                  );
                  // If the press is within 0.0001 degrees (~11 meters) of user location, ignore it
                  if (distance < 0.0001) {
                    console.log('Ignoring map press too close to user location');
                    return;
                  }
                }
                
                console.log('Setting origin from map press');
                // Set origin to tapped location
                setOrigin(`Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
                setOriginCoords({
                  latitude,
                  longitude,
                  name: `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
                });
                setSelectingOriginOnMap(false);
                setSelectingOriginTimestamp(null);
                Alert.alert('Origin Set', 'Starting location has been set to the tapped location on the map.');
              } else if (selectingOriginOnMap) {
                console.log('Ignoring spurious map press too soon after enabling selection mode');
              } else {
                console.log('Map clicked at:', { latitude, longitude });
              }
            }}
            routePolyline={selectedRoute?.polyline}
            fitToRoute={fitToRoute}
            {...(selectedRoute && availableRoutes.length > 0 && {
              routeInfo: {
                distanceMeters: selectedRoute.distanceMeters,
                durationSecs: selectedRoute.durationSecs,
                safetyScore: selectedRoute.safetyScore
              }
            })}
            availableRoutes={availableRoutes}
            onRouteSelect={(route, routeType) => {
              setSelectedRoute({
                polyline: route.polyline,
                distanceMeters: route.distanceMeters,
                durationSecs: route.durationSecs,
                safetyScore: route.safetyScore,
                raw: route.rawRoute,
                steps: route.steps,
              });
              setRouteType(routeType);
              setUseSafeRoute(routeType === 'safest');
              setFitToRoute(true); // Fit map to show complete route
            }}
            showFilterButton={true}
            onFilterPress={() => setShowFilterModal(true)}
            hasActiveFilter={selectedIncidentType !== 'all'}
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
              if (!previewLocation) return;

              const currentOrigin = originCoords || (userLocation ? {
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude,
                name: 'Current Location'
              } : null);

              if (!currentOrigin) {
                Alert.alert('Error', 'Unable to determine origin location');
                return;
              }

              setShowLocationDetails(false);

              try {
                // Get all route options for all transport modes
                const routePromises = [
                  { mode: 'driving' as const, icon: 'car', label: 'Car', transportKey: 'driving' },
                  { mode: 'driving' as const, icon: 'bicycle', label: 'Motor', transportKey: 'motorbike' },
                  { mode: 'walking' as const, icon: 'walk', label: 'Walk', transportKey: 'walking' },
                  { mode: 'bicycling' as const, icon: 'bicycle', label: 'Bike', transportKey: 'bicycling' }
                ].map(async (transport) => {
                  try {
                    const fastest = await planRoutesAndSelect(
                      { lat: currentOrigin.latitude, lng: currentOrigin.longitude },
                      { lat: previewLocation.latitude, lng: previewLocation.longitude },
                      transport.mode,
                      'fastest',
                      mockIncidents
                    );

                    const safest = await planRoutesAndSelect(
                      { lat: currentOrigin.latitude, lng: currentOrigin.longitude },
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
                const validRoutes = routes.filter(r => r.fastest || r.safest);
                setAvailableRoutes(validRoutes);

                // Automatically show the first available route
                if (validRoutes.length > 0) {
                  const firstRoute = validRoutes[0];
                  if (firstRoute.fastest) {
                    setSelectedRoute({
                      polyline: firstRoute.fastest.polyline,
                      distanceMeters: firstRoute.fastest.distanceMeters,
                      durationSecs: firstRoute.fastest.durationSecs,
                      safetyScore: firstRoute.fastest.safetyScore,
                      raw: firstRoute.fastest.rawRoute,
                      steps: firstRoute.fastest.steps,
                    });
                    setRouteType('fastest');
                    setUseSafeRoute(false);
                    setFitToRoute(true); // Show full route view
                    setDestination(previewLocation!.name);
                    setDestinationCoords({
                      latitude: previewLocation!.latitude,
                      longitude: previewLocation!.longitude,
                      name: previewLocation!.name
                    });
                    setOriginCoords(currentOrigin); // Set origin to show grey dot at route start
                    setShowSafeRoute(true);
                    setUseSafeRoute(false);
                    setShowTransportSelection(true);
                  }
                }

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
                      setTransportMode(routeGroup.transport.transportKey === 'bicycling' ? 'motorbike' : routeGroup.transport.transportKey);
                      setRouteType('fastest');
                      setSelectedRoute({
                        polyline: routeGroup.fastest.polyline,
                        distanceMeters: routeGroup.fastest.distanceMeters,
                        durationSecs: routeGroup.fastest.durationSecs,
                        safetyScore: routeGroup.fastest.safetyScore,
                        raw: routeGroup.fastest.rawRoute,
                        steps: routeGroup.fastest.steps,
                      });
                      setDestination(previewLocation!.name);
                      setDestinationCoords({
                        latitude: previewLocation!.latitude,
                        longitude: previewLocation!.longitude,
                        name: previewLocation!.name
                      });
                      // Set origin coords to show grey dot at route start
                      const routeOrigin = originCoords || (userLocation ? {
                        latitude: userLocation.coords.latitude,
                        longitude: userLocation.coords.longitude,
                        name: 'Current Location'
                      } : undefined);
                      if (routeOrigin) {
                        setOriginCoords(routeOrigin);
                      }
                      setShowSafeRoute(true);
                      setUseSafeRoute(false);
                      setShowRouteOptions(false);
                      setShowTransportSelection(true);
                      setFitToRoute(true); // Show full route view
                    }}
                  >
                    <View style={styles.routeOptionContent}>
                      <View style={styles.routeOptionLeft}>
                        <Ionicons name="flash" size={16} color="#FF9500" />
                        <Text style={styles.routeOptionType}>Fastest</Text>
                      </View>
                      <View style={styles.routeOptionRight}>
                        <Text style={styles.routeOptionTime}>{Math.ceil((routeGroup.fastest.durationSecs || 0) / 60)} min</Text>
                        <Text style={styles.routeOptionDistance}>{Math.round((routeGroup.fastest.distanceMeters || 0) / 1000 * 100) / 100} km</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Safest Route Option */}
                {routeGroup.safest && (
                  <TouchableOpacity
                    style={styles.routeOptionItem}
                    onPress={() => {
                      setTransportMode(routeGroup.transport.transportKey === 'bicycling' ? 'motorbike' : routeGroup.transport.transportKey);
                      setRouteType('safest');
                      setSelectedRoute({
                        polyline: routeGroup.safest.polyline,
                        distanceMeters: routeGroup.safest.distanceMeters,
                        durationSecs: routeGroup.safest.durationSecs,
                        safetyScore: routeGroup.safest.safetyScore,
                        raw: routeGroup.safest.rawRoute,
                        steps: routeGroup.safest.steps,
                      });
                      setDestination(previewLocation!.name);
                      setDestinationCoords({
                        latitude: previewLocation!.latitude,
                        longitude: previewLocation!.longitude,
                        name: previewLocation!.name
                      });
                      // Set origin coords to show grey dot at route start
                      const routeOrigin = originCoords || (userLocation ? {
                        latitude: userLocation.coords.latitude,
                        longitude: userLocation.coords.longitude,
                        name: 'Current Location'
                      } : undefined);
                      if (routeOrigin) {
                        setOriginCoords(routeOrigin);
                      }
                      setShowSafeRoute(true);
                      setUseSafeRoute(true);
                      setShowRouteOptions(false);
                      setShowTransportSelection(true);
                      setFitToRoute(true); // Show full route view
                    }}
                  >
                    <View style={styles.routeOptionContent}>
                      <View style={styles.routeOptionLeft}>
                        <Ionicons name="shield-checkmark" size={16} color="#34C759" />
                        <Text style={styles.routeOptionType}>Safest</Text>
                      </View>
                      <View style={styles.routeOptionRight}>
                        <Text style={styles.routeOptionTime}>{Math.ceil((routeGroup.safest.durationSecs || 0) / 60)} min</Text>
                        <Text style={styles.routeOptionDistance}>{Math.round((routeGroup.safest.distanceMeters || 0) / 1000 * 100) / 100} km</Text>
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
                setFitToRoute(false); // Reset fit to route
                setShowSafeRoute(false);
                setDestination('');
                setDestinationCoords(undefined);
                setOrigin('');
                setOriginCoords(undefined);
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
                onPress={async () => {
                  const newMode = 'driving';
                  setTransportMode(newMode);

                  // If we have a destination, recalculate the route
                  if (destinationCoords && userLocation) {
                    try {
                      const route = await planRoutesAndSelect(
                        { lat: userLocation.coords.latitude, lng: userLocation.coords.longitude },
                        { lat: destinationCoords.latitude, lng: destinationCoords.longitude },
                        newMode,
                        routeType,
                        mockIncidents
                      );
                      if (route) {
                        setSelectedRoute(route);
                        setFitToRoute(true); // Show full route view
                      }
                    } catch (error) {
                      console.error('Error recalculating route:', error);
                    }
                  }
                }}
              >
                <Ionicons name="car" size={16} color={transportMode === 'driving' ? '#fff' : '#007AFF'} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.compactModeButton, transportMode === 'motorbike' && styles.compactModeActive]}
                onPress={async () => {
                  const newMode = 'bicycling';
                  setTransportMode('motorbike');

                  // If we have a destination, recalculate the route
                  if (destinationCoords && userLocation) {
                    try {
                      const route = await planRoutesAndSelect(
                        { lat: userLocation.coords.latitude, lng: userLocation.coords.longitude },
                        { lat: destinationCoords.latitude, lng: destinationCoords.longitude },
                        newMode,
                        routeType,
                        mockIncidents
                      );
                      if (route) {
                        setSelectedRoute(route);
                        setFitToRoute(true); // Show full route view
                      }
                    } catch (error) {
                      console.error('Error recalculating route:', error);
                    }
                  }
                }}
              >
                <Ionicons name="bicycle" size={16} color={transportMode === 'motorbike' ? '#fff' : '#007AFF'} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.compactModeButton, transportMode === 'walking' && styles.compactModeActive]}
                onPress={async () => {
                  const newMode = 'walking';
                  setTransportMode(newMode);

                  // If we have a destination, recalculate the route
                  if (destinationCoords && userLocation) {
                    try {
                      const route = await planRoutesAndSelect(
                        { lat: userLocation.coords.latitude, lng: userLocation.coords.longitude },
                        { lat: destinationCoords.latitude, lng: destinationCoords.longitude },
                        newMode,
                        routeType,
                        mockIncidents
                      );
                      if (route) {
                        setSelectedRoute(route);
                        setFitToRoute(true); // Show full route view
                      }
                    } catch (error) {
                      console.error('Error recalculating route:', error);
                    }
                  }
                }}
              >
                <Ionicons name="walk" size={16} color={transportMode === 'walking' ? '#fff' : '#007AFF'} />
              </TouchableOpacity>
            </View>

            {/* Route type toggle and action buttons */}
            <View style={styles.compactActionButtons}>
              <TouchableOpacity
                style={[styles.compactRouteToggle, routeType === 'safest' ? styles.compactSafestActive : styles.compactFastestActive]}
                onPress={() => {
                  const newRouteType = routeType === 'safest' ? 'fastest' : 'safest';
                  setRouteType(newRouteType);

                  // If we have available routes, switch between fastest and safest
                  if (availableRoutes.length > 0) {
                    const currentTransportGroup = availableRoutes.find(group =>
                      (group.transport.mode === 'bicycling' ? 'motorbike' : group.transport.mode) === transportMode
                    );

                    if (currentTransportGroup) {
                      const routeToSelect = currentTransportGroup[newRouteType];
                      if (routeToSelect) {
                        setSelectedRoute({
                          polyline: routeToSelect.polyline,
                          distanceMeters: routeToSelect.distanceMeters,
                          durationSecs: routeToSelect.durationSecs,
                          safetyScore: routeToSelect.safetyScore,
                          raw: routeToSelect.rawRoute,
                          steps: routeToSelect.steps,
                        });
                        setFitToRoute(true); // Show full route view
                      }
                    }
                  }
                }}
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

              {/* Directions button only */}
              <TouchableOpacity
                style={styles.compactDirectionsButton}
                onPress={() => {
                  // Show directions instead of navigating
                  setShowDirections(!showDirections);
                }}
              >
                <Ionicons name="list" size={16} color="#fff" />
                <Text style={styles.compactDirectionsText}>Directions</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Route info (shown when route is active) */}
          {selectedRoute && (
            <View style={styles.compactRouteInfo}>
              <Text style={styles.compactRouteInfoText}>
                {Math.round((selectedRoute.distanceMeters || 0) / 1000 * 100) / 100} km • {Math.ceil((selectedRoute.durationSecs || 0) / 60)} min • Safety: {Math.round((selectedRoute.safetyScore || 0) * 100) / 100}
              </Text>

              {/* Navigation Controls */}
              <View style={styles.navigationControls}>
                {!isNavigating ? (
                  <TouchableOpacity
                    style={styles.startNavigationButton}
                    onPress={startTurnByTurnNavigation}
                  >
                    <Ionicons name="navigate" size={16} color="#fff" />
                    <Text style={styles.startNavigationText}>Start Navigation</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.stopNavigationButton}
                    onPress={stopNavigation}
                  >
                    <Ionicons name="stop" size={16} color="#fff" />
                    <Text style={styles.stopNavigationText}>Stop Navigation</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Directions list */}
              {showDirections && selectedRoute.steps && (
                <View style={styles.directionsContainer}>
                  <View style={styles.directionsHeader}>
                    <Text style={styles.directionsTitle}>
                      {isNavigating ? `Step ${currentStepIndex + 1} of ${selectedRoute.steps.length}` : 'Turn-by-Turn Directions'}
                    </Text>
                    <View style={styles.directionsHeaderButtons}>
                      <TouchableOpacity
                        style={styles.speakButton}
                        onPress={async () => {
                          if (isNavigating && selectedRoute?.steps) {
                            await speakCurrentStep();
                          } else if (selectedRoute?.steps) {
                            await speakDirections();
                          }
                        }}
                      >
                        <Ionicons name="volume-high" size={16} color="#007AFF" />
                        <Text style={styles.speakButtonText}>Speak</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => {
                          // Only stop navigation and close directions panel
                          if (isNavigating) {
                            stopNavigation();
                          }
                          setShowDirections(false);
                        }}
                      >
                        <Ionicons name="close" size={20} color="#666" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Current step highlight */}
                  {isNavigating && selectedRoute?.steps && (
                    <View style={styles.currentStepContainer}>
                      <View style={styles.currentStepHeader}>
                        <Ionicons name="location" size={20} color="#007AFF" />
                        <Text style={styles.currentStepLabel}>Current Step</Text>
                        {nextAnnouncementDistance !== null && (
                          <Text style={styles.distanceToNext}>
                            {Math.round(nextAnnouncementDistance)}m to go
                          </Text>
                        )}
                      </View>
                      <Text style={styles.currentStepText}>
                        {selectedRoute.steps[currentStepIndex]?.html_instructions.replace(/<[^>]*>/g, '')}
                      </Text>
                    </View>
                  )}

                  <ScrollView style={styles.directionsList} showsVerticalScrollIndicator={false}>
                    {selectedRoute?.steps && selectedRoute.steps.map((step: any, index: number) => {
                      const instruction = step.html_instructions.replace(/<[^>]*>/g, '');
                      const isCurrentStep = isNavigating && index === currentStepIndex;
                      const isCompletedStep = isNavigating && index < currentStepIndex;

                      return (
                        <View key={index} style={[
                          styles.directionStep,
                          isCurrentStep && styles.currentDirectionStep,
                          isCompletedStep && styles.completedDirectionStep
                        ]}>
                          <View style={[
                            styles.stepNumber,
                            isCurrentStep && styles.currentStepNumber,
                            isCompletedStep && styles.completedStepNumber
                          ]}>
                            {isCompletedStep ? (
                              <Ionicons name="checkmark" size={12} color="#fff" />
                            ) : (
                              <Text style={[
                                styles.stepNumberText,
                                isCurrentStep && styles.currentStepNumberText
                              ]}>
                                {index + 1}
                              </Text>
                            )}
                          </View>
                          <View style={styles.stepContent}>
                            <Text style={[
                              styles.stepInstruction,
                              isCurrentStep && styles.currentStepInstruction,
                              isCompletedStep && styles.completedStepInstruction
                            ]}>
                              {instruction}
                            </Text>
                            <Text style={[
                              styles.stepDistance,
                              isCurrentStep && styles.currentStepDistance,
                              isCompletedStep && styles.completedStepDistance
                            ]}>
                              {step.distance.text}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
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
        <View style={styles.incidentContainer}>
          <View style={styles.incidentInfo}>
            <Ionicons
              name={getIncidentIcon(selectedIncident?.type || '')}
              size={24}
              color={getIncidentColor(selectedIncident?.type || '')}
            />
            <Text style={styles.incidentType}>
              {selectedIncident?.type
                ? selectedIncident.type.charAt(0).toUpperCase() + selectedIncident.type.slice(1)
                : ''}
            </Text>
          </View>

          <Text style={styles.incidentDescription}>
            {selectedIncident?.description}
          </Text>
          <Text style={styles.incidentTime}>
            Reported: {selectedIncident?.time}
          </Text>

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
              userHeading={userHeading}
              {...(region && { region })}
              incidents={filteredIncidents}
              showSafeRoute={showSafeRoute}
              destination={destinationCoords}
              origin={originCoords}
              useSafeRoute={useSafeRoute}
              onFullscreen={() => setIsFullScreenMap(true)}
              onMapPress={(latitude, longitude) => {
                const now = Date.now();
                const timeSinceSelectionEnabled = selectingOriginTimestamp ? now - selectingOriginTimestamp : Infinity;
                console.log('Fullscreen map pressed, selectingOriginOnMap:', selectingOriginOnMap, 'time since enabled:', timeSinceSelectionEnabled, 'coords:', { latitude, longitude });
                
                // Ignore map presses that happen too soon after enabling selection mode (prevent spurious touches)
                if (selectingOriginOnMap && timeSinceSelectionEnabled > 500) {
                  // Additional check: ignore presses that are too close to the user's current location
                  // to prevent accidental presses on the user marker
                  if (userLocation) {
                    const distance = Math.sqrt(
                      Math.pow(latitude - userLocation.coords.latitude, 2) +
                      Math.pow(longitude - userLocation.coords.longitude, 2)
                    );
                    // If the press is within 0.0001 degrees (~11 meters) of user location, ignore it
                    if (distance < 0.0001) {
                      console.log('Ignoring fullscreen map press too close to user location');
                      return;
                    }
                  }
                  
                  console.log('Setting origin from fullscreen map press');
                  // Set origin to tapped location
                  setOrigin(`Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
                  setOriginCoords({
                    latitude,
                    longitude,
                    name: `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
                  });
                  setSelectingOriginOnMap(false);
                  setSelectingOriginTimestamp(null);
                  setIsFullScreenMap(false); // Close fullscreen when origin is set
                  Alert.alert('Origin Set', 'Starting location has been set to the tapped location on the map.');
                } else if (selectingOriginOnMap) {
                  console.log('Ignoring spurious fullscreen map press too soon after enabling selection mode');
                } else {
                  console.log('Fullscreen map clicked at:', { latitude, longitude });
                }
              }}
              routePolyline={selectedRoute?.polyline}
              fitToRoute={fitToRoute}
              {...(selectedRoute && availableRoutes.length > 0 && {
                routeInfo: {
                  distanceMeters: selectedRoute.distanceMeters,
                  durationSecs: selectedRoute.durationSecs,
                  safetyScore: selectedRoute.safetyScore
                }
              })}
              availableRoutes={availableRoutes}
              onRouteSelect={(route, routeType) => {
                setSelectedRoute({
                  polyline: route.polyline,
                  distanceMeters: route.distanceMeters,
                  durationSecs: route.durationSecs,
                  safetyScore: route.safetyScore,
                  raw: route.rawRoute,
                  steps: route.steps,
                });
                setRouteType(routeType);
                setUseSafeRoute(routeType === 'safest');
                setFitToRoute(true); // Fit map to show complete route
              }}
              showFilterButton={true}
              onFilterPress={() => setShowFilterModal(true)}
              hasActiveFilter={selectedIncidentType !== 'all'}
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

        {/* Navigation UI Overlay - Shows during turn-by-turn navigation */}
        {isNavigating && selectedRoute?.steps && (
          <View style={styles.navigationOverlay}>
            <View style={styles.navigationCard}>
              <View style={styles.navigationHeader}>
                <View style={styles.stepIndicator}>
                  <Text style={styles.navigationStepNumber}>{currentStepIndex + 1}</Text>
                  <Text style={styles.stepTotal}>of {selectedRoute.steps.length}</Text>
                </View>
                <TouchableOpacity
                  style={styles.navigationCloseButton}
                  onPress={stopNavigation}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.currentInstruction}>
                <View style={styles.turnArrowContainer}>
                  {getTurnIcon(selectedRoute.steps[currentStepIndex])}
                </View>
                <View style={styles.instructionTextContainer}>
                  <Text style={styles.instructionText} numberOfLines={2}>
                    {selectedRoute.steps[currentStepIndex]?.html_instructions.replace(/<[^>]*>/g, '') || 'Continue straight'}
                  </Text>
                  <Text style={styles.distanceText}>
                    {selectedRoute.steps[currentStepIndex]?.distance?.text || 'Continue'}
                  </Text>
                </View>
              </View>

              {selectedRoute.steps[currentStepIndex + 1] && (
                <View style={styles.nextInstruction}>
                  <Ionicons name="arrow-forward" size={16} color="#666" />
                  <Text style={styles.nextInstructionText} numberOfLines={1}>
                    Then {selectedRoute.steps[currentStepIndex + 1]?.html_instructions.replace(/<[^>]*>/g, '')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
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
    marginTop: -120,
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
  incidentContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
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
    alignItems: 'center',
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
    paddingHorizontal: 12,
    paddingVertical: 0,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    position: 'relative',
    zIndex: 10, // keep dropdown visible
  },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 100,
  },
  searchIcon: {
    width: 32,
    marginRight: 4,
    alignItems: 'center',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#e8eaed',
    marginRight: 4,
    flex: 1,
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
    paddingHorizontal: 0,
    paddingVertical: 0,
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
  inputSearchIcon: {
    marginRight: 8,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  placesSearch: {
    flex: 1,
  },
  clearSearchButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: '#fff',
    minWidth: 70,
  },
  transportModeActive: {
    backgroundColor: '#007AFF',
  },
  transportModeText: {
    marginTop: 6,
    fontSize: 12,
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 6,
  },
  showRouteButtonText: {
    fontSize: 14,
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
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    maxHeight: '35%',
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 15,
    maxHeight: '30%',
  },
  locationDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  locationDetailsInfo: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
    gap: 10,
  },
  locationDetailsText: {
    flex: 1,
  },
  locationDetailsName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
    lineHeight: 22,
  },
  locationDetailsDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 6,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  getRouteButtonText: {
    fontSize: 15,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
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
    marginBottom: 8,
  },
  compactLocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  compactLocationName: {
    fontSize: 14,
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
    gap: 8,
  },
  compactTransportModes: {
    flexDirection: 'row',
    gap: 6,
  },
  compactModeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
  directionsButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  directionsButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  speakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  speakButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  directionsList: {
    maxHeight: 150,
  },
  directionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  stepContent: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  stepDistance: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  locationOptionsModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxHeight: '70%',
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginBottom: 12,
  },
  locationOptionText: {
    flex: 1,
    marginLeft: 12,
  },
  locationOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  locationOptionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  cancelButton: {
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  directionsContainer: {
    marginTop: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    maxHeight: 200,
  },
  directionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  directionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  directionsHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeButton: {
    padding: 4,
  },
  navigationControls: {
    marginTop: 12,
    alignItems: 'center',
  },
  startNavigationButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  startNavigationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  stopNavigationButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  stopNavigationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  currentStepContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  currentStepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  currentStepLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    flex: 1,
  },
  distanceToNext: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  currentStepText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  currentDirectionStep: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  completedDirectionStep: {
    opacity: 0.6,
  },
  currentStepNumber: {
    backgroundColor: '#007AFF',
  },
  completedStepNumber: {
    backgroundColor: '#34C759',
  },
  currentStepNumberText: {
    color: '#fff',
    fontWeight: '700',
  },
  currentStepInstruction: {
    color: '#007AFF',
    fontWeight: '600',
  },
  completedStepInstruction: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  currentStepDistance: {
    color: '#007AFF',
    fontWeight: '500',
  },
  completedStepDistance: {
    color: '#666',
  },
  locationOptionsInline: {
    position: 'absolute',
    top: 60, // Position below the search input
    left: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1500,
  },
  locationOptionInline: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  locationOptionInlineText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  // Navigation UI Styles
  navigationOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  navigationCard: {
    backgroundColor: '#fff',
    margin: 12,
    marginBottom: 30,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  navigationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  navigationStepNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  stepTotal: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  navigationCloseButton: {
    padding: 8,
  },
  currentInstruction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  turnArrowContainer: {
    width: 65,
    height: 65,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  instructionTextContainer: {
    flex: 1,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    lineHeight: 20,
  },
  nextInstructionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    flex: 1,
    marginLeft: 6,
  },
  distanceText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 2,
  },
  nextInstruction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  compactActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactDirectionsButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  compactDirectionsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});