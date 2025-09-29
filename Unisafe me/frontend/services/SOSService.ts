import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { capturePhoto, captureVideo } from './SimpleCaptureService';

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

    // Use our simplified captureVideo function that handles permissions internally
    const savedUri = await captureVideo();
    
    if (!savedUri) {
      console.log('Auto video capture canceled or failed');
      return null;
    }
    
    console.log('🎥 Auto emergency video captured successfully:', savedUri);
    return savedUri;
  } catch (error: any) {
    console.error('Error capturing emergency media:', error);
    return null;
  }
};

// Function to manually take a picture during SOS
export const takeEmergencyPhoto = async (cameraRef: any) => {
  try {
    console.log('Taking emergency photo...');
    
    // Use our simplified capturePhoto function that handles permissions internally
    const photoUri = await capturePhoto();
    
    if (!photoUri) {
      console.log('Photo capture was canceled or failed');
      return null;
    }
    
    console.log('📸 Emergency photo captured successfully:', photoUri);
    return photoUri;
  } catch (error) {
    console.error('Error taking emergency photo:', error);
    return null;
  }
};