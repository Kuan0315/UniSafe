import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  static async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }
    
    return true;
  }

  static async getPushToken() {
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Replace with your Expo project ID
      });
      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  static async scheduleLocalNotification(title: string, body: string, data?: any) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  static async scheduleSafetyAlert(
    incidentType: string,
    location: string,
    time: string,
    data?: any
  ) {
    const title = `⚠️ ${incidentType} Reported`;
    const body = `${incidentType} reported at ${location} at ${time}. Stay alert and avoid the area if possible.`;
    
    await this.scheduleLocalNotification(title, body, {
      type: 'safety_alert',
      incidentType,
      location,
      time,
      ...data,
    });
  }

  static async scheduleEmergencyAlert(
    message: string,
    data?: any
  ) {
    const title = '🚨 Emergency Alert';
    const body = message;
    
    await this.scheduleLocalNotification(title, body, {
      type: 'emergency',
      priority: 'high',
      ...data,
    });
  }

  static async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  static async cancelNotification(notificationId: string) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  // Listen for notification responses
  static addNotificationResponseListener(callback: (response: any) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Listen for notifications received while app is in foreground
  static addNotificationReceivedListener(callback: (notification: any) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }
}

// Example usage:
// await NotificationService.requestPermissions();
// await NotificationService.scheduleSafetyAlert('Theft', 'Engineering Building', '2:30 PM');
// await NotificationService.scheduleEmergencyAlert('SOS activated - Emergency services contacted');
