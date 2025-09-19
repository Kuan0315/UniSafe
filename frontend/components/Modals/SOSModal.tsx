import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LocationObject } from 'expo-location';
import { capturePhoto, captureVideo } from '../../services/SimpleCaptureService';
import EmergencyChatScreen from '../EmergencyChatScreen';

interface SOSModalProps {
  visible: boolean;
  onClose: () => void;
  onMinimize?: () => void; // New prop for minimizing SOS modal
  sosStartTime: Date | null;
  capturedMedia: { photo?: string; video?: string };
  currentLocation: LocationObject | null;
  locationAddress: string;
  autoCaptureSOS: boolean;
  requestLocationPermission: () => void;
  handleEmergencyCall: (type: string) => void;
  handleCancelSOS?: () => void;
  handleEndEmergency?: () => void;
  handleMistakeActivation?: () => void;
  onMediaUpdated?: () => void; // callback to notify parent when media may have been updated
  speakNotification?: (text: string) => void;
  takePicture?: () => Promise<void>;
}

export default function SOSModal({
  visible,
  onClose,
  onMinimize,
  sosStartTime,
  capturedMedia,
  currentLocation,
  locationAddress,
  autoCaptureSOS,
  requestLocationPermission,
  handleEmergencyCall,
  handleCancelSOS,
  handleEndEmergency,
  handleMistakeActivation,
  onMediaUpdated,
}: SOSModalProps) {
  const [mediaSaveError, setMediaSaveError] = useState<string | null>(null);
  const [showMediaError, setShowMediaError] = useState(false);
  const [mediaCaptureType, setMediaCaptureType] = useState<'photo' | 'video' | null>(null);
  const [isCapturingMedia, setIsCapturingMedia] = useState(false);
  
  // Emergency chat screen state
  const [showChatScreen, setShowChatScreen] = useState(false);

  const openCamera = async (type: 'photo' | 'video') => {
    try {
      setMediaCaptureType(type); // Track what type of media is being captured
      setIsCapturingMedia(true); // Set loading state
      console.log(`📸 Opening in-app ${type} camera...`);
      
      // Use our simplified capture methods that don't rely on MediaLibrary
      let uri: string | null = null;
      
      if (type === 'photo') {
        uri = await capturePhoto();
      } else {
        uri = await captureVideo();
      }
      
      if (!uri) {
        console.log(`${type} capture was canceled or failed`);
        return;
      }
      
      console.log(`📸 Emergency ${type} captured:`, uri);
      
      // Notify parent component about the captured media
      if (onMediaUpdated) {
        onMediaUpdated();
        console.log('Parent notified of media capture');
      }
      
    } catch (error) {
      console.error(`Error opening ${type} camera:`, error);
      setMediaSaveError(`Failed to open ${type} camera. Please try again.`);
      setShowMediaError(true);
      setTimeout(() => setShowMediaError(false), 5000);
    } finally {
      // Reset states
      setMediaCaptureType(null);
      setIsCapturingMedia(false);
    }
  };

  const openVideoCamera = async () => {
    // Delegate to openCamera with video type for consistency
    openCamera('video');
  };

  const confirmCancelSOS = () => {
    Alert.alert(
      "Cancel SOS Emergency",
      "Are you sure you want to end the emergency mode? This will stop all emergency notifications.",
      [
        {
          text: "Keep Active",
          style: "cancel"
        },
        {
          text: "End Emergency",
          style: "destructive",
          onPress: handleEndEmergency || handleCancelSOS
        }
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.sosModalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sosModalContent}>
          {/* External camera is now used for both photo and video */}
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            {/* Media Save Error Banner */}
            {showMediaError && (
              <View style={styles.errorBanner}>
                <Ionicons name="warning" size={20} color="#fff" />
                <Text style={styles.errorText}>
                  {mediaSaveError}
                </Text>
                <TouchableOpacity onPress={() => setShowMediaError(false)}>
                  <Ionicons name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {/* Header */}
            <View style={styles.sosModalHeader}>
              {onMinimize && (
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={onMinimize}
                  accessibilityLabel="Minimize SOS modal"
                  accessibilityHint="Keep SOS active but return to main app"
                >
                  <Ionicons name="chevron-back" size={24} color="#007AFF" />
                </TouchableOpacity>
              )}
              <Ionicons name="alert-circle" size={40} color="#FF3B30" />
              <Text style={styles.sosModalTitle}>🚨 SOS ACTIVATED</Text>
              <Text style={styles.sosModalSubtitle}>Emergency data sent to contacts</Text>
              <Text style={styles.sosModalTime}>
                Activated at: {sosStartTime?.toLocaleTimeString()}
              </Text>
            </View>

            {/* Location Display */}
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={24} color="#FF3B30" />
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationText}>LOCATION SHARED:</Text>
                {currentLocation ? (
                  <>
                    <Text style={styles.locationAddress}>{locationAddress || "Getting address..."}</Text>
                    <Text style={styles.locationShared}>📍 Sent to emergency contacts</Text>
                  </>
                ) : (
                  <TouchableOpacity 
                    onPress={requestLocationPermission}
                    style={styles.locationPermissionButton}
                  >
                    <Text style={styles.locationPermissionText}>
                      ⚠️ Tap to enable location services
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Manual Capture Controls */}
            <View style={styles.captureContainer}>
              <View style={styles.captureHeader}>
                <Ionicons name="camera" size={24} color="#333" />
                <Text style={styles.captureHeaderTitle}>
                  {capturedMedia?.photo || capturedMedia?.video ? 
                    "EVIDENCE CAPTURED" : 
                    "EMERGENCY EVIDENCE CAPTURE"}
                </Text>
              </View>
              
              {/* Capture status indicators */}
              {(capturedMedia?.photo || capturedMedia?.video) && (
                <View style={styles.captureStatus}>
                  {capturedMedia?.photo && (
                    <View style={styles.captureStatusItem}>
                      <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                      <Text style={styles.captureStatusText}>Photo captured</Text>
                    </View>
                  )}
                  {capturedMedia?.video && (
                    <View style={styles.captureStatusItem}>
                      <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                      <Text style={styles.captureStatusText}>Video captured</Text>
                    </View>
                  )}
                </View>
              )}
              
              <Text style={styles.captureInstructions}>
                {autoCaptureSOS 
                  ? "Capture additional evidence if needed:" 
                  : "Capture evidence of your emergency:"}
              </Text>
              
              <View style={styles.captureButtons}>
                <TouchableOpacity
                  style={[
                    styles.captureButton, 
                    styles.photoButton,
                    isCapturingMedia && mediaCaptureType === 'photo' && styles.captureButtonDisabled
                  ]}
                  onPress={() => !isCapturingMedia && openCamera('photo')}
                  disabled={isCapturingMedia}
                >
                  {isCapturingMedia && mediaCaptureType === 'photo' ? (
                    <Text style={styles.captureButtonText}>Opening...</Text>
                  ) : (
                    <>
                      <Ionicons name="camera" size={18} color="#fff" />
                      <Text style={styles.captureButtonText}>Photo</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.captureButton, 
                    styles.videoButton,
                    isCapturingMedia && mediaCaptureType === 'video' && styles.captureButtonDisabled
                  ]}
                  onPress={() => !isCapturingMedia && openVideoCamera()}
                  disabled={isCapturingMedia}
                >
                  {isCapturingMedia && mediaCaptureType === 'video' ? (
                    <Text style={styles.captureButtonText}>Opening...</Text>
                  ) : (
                    <>
                      <Ionicons name="videocam" size={18} color="#fff" />
                      <Text style={styles.captureButtonText}>Video</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
              
              <Text style={styles.noteText}>
                {(global as any).ExpoGo ? 
                  'Gallery saving not available in Expo Go.' : 
                  'Media will be saved to your gallery.'}
              </Text>
            </View>

            {/* Text Communication with Campus Security */}
            <View style={styles.communicationContainer}>
              <View style={styles.communicationHeader}>
                <Ionicons name="chatbubbles" size={24} color="#007AFF" />
                <Text style={styles.communicationHeaderTitle}>COMMUNICATE WITH SECURITY</Text>
              </View>
              
              <TouchableOpacity
                style={styles.chatButton}
                onPress={() => setShowChatScreen(true)}
              >
                <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
                <Text style={styles.chatButtonText}>Open Emergency Chat</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Emergency Actions */}
            <View style={styles.emergencyContainer}>
              <View style={styles.emergencyHeader}>
                <Ionicons name="call" size={24} color="#FF3B30" />
                <Text style={styles.emergencyHeaderTitle}>EMERGENCY CALLS</Text>
              </View>
              <Text style={styles.emergencyInstructions}>Contact emergency services immediately:</Text>
              <View style={styles.emergencyActionsContainer}>
                <TouchableOpacity
                  style={[styles.emergencyButton, styles.policeButton]}
                  onPress={() => handleEmergencyCall('police')}
                >
                  <Ionicons name="car" size={20} color="#fff" />
                  <Text style={styles.emergencyButtonText}>Police</Text>
                  <Text style={styles.emergencyButtonSubtext}>911</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.emergencyButton, styles.campusButton]}
                  onPress={() => handleEmergencyCall('campus')}
                >
                  <Ionicons name="shield-checkmark" size={20} color="#fff" />
                  <Text style={styles.emergencyButtonText}>Campus</Text>
                  <Text style={styles.emergencyButtonSubtext}>Security</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.emergencyButton, styles.hospitalButton]}
                  onPress={() => handleEmergencyCall('hospital')}
                >
                  <Ionicons name="medical" size={20} color="#fff" />
                  <Text style={styles.emergencyButtonText}>Medical</Text>
                  <Text style={styles.emergencyButtonSubtext}>Help</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Bottom Action Buttons */}
          <View style={styles.bottomActionsContainer}>
            <TouchableOpacity
              style={styles.mistakeButton}
              onPress={() => {
                Alert.alert(
                  "Cancel SOS",
                  "Did you activate SOS by mistake?",
                  [
                    {
                      text: "No, Keep Active",
                      style: "cancel"
                    },
                    {
                      text: "Yes, Cancel SOS",
                      style: "destructive",
                      onPress: handleMistakeActivation || handleCancelSOS
                    }
                  ]
                );
              }}
            >
              <Ionicons name="alert-circle-outline" size={16} color="#FF8C00" />
              <Text style={styles.mistakeButtonText}>By Mistake?</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cancelSOSButton}
              onPress={confirmCancelSOS}
            >
              <Ionicons name="close-circle" size={18} color="#FF3B30" />
              <Text style={styles.cancelSOSButtonText}>End Emergency</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      
      {/* Emergency Chat Screen */}
      <EmergencyChatScreen 
        visible={showChatScreen} 
        onClose={() => setShowChatScreen(false)}
        emergencyId="current-emergency"
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    width: '90%',
    maxHeight: '90%',
  },
  errorBanner: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#fff',
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    fontSize: 14,
  },
  sosModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f8ff',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  sosModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginTop: 12,
    marginBottom: 4,
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
  locationContainer: {
    backgroundColor: '#e8f5e9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationTextContainer: {
    marginLeft: 8,
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  locationAddress: {
    fontSize: 13,
    color: '#007AFF',
    marginTop: 2,
  },
  locationShared: {
    fontSize: 12,
    color: '#34C759',
    marginTop: 4,
    fontWeight: 'bold',
  },
  locationPermissionButton: {
    backgroundColor: '#ffebee',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  locationPermissionText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  captureContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  captureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  captureHeaderTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 6,
  },
  captureStatus: {
    marginBottom: 8,
    backgroundColor: '#e8f5e9',
    padding: 8,
    borderRadius: 6,
  },
  captureStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  captureStatusText: {
    fontSize: 13,
    color: '#2e7d32',
    marginLeft: 4,
    fontWeight: '500',
  },
  captureInstructions: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    fontStyle: 'italic',
  },
  noteText: {
    fontSize: 10,
    color: '#888',
    marginTop: 6,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  captureButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
    flex: 1,
  },
  photoButton: {
    backgroundColor: '#007AFF',
  },
  videoButton: {
    backgroundColor: '#FF3B30',
  },
  captureButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 4,
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  emergencyContainer: {
    backgroundColor: '#fff1f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffcccc',
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emergencyHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginLeft: 8,
  },
  emergencyInstructions: {
    fontSize: 14,
    color: '#333',
    marginBottom: 16,
  },
  emergencyActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emergencyButton: {
    flex: 1,
    alignItems: 'center',
    padding: 8, // Reduced padding
    borderRadius: 8, // Smaller radius
    marginHorizontal: 3, // Smaller margin
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, // Smaller shadow
    shadowOpacity: 0.2,
    shadowRadius: 2, // Smaller shadow radius
    elevation: 2, // Smaller elevation
  },
  policeButton: {
    backgroundColor: '#FF3B30',
  },
  campusButton: {
    backgroundColor: '#007AFF',
  },
  hospitalButton: {
    backgroundColor: '#34C759',
  },
  emergencyButtonText: {
    fontSize: 13, // Smaller font
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4, // Smaller margin
  },
  emergencyButtonSubtext: {
    fontSize: 10, // Smaller font
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 1, // Smaller margin
  },
  bottomActionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  mistakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF8C00',
    padding: 8,
    borderRadius: 6,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  mistakeButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF8C00',
    marginLeft: 3,
  },
  cancelSOSButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FF3B30',
    padding: 8,
    borderRadius: 8,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelSOSButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginLeft: 4,
  },
  // Text Communication Styles
  communicationContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E1E1E1',
  },
  communicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  communicationHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginLeft: 8,
    flex: 1,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 10,
  },
  chatButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
    marginRight: 8,
  },
});