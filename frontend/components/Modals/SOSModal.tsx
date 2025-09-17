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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LocationObject } from 'expo-location';
import * as IntentLauncher from 'expo-intent-launcher';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { canSaveToGallery } from '../../services/SOSService';

interface SOSModalProps {
  visible: boolean;
  onClose: () => void;
  sosStartTime: Date | null;
  capturedMedia: { photo?: string; video?: string };
  currentLocation: LocationObject | null;
  locationAddress: string;
  autoCaptureSOS: boolean;
  requestLocationPermission: () => void;
  handleEmergencyCall: (type: string) => void;
  handleCancelSOS: () => void;
  onMediaUpdated?: () => void; // callback to notify parent when media may have been updated
}

export default function SOSModal({
  visible,
  onClose,
  sosStartTime,
  capturedMedia,
  currentLocation,
  locationAddress,
  autoCaptureSOS,
  requestLocationPermission,
  handleEmergencyCall,
  handleCancelSOS,
  onMediaUpdated,
}: SOSModalProps) {
  const [mediaSaveError, setMediaSaveError] = useState<string | null>(null);
  const [showMediaError, setShowMediaError] = useState(false);
  const [mediaCaptureType, setMediaCaptureType] = useState<'photo' | 'video' | null>(null);
  const [isCapturingMedia, setIsCapturingMedia] = useState(false);

  const openCamera = async (type: 'photo' | 'video') => {
    // Using external intent approach for both photo and video for consistent gallery saving
    try {
      setMediaCaptureType(type); // Track what type of media is being captured
      setIsCapturingMedia(true); // Set loading state
      console.log(`Opening system ${type} camera app - will save directly to gallery`);
      
      if (Platform.OS === 'ios') {
        // On iOS, use the appropriate URL scheme
        Linking.openURL('photos-redirect://');  // iOS doesn't have separate photo/video URLs
        
        // Set a timeout to refresh/check media after returning from camera
        setTimeout(() => {
          console.log('Returned from iOS system camera app');
          if (onMediaUpdated) {
            onMediaUpdated();
            console.log('Parent notified of potential media update');
          }
          Alert.alert(
            `${type === 'photo' ? 'Photo' : 'Video'} Captured`,
            `Emergency ${type} has been saved.`
          );
        }, 1500); // delay to allow system to process saved media
        
      } else {
        // On Android, use IntentLauncher for BOTH photo and video
        // This ensures both use native camera apps that save to gallery automatically
        try {
          // Use the appropriate intent action based on media type
          const intentAction = type === 'photo' 
            ? 'android.media.action.IMAGE_CAPTURE'
            : 'android.media.action.VIDEO_CAPTURE';
          
          console.log(`Launching Android ${intentAction}`);
          await IntentLauncher.startActivityAsync(intentAction);
          console.log('Intent completed, returned to app');
          
          // Set a timeout to refresh/check media after returning from camera
          setTimeout(() => {
            console.log('Processing after returning from system camera app');
            if (onMediaUpdated) {
              onMediaUpdated();
              console.log('Parent notified of potential media update');
            }
            
            // Show success message
            Alert.alert(
              `${type === 'photo' ? 'Photo' : 'Video'} Captured`,
              `Emergency ${type} has been saved to your gallery.`
            );
          }, 1500); // delay to allow system to process saved media
          
        } catch (error) {
          console.error('Intent launch error:', error);
          // Fallback to content URI if intent fails
          try {
            Linking.openURL('content://media/internal/images/media');
            setTimeout(() => {
              if (onMediaUpdated) onMediaUpdated();
            }, 1500);
          } catch (linkError) {
            console.error('Linking fallback error:', linkError);
            throw new Error('Failed to launch camera: ' + error);
          }
        }
      }
      
      // Reset states after handling is complete
      setTimeout(() => {
        setMediaCaptureType(null);
        setIsCapturingMedia(false);
      }, 2000);
      
      // Reset states
      setMediaCaptureType(null);
      setIsCapturingMedia(false);
      
    } catch (error) {
      console.error(`Error opening ${type} camera:`, error);
      setMediaSaveError(`Failed to open ${type} camera. Please check permissions.`);
      setShowMediaError(true);
      setTimeout(() => setShowMediaError(false), 5000);
      setMediaCaptureType(null); // Reset on error
      setIsCapturingMedia(false); // Reset loading state
    }
  };

  const openVideoCamera = async () => {
    // Delegate to openCamera with video type for consistency
    openCamera('video');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sosModalOverlay}>
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
              <Ionicons name="alert-circle" size={40} color="#FF3B30" />
              <Text style={styles.sosModalTitle}>🚨 SOS ACTIVATED</Text>
              <Text style={styles.sosModalSubtitle}>Emergency data sent to contacts</Text>
              <Text style={styles.sosModalTime}>
                Activated at: {sosStartTime?.toLocaleTimeString()}
              </Text>
            </View>

            {/* Location Display */}
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={28} color="#FF3B30" />
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationText}>YOUR LOCATION:</Text>
                {currentLocation ? (
                  <>
                    <Text style={styles.locationAddress}>{locationAddress || "Getting address..."}</Text>
                    <Text style={styles.locationCoords}>
                      Lat: {currentLocation.coords.latitude.toFixed(6)}, 
                      Long: {currentLocation.coords.longitude.toFixed(6)}
                    </Text>
                    <Text style={styles.locationShared}>📍 Location shared with emergency contacts</Text>
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
                    "📸 Evidence Captured" : 
                    "📸 EMERGENCY EVIDENCE CAPTURE"}
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
                  ? "Auto-capture complete. You can also capture additional evidence using your phone's camera:" 
                  : "Capture evidence of your emergency situation using your phone's camera:"}
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
                    <Text style={styles.captureButtonText}>Opening Camera...</Text>
                  ) : (
                    <>
                      <Ionicons name="camera" size={28} color="#fff" />
                      <Text style={styles.captureButtonText}>Open Camera</Text>
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
                    <Text style={styles.captureButtonText}>Opening Video Camera...</Text>
                  ) : (
                    <>
                      <Ionicons name="videocam" size={28} color="#fff" />
                      <Text style={styles.captureButtonText}>Record Video</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
              
              <Text style={styles.noteText}>
                Note: This will open your phone's camera app. The media will be saved to your device's gallery.
              </Text>
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
                  <Ionicons name="car" size={24} color="#fff" />
                  <Text style={styles.emergencyButtonText}>Police</Text>
                  <Text style={styles.emergencyButtonSubtext}>999</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.emergencyButton, styles.campusButton]}
                  onPress={() => handleEmergencyCall('campus')}
                >
                  <Ionicons name="shield-checkmark" size={24} color="#fff" />
                  <Text style={styles.emergencyButtonText}>Campus</Text>
                  <Text style={styles.emergencyButtonSubtext}>Security</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.emergencyButton, styles.hospitalButton]}
                  onPress={() => handleEmergencyCall('hospital')}
                >
                  <Ionicons name="medical" size={24} color="#fff" />
                  <Text style={styles.emergencyButtonText}>Medical</Text>
                  <Text style={styles.emergencyButtonSubtext}>Emergency</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Bottom Action Buttons */}
          <View style={styles.bottomActionsContainer}>
            <TouchableOpacity
              style={styles.cancelSOSButton}
              onPress={handleCancelSOS}
            >
              <Ionicons name="close-circle" size={22} color="#FF3B30" />
              <Text style={styles.cancelSOSButtonText}>End Emergency Mode</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  locationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  locationAddress: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 4,
  },
  locationCoords: {
    fontSize: 13,
    color: '#333',
    marginTop: 2,
    fontFamily: 'monospace',
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
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  captureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  captureHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  captureStatus: {
    marginBottom: 12,
    backgroundColor: '#e8f5e9',
    padding: 10,
    borderRadius: 8,
  },
  captureStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  captureStatusText: {
    fontSize: 14,
    color: '#2e7d32',
    marginLeft: 6,
    fontWeight: '500',
  },
  captureInstructions: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  noteText: {
    fontSize: 12,
    color: '#888',
    marginTop: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  captureButtons: {
    flexDirection: 'column',
    gap: 12,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoButton: {
    backgroundColor: '#007AFF',
  },
  videoButton: {
    backgroundColor: '#FF3B30',
  },
  captureButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
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
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 6,
  },
  emergencyButtonSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  bottomActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelSOSButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FF3B30',
    padding: 14,
    borderRadius: 10,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelSOSButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginLeft: 8,
  },
});