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
        <View key={alert.id} style={styles.alertItem}>
          <Ionicons
            name={alert.type === 'warning' ? 'warning' : 'information-circle'}
            size={20}
            color={alert.type === 'warning' ? '#ff6b35' : '#007AFF'}
          />
          <Text style={styles.alertMessage}>{alert.message}</Text>
          <Text style={styles.alertTime}>{alert.time}</Text>
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
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  alertMessage: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
    marginLeft: 12,
    marginRight: 8,
  },
  alertTime: {
    fontSize: 12,
    color: '#999',
  },
});