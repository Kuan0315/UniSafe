/**
 * SimpleCaptureService.ts
 * 
 * This service provides simplified media capture functionality without using MediaLibrary.
 * It avoids the permission issues with MediaLibrary in Expo SDK 54+.
 */
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

/**
 * Captures a photo using ImagePicker (no MediaLibrary needed)
 */
export const capturePhoto = async (): Promise<string | null> => {
  try {
    // Request camera permissions
    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    if (!cameraStatus.granted) {
      Alert.alert('Permission Required', 'Camera access is needed to capture photos.');
      return null;
    }
    
    // Launch the camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8
    });
    
    if (result.canceled || !result.assets || result.assets.length === 0) {
      console.log('Photo capture was canceled');
      return null;
    }
    
    const asset = result.assets[0];
    console.log(`📸 Emergency photo captured:`, asset.uri);
    
    Alert.alert(
      'Photo Captured',
      'Emergency photo has been saved.',
      [{ text: 'OK' }]
    );
    
    return asset.uri;
  } catch (error) {
    console.error('Error capturing photo:', error);
    Alert.alert('Error', 'Failed to capture photo. Please try again.');
    return null;
  }
};

/**
 * Records a video using ImagePicker (no MediaLibrary needed)
 */
export const captureVideo = async (): Promise<string | null> => {
  try {
    // Request camera permissions
    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    if (!cameraStatus.granted) {
      Alert.alert('Permission Required', 'Camera access is needed to record videos.');
      return null;
    }
    
    // Launch the camera for video
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      videoMaxDuration: 30
    });
    
    if (result.canceled || !result.assets || result.assets.length === 0) {
      console.log('Video recording was canceled');
      return null;
    }
    
    const asset = result.assets[0];
    console.log(`🎥 Emergency video captured:`, asset.uri);
    
    Alert.alert(
      'Video Recorded',
      'Emergency video has been saved.',
      [{ text: 'OK' }]
    );
    
    return asset.uri;
  } catch (error) {
    console.error('Error recording video:', error);
    Alert.alert('Error', 'Failed to record video. Please try again.');
    return null;
  }
};