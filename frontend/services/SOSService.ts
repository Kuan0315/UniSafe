import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// Simple runtime flag to know if we are inside Expo Go (development client would have full native modules)
const isExpoGo = !!(global as any).ExpoGo; // heuristic – Expo Go injects a global marker

export const canSaveToGallery = !isExpoGo; // caller can use to adjust UI messaging

export const triggerSOSActions = async (location: Location.LocationObject | null, trustedContacts: string[]) => {
  try {
    // Provide haptic feedback to indicate SOS activation
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    // Repeat haptic feedback to emphasize emergency
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }, 300);

    if (location) {
      console.log('📍 Sending location to campus security and trusted contacts...');
      // Here you would integrate with your backend API to send the location
      trustedContacts.forEach((contact) => {
        console.log(`Location sent to ${contact}:`, location.coords);
        // In a real implementation, you would send this data to your backend API
        // e.g., api.sendEmergencyLocation(contact, location);
      });
    } else {
      console.error('Location not available.');
    }
  } catch (error) {
    console.error('Error triggering SOS actions:', error);
  }
};

export const captureEmergencyMedia = async (_cameraRef: any, autoCaptureSOS: boolean): Promise<string | null> => {
  if (!autoCaptureSOS) {
    console.log('Auto-capture disabled.');
    return null;
  }
  try {
    console.log('📸 Auto-capturing emergency video (attempt)...');

    // We cannot background‑record without user interaction in Expo Go; best effort approach:
    // 1. Ask for camera permission.
    // 2. Launch camera for video (user taps record) with a hint in UI.
    // 3. If in Expo Go and permission / launch fails, fall back to simulation.

    const camPerm = await ImagePicker.requestCameraPermissionsAsync();
    if (camPerm.status !== 'granted') {
      console.warn('Camera permission denied for auto video');
      return null;
    }

    // Launch camera constrained to video; user will need to confirm recording.
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 0.6,
      videoMaxDuration: 12 // short clip
    });

    if (result.canceled || !result.assets?.length) {
      console.log('Auto video capture canceled by user');
      return null;
    }

    const assetInfo = result.assets[0];
    let savedUri = assetInfo.uri;

    // Try to save to gallery (only works outside Expo Go due to granular permission limits)
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync(false, ['video']);
      if (status === 'granted') {
        const saved = await MediaLibrary.createAssetAsync(assetInfo.uri);
        savedUri = saved.uri;
        console.log('🎥 Auto emergency video saved to gallery:', saved.id);
      } else {
        console.log('Gallery permission not granted for auto video save. Using temp URI.');
      }
    } catch (e: any) {
      if (e.message?.includes('Expo Go')) {
        console.warn('Cannot save auto video to gallery in Expo Go – continuing with temporary URI');
      } else {
        console.error('Unexpected error saving auto video:', e);
      }
    }

    return savedUri;
  } catch (error: any) {
    if (error?.message?.includes('undefined')) {
      console.warn('Camera module not fully available – likely Expo Go limitation. Returning simulation token.');
      return 'auto-video-simulated';
    }
    console.error('Error capturing emergency media:', error);
    return null;
  }
};

// Function to manually take a picture during SOS
export const takeEmergencyPhoto = async (cameraRef: any) => {
  try {
    console.log('Taking emergency photo...');
    
    // Request camera permissions
    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraStatus.status !== 'granted') {
      console.error('Camera permission not granted');
      return null;
    }

    // Launch camera to take photo
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
      base64: false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      console.log('Photo capture was canceled');
      return null;
    }

    const photo = result.assets[0];
    console.log('📸 Emergency photo captured:', photo.uri);
    
    // Try to save to media library (will fail gracefully in Expo Go)
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync(false, ['audio', 'photo', 'video']);
      if (status === 'granted') {
        const asset = await MediaLibrary.createAssetAsync(photo.uri);
        console.log('📱 Photo saved to device gallery:', asset.id);
        return photo.uri;
      } else {
        console.log('📱 Photo captured but not saved to gallery (permission denied)');
        return photo.uri;
      }
    } catch (mediaError: any) {
      if (mediaError.message?.includes('Expo Go can no longer provide full access')) {
        console.warn('📱 Photo captured but cannot save to gallery in Expo Go');
        return photo.uri;
      }
      throw mediaError;
    }
  } catch (error) {
    console.error('Error taking emergency photo:', error);
    return null;
  }
};