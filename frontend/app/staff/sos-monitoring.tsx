import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import StandardHeader from '../../components/StandardHeader';

interface SOSAlert {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  status: 'active' | 'resolved' | 'false_alarm';
  priority: 'critical' | 'high' | 'medium';
  mediaAttached: boolean;
  description?: string;
  emergencyContacts?: string[];
  responseTime?: number;
}

export default function SOSMonitoring() {
  const [sosAlerts, setSosAlerts] = useState<SOSAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<SOSAlert[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<SOSAlert | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSOSAlerts();
    // Set up real-time updates (replace with actual WebSocket/polling)
    const interval = setInterval(loadSOSAlerts, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilter();
  }, [sosAlerts, filterStatus]);

  const loadSOSAlerts = async () => {
    try {
      // Simulate API call - replace with actual API
      const mockAlerts: SOSAlert[] = [
        {
          id: '1',
          userId: 'user123',
          userName: 'John Doe',
          userPhone: '+60123456789',
          timestamp: new Date(Date.now() - 300000), // 5 mins ago
          location: {
            latitude: 3.1319,
            longitude: 101.6841,
            address: 'Main Campus Library, University of Malaya'
          },
          status: 'active',
          priority: 'critical',
          mediaAttached: true,
          description: 'Emergency situation near the library entrance',
          emergencyContacts: ['+60198765432', '+60187654321'],
        },
        {
          id: '2',
          userId: 'user456',
          userName: 'Jane Smith',
          userPhone: '+60123456790',
          timestamp: new Date(Date.now() - 900000), // 15 mins ago
          location: {
            latitude: 3.1325,
            longitude: 101.6850,
            address: 'Engineering Faculty, University of Malaya'
          },
          status: 'resolved',
          priority: 'high',
          mediaAttached: false,
          description: 'Suspicious person reported',
          responseTime: 12,
        },
        {
          id: '3',
          userId: 'user789',
          userName: 'Bob Wilson',
          userPhone: '+60123456791',
          timestamp: new Date(Date.now() - 1800000), // 30 mins ago
          location: {
            latitude: 3.1315,
            longitude: 101.6845,
            address: 'Student Residence Hall A'
          },
          status: 'false_alarm',
          priority: 'medium',
          mediaAttached: false,
          description: 'Accidentally triggered SOS',
          responseTime: 8,
        },
      ];

      setSosAlerts(mockAlerts);
    } catch (error) {
      console.error('Error loading SOS alerts:', error);
      Alert.alert('Error', 'Failed to load SOS alerts');
    }
  };

  const applyFilter = () => {
    if (filterStatus === 'all') {
      setFilteredAlerts(sosAlerts);
    } else {
      setFilteredAlerts(sosAlerts.filter(alert => alert.status === filterStatus));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSOSAlerts();
    setRefreshing(false);
  };

  const handleAlertPress = (alert: SOSAlert) => {
    setSelectedAlert(alert);
    setModalVisible(true);
  };

  const updateAlertStatus = async (alertId: string, newStatus: SOSAlert['status']) => {
    try {
      // Simulate API call
      setSosAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, status: newStatus, responseTime: newStatus !== 'active' ? Math.floor((Date.now() - alert.timestamp.getTime()) / 60000) : undefined }
            : alert
        )
      );
      setModalVisible(false);
      Alert.alert('Success', `Alert marked as ${newStatus}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update alert status');
    }
  };

  const makeCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const openMaps = (latitude: number, longitude: number) => {
    const url = `https://maps.google.com/?q=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#FF3B30';
      case 'resolved': return '#34C759';
      case 'false_alarm': return '#8E8E93';
      default: return '#007AFF';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#FF3B30';
      case 'high': return '#FF9500';
      case 'medium': return '#007AFF';
      default: return '#8E8E93';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const filterButtons = [
    { key: 'all', label: 'All', count: sosAlerts.length },
    { key: 'active', label: 'Active', count: sosAlerts.filter(a => a.status === 'active').length },
    { key: 'resolved', label: 'Done', count: sosAlerts.filter(a => a.status === 'resolved').length },
    { key: 'false_alarm', label: 'False', count: sosAlerts.filter(a => a.status === 'false_alarm').length },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StandardHeader 
        title="SOS Monitoring" 
        subtitle="Monitor and respond to emergency alerts"
        rightIcon="refresh"
        onRightPress={onRefresh}
        theme="blue"
        showBackButton={false}
        showLogo={true}
      />
      
      {/* Filter Buttons */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {filterButtons.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              filterStatus === filter.key && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus(filter.key)}
          >
            <Text style={[
              styles.filterButtonText,
              filterStatus === filter.key && styles.filterButtonTextActive
            ]}>
              {filter.label} ({filter.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* SOS Alerts List */}
      <ScrollView
        style={styles.alertsList}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
      >
        {filteredAlerts.map((alert) => (
          <TouchableOpacity
            key={alert.id}
            style={[
              styles.alertCard,
              alert.status === 'active' && styles.alertCardActive
            ]}
            onPress={() => handleAlertPress(alert)}
          >
            <View style={styles.alertHeader}>
              <View style={styles.alertUser}>
                <Ionicons name="person-circle" size={32} color="#007AFF" />
                <View style={styles.alertUserInfo}>
                  <Text style={styles.alertUserName}>{alert.userName}</Text>
                  <Text style={styles.alertTime}>{formatTimeAgo(alert.timestamp)}</Text>
                </View>
              </View>
              <View style={styles.alertBadges}>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(alert.priority) }]}>
                  <Text style={styles.badgeText}>{alert.priority.toUpperCase()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(alert.status) }]}>
                  <Text style={styles.badgeText}>{alert.status.replace('_', ' ').toUpperCase()}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.alertLocation}>{alert.location.address}</Text>
            
            {alert.description && (
              <Text style={styles.alertDescription}>{alert.description}</Text>
            )}

            <View style={styles.alertMeta}>
              <View style={styles.alertMetaItem}>
                <Ionicons name="location" size={16} color="#8E8E93" />
                <Text style={styles.alertMetaText}>
                  {alert.location.latitude.toFixed(4)}, {alert.location.longitude.toFixed(4)}
                </Text>
              </View>
              {alert.mediaAttached && (
                <View style={styles.alertMetaItem}>
                  <Ionicons name="camera" size={16} color="#007AFF" />
                  <Text style={styles.alertMetaText}>Media attached</Text>
                </View>
              )}
              {alert.responseTime && (
                <View style={styles.alertMetaItem}>
                  <Ionicons name="time" size={16} color="#34C759" />
                  <Text style={styles.alertMetaText}>{alert.responseTime}m response</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {filteredAlerts.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={64} color="#8E8E93" />
            <Text style={styles.emptyStateTitle}>No SOS alerts</Text>
            <Text style={styles.emptyStateText}>
              {filterStatus === 'all' 
                ? 'No SOS alerts have been received yet.' 
                : `No ${filterStatus.replace('_', ' ')} alerts found.`
              }
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Alert Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedAlert && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>SOS Alert Details</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#8E8E93" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScroll}>
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>User Information</Text>
                    <Text style={styles.modalText}>Name: {selectedAlert.userName}</Text>
                    <Text style={styles.modalText}>Phone: {selectedAlert.userPhone}</Text>
                    <Text style={styles.modalText}>Time: {selectedAlert.timestamp.toLocaleString()}</Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Location</Text>
                    <Text style={styles.modalText}>{selectedAlert.location.address}</Text>
                    <Text style={styles.modalText}>
                      Coordinates: {selectedAlert.location.latitude.toFixed(6)}, {selectedAlert.location.longitude.toFixed(6)}
                    </Text>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => openMaps(selectedAlert.location.latitude, selectedAlert.location.longitude)}
                    >
                      <Ionicons name="map" size={20} color="#fff" />
                      <Text style={styles.modalButtonText}>Open in Maps</Text>
                    </TouchableOpacity>
                  </View>

                  {selectedAlert.description && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Description</Text>
                      <Text style={styles.modalText}>{selectedAlert.description}</Text>
                    </View>
                  )}

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Quick Actions</Text>
                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: '#34C759' }]}
                      onPress={() => makeCall(selectedAlert.userPhone)}
                    >
                      <Ionicons name="call" size={20} color="#fff" />
                      <Text style={styles.modalButtonText}>Call User</Text>
                    </TouchableOpacity>

                    {selectedAlert.emergencyContacts?.map((contact, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.modalButton, { backgroundColor: '#FF9500' }]}
                        onPress={() => makeCall(contact)}
                      >
                        <Ionicons name="call" size={20} color="#fff" />
                        <Text style={styles.modalButtonText}>Call Contact {index + 1}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {selectedAlert.status === 'active' && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Update Status</Text>
                      <TouchableOpacity
                        style={[styles.modalButton, { backgroundColor: '#34C759' }]}
                        onPress={() => updateAlertStatus(selectedAlert.id, 'resolved')}
                      >
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        <Text style={styles.modalButtonText}>Mark as Resolved</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modalButton, { backgroundColor: '#8E8E93' }]}
                        onPress={() => updateAlertStatus(selectedAlert.id, 'false_alarm')}
                      >
                        <Ionicons name="close-circle" size={20} color="#fff" />
                        <Text style={styles.modalButtonText}>Mark as False Alarm</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
   filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8, 
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    maxHeight: 50, // Add a maximum height constraint
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 6, // Reduced vertical padding
    marginRight: 8,
    borderRadius: 6,
    backgroundColor: '#F2F2F7',
    height: 32, // Fixed height for consistent button size
    justifyContent: 'center', // Center text vertically
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 16, // Explicit line height to prevent text from expanding button
  },
  
  
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  
  filterButtonTextActive: {
    color: '#fff',
  },
  alertsList: {
    flex: 1,
    padding: 16,
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  alertCardActive: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  alertUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  alertUserInfo: {
    marginLeft: 12,
    flex: 1,
  },
  alertUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  alertTime: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  alertBadges: {
    gap: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-end',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  alertLocation: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 8,
  },
  alertDescription: {
    fontSize: 14,
    color: '#1D1D1F',
    marginBottom: 12,
  },
  alertMeta: {
    gap: 8,
  },
  alertMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertMetaText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    color: '#1D1D1F',
    marginBottom: 8,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});