import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Alert, TouchableOpacity, View, Text, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Dimensions } from 'react-native';
import Header from '../../components/Header';
import SafetyAlerts from '../../components/SafetyAlerts';
import SOSModal from '../../components/Modals/SOSModal';
import NotificationsModal from '../../components/Modals/NotificationsModal';
import ActivityModal from '../../components/Modals/ActivityModal';
import FollowMeButton from '../../components/FollowMeButton';
import usePermissions from '../hooks/usePermissions';
import useLocation from '../hooks/useLocation';
import { speakPageTitle, speakButtonAction } from '../../services/SpeechService';
import { triggerSOSActions, captureEmergencyMedia, takeEmergencyPhoto, canSaveToGallery } from '../../services/SOSService';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { capturePhoto, captureVideo } from '../../services/SimpleCaptureService';
import * as FileSystem from 'expo-file-system';
import { Camera } from 'expo-camera';

function HomeScreen() {
  const [sosPressCount, setSosPressCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isSOSActivated, setIsSOSActivated] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState<{ photo?: string; video?: string }>({});
  const [sosStartTime, setSosStartTime] = useState<Date | null>(null);
  const [autoCaptureSOS, setAutoCaptureSOS] = useState(true); // Enable auto-capture by default
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const { currentLocation, locationAddress, requestLocationPermission } = useLocation();
  const permissions = usePermissions();

  // Refs for countdown and SOS activation
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sosTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Camera states for photo/video capture
  const [cameraType, setCameraType] = useState<'front' | 'back'>('back');
  const [cameraFlash, setCameraFlash] = useState<'on' | 'off'>('off');

  useEffect(() => {
    speakPageTitle('Home');
  }, []);

  // Load the auto-capture setting from AsyncStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedAutoCapture = await AsyncStorage.getItem('@autoCaptureSOS');
        if (savedAutoCapture !== null) {
          setAutoCaptureSOS(savedAutoCapture === 'true');
        }
      } catch (error) {
        console.error('Error loading SOS settings:', error);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const requestPermissions = async () => {
      // Request location permissions
      const locationStatus = await Location.requestForegroundPermissionsAsync();
      if (locationStatus.status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for SOS.');
      }
      
      // Request camera permissions for flashlight
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      if (cameraStatus.status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required for flashlight functionality.');
      }
      
      // Using SimpleCaptureService that doesn't need MediaLibrary permissions
      console.log('Using SimpleCaptureService for media capture, no MediaLibrary permissions needed');
    };
    requestPermissions();
  }, []);

  const handleCancelSOS = () => {
    setIsSOSActivated(false);
    setShowSOSModal(false);
    console.log('SOS canceled');
  };
  
  // Function to manually take a photo during SOS
  const takePicture = async () => {
    try {
      console.log('Starting photo capture...');
      
      // Use our simplified capturePhoto function that handles permissions internally
      const photoUri = await capturePhoto();
      
      if (!photoUri) {
        console.log('User canceled or no photo captured');
        return;
      }
      
      console.log('Photo captured successfully:', photoUri);
      
      // Save the URI to state - no need to save to gallery with SimpleCaptureService
      setCapturedMedia((prev) => ({ ...prev, photo: photoUri }));
      
    } catch (error: any) {
      console.error('Error in takePicture:', error);
      
      // More specific error handling
      if (error.code === 'UserCancel') {
        console.log('User canceled photo capture');
        return;
      }
      
      Alert.alert(
        'Camera Error', 
        'Unable to take photo. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Toggle camera flash
  const toggleFlash = () => {
    setCameraFlash((prev: 'on' | 'off') => prev === 'on' ? 'off' : 'on');
  };
  
  // Toggle camera type (front/back)
  const toggleCameraType = () => {
    setCameraType((prev: 'front' | 'back') => prev === 'back' ? 'front' : 'back');
  };
  
  // Toggle the device torch/flashlight
  const toggleTorch = async () => {
    try {
      // Check camera permission first
      const { status } = await Camera.getCameraPermissionsAsync();
      
      if (status !== 'granted') {
        const { status: newStatus } = await Camera.requestCameraPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Camera permission is needed to use the flashlight.',
            [{ text: 'OK' }]
          );
          return;
        }
        setHasCameraPermission(newStatus === 'granted');
      }
      
      // Toggle flashlight state
      const newTorchState = !isTorchOn;
      
      // Update state
      setIsTorchOn(newTorchState);
      
      // Provide feedback
      speakButtonAction(newTorchState ? 'Torch activated' : 'Torch deactivated');
      
      // Show informative alert about development build requirement
      Alert.alert(
        newTorchState ? 'Torch Activated' : 'Torch Deactivated',
        'Note: The actual flashlight requires a development build to function. This is a simulated response in Expo Go.',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Error toggling torch:', error);
      Alert.alert(
        'Torch Error',
        'Failed to toggle torch. This feature may not be available on your device or requires a real device (not an emulator).',
        [{ text: 'OK' }]
      );
      // If there's an error, make sure the UI state reflects that the torch is off
      setIsTorchOn(false);
    }
  };

  const handleFollowMe = () => {
    const newState = !isFollowing;
    setIsFollowing(newState);
    Alert.alert(
      newState ? 'Follow Me Activated' : 'Follow Me Deactivated',
      newState
        ? 'Your location is now being shared with trusted contacts.'
        : 'Your location is no longer being shared with trusted contacts.',
      [{ text: 'OK' }]
    );
  };

  const activateSOS = async () => {
    try {
      // Using SimpleCaptureService that doesn't need MediaLibrary permissions
      console.log('Using SimpleCaptureService for media capture, no MediaLibrary permissions needed');
      
      // Show the SOS modal immediately
      setShowSOSModal(true);
      setSosStartTime(new Date());
      setIsSOSActivated(true);

      // Speak emergency message for accessibility
      speakButtonAction('Emergency SOS activated. Sending your location to trusted contacts.');

      // Get the user's current location
      let location;
      try {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        console.log("Got location:", JSON.stringify(location));
      } catch (error) {
        console.error('Failed to get accurate location:', error);
        // Fallback to last known location
        location = currentLocation;
      }

      // Get trusted contacts from profile (mockTrustedCircle in the mock data)
      const trustedContacts = ['Mom', 'Dad', 'Campus Security'];

      // Send emergency location to trusted contacts
      await triggerSOSActions(location, trustedContacts);
      
      // Alert to show user what's happening
      Alert.alert(
        'SOS Activated',
        `Your emergency location has been sent to your trusted contacts.${autoCaptureSOS ? ' Recording emergency video...' : ''}`,
        [{ text: 'OK' }]
      );

      // If auto-capture is enabled, use the actual implementation
      if (autoCaptureSOS) {
        console.log('Auto-capturing emergency video (10 seconds)');
        
        try {
          // Use our implementation from SOSService to capture and save a video
          const videoUri = await captureEmergencyMedia(null, autoCaptureSOS);

          if (videoUri) {
            if (videoUri === 'auto-video-simulated') {
              Alert.alert(
                'Simulation in Expo Go',
                'Auto emergency video is simulated in Expo Go. Build a development client to enable saving real auto videos.',
                [{ text: 'OK' }]
              );
            } else {
              setCapturedMedia(prev => ({...prev, video: videoUri}));
              Alert.alert(
                'Video Captured',
                canSaveToGallery ?
                  'Emergency video recorded and saved to your gallery.' :
                  'Emergency video recorded (not saved to gallery in Expo Go).',
                [{ text: 'OK' }]
              );
            }
          } else {
            console.error('Failed to auto-capture emergency video');
          }
        } catch (error) {
          console.error('Error with emergency video capture:', error);
        }
      }
    } catch (error) {
      console.error('Error activating SOS:', error);
      Alert.alert('SOS Error', 'There was a problem with the SOS activation.', [
        { text: 'Try Again', onPress: () => activateSOS() },
        { text: 'Cancel', style: 'cancel' }
      ]);
    }
  };

  const handleSOSPressIn = () => {
    setCountdown(3);

    // Start the countdown interval
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev && prev > 1) {
          return prev - 1;
        } else {
          clearInterval(countdownIntervalRef.current!);
          countdownIntervalRef.current = null;
          return null;
        }
      });
    }, 1000);

    // Activate SOS after 3 seconds
    sosTimeoutRef.current = setTimeout(() => {
      clearInterval(countdownIntervalRef.current!);
      countdownIntervalRef.current = null;
      setCountdown(null);
      activateSOS(); // Ensure this function is called
    }, 3000);
  };

  const handleSOSPressOut = () => {
    clearInterval(countdownIntervalRef.current!);
    countdownIntervalRef.current = null;
    clearTimeout(sosTimeoutRef.current!);
    sosTimeoutRef.current = null;
    setCountdown(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Header unreadCount={unreadCount} onNotificationsPress={() => setShowNotificationsModal(true)} />

        {/* Safety Alerts */}
        <SafetyAlerts
          alerts={[
            { id: 1, type: 'warning', message: '⚠️ Incident near Faculty of Engineering', time: '5 mins ago' },
            { id: 2, type: 'info', message: 'ℹ️ Campus security patrol in Science Building area', time: '15 mins ago' },
          ]}
          onViewAll={() => console.log('View all alerts')}
        />
        
        {/* SOS Button - Added TouchableOpacity for SOS activation */}
        <View style={styles.sosMainContainer}>
          <TouchableOpacity
            style={[styles.sosCircleButton, countdown !== null && styles.sosCircleButtonActive]}
            onPressIn={handleSOSPressIn}
            onPressOut={handleSOSPressOut}
            activeOpacity={0.8}
            accessibilityLabel="SOS Emergency Button"
            accessibilityHint="Press and hold for 3 seconds to activate emergency SOS"
          >
            <View style={styles.sosCircleButtonContent}>
              <Ionicons name="alert-circle" size={40} color="#fff" />
              <Text style={styles.sosCircleButtonText}>
                {countdown !== null ? countdown : 'SOS'}
              </Text>
              <Text style={styles.sosCircleButtonSubtext}>
                {countdown !== null ? 'Hold...' : 'Hold 3s'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Secondary Buttons */}
          <View style={styles.secondaryButtonsContainer}>
            {/* Follow Me Button */}
            <TouchableOpacity
              style={[styles.secondaryButton, styles.followMeButton, isFollowing && styles.followMeButtonActive]}
              onPress={handleFollowMe}
              accessibilityLabel="Follow Me Button"
              accessibilityHint="Share your location with trusted contacts"
            >
              <View style={styles.secondaryButtonContent}>
                <Ionicons
                  name={isFollowing ? 'location' : 'location-outline'}
                  size={24}
                  color={isFollowing ? '#fff' : '#007AFF'}
                />
                <Text style={isFollowing ? styles.secondaryButtonTextActive : styles.secondaryButtonText}>
                  {isFollowing ? 'Following' : 'Follow Me'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Torch Button - Added TouchableOpacity for torch activation */}
            <TouchableOpacity
              style={[styles.secondaryButton, styles.torchButton, isTorchOn && styles.torchButtonActive]}
              onPress={toggleTorch}
              accessibilityLabel="Torchlight Button"
              accessibilityHint="Turn on or off your device flashlight"
            >
              <View style={styles.secondaryButtonContent}>
                <Ionicons
                  name={isTorchOn ? "flashlight" : "flashlight-outline"}
                  size={24}
                  color={isTorchOn ? "#fff" : "#FFD700"}
                />
                <Text style={isTorchOn ? styles.secondaryButtonText : styles.torchButtonText}>
                  {isTorchOn ? "ON" : "Torch"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* SOS Modal */}
      <SOSModal
        visible={showSOSModal}
        onClose={() => setShowSOSModal(false)}
        sosStartTime={sosStartTime}
        capturedMedia={capturedMedia}
        currentLocation={currentLocation}
        locationAddress={locationAddress}
        autoCaptureSOS={autoCaptureSOS}
        requestLocationPermission={requestLocationPermission}
        onMediaUpdated={() => {
          // When media is updated through external camera apps
          console.log('Media updated callback received');
          // In a real app, we would query the gallery for new photos or refresh UI
          // For testing, show a message
          setTimeout(() => {
            Alert.alert('Media Update', 'New emergency media has been captured');
          }, 500);
        }}
        handleEmergencyCall={(type) => {
          const phoneNumbers = {
            'police': '911',
            'campus': '555-CAMPUS',
            'hospital': '555-HOSPITAL'
          };
          const phoneNumber = phoneNumbers[type as keyof typeof phoneNumbers];
          
          // Ask for confirmation before making the call
          Alert.alert(
            `Call ${type.charAt(0).toUpperCase() + type.slice(1)} Emergency`,
            `Are you sure you want to call ${phoneNumber}?`,
            [
              { 
                text: 'Cancel', 
                style: 'cancel' 
              },
              { 
                text: 'Call Now', 
                style: 'destructive',
                onPress: async () => {
                  try {
                    // Format the phone number for the dialer
                    const phoneUrl = `tel:${phoneNumber}`;
                    
                    // Check if the device can handle telephone links
                    const canOpen = await Linking.canOpenURL(phoneUrl);
                    
                    if (canOpen) {
                      // Open the phone dialer with the number
                      await Linking.openURL(phoneUrl);
                    } else {
                      Alert.alert('Error', `Your device cannot make phone calls to ${phoneNumber}`);
                    }
                  } catch (error) {
                    console.error('Error making emergency call:', error);
                    Alert.alert(
                      'Call Failed', 
                      `Failed to call ${phoneNumber}. Please dial manually.`
                    );
                  }
                }
              }
            ]
          );
        }}
        handleCancelSOS={handleCancelSOS}
      />

      {/* Notifications Modal */}
      <NotificationsModal
        visible={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        notifications={[
          { id: 'n1', title: 'Trusted Friend Request accepted', description: 'Emma accepted your request.', time: '2:45 PM', read: false },
          { id: 'n2', title: 'Guardian session ended', description: 'Your route to Library completed.', time: '1:10 PM', read: true },
          { id: 'n3', title: 'Safety Alert', description: 'Patrol near Science Building.', time: '12:30 PM', read: false },
        ]}
        speakNotification={(text) => speakButtonAction(text)}
      />

      {/* Activity Modal */}
      <ActivityModal
        visible={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        recentActivities={[
          { id: 1, type: 'guardian', count: 3, label: 'Guardian Sessions' },
          { id: 2, type: 'location', count: 12, label: 'Location Shares' },
          { id: 3, type: 'reports', count: 2, label: 'Reports Filed' },
          { id: 4, type: 'checkin', count: 8, label: 'Safety Check-ins' },
        ]}
      />
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
  sosMainContainer: {
    alignItems: 'center',
    marginVertical: 24,
    paddingHorizontal: 20,
  },
  sosCircleButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    marginBottom: 24,
  },
  sosCircleButtonActive: {
    backgroundColor: '#ff6b35',
    transform: [{ scale: 1.05 }],
  },
  sosCircleButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosCircleButtonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  sosCircleButtonSubtext: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
  secondaryButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 16,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  secondaryButtonContent: {
    alignItems: 'center',
  },
  followMeButton: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  followMeButtonActive: {
    backgroundColor: '#007AFF',
  },
  followMeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 8,
  },
  torchButton: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  torchButtonActive: {
    backgroundColor: '#FFD700',
  },
  torchButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
    marginTop: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 8,
  },
  secondaryButtonTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
});

// Make sure the default export is recognized by Expo Router
export default HomeScreen;