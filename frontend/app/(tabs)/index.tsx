import React, { useState, useEffect, useMemo } from 'react';
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
  const [sosHoldTimer, setSosHoldTimer] = useState<number | null>(null);
  const [isSOSActivated, setIsSOSActivated] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState<{ photo?: string; video?: string }>({});
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [sosStartTime, setSosStartTime] = useState<Date | null>(null);
  
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
    // Reset SOS press count after 3 seconds
    if (sosPressCount > 0) {
      const timer = setTimeout(() => setSosPressCount(0), 3000);
      return () => clearTimeout(timer);
    }
  }, [sosPressCount]);

  // Request location permissions
  useEffect(() => {
    (async () => {
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (locationStatus === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation(location);
      }
    })();
  }, []);

  // Speak page title on load for accessibility
  useEffect(() => {
    speakPageTitle('Home');
  }, []);

  const handleSOSPressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSosPressCount(prev => {
      const next = prev + 1;
      if (next >= 3) {
        activateSOS();
        return 0;
      }
      return next;
    });
    
    // Start hold countdown overlay for 3 seconds
    let seconds = 3;
    setCountdown(seconds);
    const intervalId: any = setInterval(() => {
      seconds -= 1;
      setCountdown(seconds);
      if (seconds <= 0) {
        clearInterval(intervalId);
        setCountdown(null);
        activateSOS();
      }
    }, 1000);
    setSosHoldTimer(intervalId as any);
    speakSOSCountdown(3);
  };

  const handleSOSPressOut = () => {
    if (sosHoldTimer) {
      // clear interval countdown if present
      // @ts-ignore
      clearInterval(sosHoldTimer);
      setSosHoldTimer(null);
    }
    setCountdown(null);
  };

  const activateSOS = async () => {
    setIsSOSActivated(true);
    setSosStartTime(new Date());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    speak('SOS activated. Sending help now.');
    
    // SILENT AUTOMATIC ACTIONS (User doesn't see these happening)
    await silentEmergencyActions();
    
    // Show SOS modal with options
    setShowSOSModal(true);
  };

  const silentEmergencyActions = async () => {
    try {
      // 1. SILENTLY take picture (simulated)
      setCapturedMedia(prev => ({ ...prev, photo: 'emergency_photo.jpg' }));
      
      // 2. SILENTLY start video recording (simulated)
      setCapturedMedia(prev => ({ ...prev, video: 'emergency_video.mp4' }));
      
      // 3. SILENTLY get live location
      const { status: locationStatus } = await Location.getForegroundPermissionsAsync();
      if (locationStatus === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation(location);
      }
      
      // 4. SILENTLY bundle and send data to emergency contacts
      await sendSilentEmergencyData();
      
      console.log('🚨 SILENT EMERGENCY ACTIONS COMPLETED:');
      console.log('- Photo captured');
      console.log('- Video recording started');
      console.log('- Location obtained');
      console.log('- Data sent to emergency contacts');
      
    } catch (error) {
      console.log('Silent emergency actions failed:', error);
    }
  };

  const sendSilentEmergencyData = async () => {
    // TODO: In real app, this would silently send SMS/app notifications
    // with photo, video, location, and timestamp to all emergency contacts
    console.log('📱 SILENTLY sending emergency data to all contacts...');
    
    // Simulate sending to multiple contacts
    const emergencyContacts = ['Mom', 'Dad', 'Campus Security'];
    emergencyContacts.forEach(contact => {
      console.log(`📤 Data sent to ${contact}:`);
      console.log(`   📍 Location: ${currentLocation ? 'Captured' : 'Getting...'}`);
      console.log(`   📸 Photo: ${capturedMedia.photo ? 'Captured' : 'Failed'}`);
      console.log(`   🎥 Video: ${capturedMedia.video ? 'Recording' : 'Failed'}`);
      console.log(`   ⏰ Time: ${sosStartTime?.toLocaleTimeString()}`);
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
    // TODO: Navigate to detailed alerts page
    Alert.alert('Safety Alerts', 'View all safety alerts');
  };

  const toggleTorch = async () => {
    try {
      // Simulate torch functionality for now
      const next = !isTorchOn;
      setIsTorchOn(next);
      speakButtonAction(next ? 'Torch turned on' : 'Torch turned off');
      Alert.alert('Torch', next ? 'Torch turned on' : 'Torch turned off');
    } catch (error) {
      speakButtonAction('Unable to control flashlight');
      Alert.alert('Error', 'Unable to control flashlight');
    }
  };

  const handleEmergencyCall = (type: string) => {
    let phoneNumber = '';
    let title = '';
    
    switch (type) {
      case 'campus':
        phoneNumber = '+1 (555) 911-0000'; // Campus Security
        title = 'Campus Security';
        break;
      case 'police':
        phoneNumber = '999'; // Emergency Police
        title = 'Police (999)';
        break;
      case 'hospital':
        phoneNumber = '+1 (555) 911-0002'; // Hospital
        title = 'Hospital';
        break;
      case 'trusted':
        // TODO: Implement trusted contact notification
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
    setShowSOSModal(false);
    setIsSOSActivated(false);
    setSosStartTime(null);
    setCapturedMedia({});
    Alert.alert('SOS Cancelled', 'Emergency has been cancelled. Stay safe!');
  };

  return (
    <SafeAreaView style={styles.container}>
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
            style={[styles.actionButton, styles.torchButton, isTorchOn && styles.torchButtonActive]} 
            onPress={toggleTorch}
            accessibilityLabel="Torchlight Button"
            accessibilityHint="Turn on or off your device flashlight"
          >
            <View style={styles.actionButtonContent}>
              <Ionicons 
                name={isTorchOn ? 'flashlight' : 'flashlight-outline'} 
                size={28} 
                color={isTorchOn ? '#fff' : '#FFD700'} 
              />
              <Text style={isTorchOn ? styles.actionButtonText : styles.torchButtonText}>
                {isTorchOn ? 'ON' : 'Torch'}
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

      {/* Enhanced SOS Modal - Shows AFTER silent actions are complete */}
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
              <Text style={styles.sosModalSubtitle}>Emergency data already sent to contacts</Text>
              <Text style={styles.sosModalTime}>
                Activated at: {sosStartTime?.toLocaleTimeString()}
              </Text>
            </View>

            {/* Status of Silent Actions */}
            <View style={styles.silentActionsStatus}>
              <Text style={styles.silentActionsTitle}>✅ Silent Actions Completed:</Text>
              <View style={styles.statusItem}>
                <Ionicons name="camera" size={20} color="#34C759" />
                <Text style={styles.statusText}>Photo captured automatically</Text>
              </View>
              <View style={styles.statusItem}>
                <Ionicons name="videocam" size={20} color="#34C759" />
                <Text style={styles.statusText}>Video recording started</Text>
              </View>
              <View style={styles.statusItem}>
                <Ionicons name="location" size={20} color="#34C759" />
                <Text style={styles.statusText}>Live location obtained</Text>
              </View>
              <View style={styles.statusItem}>
                <Ionicons name="send" size={20} color="#34C759" />
                <Text style={styles.statusText}>Data sent to emergency contacts</Text>
              </View>
            </View>

            {/* Live Location Display */}
            <View style={styles.locationMapContainer}>
              <Ionicons name="location" size={48} color="#007AFF" />
              <Text style={styles.locationText}>Your Current Location</Text>
              <Text style={styles.locationSubtext}>
                {currentLocation ? 
                  `Lat: ${currentLocation.coords.latitude.toFixed(4)}, Lon: ${currentLocation.coords.longitude.toFixed(4)}` :
                  'Getting your location...'
                }
              </Text>
            </View>

            {/* Next Steps - User chooses what to do next */}
            <View style={styles.nextStepsContainer}>
              <Text style={styles.nextStepsTitle}>What would you like to do next?</Text>
              
              <View style={styles.emergencyActionsContainer}>
                <TouchableOpacity 
                  style={[styles.emergencyButton, styles.policeButton]}
                  onPress={() => handleEmergencyCall('police')}
                >
                  <Ionicons name="car" size={24} color="#fff" />
                  <Text style={styles.emergencyButtonText}>🚓 Call 911</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.emergencyButton, styles.campusButton]}
                  onPress={() => handleEmergencyCall('campus')}
                >
                  <Ionicons name="shield-checkmark" size={24} color="#fff" />
                  <Text style={styles.emergencyButtonText}>📞 Call Campus Security</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.emergencyButton, styles.hospitalButton]}
                  onPress={() => handleEmergencyCall('hospital')}
                >
                  <Ionicons name="medical" size={24} color="#fff" />
                  <Text style={styles.emergencyButtonText}>🏥 Call Hospital</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.emergencyButton, styles.trustedButton]}
                  onPress={() => handleEmergencyCall('trusted')}
                >
                  <Ionicons name="people" size={24} color="#fff" />
                  <Text style={styles.emergencyButtonText}>👥 Call Mom/Dad</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom Action Buttons */}
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
                  size={20} 
                  color="#FFD700" 
                />
                <Text style={styles.flashlightButtonText}>
                  {isTorchOn ? 'Turn Off' : 'Turn On'} Flashlight
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      

      {/* Notifications Modal */}
      <Modal
        visible={showNotificationsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNotificationsModal(false)}
      >
        <View style={styles.sosModalOverlay}>
          <View style={styles.sosModalContent}>
            <View style={styles.sosModalHeader}>
              <TouchableOpacity style={styles.notifCloseBtn} onPress={() => setShowNotificationsModal(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
              <Ionicons name="notifications" size={40} color="#007AFF" />
              <Text style={styles.notifTitle}>Notifications</Text>
              <Text style={styles.sosModalSubtitle}>Your latest updates</Text>
            </View>
            
            {/* Read Aloud Button for Accessibility */}
            <TouchableOpacity 
              style={styles.readAloudButton}
              onPress={() => {
                const notificationText = notifications.map(n => 
                  `${n.title}. ${n.description}. Received at ${n.time}`
                ).join('. ');
                speakNotification(notificationText);
              }}
              accessibilityLabel="Read notifications aloud"
              accessibilityHint="Tap to hear all notifications read aloud"
            >
              <Ionicons name="volume-high" size={20} color="#007AFF" />
              <Text style={styles.readAloudText}>Read Aloud</Text>
            </TouchableOpacity>
            <View>
              {notifications.map(n => (
                <View key={n.id} style={styles.alertItem}>
                  <Ionicons name="notifications" size={20} color="#007AFF" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontWeight: '600', color: '#1a1a1a' }}>{n.title}</Text>
                    <Text style={{ color: '#666', marginTop: 2 }}>{n.description}</Text>
                  </View>
                  <Text style={styles.alertTime}>{n.time}</Text>
                </View>
              ))}
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
  safeRoutesButton: {
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
  safeRoutesContent: {
    flex: 1,
  },
  safeRoutesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 4,
    marginBottom: 2,
  },
  safeRoutesSubtext: {
    fontSize: 12,
    color: '#666',
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
    padding: 24,
    margin: 20,
    width: width - 40,
    maxHeight: height * 0.8,
  },
  sosModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
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
  locationText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 12,
    marginBottom: 4,
  },
  locationSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  emergencyActionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  bottomActionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  flashlightButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  flashlightButtonText: {
    fontSize: 16,
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
    marginBottom: 24,
  },
  nextStepsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
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


