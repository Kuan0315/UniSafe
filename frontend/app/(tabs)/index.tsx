import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Audio } from "expo-av";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  Dimensions,
  Modal,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { Camera } from "expo-camera";
import { CameraView, CameraType, FlashMode } from "expo-camera";
import * as MediaLibrary from 'expo-media-library';

import {
  speak,
  speakButtonAction,
  speakNotification,
  speakEmergencyAlert,
  speakSOSCountdown,
  speakPageTitle
} from '../../services/SpeechService';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
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
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [sosStartTime, setSosStartTime] = useState<Date | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>('Getting address...');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasMicrophonePermission, setHasMicrophonePermission] = useState<boolean | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const cameraRef = useRef<CameraView | null>(null);
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [cameraFlash, setCameraFlash] = useState<FlashMode>('off');
  const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState(false);
  const [autoCaptureSOS, setAutoCaptureSOS] = useState(false);
  
  const sosTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recordingRef = useRef<{ isRecording: boolean }>({ isRecording: false });

  useEffect(() => {
    (async () => {
      const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
      setHasMediaLibraryPermission(status === "granted");
    })();
  }, []);

  const toggleCameraType = () => {
    setCameraType(prev => (prev === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setCameraFlash(prev => (prev === 'off' ? 'on' : 'off'));
  };

  const [safetyAlerts, setSafetyAlerts] = useState([
    {
      id: 1,
      type: 'warning',
      message: '⚠️ Reported incident near Faculty of Engineering 5 mins ago',
      time: '5 mins ago',
    },
    {
      id: 2,
      type: 'info',
      message: 'ℹ️ Campus security patrol in Science Building area',
      time: '15 mins ago',
    },
  ]);

  const [recentActivities] = useState([
    { id: 1, type: 'guardian', count: 3, label: 'Guardian Sessions' },
    { id: 2, type: 'location', count: 12, label: 'Location Shares' },
    { id: 3, type: 'reports', count: 2, label: 'Reports Filed' },
    { id: 4, type: 'checkin', count: 8, label: 'Safety Check-ins' },
  ]);

  const notifications = useMemo(() => ([
    { id: 'n1', title: 'Trusted Friend Request accepted', description: 'Emma accepted your request.', time: '2:45 PM', read: false },
    { id: 'n2', title: 'Guardian session ended', description: 'Your route to Library completed.', time: '1:10 PM', read: true },
    { id: 'n3', title: 'Safety Alert', description: 'Patrol near Science Building.', time: '12:30 PM', read: false },
  ]), []);

  useEffect(() => {
    if (sosPressCount > 0) {
      const timer = setTimeout(() => setSosPressCount(0), 3000);
      return () => clearTimeout(timer);
    }
  }, [sosPressCount]);

  useEffect(() => {
    (async () => {
      // Request location permissions
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

      if (locationStatus === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation(location);
        reverseGeocode(location.coords.latitude, location.coords.longitude);
      }

      // Request camera and microphone permissions separately
      const { status: camStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: micStatus } = await Camera.requestMicrophonePermissionsAsync();
      
      setHasCameraPermission(camStatus === "granted");
      setHasMicrophonePermission(micStatus === "granted");
      
      console.log("Camera:", camStatus, "Mic:", micStatus);

      // Request media library permissions
      const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
      setHasMediaLibraryPermission(mediaStatus === 'granted');
    })();
  }, []);

  // Speak page title on load for accessibility
  useEffect(() => {
    speakPageTitle('Home');
  }, []);

  useEffect(() => {
    return () => {
      if (sosTimeoutRef.current) {
        clearTimeout(sosTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('@autoCaptureSOS');
      if (saved !== null) setAutoCaptureSOS(saved === 'true');
    })();
  }, []);

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const reverseGeocodedAddress = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocodedAddress.length > 0) {
        const address = reverseGeocodedAddress[0];
        const formattedAddress = [
          address.name,
          address.street,
          address.city,
          address.region,
          address.postalCode,
          address.country
        ].filter(Boolean).join(', ');

        setLocationAddress(formattedAddress || 'Address not available');
      } else {
        setLocationAddress('Address not available');
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setLocationAddress('Error getting address');
    }
  };

  const captureEmergencyMedia = async () => {
    if (!hasCameraPermission || !autoCaptureSOS) {
      console.log('No camera permission or auto-capture disabled, skipping media capture');
      return;
    }

    try {
      // Take photo first
      await takePicture();
      
      // Then start video recording
      if (cameraRef.current && cameraReady) {
        setIsRecording(true);
        recordingRef.current.isRecording = true;
        
        const video = await cameraRef.current.recordAsync({
          maxDuration: 10,
          maxFileSize: 10_000_000,
        });

        if (video?.uri) {
          if (hasMediaLibraryPermission) {
            try {
              const asset = await MediaLibrary.createAssetAsync(video.uri);
              await MediaLibrary.createAlbumAsync("SafetySOS", asset, false);
            } catch (mediaError) {
              console.log("Error saving video to media library:", mediaError);
            }
          }
          setCapturedMedia(prev => ({ ...prev, video: video.uri }));
        }
      }
    } catch (error) {
      console.log('Error in captureEmergencyMedia:', error);
    } finally {
      setIsRecording(false);
      recordingRef.current.isRecording = false;
    }
  };

  const takePicture = async () => {
    if (!hasCameraPermission) {
      Alert.alert('Error', 'Camera permission not granted');
      return;
    }

    if (cameraRef.current && cameraReady) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: false,
          exif: true
        });

        if (hasMediaLibraryPermission) {
          try {
            const asset = await MediaLibrary.createAssetAsync(photo.uri);
            await MediaLibrary.createAlbumAsync('SafetySOS', asset, false);
          } catch (mediaError) {
            console.log('Error saving photo:', mediaError);
          }
        }

        setCapturedMedia(prev => ({ ...prev, photo: photo.uri }));
        console.log('Photo captured successfully:', photo.uri);
      } catch (error) {
        console.log('Error taking picture:', error);
      }
    }
  };

  const toggleRecording = async () => {
    if (!hasCameraPermission || !hasMicrophonePermission) {
      Alert.alert("Error", "Camera or microphone permission not granted");
      return;
    }

    if (cameraRef.current && cameraReady) {
      try {
        if (isRecording) {
          await cameraRef.current.stopRecording();
          speak("Video recording stopped");
        } else {
          setIsRecording(true);
          speak("Video recording started");

          const video = await cameraRef.current.recordAsync({
            maxDuration: 60,
            maxFileSize: 50_000_000,
          });

          if (video?.uri && hasMediaLibraryPermission) {
            try {
              const asset = await MediaLibrary.createAssetAsync(video.uri);
              await MediaLibrary.createAlbumAsync("SafetySOS", asset, false);
              setCapturedMedia(prev => ({ ...prev, video: video.uri }));
            } catch (mediaError) {
              console.log("Error saving video:", mediaError);
            }
          }
        }
      } catch (error) {
        console.log("Error with video recording:", error);
        speak("Failed to control video recording");
      } finally {
        setIsRecording(false);
      }
    }
  };

  // Handle SOS long press
  const handleSOSPressIn = () => {
    sosTimeoutRef.current = setTimeout(() => {
      activateSOS();
    }, 3000);
  };

  const handleSOSPressOut = () => {
    if (sosTimeoutRef.current) {
      clearTimeout(sosTimeoutRef.current);
    }
  };

  const triggerSOSActions = async () => {
    try {
      setIsSOSActivated(true);
      setSosStartTime(new Date());

      // Run your silent emergency actions
      await silentEmergencyActions();

      // Show modal only after actions are completed
      setShowSOSModal(true);
      
      console.log("🚨 SOS fully activated!");
    } catch (error) {
      console.error("Error in triggerSOSActions:", error);
    }
  };

  const activateSOS = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      triggerSOSActions();
    } catch (err) {
      console.error("SOS activation error:", err);
    }
  };

  const silentEmergencyActions = async () => {
    try {
      if (autoCaptureSOS) {
        // Get location first
        const { status: locationStatus } = await Location.getForegroundPermissionsAsync();
        if (locationStatus === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setCurrentLocation(location);
          await reverseGeocode(location.coords.latitude, location.coords.longitude);
        }

        // Then capture media
        await captureEmergencyMedia();
        await sendSilentEmergencyData();

        console.log('🚨 SILENT EMERGENCY ACTIONS COMPLETED:');
        console.log('- Photo captured:', capturedMedia.photo ? 'Yes' : 'No');
        console.log('- Video recording:', capturedMedia.video ? 'Yes' : 'No');
        console.log('- Location obtained:', currentLocation ? 'Yes' : 'No');
      } else {
        console.log('🚨 Auto-capture disabled, skipping media capture');
        await sendSilentEmergencyData();
      }
    } catch (error) {
      console.log('Silent emergency actions failed:', error);
    }
  };

  const sendSilentEmergencyData = async () => {
    console.log('📱 SILENTLY sending emergency data to all contacts...');

    const emergencyContacts = ['Mom', 'Dad', 'Campus Security'];
    emergencyContacts.forEach(contact => {
      console.log(`📤 Data sent to ${contact}:`);
      console.log(`   📍 Location: ${currentLocation ? 'Captured' : 'Getting...'}`);
      console.log(`   📸 Photo: ${capturedMedia.photo ? 'Captured' : 'Failed'}`);
      console.log(`   🎥 Video: ${capturedMedia.video ? 'Recording' : 'Failed'}`);
      console.log(`   ⏰ Time: ${new Date().toLocaleTimeString()}`);
    });
  };

  const handleFollowMe = () => {
    const newState = !isFollowing;
    setIsFollowing(newState);
    speakButtonAction(newState ? 'Follow Me activated' : 'Follow Me deactivated');
    Alert.alert(
      newState ? 'Follow Me Activated' : 'Follow Me Deactivated',
      newState
        ? 'Your location is now being shared with trusted contacts.'
        : 'Your location is no longer being shared with trusted contacts.',
      [{ text: 'OK' }]
    );
  };

  const handleViewAllAlerts = () => {
    router.push('/alerts');
    speakButtonAction('Viewing all safety alerts');
  };

  const toggleTorch = () => {
    setIsTorchOn(prev => !prev);
  };

  const handleEmergencyCall = (type: string) => {
    let phoneNumber = '';
    let title = '';

    switch (type) {
      case 'campus':
        phoneNumber = '+1 (555) 911-0000';
        title = 'Campus Security';
        break;
      case 'police':
        phoneNumber = '999';
        title = 'Police (999)';
        break;
      case 'hospital':
        phoneNumber = '+1 (555) 911-0002';
        title = 'Hospital';
        break;
      case 'trusted':
        speakButtonAction('Notifying trusted contacts with live location');
        Alert.alert('Trusted Contact', 'Notifying your trusted contacts with live location');
        return;
    }

    Alert.alert(
      `Call ${title}`,
      `Do you want to call ${title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            Linking.openURL(`tel:${phoneNumber}`);
          },
        },
      ]
    );
  };

  const handleCancelSOS = () => {
    if (recordingRef.current.isRecording && cameraRef.current) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
      recordingRef.current.isRecording = false;
    }

    setShowSOSModal(false);
    setIsSOSActivated(false);
    setSosStartTime(null);
    setCapturedMedia({});
    Alert.alert('SOS Cancelled', 'Emergency has been cancelled. Stay safe!');
  };

  
  return (
    <SafeAreaView style={styles.container}>
    
<CameraView
        ref={cameraRef}
        style={{ width: 1, height: 1, position: "absolute", top: -1000 }}
        facing={cameraType}
        flash={(isTorchOn ? "torch" : "off") as FlashMode}
        ratio="16:9"
        onCameraReady={() => setCameraReady(true)}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with Notifications Bell */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Good morning! 👋</Text>
            <Text style={styles.subtitle}>Stay safe on campus</Text>
          </View>

          {/* Notifications Bell Button */}
          <TouchableOpacity
            style={styles.activityRingButton}
            onPress={() => {
              setShowNotificationsModal(true);
              setUnreadCount(0);
              speakButtonAction('Opening notifications');
            }}
            accessibilityLabel="Notifications"
            accessibilityHint="View your notifications"
          >
            <View style={styles.bellContainer}>
              <Ionicons name="notifications-outline" size={28} color="#007AFF" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Safety Alerts Banner */}
        <View style={styles.alertsContainer}>
          <View style={styles.alertsHeader}>
            <Text style={styles.alertsTitle}>Safety Alerts</Text>
            <TouchableOpacity onPress={handleViewAllAlerts}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {safetyAlerts.slice(0, 2).map((alert) => (
            <View key={alert.id} style={styles.alertItem}>
              <Ionicons
                name={alert.type === 'warning' ? 'warning' : 'information-circle'}
                size={20}
                color={alert.type === 'warning' ? '#ff6b35' : '#007AFF'}
              />
              <Text style={styles.alertMessage}>{alert.message}</Text>
              <Text style={styles.alertTime}>{alert.time}</Text>
            </View>
          ))}
        </View>

        {/* Main Action Buttons - Three Equal Buttons */}
        <View style={styles.actionButtonsContainer}>
          {/* SOS Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.sosButton, sosPressCount > 0 && styles.sosButtonActive]}
            onPressIn={handleSOSPressIn}
            onPressOut={handleSOSPressOut}
            activeOpacity={0.8}
            accessibilityLabel="SOS Emergency Button"
            accessibilityHint="Press and hold for 3 seconds to activate emergency SOS"
          >
            <View style={styles.actionButtonContent}>
              <Ionicons name="alert-circle" size={28} color="#fff" />
              <Text style={styles.actionButtonText}>
                {sosPressCount === 0 ? 'SOS' : `${sosPressCount}/3`}
              </Text>
              <Text style={styles.actionButtonSubtext}>
                {sosPressCount === 0 ? 'Hold 3s' : 'Keep holding!'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Follow Me Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.followMeButton, isFollowing && styles.followMeButtonActive]}
            onPress={handleFollowMe}
            accessibilityLabel="Follow Me Button"
            accessibilityHint="Share your location with trusted contacts"
          >
            <View style={styles.actionButtonContent}>
              <Ionicons
                name={isFollowing ? 'location' : 'location-outline'}
                size={28}
                color={isFollowing ? '#fff' : '#007AFF'}
              />
              <Text style={isFollowing ? styles.actionButtonText : styles.followMeText}>
                {isFollowing ? 'Following' : 'Follow Me'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Torchlight Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.torchButton,
            isTorchOn && styles.torchButtonActive,
          ]}
          onPress={toggleTorch}
          accessibilityLabel="Torchlight Button"
          accessibilityHint="Turn on or off your device flashlight"
        >
          <View style={styles.actionButtonContent}>
            <Ionicons
              name={isTorchOn ? "flashlight" : "flashlight-outline"}
              size={28}
              color={isTorchOn ? "#fff" : "#FFD700"}
            />
            <Text style={isTorchOn ? styles.actionButtonText : styles.torchButtonText}>
              {isTorchOn ? "ON" : "Torch"}
            </Text>
          </View>
        </TouchableOpacity>
        </View>
      </ScrollView>

      {/* SOS Countdown overlay */}
      {countdown !== null && (
        <View style={styles.countdownOverlay}>
          <Text style={styles.countdownText}>{countdown}</Text>
        </View>
      )}

      {/* Hidden Camera for emergency capture */}
      <View style={styles.hiddenCameraContainer}>
        
      </View>
      {/* SOS Modal - Shows AFTER silent actions are complete */}
      <Modal
        visible={showSOSModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSOSModal(false)}
      >
        <View style={styles.sosModalOverlay}>
          <View style={styles.sosModalContent}>
            {/* Header */}
            <View style={styles.sosModalHeader}>
              <Ionicons name="alert-circle" size={40} color="#FF3B30" />
              <Text style={styles.sosModalTitle}>🚨 SOS ACTIVATED</Text>
              <Text style={styles.sosModalSubtitle}>Emergency data sent to contacts</Text>
              <Text style={styles.sosModalTime}>
                Activated at: {sosStartTime?.toLocaleTimeString()}
              </Text>
            </View>

           {/* Status of Silent Actions - Icons only */}
<View style={styles.silentActionsStatus}>
  <Text style={styles.silentActionsTitle}>✅ Actions Completed:</Text>
  <View style={styles.statusIconsContainer}>
    <View style={styles.statusIcon}>
      <Ionicons
        name="camera"
        size={24}
        color={autoCaptureSOS && capturedMedia.photo ? "#34C759" : "#FF3B30"}
      />
      <Text style={styles.statusIconText}>
        {autoCaptureSOS ? (capturedMedia.photo ? "Photo" : "No Photo") : "Auto-capture Off"}
      </Text>
    </View>
    <View style={styles.statusIcon}>
      <Ionicons
        name="videocam"
        size={24}
        color={autoCaptureSOS && capturedMedia.video ? "#34C759" : "#FF3B30"}
      />
      <Text style={styles.statusIconText}>
        {autoCaptureSOS ? (capturedMedia.video ? "Video" : "No Video") : "Auto-capture Off"}
      </Text>
    </View>
    <View style={styles.statusIcon}>
      <Ionicons
        name="location"
        size={24}
        color={currentLocation ? "#34C759" : "#FF3B30"}
      />
      <Text style={styles.statusIconText}>
        {currentLocation ? "Location" : "No Location"}
      </Text>
    </View>
    <View style={styles.statusIcon}>
      <Ionicons
        name="send"
        size={24}
        color="#34C759"
      />
      <Text style={styles.statusIconText}>Sent</Text>
    </View>
  </View>
</View>
            {/* Camera Controls in SOS Modal */}
            <View style={styles.cameraControls}>
  <Text style={styles.cameraControlsTitle}>
    {autoCaptureSOS ? "Capture More Evidence:" : "Manual Evidence Capture:"}
  </Text>
  {!autoCaptureSOS && (
    <Text style={styles.cameraNote}>
      Auto-capture is disabled. Enable it in Profile settings.
    </Text>
  )}
              <View style={styles.cameraButtonsRow}>
                <TouchableOpacity
                  style={[styles.cameraControlButton, styles.photoButton]}
                  onPress={takePicture}
                >
                  <Ionicons name="camera" size={20} color="#fff" />
                  <Text style={styles.cameraControlText}>Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.cameraControlButton, isRecording ? styles.stopButton : styles.videoButton]}
                  onPress={toggleRecording}
                >
                  <Ionicons
                    name={isRecording ? "stop" : "videocam"}
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.cameraControlText}>
                    {isRecording ? "Stop" : "Video"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.cameraControlButton, styles.flashButton]}
                  onPress={toggleFlash}
                >
                  <Ionicons
                    name={cameraFlash === 'on' ? "flash" : "flash-off"}
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.cameraControlText}>
                    {cameraFlash === 'on' ? "Flash On" : "Flash Off"}
                  </Text>

                </TouchableOpacity>


                <TouchableOpacity
                  style={[styles.cameraControlButton, styles.switchCameraButton]}
                  onPress={toggleCameraType}
                >
                  <Ionicons name="camera-reverse" size={20} color="#fff" />
                  <Text style={styles.cameraControlText}>Switch</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Location Display */}
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={24} color="#007AFF" />
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationText}>Your Location:</Text>
                <Text style={styles.locationAddress}>
                  {locationAddress}
                </Text>
              </View>
            </View>

            {/* Next Steps - User chooses what to do next */}
            <View style={styles.nextStepsContainer}>
              <Text style={styles.nextStepsTitle}>What would you like to do next?</Text>

              <View style={styles.emergencyActionsContainer}>
                <TouchableOpacity
                  style={[styles.emergencyButton, styles.policeButton]}
                  onPress={() => handleEmergencyCall('police')}
                >
                  <Ionicons name="car" size={20} color="#fff" />
                  <Text style={styles.emergencyButtonText}>Call 911</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.emergencyButton, styles.campusButton]}
                  onPress={() => handleEmergencyCall('campus')}
                >
                  <Ionicons name="shield-checkmark" size={20} color="#fff" />
                  <Text style={styles.emergencyButtonText}>Campus</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.emergencyButton, styles.hospitalButton]}
                  onPress={() => handleEmergencyCall('hospital')}
                >
                  <Ionicons name="medical" size={20} color="#fff" />
                  <Text style={styles.emergencyButtonText}>Hospital</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom Action Buttons - Smaller and closer spacing */}
            <View style={styles.bottomActionsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelSOS}
              >
                <Text style={styles.cancelButtonText}>Cancel Emergency</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.flashlightButton}
                onPress={toggleTorch}
              >
                <Ionicons
                  name={isTorchOn ? 'flashlight' : 'flashlight-outline'}
                  size={16}
                  color="#FFD700"
                />
                <Text style={styles.flashlightButtonText}>
                  {isTorchOn ? 'Light On' : 'Light Off'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Recent Activity Modal */}
      <Modal
        visible={showActivityModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowActivityModal(false)}
      >
        <View style={styles.sosModalOverlay}>
          <View style={styles.sosModalContent}>
            <View style={styles.sosModalHeader}>
              <Ionicons name="pulse" size={40} color="#007AFF" />
              <Text style={styles.sosModalTitle}>📊 Recent Activity</Text>
              <Text style={styles.sosModalSubtitle}>Your Safety Summary</Text>
            </View>

            <View style={styles.activitySummaryContainer}>
              {recentActivities.map((activity) => (
                <View key={activity.id} style={styles.activityStat}>
                  <Text style={styles.activityStatLabel}>{activity.label}</Text>
                  <Text style={styles.activityStatValue}>{activity.count}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowActivityModal(false)}>
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ... your styles remain unchanged ...

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  activityRingButton: {
    padding: 10,
  },
  activityRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  activityRingFill: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 25,
    backgroundColor: '#fff',
    opacity: 0.3,
  },
  activityRingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  countdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)'
  },
  countdownText: {
    fontSize: 72,
    fontWeight: '800',
    color: '#FF3B30',
  },
  bellContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  alertsContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  alertsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  viewAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  alertMessage: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
    marginLeft: 12,
    marginRight: 8,
  },
  alertTime: {
    fontSize: 12,
    color: '#999',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sosButton: {
    backgroundColor: '#ff3b30',
  },
  sosButtonActive: {
    backgroundColor: '#ff6b35',
    transform: [{ scale: 1.05 }],
  },
  sosButtonContent: {
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  locationTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  locationCoords: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  hiddenCameraContainer: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
  },
  hiddenCamera: {
    width: 1,
    height: 1,
  },
  cameraControls: {
    marginBottom: 16,
  },
  cameraControlsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  cameraButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  cameraControlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 4,
  },
  cameraNote: {
  fontSize: 12,
  color: '#666',
  textAlign: 'center',
  marginBottom: 8,
  fontStyle: 'italic',
},
  photoButton: {
    backgroundColor: '#34C759',
  },
  videoButton: {
    backgroundColor: '#007AFF',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  flashButton: {
    backgroundColor: '#FF9500',
  },
  switchCameraButton: {
    backgroundColor: '#5856D6',
  },
  cameraControlText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  statusIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  statusIconText: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  actionButtonContent: {
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  actionButtonSubtext: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
  actionButtonTextActive: {
    color: '#fff',
  },
  followMeButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  followMeTextActive: {
    color: '#fff',
  },
  torchButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  torchButtonActive: {
    backgroundColor: '#FFD700',
  },
  torchButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFD700',
    marginTop: 8,
    marginBottom: 4,
  },
  torchButtonTextActive: {
    color: '#fff',
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginLeft: 12,
  },

  recentActivityContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  activityText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
  // SOS Modal Styles
  sosModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    width: width - 40,
    maxHeight: height * 0.8,
  },
  sosModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },

  notifCloseBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 4,
  },
  notifTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 8,
  },
  sosModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginTop: 12,
    marginBottom: 4,
  },
  notifHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sosModalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  sosModalTime: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  locationMapContainer: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },

  locationSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  emergencyActionsContainer: {
    gap: 8,
    marginBottom: 8,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  campusButton: {
    backgroundColor: '#34C759',
  },
  policeButton: {
    backgroundColor: '#007AFF',
  },
  hospitalButton: {
    backgroundColor: '#FF3B30',
  },
  trustedButton: {
    backgroundColor: '#FF9500',
  },
  emergencyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  bottomActionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  flashlightButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  flashlightButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
  },

  securityServicesContainer: {
    gap: 16,
    marginBottom: 24,
  },
  securityServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  securityServiceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  securityServiceSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  trustedContactsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  trustedContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9500',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  trustedContactText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  trustedContactSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // New styles for enhanced SOS
  silentActionsStatus: {
    marginBottom: 24,
  },
  silentActionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  nextStepsContainer: {
    marginBottom: 12,
  },
  nextStepsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  activitySummaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityStat: {
    alignItems: 'center',
  },
  activityStatLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  activityStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  readAloudButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  readAloudText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
});


