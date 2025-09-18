/**
 * This file provides alternative implementations for MediaLibrary functions
 * that avoid using audio permissions.
 */
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

/**
 * Safely check permissions without requesting audio access.
 * Falls back to simple permission check logic if MediaLibrary fails.
 */
export const safeCheckMediaPermissions = async (): Promise<boolean> => {
  try {
    // Try using the official API first
    const permInfo = await MediaLibrary.getPermissionsAsync();
    return permInfo.granted;
  } catch (error) {
    console.log("MediaLibrary permissions check failed, using fallback: ", error);
    
    // If we're here, we couldn't check permissions through MediaLibrary
    // We'll assume permissions aren't granted and need to be requested
    return false;
  }
};

/**
 * Safely request media permissions without requiring audio permission.
 * This tries to work around the audio permission issue.
 */
export const safeRequestMediaPermissions = async (): Promise<boolean> => {
  try {
    // Try the normal permission request
    const permInfo = await MediaLibrary.requestPermissionsAsync();
    return permInfo.granted;
  } catch (error) {
    console.log("MediaLibrary permissions request failed: ", error);
    
    // Inform the user about the issue
    Alert.alert(
      "Permission Required",
      "We need permission to save photos and videos to your gallery. Please grant these permissions in your device settings.",
      [
        { text: "OK" }
      ]
    );
    
    return false;
  }
};

/**
 * Safely saves a photo or video to the device gallery without requiring audio permission.
 * Falls back to just keeping the file in the app's cache if permissions fail.
 */
export const safeSaveToGallery = async (
  uri: string, 
  mediaType: 'photo' | 'video'
): Promise<string | null> => {
  try {
    // First check permissions
    let hasPermission = false;
    
    try {
      hasPermission = await safeCheckMediaPermissions();
      if (!hasPermission) {
        hasPermission = await safeRequestMediaPermissions();
      }
    } catch (error) {
      console.log("Permission checks failed, assuming no permission: ", error);
    }
    
    if (hasPermission) {
      try {
        // Try to save asset to media library
        const asset = await MediaLibrary.createAssetAsync(uri);
        
        // Try to save to album
        try {
          const album = await MediaLibrary.getAlbumAsync("UniSafe Emergency");
          if (album) {
            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
          } else {
            await MediaLibrary.createAlbumAsync("UniSafe Emergency", asset, false);
          }
          console.log(`📱 ${mediaType} saved to UniSafe Emergency album`);
        } catch (albumError) {
          console.log(`📱 ${mediaType} saved to gallery (default location): ${asset.uri}`);
        }
        
        return asset.uri;
      } catch (error) {
        console.log(`Error saving ${mediaType} to gallery: ${error}`);
        return uri; // Return original URI as fallback
      }
    } else {
      // If no permission, just return the original URI
      console.log(`No media library permission - ${mediaType} will not be saved to gallery`);
      return uri;
    }
  } catch (error) {
    console.log(`Error in safeSaveToGallery: ${error}`);
    return uri; // Just return the original URI if anything fails
  }
};