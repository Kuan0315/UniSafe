import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { safeCheckMediaPermissions, safeRequestMediaPermissions } from '../../services/MediaService';

export default function usePermissions() {
  const [permissions, setPermissions] = useState({
    location: false,
    camera: false,
    microphone: false,
    mediaLibrary: false,
  });

  useEffect(() => {
    (async () => {
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: micStatus } = await Camera.requestMicrophonePermissionsAsync();
      
      // Use our safe permission checking for media library
      let hasMediaPermission = false;
      try {
        // Don't request media library permissions in Expo Go
        const isExpoGo = !!(global as any).ExpoGo;
        if (!isExpoGo) {
          // First check if permissions already granted
          hasMediaPermission = await safeCheckMediaPermissions();
          
          // Request permissions if not granted
          if (!hasMediaPermission) {
            hasMediaPermission = await safeRequestMediaPermissions();
          }
        } else {
          console.warn('Media library not available in Expo Go');
          hasMediaPermission = false; // Set as denied in Expo Go
        }
      } catch (error: any) {
        console.error('Error handling media library permissions:', error);
        hasMediaPermission = false;
      }

      setPermissions({
        location: locationStatus === 'granted',
        camera: cameraStatus === 'granted',
        microphone: micStatus === 'granted',
        mediaLibrary: hasMediaPermission,
      });
    })();
  }, []);

  return permissions;
}