import React, { useState, useRef } from 'react';
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
import { CameraView, useCameraPermissions } from 'expo-camera';
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
  takePicture: () => void;
  toggleRecording: () => void;
  isRecording: boolean;
  toggleFlash: () => void;
  cameraFlash: 'on' | 'off';
  toggleCameraType: () => void;
  requestLocationPermission: () => void;
  handleEmergencyCall: (type: string) => void;
  handleCancelSOS: () => void;
  isTorchOn: boolean;
  toggleTorch: () => void;
  onPhotoCaptured?: (uri: string) => void; // new callback to update parent state
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
  onPhotoCaptured,
}: SOSModalProps) {
  const [mediaSaveError, setMediaSaveError] = useState<string | null>(null);
  const [showMediaError, setShowMediaError] = useState(false);
  const [showInlineCamera, setShowInlineCamera] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);

  const openCamera = async (type: 'photo' | 'video') => {
    // Only handle photo for inline camera for now
    if (type === 'photo') {
      // If we don't have permission, request it first
      if (!permission || !permission.granted) {
        const result = await requestPermission();
        if (!result.granted) {
          setMediaSaveError('Camera permission denied.');
          setShowMediaError(true);
          setTimeout(() => setShowMediaError(false), 5000);
          return;
        }
      }
      setShowInlineCamera(true);
    } else {
      // For video we still fall back to external intent (future inline implementation)
      try {
        if (Platform.OS === 'ios') {
          Linking.openURL('photos-redirect://');
        } else {
          try {
            await IntentLauncher.startActivityAsync('android.media.action.VIDEO_CAPTURE');
          } catch (error) {
            Linking.openURL('content://media/internal/images/media');
          }
        }
      } catch (error) {
        setMediaSaveError('Failed to open video camera. Please check permissions.');
        setShowMediaError(true);
        setTimeout(() => setShowMediaError(false), 5000);
      }
    }
  };

  const openVideoCamera = async () => {
    // Delegate to openCamera with video type for consistency
    openCamera('video');
  };

  const handleCapturePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      setIsCapturingPhoto(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, skipProcessing: true });
      let finalUri = photo.uri;
      try {
        const mediaPerm = await MediaLibrary.requestPermissionsAsync(false, ['photo']);
        if (mediaPerm.status === 'granted') {
          const asset = await MediaLibrary.createAssetAsync(photo.uri);
            finalUri = asset.uri;
        } else {
          console.log('Media library permission denied – temp URI only.');
        }
      } catch (e: any) {
        if (e.message?.includes('Expo Go')) {
          console.warn('Cannot save photo to gallery in Expo Go.');
        } else {
          console.error('Gallery save error:', e);
        }
      }
      // Inform parent if callback provided
      onPhotoCaptured?.(finalUri);
      setShowInlineCamera(false);
      setMediaSaveError(null);
      Alert.alert('Photo Captured', canSaveToGallery ? 'Emergency photo captured.' : 'Emergency photo captured (not saved to gallery in Expo Go).');
    } catch (error: any) {
      console.error('Inline camera capture error:', error);
      setMediaSaveError('Failed to capture photo.');
      setShowMediaError(true);
      setTimeout(() => setShowMediaError(false), 5000);
    } finally {
      setIsCapturingPhoto(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sosModalOverlay}>
        <View style={styles.sosModalContent}>
          {/* Inline Camera Overlay */}
          {showInlineCamera && (
            <View style={styles.inlineCameraContainer}>
              {!permission?.granted ? (
                <View style={styles.inlineCameraPermission}>
                  <Text style={styles.inlineCameraPermissionText}>Camera permission required</Text>
                  <TouchableOpacity style={styles.inlineCameraPermissionButton} onPress={requestPermission}>
                    <Text style={styles.inlineCameraPermissionButtonText}>Grant Permission</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.inlineCameraCloseButton} onPress={() => setShowInlineCamera(false)}>
                    <Ionicons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <CameraView
                    ref={cameraRef}
                    style={styles.cameraView}
                    facing="back"
                  />
                  <View style={styles.cameraControls}>
                    <TouchableOpacity style={styles.capturePhotoButton} onPress={handleCapturePhoto} disabled={isCapturingPhoto}>
                      <Ionicons name={isCapturingPhoto ? 'hourglass' : 'camera'} size={34} color="#fff" />
                      <Text style={styles.capturePhotoButtonText}>{isCapturingPhoto ? 'Capturing...' : 'Capture'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.closeCameraButton} onPress={() => setShowInlineCamera(false)}>
                      <Ionicons name="close" size={28} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          )}
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
                  style={[styles.captureButton, styles.photoButton]}
                  onPress={() => openCamera('photo')}
                >
                  <Ionicons name="camera" size={28} color="#fff" />
                  <Text style={styles.captureButtonText}>Open Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.captureButton, styles.videoButton]}
                  onPress={openVideoCamera}
                >
                  <Ionicons name="videocam" size={28} color="#fff" />
                  <Text style={styles.captureButtonText}>Record Video</Text>
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
  inlineCameraContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 50,
    borderRadius: 20,
    overflow: 'hidden'
  },
  inlineCameraPermission: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  inlineCameraPermissionText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center'
  },
  inlineCameraPermissionButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  inlineCameraPermissionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16
  },
  inlineCameraCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  cameraView: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  capturePhotoButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  capturePhotoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },
  closeCameraButton: {
    position: 'absolute',
    top: 40,
    right: 30,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 30,
  },
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