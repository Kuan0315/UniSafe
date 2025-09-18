import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Alert {
  id: number;
  type: 'warning' | 'info';
  message: string;
  time: string;
}

interface SafetyAlertsProps {
  alerts: Alert[];
  onViewAll: () => void;
}

export default function SafetyAlerts({ alerts, onViewAll }: SafetyAlertsProps) {
  return (
    <View style={styles.alertsContainer}>
      <View style={styles.alertsHeader}>
        <Text style={styles.alertsTitle}>Safety Alerts</Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      {alerts.slice(0, 2).map((alert: Alert) => (
        <View 
          key={alert.id} 
          style={[
            styles.alertItem, 
            { borderLeftColor: alert.type === 'warning' ? '#ff6b35' : '#007AFF' }
          ]}
        >
          <View style={styles.alertIconContainer}>
            <Ionicons
              name={alert.type === 'warning' ? 'warning' : 'information-circle'}
              size={24}
              color={alert.type === 'warning' ? '#ff6b35' : '#007AFF'}
            />
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertMessage}>{alert.message}</Text>
            <Text style={styles.alertTime}>{alert.time}</Text>
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
});