import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
}

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
  notifications?: Notification[];
  speakNotification?: (text: string) => void;
}

export default function NotificationsModal({
  visible,
  onClose,
  notifications = [
    {
      id: '1',
      title: 'Campus Safety Alert',
      description: 'Suspicious activity reported near the library.',
      time: '10 mins ago',
      read: false
    },
    {
      id: '2',
      title: 'Weather Alert',
      description: 'Heavy rain expected this evening. Take precautions.',
      time: '1 hour ago',
      read: false
    },
    {
      id: '3',
      title: 'Event Reminder',
      description: 'Safety workshop tomorrow at 2 PM in Main Hall.',
      time: '3 hours ago',
      read: true
    }
  ],
  speakNotification = (text: string) => console.log('Speaking:', text),
}: NotificationsModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sosModalOverlay}>
        <View style={styles.sosModalContent}>
          <View style={styles.sosModalHeader}>
            <TouchableOpacity style={styles.notifCloseBtn} onPress={onClose}>
              <Ionicons name="close" size={28} color="#666" />
            </TouchableOpacity>
            <Ionicons name="notifications" size={40} color="#007AFF" />
            <Text style={styles.notifTitle}>Notifications</Text>
            <Text style={styles.sosModalSubtitle}>Your latest updates</Text>
          </View>

          <TouchableOpacity
            style={styles.readAloudButton}
            onPress={() => {
              const notificationText = notifications
                .map((n: Notification) => `${n.title}. ${n.description}. Received at ${n.time}`)
                .join('. ');
              speakNotification(notificationText);
            }}
          >
            <Ionicons name="volume-high" size={20} color="#007AFF" />
            <Text style={styles.readAloudText}>Read Aloud</Text>
          </TouchableOpacity>

          <View>
            {notifications.map((n: Notification) => (
              <View key={n.id} style={styles.alertItem}>
                <Ionicons name="notifications" size={20} color="#007AFF" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontWeight: '600', color: '#1a1a1a' }}>{n.title}</Text>
                  <Text style={{ color: '#666', marginTop: 2 }}>{n.description}</Text>
                </View>
                <Text style={styles.alertTime}>{n.time}</Text>
              </View>
            ))}
          </View>
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
  notifCloseBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  notifTitle: {
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
  readAloudButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  readAloudText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  alertTime: {
    fontSize: 12,
    color: '#999',
  },
});