import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

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
      
      let mediaStatus = 'denied';
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync(false, ['audio', 'photo', 'video']);
        mediaStatus = status;
      } catch (error: any) {
        if (error.message?.includes('Expo Go can no longer provide full access')) {
          console.warn('Media library not available in Expo Go');
          mediaStatus = 'denied'; // Set as denied in Expo Go
        } else {
          console.error('Error requesting media library permissions:', error);
        }
      }

      setPermissions({
        location: locationStatus === 'granted',
        camera: cameraStatus === 'granted',
        microphone: micStatus === 'granted',
        mediaLibrary: mediaStatus === 'granted',
      });
    })();
  }, []);

  return permissions;
}