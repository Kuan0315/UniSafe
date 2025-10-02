import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { capturePhoto, captureVideo } from './SimpleCaptureService';
import { Api } from './api';

// Simple runtime flag to know if we are inside Expo Go (development client would have full native modules)
const isExpoGo = !!(global as any).ExpoGo; // heuristic – Expo Go injects a global marker

export const canSaveToGallery = !isExpoGo; // caller can use to adjust UI messaging

export interface SOSAlert {
  id: string;
  userId: string;
  studentInfo: {
    name: string;
    email: string;
    phone?: string;
    studentId: string;
    avatarDataUrl?: string;
  };
  // Convenience properties for frontend
  userName: string;
  userPhone?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    accuracy?: number;
    timestamp: Date;
  };
  chatSummary?: string;
  timestamp: Date;
  status: 'active' | 'resolved' | 'false_alarm' | 'following' | 'responding';
  priority: 'high' | 'medium' | 'low';
  type: 'emergency' | 'discreet';
  currentLocation: {
    latitude: number;
    longitude: number;
    address?: string;
    accuracy?: number;
    timestamp: Date;
  };
  locationHistory: Array<{
    latitude: number;
    longitude: number;
    address?: string;
    timestamp: Date;
  }>;
  media: Array<{
    type: 'photo' | 'video';
    url: string;
    timestamp: Date;
    isAutoCaptured?: boolean;
  }>;
  chatMessages: Array<{
    senderId: string;
    senderRole: 'student' | 'staff' | 'security';
    message: string;
    timestamp: Date;
    messageType: 'text' | 'location_update' | 'media_shared';
    mediaUrl?: string;
  }>;
  assignedStaff?: string;
  responders: string[];
  resolvedBy?: string;
  resolutionNote?: string;
  resolvedAt?: Date;
  autoVideoEnabled: boolean;
  liveLocationEnabled: boolean;
  initialMessage?: string;
  category?: string;
  // Additional properties for staff monitoring
  respondingStaff?: Array<{
    staffId: string;
    staffName: string;
    joinedAt: Date;
    phone?: string;
  }>;
  followedBy?: {
    staffId: string;
    staffName: string;
    followedAt: Date;
    phone?: string;
  };
  responseTime?: number; // in minutes
  isMoving?: boolean;
  lastLocationUpdate?: Date;
  batteryLevel?: number;
  emergencyContacts?: Array<{
    name: string;
    phone: string;
    relationship: string;
  }>;
}

export const triggerSOS = async (
  location: Location.LocationObject | null,
  initialMessage?: string,
  category?: string,
  autoVideoEnabled: boolean = false,
  liveLocationEnabled: boolean = true,
  type: 'emergency' | 'discreet' = 'emergency'
): Promise<string | null> => {
  try {
    // Provide haptic feedback to indicate SOS activation
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }, 300);

    if (!location) {
      throw new Error('Location not available');
    }

    // Get address from coordinates
    let address: string | undefined;
    try {
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      if (geocode.length > 0) {
        const addr = geocode[0];
        address = `${addr.street || ''} ${addr.city || ''} ${addr.region || ''} ${addr.postalCode || ''}`.trim();
      }
    } catch (error) {
      console.warn('Failed to get address:', error);
    }

    // Create SOS alert on backend
    const response = await Api.post('/sos', {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      address,
      accuracy: location.coords.accuracy,
      initialMessage,
      category,
      autoVideoEnabled,
      liveLocationEnabled,
      type
    });

    console.log('SOS alert created:', response.sosId);

    // Note: Auto-capture is now handled in the UI layer (activateSOS function)
    // to avoid duplicate recordings

    return response.sosId;
  } catch (error) {
    console.error('Error triggering SOS:', error);
    throw error;
  }
};

export const updateSOSLocation = async (
  sosId: string,
  location: Location.LocationObject
): Promise<void> => {
  try {
    let address: string | undefined;
    try {
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      if (geocode.length > 0) {
        const addr = geocode[0];
        address = `${addr.street || ''} ${addr.city || ''} ${addr.region || ''} ${addr.postalCode || ''}`.trim();
      }
    } catch (error) {
      console.warn('Failed to get address:', error);
    }

    await Api.post(`/sos/${sosId}/location`, {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      address,
      accuracy: location.coords.accuracy,
    });
  } catch (error) {
    console.error('Error updating SOS location:', error);
    throw error;
  }
};

export const sendSOSMessage = async (
  sosId: string,
  message: string,
  messageType: 'text' | 'location_update' | 'media_shared' = 'text',
  mediaUrl?: string
): Promise<void> => {
  try {
    await Api.post(`/sos/${sosId}/chat`, {
      message,
      messageType,
      mediaUrl,
    });
  } catch (error) {
    console.error('Error sending SOS message:', error);
    throw error;
  }
};

export const uploadSOSMedia = async (
  sosId: string,
  type: 'photo' | 'video',
  url: string,
  isAutoCaptured: boolean = false
): Promise<void> => {
  try {
    await Api.post(`/sos/${sosId}/media`, {
      type,
      url,
      isAutoCaptured,
    });
  } catch (error) {
    console.error('Error uploading SOS media:', error);
    throw error;
  }
};

export const captureEmergencyMedia = async (
  cameraRef: any,
  autoCaptureSOS: boolean
): Promise<string | null> => {
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

// Staff functions for managing SOS alerts
export const getActiveSOSAlerts = async (): Promise<SOSAlert[]> => {
  try {
    const response = await Api.get('/sos/active');
    const alerts = response.alerts || [];
    // Convert timestamp strings to Date objects
    return alerts.map((alert: any) => ({
      id: alert._id,
      ...alert,
      // Add convenience properties
      userName: alert.studentInfo?.name || 'Unknown User',
      userPhone: alert.studentInfo?.phone,
      location: alert.currentLocation ? {
        ...alert.currentLocation,
        timestamp: new Date(alert.currentLocation.timestamp)
      } : undefined,
      timestamp: new Date(alert.timestamp),
      currentLocation: alert.currentLocation ? {
        ...alert.currentLocation,
        timestamp: new Date(alert.currentLocation.timestamp)
      } : undefined,
      locationHistory: alert.locationHistory?.map((loc: any) => ({
        ...loc,
        timestamp: new Date(loc.timestamp)
      })) || [],
      media: alert.media?.map((media: any) => ({
        ...media,
        timestamp: new Date(media.timestamp)
      })) || [],
      chatMessages: alert.chatMessages?.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })) || [],
      resolvedAt: alert.resolvedAt ? new Date(alert.resolvedAt) : undefined,
      // Map populated followedBy field
      followedBy: alert.followedBy ? {
        staffId: alert.followedBy._id,
        staffName: alert.followedBy.name,
        followedAt: alert.followedAt || new Date(), // Use existing followedAt or current time
        phone: alert.followedBy.phone
      } : undefined,
      // Map populated responders field
      respondingStaff: alert.responders?.map((responder: any) => ({
        staffId: responder._id,
        staffName: responder.name,
        joinedAt: new Date(), // We don't have this info, so use current time
        phone: responder.phone
      })) || [],
      emergencyContacts: alert.emergencyContacts || []
    }));
  } catch (error) {
    console.error('Error fetching active SOS alerts:', error);
    throw error;
  }
};

export const getSOSAlertById = async (sosId: string): Promise<SOSAlert> => {
  try {
    const response = await Api.get(`/sos/${sosId}`);
    const alert = response.alert;
    // Convert timestamp strings to Date objects
    return {
      id: alert._id,
      ...alert,
      // Add convenience properties
      userName: alert.studentInfo?.name || 'Unknown User',
      userPhone: alert.studentInfo?.phone,
      location: alert.currentLocation ? {
        ...alert.currentLocation,
        timestamp: new Date(alert.currentLocation.timestamp)
      } : undefined,
      timestamp: new Date(alert.timestamp),
      currentLocation: alert.currentLocation ? {
        ...alert.currentLocation,
        timestamp: new Date(alert.currentLocation.timestamp)
      } : undefined,
      locationHistory: alert.locationHistory?.map((loc: any) => ({
        ...loc,
        timestamp: new Date(loc.timestamp)
      })) || [],
      media: alert.media?.map((media: any) => ({
        ...media,
        timestamp: new Date(media.timestamp)
      })) || [],
      chatMessages: alert.chatMessages?.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })) || [],
      resolvedAt: alert.resolvedAt ? new Date(alert.resolvedAt) : undefined
    };
  } catch (error) {
    console.error('Error fetching SOS alert:', error);
    throw error;
  }
};

export const assignSOSAlert = async (sosId: string, staffId: string): Promise<void> => {
  try {
    await Api.post(`/sos/${sosId}/assign`, { staffId });
  } catch (error) {
    console.error('Error assigning SOS alert:', error);
    throw error;
  }
};

export const updateSOSStatus = async (
  sosId: string,
  status: 'active' | 'resolved' | 'false_alarm',
  resolutionNote?: string
): Promise<void> => {
  try {
    await Api.post(`/sos/${sosId}/status`, {
      status,
      resolutionNote,
    });
  } catch (error) {
    console.error('Error updating SOS status:', error);
    throw error;
  }
};

export const getSOSChatMessages = async (sosId: string): Promise<SOSAlert['chatMessages']> => {
  try {
    const response = await Api.get(`/sos/${sosId}/chat`);
    const messages = response.messages || [];
    // Convert timestamp strings to Date objects
    return messages.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
  } catch (error) {
    console.error('Error fetching SOS chat messages:', error);
    throw error;
  }
};

export const sendStaffSOSMessage = async (
  sosId: string,
  message: string,
  messageType: 'text' | 'location_update' | 'media_shared' = 'text',
  mediaUrl?: string
): Promise<void> => {
  try {
    await Api.post(`/sos/${sosId}/chat/staff`, {
      message,
      messageType,
      mediaUrl,
    });
  } catch (error) {
    console.error('Error sending staff SOS message:', error);
    throw error;
  }
};

export const getSOSLocationHistory = async (sosId: string): Promise<SOSAlert['locationHistory']> => {
  try {
    const response = await Api.get(`/sos/${sosId}/location-history`);
    const locationHistory = response.locationHistory || [];
    // Convert timestamp strings to Date objects
    return locationHistory.map((loc: any) => ({
      ...loc,
      timestamp: new Date(loc.timestamp)
    }));
  } catch (error) {
    console.error('Error fetching SOS location history:', error);
    throw error;
  }
};

export const getSOSMedia = async (sosId: string): Promise<SOSAlert['media']> => {
  try {
    const response = await Api.get(`/sos/${sosId}/media`);
    const media = response.media || [];
    // Convert timestamp strings to Date objects
    return media.map((mediaItem: any) => ({
      ...mediaItem,
      timestamp: new Date(mediaItem.timestamp)
    }));
  } catch (error) {
    console.error('Error fetching SOS media:', error);
    throw error;
  }
};

// Student functions for managing their own SOS alerts
export const getMySOSAlerts = async (): Promise<SOSAlert[]> => {
  try {
    const response = await Api.get('/sos/my-alerts');
    const alerts = response.alerts || [];
    // Convert timestamp strings to Date objects
    return alerts.map((alert: any) => ({
      ...alert,
      // Add convenience properties
      userName: alert.studentInfo?.name || 'Unknown User',
      userPhone: alert.studentInfo?.phone,
      location: alert.currentLocation ? {
        ...alert.currentLocation,
        timestamp: new Date(alert.currentLocation.timestamp)
      } : undefined,
      timestamp: new Date(alert.timestamp),
      currentLocation: alert.currentLocation ? {
        ...alert.currentLocation,
        timestamp: new Date(alert.currentLocation.timestamp)
      } : undefined,
      locationHistory: alert.locationHistory?.map((loc: any) => ({
        ...loc,
        timestamp: new Date(loc.timestamp)
      })) || [],
      media: alert.media?.map((media: any) => ({
        ...media,
        timestamp: new Date(media.timestamp)
      })) || [],
      chatMessages: alert.chatMessages?.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })) || [],
      resolvedAt: alert.resolvedAt ? new Date(alert.resolvedAt) : undefined
    }));
  } catch (error) {
    console.error('Error fetching my SOS alerts:', error);
    throw error;
  }
};

export const cancelSOSAlert = async (sosId: string, reason?: string, details?: string): Promise<void> => {
  try {
    await Api.post(`/sos/${sosId}/cancel`, { reason, details });
  } catch (error) {
    console.error('Error canceling SOS alert:', error);
    throw error;
  }
};

// Utility functions
export const formatSOSStatus = (status: string): string => {
  switch (status) {
    case 'active':
      return 'Active Emergency';
    case 'resolved':
      return 'Resolved';
    case 'false_alarm':
      return 'False Alarm';
    default:
      return status;
  }
};

export const formatSOSPriority = (priority: string): string => {
  switch (priority) {
    case 'high':
      return '🔴 High Priority';
    case 'medium':
      return '🟡 Medium Priority';
    case 'low':
      return '🟢 Low Priority';
    default:
      return priority;
  }
};

export const formatSOSType = (type: string): string => {
  switch (type) {
    case 'emergency':
      return '🚨 Emergency Alert';
    case 'discreet':
      return '🔇 Discreet Alert';
    default:
      return type;
  }
};