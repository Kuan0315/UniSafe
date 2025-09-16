import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  Modal,
  TextInput,
  Switch,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import TextInputWithVoice from '../../components/TextInputWithVoice';
import {
  speakPageTitle,
  speakButtonAction,
  speakGuardianStatus,
  speakEmergencyAlert
} from '../../services/SpeechService';

const { width, height } = Dimensions.get('window');

interface GuardianSession {
  id: string;
  startTime: Date;
  destination: string;
  estimatedArrival: Date;
  isActive: boolean;
  route: Array<{ latitude: number; longitude: number }>;
  trustedContacts: string[];
}

interface SafetyCheckIn {
  id: string;
  timestamp: Date;
  response: 'yes' | 'no' | 'pending';
}

export default function GuardianScreen() {
  const [guardianSession, setGuardianSession] = useState<GuardianSession | null>(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [destination, setDestination] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [checkInInterval, setCheckInInterval] = useState(5); // minutes
  const [lastCheckIn, setLastCheckIn] = useState<Date | null>(null);
  const [nextCheckIn, setNextCheckIn] = useState<Date | null>(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{ latitude: number; longitude: number }>>([]);

  // Mock trusted contacts
  const mockTrustedContacts = [
    { id: '1', name: 'Sarah Mom', phone: '+1 (555) 123-4567', relationship: 'Mother' },
    { id: '2', name: 'Mike Dad', phone: '+1 (555) 234-5678', relationship: 'Father' },
    { id: '3', name: 'Emma Friend', phone: '+1 (555) 345-6789', relationship: 'Best Friend' },
  ];

  // Animation for check-in reminder
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  // Speak page title on load for accessibility
  useFocusEffect(
    useCallback(() => {
      speakPageTitle('Guardian Mode');
    }, [])
  );

  useEffect(() => {
    if (guardianSession?.isActive) {
      startCheckInTimer();
      startLocationTracking();
    }
  }, [guardianSession]);

  useEffect(() => {
    if (nextCheckIn && new Date() >= nextCheckIn) {
      showSafetyCheckIn();
    }
  }, [nextCheckIn]);

  const startCheckInTimer = () => {
    const interval = setInterval(() => {
      const now = new Date();
      const next = new Date(now.getTime() + checkInInterval * 60000);
      setNextCheckIn(next);
    }, 1000);
    return () => clearInterval(interval);
  };

  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required for Guardian mode');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);

      // Mock route generation (replace with actual routing API)
      const mockRoute = [
        { latitude: location.coords.latitude, longitude: location.coords.longitude },
        { latitude: location.coords.latitude + 0.001, longitude: location.coords.longitude + 0.001 },
        { latitude: location.coords.latitude + 0.002, longitude: location.coords.longitude + 0.002 },
      ];
      setRouteCoordinates(mockRoute);
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  };

  const showSafetyCheckIn = () => {
    setShowCheckInModal(true);
    startPulseAnimation();
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleStartGuardian = () => {
    if (!destination.trim() || selectedContacts.length === 0) {
      speakButtonAction('Please enter destination and select trusted contacts');
      Alert.alert('Missing Information', 'Please enter destination and select trusted contacts');
      return;
    }

    const session: GuardianSession = {
      id: Date.now().toString(),
      startTime: new Date(),
      destination,
      estimatedArrival: new Date(Date.now() + 30 * 60000), // 30 minutes from now
      isActive: true,
      route: routeCoordinates,
      trustedContacts: selectedContacts,
    };

    setGuardianSession(session);
    setShowStartModal(false);
    setDestination('');
    setSelectedContacts([]);

    // Speak Guardian mode activation
    speakGuardianStatus(`Guardian mode activated. Security monitoring your path to ${destination}`);

    // Notify trusted contacts
    Alert.alert(
      'Guardian Mode Activated',
      `Your trusted contacts have been notified. They can now monitor your journey to ${destination}.`
    );
  };

  const handleStopGuardian = () => {
    Alert.alert(
      'Stop Guardian Mode',
      'Are you sure you want to stop Guardian mode? Your trusted contacts will be notified.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: () => {
            setGuardianSession(null);
            setCurrentLocation(null);
            setRouteCoordinates([]);
            setLastCheckIn(null);
            setNextCheckIn(null);
            Alert.alert('Guardian Mode Stopped', 'Your journey monitoring has been stopped.');
          },
        },
      ]
    );
  };

  const handleCheckInResponse = (response: 'yes' | 'no') => {
    setLastCheckIn(new Date());
    setShowCheckInModal(false);
    pulseAnimation.stopAnimation();

    if (response === 'yes') {
      // Schedule next check-in
      const next = new Date(Date.now() + checkInInterval * 60000);
      setNextCheckIn(next);
      Alert.alert('Check-in Complete', 'Thank you! Stay safe on your journey.');
    } else {
      // Escalate to trusted contacts and security
      Alert.alert(
        'Help Requested',
        'Your trusted contacts and campus security have been notified immediately.',
        [{ text: 'OK' }]
      );
    }
  };

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const getEstimatedTime = () => {
    if (!guardianSession) return '';
    const now = new Date();
    const diff = guardianSession.estimatedArrival.getTime() - now.getTime();
    const minutes = Math.max(0, Math.floor(diff / 60000));
    return `${minutes} min`;
  };

  const getProgressPercentage = () => {
    if (!guardianSession) return 0;
    const now = new Date();
    const total = guardianSession.estimatedArrival.getTime() - guardianSession.startTime.getTime();
    const elapsed = now.getTime() - guardianSession.startTime.getTime();
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Virtual Guardian</Text>
          <Text style={styles.subtitle}>Stay safe on your journey</Text>
        </View>

        {/* Guardian Status */}
        {guardianSession?.isActive ? (
          <View style={styles.activeSessionContainer}>
            <View style={styles.sessionHeader}>
              <Ionicons name="shield-checkmark" size={24} color="#34C759" />
              <Text style={styles.sessionTitle}>Guardian Active</Text>
              <TouchableOpacity onPress={handleStopGuardian}>
                <Ionicons name="stop-circle" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>

            <View style={styles.sessionInfo}>
              <Text style={styles.destinationText}>To: {guardianSession.destination}</Text>
              <Text style={styles.timeText}>ETA: {getEstimatedTime()}</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]} />
              </View>
              <Text style={styles.progressText}>{Math.round(getProgressPercentage())}% Complete</Text>
            </View>

            {/* Live Map */}
            <View style={styles.mapContainer}>
              {currentLocation && (
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: currentLocation.coords.latitude,
                    longitude: currentLocation.coords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  showsUserLocation
                  followsUserLocation
                >
                  {/* Current location marker */}
                  <Marker
                    coordinate={{
                      latitude: currentLocation.coords.latitude,
                      longitude: currentLocation.coords.longitude,
                    }}
                    title="You"
                  />

                  {/* Route polyline */}
                  {routeCoordinates.length > 1 && (
                    <Polyline
                      coordinates={routeCoordinates}
                      strokeColor="#007AFF"
                      strokeWidth={4}
                    />
                  )}
                </MapView>
              )}
            </View>

            {/* Trusted Contacts Status */}
            <View style={styles.contactsStatus}>
              <Text style={styles.contactsTitle}>Trusted Contacts Monitoring</Text>
              {guardianSession.trustedContacts.map(contactId => {
                const contact = mockTrustedContacts.find(c => c.id === contactId);
                return contact ? (
                  <View key={contactId} style={styles.contactStatus}>
                    <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactStatusText}>Monitoring</Text>
                  </View>
                ) : null;
              })}
            </View>

            {/* Next Check-in */}
            {nextCheckIn && (
              <View style={styles.checkInInfo}>
                <Ionicons name="time" size={20} color="#FF9500" />
                <Text style={styles.checkInText}>
                  Next safety check-in in {Math.max(0, Math.floor((nextCheckIn.getTime() - Date.now()) / 60000))} minutes
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.inactiveContainer}>
            <Ionicons name="shield-outline" size={64} color="#ccc" />
            <Text style={styles.inactiveTitle}>Guardian Mode Inactive</Text>
            <Text style={styles.inactiveSubtitle}>
              Start a journey to activate live monitoring and safety features
            </Text>

            <TouchableOpacity
              style={styles.startButton}
              onPress={() => setShowStartModal(true)}
            >
              <Ionicons name="play" size={24} color="#fff" />
              <Text style={styles.startButtonText}>Start Guardian Mode</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Settings Button */}
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowSettingsModal(true)}
        >
          <Ionicons name="settings" size={20} color="#666" />
          <Text style={styles.settingsButtonText}>Guardian Settings</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Start Guardian Modal */}
      <Modal
        visible={showStartModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowStartModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Start Guardian Mode</Text>
            <TouchableOpacity onPress={handleStartGuardian}>
              <Text style={styles.modalStartButton}>Start</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <TextInputWithVoice
              label="Destination *"
              value={destination}
              onChangeText={setDestination}
              placeholder="Where are you going?"
              prompt="destination"
            />

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Select Trusted Contacts *</Text>
              <Text style={styles.inputSubtext}>
                Choose who will monitor your journey
              </Text>
              {mockTrustedContacts.map(contact => (
                <TouchableOpacity
                  key={contact.id}
                  style={[
                    styles.contactOption,
                    selectedContacts.includes(contact.id) && styles.contactOptionSelected
                  ]}
                  onPress={() => toggleContactSelection(contact.id)}
                >
                  <Ionicons
                    name={selectedContacts.includes(contact.id) ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={selectedContacts.includes(contact.id) ? '#007AFF' : '#ccc'}
                  />
                  <View style={styles.contactOptionInfo}>
                    <Text style={styles.contactOptionName}>{contact.name}</Text>
                    <Text style={styles.contactOptionRelationship}>{contact.relationship}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Guardian Settings</Text>
            <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Safety Check-in Interval</Text>
                <Text style={styles.settingDescription}>
                  How often to ask if you're okay during your journey
                </Text>
              </View>
              <TextInputWithVoice
                value={checkInInterval.toString()}
                onChangeText={(text) => setCheckInInterval(parseInt(text) || 5)}
                keyboardType="numeric"
                placeholder="5"
                prompt="check-in interval in minutes"
                style={{ flex: 1, marginRight: 8 }}
                inputStyle={{ width: 60, textAlign: 'center' }}
              />
              <Text style={styles.intervalUnit}>min</Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Safety Check-in Modal */}
      <Modal
        visible={showCheckInModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowCheckInModal(false)}
      >
        <View style={styles.checkInModalOverlay}>
          <Animated.View
            style={[
              styles.checkInModalContent,
              { transform: [{ scale: pulseAnimation }] }
            ]}
          >
            <Ionicons name="shield-checkmark" size={64} color="#007AFF" />
            <Text style={styles.checkInModalTitle}>Safety Check-in</Text>
            <Text style={styles.checkInModalText}>
              Are you okay on your journey?
            </Text>

            <View style={styles.checkInButtons}>
              <TouchableOpacity
                style={[styles.checkInButton, styles.yesButton]}
                onPress={() => handleCheckInResponse('yes')}
              >
                <Ionicons name="checkmark" size={24} color="#fff" />
                <Text style={styles.checkInButtonText}>Yes, I'm Safe</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.checkInButton, styles.noButton]}
                onPress={() => handleCheckInResponse('no')}
              >
                <Ionicons name="close" size={24} color="#fff" />
                <Text style={styles.checkInButtonText}>Need Help</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  inactiveContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
  },
  inactiveTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  inactiveSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  activeSessionContainer: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    marginLeft: 12,
  },
  sessionInfo: {
    marginBottom: 16,
  },
  destinationText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e1e5e9',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  map: {
    flex: 1,
  },
  contactsStatus: {
    marginBottom: 16,
  },
  contactsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  contactStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginLeft: 8,
    flex: 1,
  },
  contactStatusText: {
    fontSize: 12,
    color: '#34C759',
  },
  checkInInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7e6',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  checkInText: {
    fontSize: 14,
    color: '#FF9500',
    marginLeft: 8,
    flex: 1,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingsButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  modalStartButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  inputSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#f8f9fa',
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  contactOptionSelected: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  contactOptionInfo: {
    marginLeft: 12,
    flex: 1,
  },
  contactOptionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  contactOptionRelationship: {
    fontSize: 14,
    color: '#666',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  intervalInput: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    padding: 8,
    width: 60,
    textAlign: 'center',
    fontSize: 16,
    marginRight: 8,
  },
  intervalUnit: {
    fontSize: 16,
    color: '#666',
  },
  // Check-in Modal Styles
  checkInModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkInModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    margin: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  checkInModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  checkInModalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  checkInButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    minWidth: 120,
  },
  yesButton: {
    backgroundColor: '#34C759',
  },
  noButton: {
    backgroundColor: '#FF3B30',
  },
  checkInButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  mapPlaceholder: {
    alignItems: 'center',
    padding: 20,
  },
  mapPlaceholderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 4,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  locationInfo: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  locationLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  locationCoordinates: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
});

