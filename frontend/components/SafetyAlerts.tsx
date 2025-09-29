import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SafetyAlert {
  id: string;
  title: string;
  message: string;
  type: 'critical' | 'warning' | 'info';
  priority: 'high' | 'medium' | 'low';
  category: string;
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  timeLimit?: number;
  scheduledAt?: Date;
  isActive: boolean;
  isAutoDeactivated: boolean;
  isScheduled: boolean;
  sendPushNotification: boolean;
  sendEmail: boolean;
  sendSMS: boolean;
  alertScope: 'campus-wide' | 'location-specific';
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    radius?: number;
  };
}

interface SafetyAlertsProps {
  alerts: SafetyAlert[];
  onViewAll: () => void;
}

export default function SafetyAlerts({ alerts, onViewAll }: SafetyAlertsProps) {
  const getAlertColor = (type: SafetyAlert['type']) => {
    switch (type) {
      case 'critical': return '#FF3B30';
      case 'warning': return '#FF9500';
      case 'info': return '#007AFF';
      default: return '#007AFF';
    }
  };

  const getAlertIcon = (type: SafetyAlert['type']) => {
    switch (type) {
      case 'critical': return 'alert-circle';
      case 'warning': return 'warning';
      case 'info': return 'information-circle';
      default: return 'information-circle';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <View style={styles.alertsContainer}>
      <View style={styles.alertsHeader}>
        <Text style={styles.alertsTitle}>Safety Alerts</Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      {alerts.slice(0, 2).map((alert: SafetyAlert) => (
        <View 
          key={alert.id} 
          style={[styles.alertItem, { borderLeftColor: getAlertColor(alert.type) }]}
        >
          <View style={styles.alertIconContainer}>
            <Ionicons
              name={getAlertIcon(alert.type)}
              size={24}
              color={getAlertColor(alert.type)}
            />
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertMessage}>{alert.title}</Text>
            <Text style={styles.alertTime}>
              {alert.alertScope === 'location-specific' ? 
                `📍 ${alert.location?.address || 'Specific Location'}` : 
                '🏫 Campus Wide'
              } • {formatTime(alert.createdAt)}
            </Text>
            {alert.location && (
              <Text style={styles.alertLocation}>
                📍 {alert.location.address || `${alert.location.latitude?.toFixed(4)}, ${alert.location.longitude?.toFixed(4)}`}
                {alert.location.radius && ` (Radius: ${alert.location.radius}m)`}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  alertsContainer: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  alertsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  viewAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF', // Default color, we'll handle warning color with inline styles
  },
  alertIconContainer: {
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertMessage: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 12,
    color: '#999',
  },
  alertLocation: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
});