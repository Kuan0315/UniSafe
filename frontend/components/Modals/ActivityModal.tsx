import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Activity {
  id: number;
  label: string;
  count: number;
  type: string; // Add this property
}

interface ActivityModalProps {
  visible: boolean;
  onClose: () => void;
  recentActivities?: Activity[];
}

export default function ActivityModal({ 
  visible, 
  onClose, 
  recentActivities = [
    { id: 1, label: 'Campus alert received', count: 1, type: 'alert' },
    { id: 2, label: 'Location shared', count: 3, type: 'location' },
    { id: 3, label: 'Safe arrival confirmed', count: 2, type: 'confirm' },
  ] 
}: ActivityModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sosModalOverlay}>
        <View style={styles.sosModalContent}>
          <View style={styles.sosModalHeader}>
            <Ionicons name="pulse" size={40} color="#007AFF" />
            <Text style={styles.sosModalTitle}>📊 Recent Activity</Text>
            <Text style={styles.sosModalSubtitle}>Your Safety Summary</Text>
          </View>

          <View style={styles.activitySummaryContainer}>
            {recentActivities.map((activity: Activity) => (
              <View key={activity.id} style={styles.activityStat}>
                <Text style={styles.activityStatLabel}>{activity.label}</Text>
                <Text style={styles.activityStatValue}>{activity.count}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sosModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    width: '90%',
  },
  sosModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sosModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 12,
    marginBottom: 4,
  },
  sosModalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  activitySummaryContainer: {
    marginVertical: 16,
  },
  activityStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  activityStatLabel: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  activityStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
});