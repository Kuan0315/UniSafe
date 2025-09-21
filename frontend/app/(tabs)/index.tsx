import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  Alert, 
  TouchableOpacity, 
  View, 
  Text, 
  Linking,
  Image,
  Animated,
  Easing,
  Platform,
  StatusBar
} from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import Header from '../../components/Header';
import SafetyAlerts from '../../components/SafetyAlerts';
import SOSModal from '../../components/Modals/SOSModal';
import PostIncidentResourceScreen from '../../components/PostIncidentResourceScreen';
import ReasonForm from '../../components/ReasonForm';
import NotificationsModal from '../../components/Modals/NotificationsModal';
import ActivityModal from '../../components/Modals/ActivityModal';
import DiscreetAlarmModal from '../../components/Modals/DiscreetAlarmModal';
import HelpdeskModal from '../../components/Modals/HelpdeskModal';
import FakeCallScreen from '../../components/FakeCallScreen';
import FollowMeButton from '../../components/FollowMeButton';
import usePermissions from '../hooks/usePermissions';
import { soundAlarmService } from '../../services/SoundAlarmService';
import useLocation from '../hooks/useLocation';
import { speakPageTitle, speakButtonAction } from '../../services/SpeechService';
import { triggerSOSActions, captureEmergencyMedia, takeEmergencyPhoto, canSaveToGallery } from '../../services/SOSService';
import { useSOSContext } from '../../contexts/SOSContext';
import { useAlarmContext } from '../../contexts/AlarmContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { capturePhoto, captureVideo } from '../../services/SimpleCaptureService';
import * as FileSystem from 'expo-file-system';
import { Camera } from 'expo-camera';
import * as Haptics from 'expo-haptics';
// Import torch safely with fallback
let Torch: any = null;
try {
  Torch = require('expo-torch');
} catch (error) {
  console.log('Expo Torch module not available, using fallback');
}

// Safety Alerts Component with Priority Support
interface SafetyAlert {
  id: string;
  title: string;
  message: string;
  type: 'critical' | 'warning' | 'info';
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  isActive: boolean;
}

const SafetyAlertsSection = () => {
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = () => {
    // Mock alerts - In real app, this would fetch from API
    const mockAlerts: SafetyAlert[] = [
      {
        id: '1',
        title: 'Campus Lockdown',
        message: 'Security incident in progress. Remain in current location.',
        type: 'critical',
        priority: 'high',
        createdAt: new Date(Date.now() - 300000), // 5 mins ago
        isActive: true,
      },
      {
        id: '2',
        title: 'Heavy Rain Warning',
        message: 'Heavy rainfall expected. Exercise caution near construction areas.',
        type: 'warning',
        priority: 'medium',
        createdAt: new Date(Date.now() - 720000), // 12 mins ago
        isActive: true,
      },
      {
        id: '3',
        title: 'Parking Closure',
        message: 'Parking Lot B closed for maintenance until 6 PM.',
        type: 'info',
        priority: 'low',
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        isActive: true,
      },
    ];

    // Sort by priority: high -> medium -> low, then by creation time (newest first)
    const sortedAlerts = mockAlerts
      .filter(alert => alert.isActive)
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

    setAlerts(sortedAlerts);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return 'alert-circle';
      case 'warning': return 'warning';
      case 'info': return 'information-circle';
      default: return 'information-circle';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '🟢';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  };

  const visibleAlerts = alerts.slice(0, 2);
  const remainingCount = Math.max(0, alerts.length - 2);

  return (
    <View style={styles.alertsContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Safety Alerts</Text>
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => {
            router.push('/alerts');
          }}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={16} color="#007AFF" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.compactAlertCard}>
        {visibleAlerts.map((alert) => (
          <View key={alert.id} style={styles.compactAlertRow}>
            <View style={[
              styles.compactAlertIcon, 
              alert.type === 'critical' ? styles.compactAlertIconCritical :
              alert.type === 'warning' ? styles.compactAlertIconWarning : 
              styles.compactAlertIconInfo
            ]}>
              <Ionicons name={getAlertIcon(alert.type)} size={18} color="#fff" />
            </View>
            <View style={styles.compactAlertContent}>
              <Text style={styles.compactAlertTitle}>{alert.title}</Text>
              <Text style={styles.compactAlertMeta}>{formatTimeAgo(alert.createdAt)} • Campus-wide</Text>
            </View>
            <View style={[
              styles.compactPriorityBadge,
              alert.priority === 'medium' ? styles.compactPriorityBadgeWarning :
              alert.priority === 'low' ? styles.compactPriorityBadgeInfo : {}
            ]}>
              <Text style={styles.compactPriorityText}>{getPriorityBadge(alert.priority)}</Text>
            </View>
          </View>
        ))}
        
        {remainingCount > 0 && (
          <View style={styles.alertSummary}>
            <Text style={styles.alertSummaryText}>+{remainingCount} more alert{remainingCount > 1 ? 's' : ''}</Text>
            <View style={styles.alertStatusDots}>
              {alerts.slice(2, 5).map((alert, index) => (
                <View key={index} style={[
                  styles.statusDot,
                  alert.priority === 'high' ? styles.statusDotCritical :
                  alert.priority === 'medium' ? styles.statusDotWarning :
                  styles.statusDotInfo
                ]} />
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

function HomeScreen() {
  const { 
    isSOSActive, 
    setIsSOSActive, 
    sosStartTime, 
    setSosStartTime, 
    showSOSModal, 
    setShowSOSModal,
    setOnSOSIndicatorPress 
  } = useSOSContext();
  
  const [sosPressCount, setSosPressCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isSOSActivated, setIsSOSActivated] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState<{ photo?: string; video?: string }>({});
  const [autoCaptureSOS, setAutoCaptureSOS] = useState(true); // Enable auto-capture by default
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const { currentLocation, locationAddress, requestLocationPermission } = useLocation();
  const permissions = usePermissions();

  // Refs for countdown and SOS activation
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sosTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Refs for discreet button interactions
  const discreetTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const discreetHoldIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastDiscreetTapTimeRef = useRef<number>(0);
  // Camera states for photo/video capture
  const [cameraType, setCameraType] = useState<'front' | 'back'>('back');
  const [cameraFlash, setCameraFlash] = useState<'on' | 'off'>('off');
  
  // Post-incident resource coordination
  const [showPostIncidentResources, setShowPostIncidentResources] = useState(false);
  const [showReasonForm, setShowReasonForm] = useState(false);
  const [incidentData, setIncidentData] = useState<{ type: string; id: string } | null>(null);

  // Discreet alarm and helpdesk states
  const [showDiscreetAlarmModal, setShowDiscreetAlarmModal] = useState(false);
  const [showHelpdeskModal, setShowHelpdeskModal] = useState(false);
  const [alarmType, setAlarmType] = useState<'fake-call' | 'ring'>('fake-call');
  
  // New state for discreet button interactions
  const [discreetTapCount, setDiscreetTapCount] = useState(0);
  const [discreetHoldProgress, setDiscreetHoldProgress] = useState(0);
  const [isDiscreetHolding, setIsDiscreetHolding] = useState(false);
  const [showFakeCallScreen, setShowFakeCallScreen] = useState(false);
  
  // Use global alarm context
  const { isAlarmPlaying, currentAlarmType, startAlarm, stopAlarm } = useAlarmContext();

  // Animation for SOS button pulse effect
  const pulseAnim = useRef(new Animated.Value(1)).current;
  // Add a countdown animation ref
  const countdownPulseAnim = useRef(new Animated.Value(1)).current;
  // Pulse animation for floating SOS indicator
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);
  
  // Start a more intense pulse animation when countdown is active
  useEffect(() => {
    if (countdown !== null) {
      // Faster, more urgent pulsing during countdown
      Animated.loop(
        Animated.sequence([
          Animated.timing(countdownPulseAnim, {
            toValue: 1.15,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(countdownPulseAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          })
        ])
      ).start();
    } else {
      // Reset animation when countdown is cancelled
      countdownPulseAnim.setValue(1);
    }
  }, [countdown]);

  // Pulse animation for floating SOS indicator
  useEffect(() => {
    if (isSOSActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 0.7,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          })
        ])
      ).start();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [isSOSActive]);

  useEffect(() => {
    speakPageTitle('Home');
  }, []);

  // Set up the callback for SOS indicator press in header
  useEffect(() => {
    setOnSOSIndicatorPress(() => () => {
      setShowSOSModal(true);
    });
  }, [setOnSOSIndicatorPress, setShowSOSModal]);

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

  // Load alarm type from profile settings
  useEffect(() => {
    const loadAlarmType = async () => {
      try {
        const savedAlarmType = await AsyncStorage.getItem('@alarmType');
        if (savedAlarmType) {
          // Handle migration from old 'loud-alarm' to new 'ring'
          const migratedType = savedAlarmType === 'loud-alarm' ? 'ring' : savedAlarmType;
          setAlarmType(migratedType as 'fake-call' | 'ring');
        }
      } catch (error) {
        console.log('Error loading alarm type:', error);
      }
    };
    loadAlarmType();
  }, []);

  // Reload alarm type when user navigates back to this screen (e.g., from profile)
  useFocusEffect(
    useCallback(() => {
      const loadAlarmType = async () => {
        try {
          const savedAlarmType = await AsyncStorage.getItem('@alarmType');
          if (savedAlarmType) {
            const migratedType = savedAlarmType === 'loud-alarm' ? 'ring' : savedAlarmType;
            setAlarmType(migratedType as 'fake-call' | 'ring');
            console.log('Reloaded alarm type on focus:', migratedType);
          }
        } catch (error) {
          console.log('Error reloading alarm type:', error);
        }
      };
      loadAlarmType();
    }, [])
  );

  // Setup sound service callback to clear UI state when sound finishes
  useEffect(() => {
    soundAlarmService.setOnSoundFinished(() => {
      // Global context will handle state updates via AlarmContext
      stopAlarm();
    });
  }, [stopAlarm]);

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
    setIsSOSActive(false);
    setShowSOSModal(false);
    setSosStartTime(null);
    console.log('SOS canceled');
  };

  const handleEndEmergency = () => {
    setIsSOSActivated(false);
    setIsSOSActive(false);
    setShowSOSModal(false);
    setSosStartTime(null);
    
    // Set incident data for post-incident resources
    setIncidentData({
      type: 'emergency_resolved',
      id: `SOS_${Date.now()}`
    });
    
    // Show post-incident resources after a brief delay
    setTimeout(() => {
      setShowPostIncidentResources(true);
    }, 500);
    
    console.log('Emergency ended - showing resources');
  };

  const handleMistakeActivation = () => {
    setIsSOSActivated(false);
    setIsSOSActive(false);
    setShowSOSModal(false);
    setSosStartTime(null);
    
    // Show reason form for mistake
    setTimeout(() => {
      setShowReasonForm(true);
    }, 500);
    
    console.log('SOS was a mistake - showing reason form');
  };

  const handleReasonSubmit = (reason: string, details?: string) => {
    console.log('False alarm reason submitted:', reason, details);
    Alert.alert(
      'Report Submitted',
      'Thank you for helping us improve our emergency response system.',
      [{ text: 'OK' }]
    );
    setShowReasonForm(false);
  };
  
  const handleMinimizeSOS = () => {
    setShowSOSModal(false);
    console.log('SOS minimized - continuing in background');
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
      
      const newTorchState = !isTorchOn;
      
      // If we have the Torch module (on real device)
      if (Torch?.default?.toggleTorchAsync) {
        await Torch.default.toggleTorchAsync(newTorchState);
      } 
      // Fallback for Expo Go or when module not available
      else if (Platform.OS !== 'web') {
        console.log('Using camera torch fallback for Expo Go');
        // We'll just update the UI state since we can't actually toggle the torch in Expo Go
        Alert.alert(
          newTorchState ? 'Torch Activated' : 'Torch Deactivated', 
          'Note: In Expo Go, the torch is simulated. Install on a real device for full functionality.',
          [{ text: 'OK' }]
        );
      }
      
      // Update UI state
      setIsTorchOn(newTorchState);
      
      // Provide feedback
      speakButtonAction(newTorchState ? 'Torch activated' : 'Torch deactivated');
      
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

  // New Discreet Alarm Functions with tap-and-hold and triple-tap
  const handleDiscreetPress = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastDiscreetTapTimeRef.current;
    lastDiscreetTapTimeRef.current = now;

    // If it's been more than 500ms since last tap, reset count
    if (timeSinceLastTap > 500) {
      setDiscreetTapCount(1);
    } else {
      setDiscreetTapCount(prev => prev + 1);
    }

    // Clear any existing tap timeout
    if (discreetTapTimeoutRef.current) {
      clearTimeout(discreetTapTimeoutRef.current);
    }

    // Haptic feedback for each tap
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      console.log('Haptics not available');
    }

    // Set timeout to reset tap count
    discreetTapTimeoutRef.current = setTimeout(() => {
      setDiscreetTapCount(0);
    }, 500);
  };

  // Watch for triple tap on discreet button
  useEffect(() => {
    if (discreetTapCount === 3) {
      // Triple tap detected - trigger loud alarm
      setDiscreetTapCount(0);
      triggerLoudAlarm();
    }
  }, [discreetTapCount]);

  const handleDiscreetPressIn = () => {
    setIsDiscreetHolding(true);
    setDiscreetHoldProgress(0);
    
    // Start hold progress animation
    discreetHoldIntervalRef.current = setInterval(() => {
      setDiscreetHoldProgress(prev => {
        const newProgress = prev + (100 / 30); // 3 seconds = 30 intervals of 100ms
        if (newProgress >= 100) {
          // Hold complete - trigger discreet alarm
          clearInterval(discreetHoldIntervalRef.current!);
          setIsDiscreetHolding(false);
          setDiscreetHoldProgress(0);
          triggerDiscreetAlarm();
          return 0;
        }
        return newProgress;
      });
    }, 100);

    // Haptic feedback when hold starts
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) {
      console.log('Haptics not available');
    }
    
    speakButtonAction('Hold for discreet alert');
  };

  const handleDiscreetPressOut = () => {
    setIsDiscreetHolding(false);
    setDiscreetHoldProgress(0);
    
    // Clear hold interval
    if (discreetHoldIntervalRef.current) {
      clearInterval(discreetHoldIntervalRef.current);
      discreetHoldIntervalRef.current = null;
    }

    // Light haptic feedback when released early
    if (discreetHoldProgress > 0 && discreetHoldProgress < 100) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        console.log('Haptics not available');
      }
      speakButtonAction('Hold cancelled');
    }
  };

  const triggerDiscreetAlarm = async () => {
    try {
      // Success haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      speakButtonAction('Discreet alert activated');
      
      if (alarmType === 'fake-call') {
        // Show fake call screen instead of just playing audio
        setShowFakeCallScreen(true);
        
        // Also start the fake call audio
        await startAlarm(alarmType);
        
        Alert.alert(
          '📞 Fake Call Activated',
          'Incoming call screen displayed. You can now pretend to take an important call to safely leave the situation.',
          [{ text: 'OK' }]
        );
      } else {
        // For ring alarm, just play the sound
        await startAlarm(alarmType);
        
        Alert.alert(
          '🔊 Discreet Alert', 
          'Ring alarm activated discreetly.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.log('Error with discreet alarm:', error);
      Alert.alert('Error', 'Failed to activate discreet alert. Please try again.');
    }
  };

  const triggerLoudAlarm = async (delaySeconds: number = 0) => {
    try {
      if (delaySeconds > 0) {
        // Legacy delay functionality for scheduled alarms
        Alert.alert(
          'Discreet Alarm Set',
          `Loud alarm will sound in ${delaySeconds} seconds. Move to safety if needed.`,
          [{ text: 'OK' }]
        );

        setTimeout(async () => {
          try {
            // Strong haptic feedback for loud alarm
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            
            speakButtonAction('Loud alarm activated');
            
            // Start loud alarm (ring)
            await startAlarm('ring');
            
            Alert.alert(
              'Loud Alarm Activated',
              'Alarm is sounding. Use the alarm indicator in the top bar to stop it.',
              [{ text: 'OK' }]
            );
          } catch (error) {
            console.error('Error triggering loud alarm:', error);
            stopAlarm();
          }
        }, delaySeconds * 1000);
      } else {
        // Immediate activation for triple-tap
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        
        speakButtonAction('Loud alarm activated');
        
        // Show immediate feedback
        Alert.alert(
          '🚨 LOUD ALARM ACTIVATED',
          'Loud alarm is sounding!',
          [
            { 
              text: 'Stop Alarm', 
              onPress: () => stopAlarm(),
              style: 'destructive'
            }
          ]
        );
        
        // Start loud alarm (ring)
        await startAlarm('ring');
      }
    } catch (error) {
      console.log('Error with loud alarm:', error);
      Alert.alert('Error', 'Failed to activate loud alarm. Please try again.');
    }
  };

  // Legacy functions for compatibility
  const handleDiscreetAlarm = async () => {
    try {
      if (isAlarmPlaying) {
        // Stop the alarm if it's currently playing
        await stopAlarm();
        Alert.alert('Alarm Stopped', 'The discreet alarm has been stopped.');
      }
    } catch (error) {
      console.log('Error with discreet alarm:', error);
      Alert.alert('Error', 'Failed to control alarm. Please try again.');
    }
  };

  const handleStopAlarm = async () => {
    try {
      await stopAlarm();
      Alert.alert('Alarm Stopped', 'The alarm has been stopped.');
    } catch (error) {
      console.log('Error stopping alarm:', error);
      Alert.alert('Error', 'Failed to stop alarm.');
    }
  };

  const triggerFakeCall = async (delaySeconds: number = 30) => {
    Alert.alert(
      'Discreet Alarm Set',
      `Fake call will trigger in ${delaySeconds} seconds. Stay calm.`,
      [{ text: 'OK' }]
    );

    setTimeout(async () => {
      try {
        // Trigger haptic feedback
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        
        // Start fake call alarm
        await startAlarm('fake-call');
        
        // Simulate a fake incoming call
        Alert.alert(
          'Incoming Call',
          'Mom is calling...',
          [
            { 
              text: 'Answer', 
              onPress: () => {
                // Open phone app to make it look authentic
                Linking.openURL('tel:+1234567890');
              }
            },
            { 
              text: 'Decline' 
            }
          ]
        );
      } catch (error) {
        console.error('Error triggering fake call:', error);
        stopAlarm();
      }
    }, delaySeconds * 1000);
  };

  // Helpdesk Functions
  const handleHelpdesk = () => {
    setShowHelpdeskModal(true);
  };

  const contactHelpdesk = (method: 'call' | 'chat' | 'email') => {
    switch (method) {
      case 'call':
        Linking.openURL('tel:+60123456700');
        // Keep modal open so user can return to helpdesk
        break;
      case 'chat':
        // In a real app, this would open a live chat system
        Alert.alert('Live Chat', 'Connecting you to campus support...', [{ text: 'OK' }]);
        setShowHelpdeskModal(false); // Close only for chat since it's handled in app
        break;
      case 'email':
        Linking.openURL('mailto:support@university.edu.my?subject=Student Support Request');
        // Keep modal open so user can return to helpdesk after email
        break;
    }
  };

  const activateSOS = async () => {
    try {
      // Using SimpleCaptureService that doesn't need MediaLibrary permissions
      console.log('Using SimpleCaptureService for media capture, no MediaLibrary permissions needed');
      
      // Show the SOS modal immediately
      setShowSOSModal(true);
      setSosStartTime(new Date());
      setIsSOSActivated(true);
      setIsSOSActive(true);

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
    // Start with countdown at 3
    setCountdown(3);
    
    // Provide haptic feedback when countdown starts
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) {
      console.log('Haptics not available');
    }
    
    // Initial voice feedback
    speakButtonAction('Hold for SOS. Counting down from 3.');

    // Start the countdown interval with sound feedback
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev && prev > 1) {
          // Provide haptic feedback for each countdown step
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          } catch (e) {
            console.log('Haptics not available');
          }
          
          // Announce each number in the countdown
          speakButtonAction(`${prev - 1}`);
          
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
      
      // Final haptic feedback when countdown completes
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        console.log('Haptics not available');
      }
      
      activateSOS(); // Ensure this function is called
    }, 3000);
  };

  const handleSOSPressOut = () => {
    // Only provide feedback if the countdown was actually in progress
    if (countdown !== null) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        console.log('Haptics not available');
      }
      
      // Provide auditory feedback that SOS was canceled
      speakButtonAction('SOS canceled');
    }
    
    // Clear all timers and reset countdown
    clearInterval(countdownIntervalRef.current!);
    countdownIntervalRef.current = null;
    clearTimeout(sosTimeoutRef.current!);
    sosTimeoutRef.current = null;
    setCountdown(null);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <LinearGradient
        colors={['#f8f9fa', '#e9f0f8']}
        style={styles.container}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with welcome message and notification/activity icons */}
          <Header 
            title="Welcome" 
            subtitle="Stay safe on campus"
            unreadCount={unreadCount}
            onActivityPress={() => setShowActivityModal(true)}
            onNotificationsPress={() => {
              setShowNotificationsModal(true);
              setUnreadCount(0);
            }}
          />

          {/* Compact Safety alerts section */}
          <SafetyAlertsSection />
          
          {/* Enhanced SOS Button Section */}
          <View style={styles.sosMainContainer}>
            {/* Pulsing SOS Button */}
            <Animated.View style={[
              styles.sosCircleButtonOuterRing,
              countdown !== null && styles.sosCircleButtonUrgent,
              { transform: [{ scale: countdown !== null ? countdownPulseAnim : pulseAnim }] }
            ]}>
              <TouchableOpacity
                style={[styles.sosCircleButton, countdown !== null && styles.sosCircleButtonActive]}
                onPressIn={handleSOSPressIn}
                onPressOut={handleSOSPressOut}
                activeOpacity={0.8}
                accessibilityLabel="SOS Emergency Button"
                accessibilityHint="Press and hold for 3 seconds to activate emergency SOS"
              >
                <View style={styles.sosCircleButtonContent}>
                  {countdown === null ? (
                    <>
                      <Ionicons name="alert-circle" size={40} color="#fff" />
                      <Text style={styles.sosCircleButtonText}>SOS</Text>
                      <Text style={styles.sosCircleButtonSubtext}>Hold 3s</Text>
                    </>
                  ) : (
                    <View style={styles.countdownContainer}>
                      <Text style={styles.countdownText}>{countdown}</Text>
                      <Text style={styles.sosCircleButtonSubtext}>Keep holding...</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Secondary Buttons - 2x2 Grid */}
            <View style={styles.secondaryButtonsContainer}>
              {/* Row 1 */}
              <View style={styles.buttonRow}>
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
                      size={20}
                      color={isFollowing ? '#fff' : '#007AFF'}
                    />
                    <Text style={isFollowing ? styles.secondaryButtonTextActive : styles.secondaryButtonText}>
                      {isFollowing ? 'Following' : 'Follow Me'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Torch Button */}
                <TouchableOpacity
                  style={[styles.secondaryButton, styles.torchButton, isTorchOn && styles.torchButtonActive]}
                  onPress={toggleTorch}
                  accessibilityLabel="Torchlight Button"
                  accessibilityHint="Turn on or off your device flashlight"
                >
                  <View style={styles.secondaryButtonContent}>
                    <Ionicons
                      name={isTorchOn ? "flashlight" : "flashlight-outline"}
                      size={20}
                      color={isTorchOn ? "#fff" : "#FFD700"}
                    />
                    <Text style={isTorchOn ? styles.secondaryButtonTextLight : styles.torchButtonText}>
                      {isTorchOn ? "ON" : "Torch"}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Row 2 */}
              <View style={styles.buttonRow}>
                {/* Discreet Alarm Button with new interactions */}
                <TouchableOpacity
                  style={[
                    styles.secondaryButton, 
                    styles.discreetAlarmButton, 
                    (isAlarmPlaying || isDiscreetHolding) && styles.discreetAlarmButtonActive,
                    discreetTapCount > 0 && styles.discreetTapping
                  ]}
                  onPress={isAlarmPlaying ? handleDiscreetAlarm : handleDiscreetPress}
                  onPressIn={!isAlarmPlaying ? handleDiscreetPressIn : undefined}
                  onPressOut={!isAlarmPlaying ? handleDiscreetPressOut : undefined}
                  accessibilityLabel="Discreet Alarm Button"
                  accessibilityHint="Hold for 3 seconds for discreet alert, or tap 3 times quickly for loud alarm"
                >
                  <View style={styles.secondaryButtonContent}>
                    {isDiscreetHolding ? (
                      <View style={styles.discreetHoldContainer}>
                        <View style={styles.discreetProgressBar}>
                          <View style={[styles.discreetProgressFill, { width: `${discreetHoldProgress}%` }]} />
                        </View>
                        <Ionicons name="call" size={16} color="#fff" />
                        <Text style={styles.secondaryButtonTextActive}>Call</Text>
                        <Text style={styles.discreetHoldSubtext}>Hold...</Text>
                      </View>
                    ) : discreetTapCount > 0 ? (
                      <View style={styles.discreetTapContainer}>
                        <Text style={styles.discreetTapCountText}>{discreetTapCount}</Text>
                        <Text style={styles.discreetTapSubtext}>
                          {discreetTapCount === 1 ? "Tap 2 more" : "Tap 1 more"}
                        </Text>
                        <Text style={styles.discreetTapSubtext2}>for ALARM</Text>
                      </View>
                    ) : (
                      <>
                        <Ionicons
                          name={isAlarmPlaying ? "alarm" : "alarm-outline"}
                          size={20}
                          color={(isAlarmPlaying || isDiscreetHolding) ? "#fff" : "#FF6B35"}
                        />
                        <Text style={(isAlarmPlaying || isDiscreetHolding) ? styles.secondaryButtonTextActive : styles.discreetAlarmButtonText}>
                          {isAlarmPlaying ? 'Stop' : 'Discreet'}
                        </Text>
                      </>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Helpdesk Button */}
                <TouchableOpacity
                  style={[styles.secondaryButton, styles.helpdeskButton]}
                  onPress={handleHelpdesk}
                  accessibilityLabel="Helpdesk Button"
                  accessibilityHint="Contact campus support and helpdesk services"
                >
                  <View style={styles.secondaryButtonContent}>
                    <Ionicons
                      name="help-circle-outline"
                      size={20}
                      color="#8B5CF6"
                    />
                    <Text style={styles.helpdeskButtonText}>
                      Helpdesk
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
      
      {/* SOS Modal */}
      <SOSModal
        visible={showSOSModal}
        onClose={handleCancelSOS}
        onMinimize={handleMinimizeSOS}
        handleCancelSOS={handleCancelSOS}
        handleEndEmergency={handleEndEmergency}
        handleMistakeActivation={handleMistakeActivation}
        sosStartTime={sosStartTime}
        capturedMedia={capturedMedia}
        currentLocation={currentLocation}
        locationAddress={locationAddress}
        autoCaptureSOS={autoCaptureSOS}
        requestLocationPermission={requestLocationPermission}
        onMediaUpdated={() => {
          console.log('Media updated callback received');
          setTimeout(() => {
            Alert.alert('Media Update', 'New emergency media has been captured');
          }, 500);
        }}
        handleEmergencyCall={(type) => {
          const phoneNumbers = {
            'police': '911',
            'campus': '123-456-7890',
            'hospital': '911',
          };
          
          const number = phoneNumbers[type as keyof typeof phoneNumbers];
          const contactName = type === 'police' ? 'Police' : type === 'campus' ? 'Campus Security' : 'Hospital';
          
          if (number) {
            Linking.openURL(`tel:${number}`)
              .then(() => {
                speakButtonAction(`Calling ${contactName}`);
              })
              .catch((err) => {
                speakButtonAction('Cannot place call. Check your device call permissions.');
                console.error('Error placing phone call:', err);
              });
          }
        }}
        speakNotification={(text) => speakButtonAction(text)}
        takePicture={takePicture}
      />
      
      {/* Activity Modal */}
      <ActivityModal
        visible={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        recentActivities={[
          { id: 1, label: 'Campus alert received', count: 1, type: 'alert' },
          { id: 2, label: 'Location shared', count: 3, type: 'location' },
          { id: 3, label: 'Safe arrival confirmed', count: 2, type: 'confirm' },
        ]}
      />
      
      {/* Notifications Modal */}
      <NotificationsModal
        visible={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
      />
      
      {/* Post-Incident Resource Coordination */}
      <PostIncidentResourceScreen
        visible={showPostIncidentResources}
        incidentType={incidentData?.type || 'general'}
        incidentId={incidentData?.id || ''}
        onClose={() => {
          setShowPostIncidentResources(false);
          setIncidentData(null);
        }}
      />

      {/* Reason Form for Mistake Activations */}
      <ReasonForm
        visible={showReasonForm}
        onClose={() => setShowReasonForm(false)}
        onSubmit={handleReasonSubmit}
      />

      {/* Discreet Alarm Modal */}
      <DiscreetAlarmModal
        visible={showDiscreetAlarmModal}
        onClose={() => setShowDiscreetAlarmModal(false)}
        onTriggerFakeCall={triggerFakeCall}
        onTriggerLoudAlarm={triggerLoudAlarm}
      />

      {/* Helpdesk Modal */}
      <HelpdeskModal
        visible={showHelpdeskModal}
        onClose={() => setShowHelpdeskModal(false)}
        onContactHelpdesk={contactHelpdesk}
      />

      {/* Fake Call Screen */}
      <FakeCallScreen
        visible={showFakeCallScreen}
        onEndCall={() => {
          setShowFakeCallScreen(false);
          stopAlarm(); // Stop the fake call sound when ending the call
        }}
        callerName="Mom"
        callerNumber="+1 (555) 123-4567"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 0,
    paddingBottom: 0,
  },
  container: {
    flex: 1,
    paddingBottom: 0,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
    marginTop: 0,
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  alertsContainer: {
    marginBottom: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  alertBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#343a40',
    marginBottom: 0,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  alertCardCritical: {
    borderLeftWidth: 5,
    borderLeftColor: '#FF3B30',
    backgroundColor: '#fff5f5',
  },
  alertCardWarning: {
    borderLeftWidth: 5,
    borderLeftColor: '#FF9500',
    backgroundColor: '#fffbf0',
  },
  alertCardInfo: {
    borderLeftWidth: 5,
    borderLeftColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  alertLeftSection: {
    alignItems: 'center',
    marginRight: 16,
  },
  alertIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertIconCritical: {
    backgroundColor: '#FF3B30',
  },
  alertIconWarning: {
    backgroundColor: '#FF9500',
  },
  alertIconInfo: {
    backgroundColor: '#007AFF',
  },
  priorityIndicator: {
    alignItems: 'center',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityDotCritical: {
    backgroundColor: '#FF3B30',
  },
  priorityDotWarning: {
    backgroundColor: '#FF9500',
  },
  priorityDotInfo: {
    backgroundColor: '#007AFF',
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    marginBottom: 8,
  },
  alertTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  alertCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8e8e93',
    letterSpacing: 0.5,
  },
  priorityBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  priorityBadgeWarning: {
    backgroundColor: '#FF9500',
  },
  priorityBadgeInfo: {
    backgroundColor: '#007AFF',
  },
  priorityText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  alertMessage: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    lineHeight: 20,
  },
  alertFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  alertTime: {
    fontSize: 13,
    color: '#8e8e93',
    fontWeight: '500',
  },
  alertDistance: {
    fontSize: 13,
    color: '#8e8e93',
    fontWeight: '500',
  },
  alertActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Compact Alert Styles
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f8ff',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 4,
  },
  compactAlertCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  compactAlertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  compactAlertIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  compactAlertIconCritical: {
    backgroundColor: '#FF3B30',
  },
  compactAlertIconWarning: {
    backgroundColor: '#FF9500',
  },
  compactAlertIconInfo: {
    backgroundColor: '#007AFF',
  },
  compactAlertContent: {
    flex: 1,
  },
  compactAlertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  compactAlertMeta: {
    fontSize: 12,
    color: '#8e8e93',
    fontWeight: '500',
  },
  compactPriorityBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactPriorityBadgeWarning: {
    backgroundColor: '#FF9500',
  },
  compactPriorityBadgeInfo: {
    backgroundColor: '#007AFF',
  },
  compactPriorityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  alertSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  alertSummaryText: {
    fontSize: 13,
    color: '#8e8e93',
    fontWeight: '500',
  },
  alertStatusDots: {
    flexDirection: 'row',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotCritical: {
    backgroundColor: '#FF3B30',
  },
  statusDotWarning: {
    backgroundColor: '#FF9500',
  },
  statusDotInfo: {
    backgroundColor: '#007AFF',
  },
  sosMainContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  sosCircleButtonOuterRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    marginBottom: 20,
  },
  sosCircleButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  sosCircleButtonActive: {
    backgroundColor: '#cc0000',
  },
  sosCircleButtonUrgent: {
    borderWidth: 3,
    borderColor: '#ff0000',
    shadowColor: '#ff0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
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
    flexDirection: 'column',
    width: '100%',
    gap: 12,
    marginBottom: 0,
    paddingBottom: 0,
    marginTop: 0,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 6,
  },
  torchButton: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  torchButtonActive: {
    backgroundColor: '#FFD700',
  },
  torchButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
    marginTop: 6,
  },
  discreetAlarmButton: {
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  discreetAlarmButtonActive: {
    backgroundColor: '#FF6B35',
  },
  discreetTapping: {
    backgroundColor: '#ff9500',
    transform: [{ scale: 1.05 }],
  },
  // New styles for discreet button interactions
  discreetHoldContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  discreetProgressBar: {
    position: 'absolute',
    bottom: 4,
    width: '80%',
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1,
  },
  discreetProgressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  discreetTapContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  discreetTapCountText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 2,
  },
  discreetTapSubtext: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '500',
    opacity: 0.9,
  },
  discreetTapSubtext2: {
    color: '#fff',
    fontSize: 7,
    fontWeight: '500',
    opacity: 0.8,
    marginTop: 1,
  },
  discreetHoldSubtext: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '500',
    opacity: 0.9,
    marginTop: 1,
  },
  discreetAlarmButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B35',
    marginTop: 6,
  },
  helpdeskButton: {
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  helpdeskButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
    marginTop: 6,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 6,
  },
  secondaryButtonTextLight: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 8,
  },
  secondaryButtonTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  // Countdown styles
  countdownContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  countdownText: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
  alarmRingingContainer: {
    backgroundColor: '#ffebee',
    borderColor: '#ff1744',
    borderWidth: 2,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#ff1744',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  alarmRingingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alarmRingingText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#d32f2f',
    marginLeft: 12,
  },
  stopAlarmButton: {
    backgroundColor: '#ff1744',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stopAlarmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

// Export the HomeScreen component as the default export
export { HomeScreen as default };