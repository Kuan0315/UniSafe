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
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import StandardHeader from '../../components/StandardHeader';
import StaffEmergencyChat from '../../components/StaffEmergencyChat';
import { Video, ResizeMode } from 'expo-av';

interface SOSAlert {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userPhoto?: string;
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  locationHistory: Array<{
    latitude: number;
    longitude: number;
    timestamp: Date;
  }>;
  lastLocationUpdate: Date;
  isMoving: boolean;
  batteryLevel?: number;
  status: 'active' | 'following' | 'responding' | 'resolved' | 'false_alarm';
  priority: 'critical' | 'high' | 'medium';
  emergencyType: 'general_emergency' | 'medical' | 'fire' | 'security' | 'assault' | 'harassment';
  mediaAttached: boolean;
  mediaUrls?: {
    url: string;
    type: 'image' | 'video';
    thumbnail?: string;
  }[];
  description?: string;
  chatSummary?: string;
  emergencyContacts?: string[];
  responseTime?: number;
  followedBy?: {
    staffId: string;
    staffName: string;
    followedAt: Date;
    phone?: string;
  };
  respondingStaff?: Array<{
    staffId: string;
    staffName: string;
    role: string;
    eta?: string;
    phone?: string;
  }>;
}

export default function SOSMonitoring() {
  const [sosAlerts, setSosAlerts] = useState<SOSAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<SOSAlert[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<SOSAlert | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  const [messageSummary, setMessageSummary] = useState<string>('');

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
          userPhoto: 'https://picsum.photos/100/100?random=1',
          timestamp: new Date(Date.now() - 300000), // 5 mins ago
          location: {
            latitude: 3.1319,
            longitude: 101.6841,
            address: 'Main Campus Library, University of Malaya'
          },
          locationHistory: [
            { latitude: 3.1317, longitude: 101.6839, timestamp: new Date(Date.now() - 400000) },
            { latitude: 3.1318, longitude: 101.6840, timestamp: new Date(Date.now() - 350000) },
            { latitude: 3.1319, longitude: 101.6841, timestamp: new Date(Date.now() - 300000) },
          ],
          lastLocationUpdate: new Date(Date.now() - 60000), // 1 minute ago
          isMoving: true,
          batteryLevel: 85,
          status: 'active',
          priority: 'critical',
          emergencyType: 'general_emergency',
          mediaAttached: true,
          mediaUrls: [
            {
              url: 'https://picsum.photos/400/300?random=1',
              type: 'image'
            },
            {
              url: 'https://picsum.photos/400/300?random=2',
              type: 'image'
            },
            {
              url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
              type: 'video',
              thumbnail: 'https://picsum.photos/400/300?random=4'
            }
          ],
          description: 'Emergency situation near the library entrance, someone following me',
          chatSummary: 'Student reports being followed - security threat',
          emergencyContacts: ['+60198765432', '+60187654321'],
        },
        {
          id: '2',
          userId: 'user456',
          userName: 'Jane Smith',
          userPhone: '+60123456790',
          userPhoto: 'https://picsum.photos/100/100?random=2',
          timestamp: new Date(Date.now() - 900000), // 15 mins ago
          location: {
            latitude: 3.1325,
            longitude: 101.6850,
            address: 'Engineering Faculty, University of Malaya'
          },
          locationHistory: [
            { latitude: 3.1325, longitude: 101.6850, timestamp: new Date(Date.now() - 900000) },
          ],
          lastLocationUpdate: new Date(Date.now() - 300000), // 5 minutes ago
          isMoving: false,
          batteryLevel: 45,
          status: 'following',
          priority: 'high',
          emergencyType: 'medical',
          mediaAttached: true,
          mediaUrls: [
            {
              url: 'https://picsum.photos/400/300?random=3',
              type: 'image'
            }
          ],
          description: 'Having chest pain, need medical help urgently',
          chatSummary: 'Medical emergency - student requires medical assistance',
          responseTime: 12,
          followedBy: {
            staffId: 'MED001',
            staffName: 'Dr. Lisa Wong',
            followedAt: new Date(Date.now() - 600000),
            phone: '+60123456800',
          },
          respondingStaff: [
            { staffId: 'MED001', staffName: 'Dr. Lisa Wong', role: 'medical', eta: '2 minutes', phone: '+60123456800' },
            { staffId: 'SEC001', staffName: 'Ahmad Rahman', role: 'security', eta: '3 minutes', phone: '+60123456801' },
          ],
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
          locationHistory: [
            { latitude: 3.1315, longitude: 101.6845, timestamp: new Date(Date.now() - 1800000) },
          ],
          lastLocationUpdate: new Date(Date.now() - 1800000),
          isMoving: false,
          batteryLevel: 92,
          status: 'false_alarm',
          priority: 'medium',
          emergencyType: 'general_emergency',
          mediaAttached: false,
          description: 'Accidentally triggered SOS while jogging',
          chatSummary: 'False alarm - accidental activation confirmed',
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
    // Initialize messageSummary with existing chatSummary if available
    if (alert.chatSummary) {
      setMessageSummary(alert.chatSummary);
    } else {
      setMessageSummary('');
    }
  };

  const openImageViewer = (mediaItem: { url: string; type: 'image' | 'video'; thumbnail?: string }) => {
    setSelectedImageUrl(mediaItem.url);
    setImageViewerVisible(true);
  };

  const closeImageViewer = () => {
    setImageViewerVisible(false);
    setSelectedImageUrl('');
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

  const followSOSAlert = async (alertId: string) => {
    try {
      const updatedAlerts = sosAlerts.map(alert => 
        alert.id === alertId 
          ? { 
              ...alert, 
              status: 'following' as const,
              followedBy: {
                staffId: 'CURRENT_STAFF_ID',
                staffName: 'Current Staff Member',
                followedAt: new Date(),
                phone: '+60123456999',
              }
            }
          : alert
      );
      
      setSosAlerts(updatedAlerts);
      
      // Update the selected alert to show changes immediately
      const updatedSelectedAlert = updatedAlerts.find(alert => alert.id === alertId);
      if (updatedSelectedAlert) {
        setSelectedAlert(updatedSelectedAlert);
      }
      
      Alert.alert('Success', 'You are now following this SOS alert');
    } catch (error) {
      Alert.alert('Error', 'Failed to follow alert');
    }
  };

  const respondToSOS = async (alertId: string) => {
    try {
      const updatedAlerts = sosAlerts.map(alert => 
        alert.id === alertId 
          ? { 
              ...alert, 
              status: 'responding' as const,
              respondingStaff: [
                ...(alert.respondingStaff || []),
                {
                  staffId: 'CURRENT_STAFF_ID',
                  staffName: 'Current Staff Member',
                  role: 'security',
                  eta: '5 minutes',
                  phone: '+60123456999',
                }
              ]
            }
          : alert
      );
      
      setSosAlerts(updatedAlerts);
      
      // Update the selected alert to show changes immediately
      const updatedSelectedAlert = updatedAlerts.find(alert => alert.id === alertId);
      if (updatedSelectedAlert) {
        setSelectedAlert(updatedSelectedAlert);
      }
      
      Alert.alert('Success', 'You are now responding to this SOS alert');
    } catch (error) {
      Alert.alert('Error', 'Failed to respond to alert');
    }
  };

  const makeCall = (phoneNumber: string) => {
    if (phoneNumber === '999') {
      Alert.alert(
        'Emergency Call',
        'You are about to call 999 Emergency Services. This should only be used for genuine emergencies.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Call 999', 
            style: 'destructive',
            onPress: () => Linking.openURL(`tel:${phoneNumber}`)
          }
        ]
      );
    } else {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const openMaps = (latitude: number, longitude: number) => {
    const url = `https://maps.google.com/?q=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const handleMessageSummary = (summary: string) => {
    setMessageSummary(summary);
    
    // Update the alert's chatSummary in the main alerts list
    if (selectedAlert) {
      setSosAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alert.id === selectedAlert.id 
            ? { ...alert, chatSummary: summary }
            : alert
        )
      );
      
      // Also update filteredAlerts if it's currently filtered
      setFilteredAlerts(prevFiltered => 
        prevFiltered.map(alert => 
          alert.id === selectedAlert.id 
            ? { ...alert, chatSummary: summary }
            : alert
        )
      );
      
      // Update selectedAlert state for consistency
      setSelectedAlert(prev => prev ? { ...prev, chatSummary: summary } : null);
    }
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
            
            {alert.chatSummary && (
              <Text style={styles.alertDescription}>{alert.chatSummary}</Text>
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
                  <Text style={styles.alertMetaText}>
                    {alert.mediaUrls && alert.mediaUrls.length > 0 
                      ? `${alert.mediaUrls.length} file(s) - ${alert.mediaUrls.filter(m => m.type === 'image').length} img, ${alert.mediaUrls.filter(m => m.type === 'video').length} vid`
                      : 'Media attached'
                    }
                  </Text>
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

      {/* Alert Detail Modal - Full Screen */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.fullScreenModal}>
          {selectedAlert && (
            <>
              {/* Full Screen Header */}
              <View style={styles.fullScreenHeader}>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.fullScreenTitle}>SOS Alert Details</Text>
                <View style={styles.headerSpacer} />
              </View>

                <ScrollView style={styles.modalScroll}>
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>User Information</Text>
                    <Text style={styles.modalText}>Name: {selectedAlert.userName}</Text>
                    <Text style={styles.modalText}>Phone: {selectedAlert.userPhone}</Text>
                    <Text style={styles.modalText}>Time: {selectedAlert.timestamp.toLocaleString()}</Text>
                  </View>

                  {/* Enhanced Location Section with Live Tracking */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Live Location Tracking</Text>
                    
                    {/* Live Map View */}
                    <View style={styles.mapContainer}>
                      <MapView
                        provider={PROVIDER_GOOGLE}
                        style={styles.miniMap}
                        initialRegion={{
                          latitude: selectedAlert.location.latitude,
                          longitude: selectedAlert.location.longitude,
                          latitudeDelta: 0.005,
                          longitudeDelta: 0.005,
                        }}
                        showsUserLocation={false}
                        scrollEnabled={true}
                        zoomEnabled={true}
                      >
                        {/* Current Location Marker */}
                        <Marker
                          coordinate={selectedAlert.location}
                          title={selectedAlert.userName}
                          description="Current Location"
                        >
                          <View style={[styles.userMarker, { backgroundColor: selectedAlert.isMoving ? '#fd7e14' : '#28a745' }]}>
                            <Ionicons 
                              name="person" 
                              size={16} 
                              color="white" 
                            />
                            {selectedAlert.isMoving && (
                              <View style={styles.movingIndicator}>
                                <View style={styles.movingDot} />
                              </View>
                            )}
                          </View>
                        </Marker>

                        {/* Location History Trail */}
                        {selectedAlert.locationHistory.length > 1 && (
                          <Polyline
                            coordinates={selectedAlert.locationHistory}
                            strokeColor="#007bff"
                            strokeWidth={3}
                          />
                        )}

                        {/* Historical markers */}
                        {selectedAlert.locationHistory.slice(0, -1).map((location, index) => (
                          <Marker
                            key={index}
                            coordinate={location}
                            title={`Location ${index + 1}`}
                            description={location.timestamp.toLocaleTimeString()}
                          >
                            <View style={styles.historyMarker}>
                              <Text style={styles.historyMarkerText}>{index + 1}</Text>
                            </View>
                          </Marker>
                        ))}
                      </MapView>
                    </View>

                    {/* Location Status Info */}
                    <View style={styles.locationInfo}>
                      <View style={styles.locationInfoRow}>
                        <View style={styles.locationInfoItem}>
                          <Ionicons name="location" size={16} color="#007bff" />
                          <Text style={styles.locationInfoLabel}>Address:</Text>
                        </View>
                        <Text style={styles.locationInfoValue}>{selectedAlert.location.address}</Text>
                      </View>

                      <View style={styles.locationInfoRow}>
                        <View style={styles.locationInfoItem}>
                          <Ionicons name="navigate" size={16} color="#007bff" />
                          <Text style={styles.locationInfoLabel}>Coordinates:</Text>
                        </View>
                        <Text style={styles.locationInfoValue}>
                          {selectedAlert.location.latitude.toFixed(6)}, {selectedAlert.location.longitude.toFixed(6)}
                        </Text>
                      </View>

                      <View style={styles.locationInfoRow}>
                        <View style={styles.locationInfoItem}>
                          <Ionicons 
                            name={selectedAlert.isMoving ? "walk" : "pause-circle"} 
                            size={16} 
                            color={selectedAlert.isMoving ? "#fd7e14" : "#28a745"} 
                          />
                          <Text style={styles.locationInfoLabel}>Status:</Text>
                        </View>
                        <Text style={[styles.locationInfoValue, { color: selectedAlert.isMoving ? "#fd7e14" : "#28a745" }]}>
                          {selectedAlert.isMoving ? "Moving" : "Stationary"}
                        </Text>
                      </View>

                      <View style={styles.locationInfoRow}>
                        <View style={styles.locationInfoItem}>
                          <Ionicons name="time" size={16} color="#007bff" />
                          <Text style={styles.locationInfoLabel}>Last Update:</Text>
                        </View>
                        <Text style={styles.locationInfoValue}>
                          {selectedAlert.lastLocationUpdate.toLocaleString()}
                        </Text>
                      </View>

                      {selectedAlert.batteryLevel && (
                        <View style={styles.locationInfoRow}>
                          <View style={styles.locationInfoItem}>
                            <Ionicons 
                              name="battery-half" 
                              size={16} 
                              color={selectedAlert.batteryLevel < 20 ? "#dc3545" : "#28a745"} 
                            />
                            <Text style={styles.locationInfoLabel}>Battery:</Text>
                          </View>
                          <Text style={[
                            styles.locationInfoValue, 
                            { color: selectedAlert.batteryLevel < 20 ? "#dc3545" : "#28a745" }
                          ]}>
                            {selectedAlert.batteryLevel}% 
                            {selectedAlert.batteryLevel < 20 && " ⚠️ Low"}
                          </Text>
                        </View>
                      )}
                    </View>

                    <TouchableOpacity
                      style={[styles.cardButton, styles.mapCardButton]}
                      onPress={() => openMaps(selectedAlert.location.latitude, selectedAlert.location.longitude)}
                    >
                      <View style={styles.cardButtonContent}>
                        <Ionicons name="map" size={20} color="#007AFF" />
                        <Text style={[styles.cardButtonText, { color: '#007AFF' }]}>Open in External Maps</Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Emergency Summary */}
                  {messageSummary && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Emergency Summary</Text>
                      <View style={styles.summaryContainer}>
                        <Ionicons name="information-circle" size={20} color="#3182CE" />
                        <Text style={styles.summaryText}>{messageSummary}</Text>
                      </View>
                    </View>
                  )}

                  {/* Emergency Communication Chat */}
                  <View style={styles.modalSectionNoTopPadding}>
                    <StaffEmergencyChat
                      studentName={selectedAlert.userName}
                      alertId={selectedAlert.id}
                      onMessageSummary={handleMessageSummary}
                    />
                  </View>

                  {selectedAlert.mediaAttached && selectedAlert.mediaUrls && selectedAlert.mediaUrls.length > 0 && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Attached Media</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScrollView}>
                        {selectedAlert.mediaUrls.map((mediaItem, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.mediaContainer}
                            onPress={() => openImageViewer(mediaItem)}
                          >
                            {mediaItem.type === 'image' ? (
                              <Image
                                source={{ uri: mediaItem.url }}
                                style={styles.mediaImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={styles.videoThumbnailContainer}>
                                <Image
                                  source={{ uri: mediaItem.thumbnail || 'https://picsum.photos/120/90?random=video' }}
                                  style={styles.mediaImage}
                                  resizeMode="cover"
                                />
                                <View style={styles.videoPlayIcon}>
                                  <Ionicons name="play-circle" size={32} color="#fff" />
                                </View>
                              </View>
                            )}
                            <View style={styles.mediaOverlay}>
                              <Ionicons 
                                name={mediaItem.type === 'image' ? "expand-outline" : "videocam-outline"} 
                                size={20} 
                                color="#fff" 
                              />
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                  <Text style={styles.mediaHint}>
                    Tap to view full size • {selectedAlert.mediaUrls.length} file(s) attached 
                    ({selectedAlert.mediaUrls.filter(m => m.type === 'image').length} images, {selectedAlert.mediaUrls.filter(m => m.type === 'video').length} videos)
                  </Text>
                    </View>
                  )}

                  {/* Staff Assignment Section */}
                  {(selectedAlert.followedBy || (selectedAlert.respondingStaff && selectedAlert.respondingStaff.length > 0)) && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Staff Assignment</Text>
                      
                      {selectedAlert.followedBy && (
                        <View style={styles.staffSection}>
                          <Text style={styles.staffSectionTitle}>Following Staff</Text>
                          <View style={styles.followingStaff}>
                            <Ionicons name="person-circle" size={20} color="#007bff" />
                            <View style={styles.staffInfo}>
                              <Text style={styles.staffName}>
                                {selectedAlert.followedBy.staffName}
                                {selectedAlert.followedBy.staffName === 'Current Staff Member' && (
                                  <Text style={styles.youIndicator}> (You)</Text>
                                )}
                              </Text>
                              <Text style={styles.staffTime}>
                                Since {selectedAlert.followedBy.followedAt.toLocaleTimeString()}
                              </Text>
                            </View>
                            {selectedAlert.followedBy.phone && selectedAlert.followedBy.staffName !== 'Current Staff Member' && (
                              <TouchableOpacity
                                style={styles.phoneButton}
                                onPress={() => makeCall(selectedAlert.followedBy!.phone!)}
                              >
                                <Ionicons name="call" size={16} color="#007bff" />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      )}

                      {selectedAlert.respondingStaff && selectedAlert.respondingStaff.length > 0 && (
                        <View style={styles.staffSection}>
                          <Text style={styles.staffSectionTitle}>Responding Staff</Text>
                          {selectedAlert.respondingStaff.map((staff, index) => (
                            <View key={index} style={styles.respondingStaff}>
                              <Ionicons name="person" size={16} color="#28a745" />
                              <View style={styles.staffInfo}>
                                <Text style={styles.staffName}>
                                  {staff.staffName}
                                  {staff.staffName === 'Current Staff Member' && (
                                    <Text style={styles.youIndicator}> (You)</Text>
                                  )}
                                </Text>
                                <View style={styles.staffDetails}>
                                  <Text style={styles.staffRole}>({staff.role})</Text>
                                  <Text style={styles.staffEta}>ETA: {staff.eta}</Text>
                                </View>
                              </View>
                              {staff.phone && staff.staffName !== 'Current Staff Member' && (
                                <TouchableOpacity
                                  style={styles.phoneButton}
                                  onPress={() => makeCall(staff.phone!)}
                                >
                                  <Ionicons name="call" size={16} color="#28a745" />
                                </TouchableOpacity>
                              )}
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Emergency Actions</Text>
                    
                    <View style={styles.buttonRow}>
                      <TouchableOpacity
                        style={[styles.cardButton, styles.emergencyCardButton, styles.halfWidthButton]}
                        onPress={() => makeCall('999')}
                      >
                        <View style={styles.cardButtonContent}>
                          <Ionicons name="warning" size={20} color="#E53E3E" />
                          <Text style={[styles.cardButtonText, { color: '#E53E3E' }]}>Call 999</Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.cardButton, styles.callCardButton, styles.halfWidthButton]}
                        onPress={() => makeCall(selectedAlert.userPhone)}
                      >
                        <View style={styles.cardButtonContent}>
                          <Ionicons name="call" size={20} color="#3182CE" />
                          <Text style={[styles.cardButtonText, { color: '#3182CE' }]}>Call User</Text>
                        </View>
                      </TouchableOpacity>
                    </View>

                    {selectedAlert.emergencyContacts && selectedAlert.emergencyContacts.length > 0 && (
                      <View style={styles.buttonRow}>
                        <TouchableOpacity
                          style={[styles.cardButton, styles.contactCardButton, styles.halfWidthButton]}
                          onPress={() => selectedAlert.emergencyContacts?.[0] && makeCall(selectedAlert.emergencyContacts[0])}
                        >
                          <View style={styles.cardButtonContent}>
                            <Ionicons name="people" size={20} color="#38A169" />
                            <Text style={[styles.cardButtonText, { color: '#38A169' }]}>Contact 1</Text>
                          </View>
                        </TouchableOpacity>

                        {selectedAlert.emergencyContacts && selectedAlert.emergencyContacts[1] ? (
                          <TouchableOpacity
                            style={[styles.cardButton, styles.contact2CardButton, styles.halfWidthButton]}
                            onPress={() => selectedAlert.emergencyContacts?.[1] && makeCall(selectedAlert.emergencyContacts[1])}
                          >
                            <View style={styles.cardButtonContent}>
                              <Ionicons name="people" size={20} color="#805AD5" />
                              <Text style={[styles.cardButtonText, { color: '#805AD5' }]}>Contact 2</Text>
                            </View>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.halfWidthButton} />
                        )}
                      </View>
                    )}
                  </View>

                  {/* Staff Actions */}
                  {(selectedAlert.status === 'active' || selectedAlert.status === 'following') && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Staff Actions</Text>
                      
                      <View style={styles.buttonRow}>
                        {selectedAlert.status === 'active' && !selectedAlert.followedBy && (
                          <TouchableOpacity
                            style={[styles.cardButton, styles.followCardButton, styles.halfWidthButton]}
                            onPress={() => followSOSAlert(selectedAlert.id)}
                          >
                            <View style={styles.cardButtonContent}>
                              <Ionicons name="eye" size={20} color="#17a2b8" />
                              <Text style={[styles.cardButtonText, { color: '#17a2b8' }]}>Follow Alert</Text>
                            </View>
                          </TouchableOpacity>
                        )}
                        
                        <TouchableOpacity
                          style={[
                            styles.cardButton, 
                            styles.respondCardButton, 
                            selectedAlert.status === 'active' && !selectedAlert.followedBy 
                              ? styles.halfWidthButton 
                              : { flex: 1 }
                          ]}
                          onPress={() => respondToSOS(selectedAlert.id)}
                        >
                          <View style={styles.cardButtonContent}>
                            <Ionicons name="car" size={20} color="#fd7e14" />
                            <Text style={[styles.cardButtonText, { color: '#fd7e14' }]}>Respond Now</Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {(selectedAlert.status === 'active' || selectedAlert.status === 'following' || selectedAlert.status === 'responding') && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Update Status</Text>
                      <View style={styles.buttonRow}>
                        <TouchableOpacity
                          style={[styles.cardButton, styles.resolveCardButton, styles.halfWidthButton]}
                          onPress={() => updateAlertStatus(selectedAlert.id, 'resolved')}
                        >
                          <View style={styles.cardButtonContent}>
                            <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                            <Text style={[styles.cardButtonText, { color: '#34C759' }]}>Resolved</Text>
                          </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.cardButton, styles.falseAlarmCardButton, styles.halfWidthButton]}
                          onPress={() => updateAlertStatus(selectedAlert.id, 'false_alarm')}
                        >
                          <View style={styles.cardButtonContent}>
                            <Ionicons name="close-circle" size={20} color="#8E8E93" />
                            <Text style={[styles.cardButtonText, { color: '#8E8E93' }]}>False Alarm</Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </ScrollView>
              </>
            )}
        </SafeAreaView>
      </Modal>

      {/* Media Viewer Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={imageViewerVisible}
        onRequestClose={closeImageViewer}
      >
        <View style={styles.imageViewerOverlay}>
          <TouchableOpacity
            style={styles.imageViewerCloseButton}
            onPress={closeImageViewer}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.imageViewerContainer}>
            {selectedImageUrl.includes('.mp4') || selectedImageUrl.includes('video') || selectedImageUrl.includes('SampleVideo') ? (
              <Video
                source={{ uri: selectedImageUrl }}
                style={styles.fullScreenImage}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={false}
              />
            ) : (
              <ScrollView
                contentContainerStyle={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}
                maximumZoomScale={3}
                minimumZoomScale={1}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
              >
                <Image
                  source={{ uri: selectedImageUrl }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              </ScrollView>
            )}
          </View>
          
          <View style={styles.imageViewerBottomBar}>
            <TouchableOpacity
              style={styles.imageViewerButton}
              onPress={() => {
                // TODO: Add save image functionality
                Alert.alert('Save Image', 'Save image to device gallery?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Save', onPress: () => {
                    // Implement save functionality
                    Alert.alert('Success', 'Image saved to gallery');
                  }}
                ]);
              }}
            >
              <Ionicons name="download-outline" size={24} color="#fff" />
              <Text style={styles.imageViewerButtonText}>Save</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.imageViewerButton}
              onPress={() => {
                // TODO: Add share functionality
                Alert.alert('Share Image', 'Share this image with other team members?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Share', onPress: () => {
                    // Implement share functionality
                    Alert.alert('Shared', 'Image shared successfully');
                  }}
                ]);
              }}
            >
              <Ionicons name="share-outline" size={24} color="#fff" />
              <Text style={styles.imageViewerButtonText}>Share</Text>
            </TouchableOpacity>
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
  // Full Screen Modal styles
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  fullScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
  },
  fullScreenTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  headerSpacer: {
    width: 40, // Same width as back button for centering
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
    flex: 1,
  },
  modalSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  modalSectionNoTopPadding: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 20,
    paddingTop: 0,
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
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B3D9FF',
  },
  summaryText: {
    fontSize: 14,
    color: '#1D1D1F',
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
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
  // Media styles
  mediaScrollView: {
    marginBottom: 12,
  },
  mediaContainer: {
    position: 'relative',
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaImage: {
    width: 120,
    height: 90,
    backgroundColor: '#F2F2F7',
  },
  mediaOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  mediaHint: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Video styles
  videoThumbnailContainer: {
    position: 'relative',
  },
  videoPlayIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -16,
    marginLeft: -16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
  },
  // Image Viewer styles
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  imageViewerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
  },
  imageViewerBottomBar: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
  },
  imageViewerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  imageViewerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Live Location Tracking Styles
  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  miniMap: {
    height: 200,
    width: '100%',
  },
  userMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    position: 'relative',
  },
  movingIndicator: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fd7e14',
  },
  movingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fd7e14',
  },
  historyMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007bff',
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  historyMarkerText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  locationInfo: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    gap: 12,
  },
  locationInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  locationInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  locationInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  locationInfoValue: {
    fontSize: 14,
    color: '#666',
    flex: 2,
    textAlign: 'right',
  },
  // Staff Assignment Styles
  staffSection: {
    backgroundColor: '#e8f5e8',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  staffSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  followingStaff: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
  },
  respondingStaff: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  staffName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  staffRole: {
    fontSize: 12,
    color: '#666',
  },
  staffTime: {
    fontSize: 12,
    color: '#666',
    marginLeft: 'auto',
  },
  staffEta: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '500',
    marginLeft: 'auto',
  },
  // Card Button Styles
  cardButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardButtonText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  // Specific card button color variations
  emergencyCardButton: {
    backgroundColor: '#fef2f2',
    borderLeftColor: '#E53E3E',
  },
  callCardButton: {
    backgroundColor: '#eff6ff',
    borderLeftColor: '#3182CE',
  },
  contactCardButton: {
    backgroundColor: '#f0fff4',
    borderLeftColor: '#38A169',
  },
  contact2CardButton: {
    backgroundColor: '#faf5ff',
    borderLeftColor: '#805AD5',
  },
  followCardButton: {
    backgroundColor: '#e6fffa',
    borderLeftColor: '#17a2b8',
  },
  respondCardButton: {
    backgroundColor: '#fff7ed',
    borderLeftColor: '#fd7e14',
  },
  resolveCardButton: {
    backgroundColor: '#f0fff4',
    borderLeftColor: '#34C759',
  },
  falseAlarmCardButton: {
    backgroundColor: '#f9f9f9',
    borderLeftColor: '#8E8E93',
  },
  mapCardButton: {
    backgroundColor: '#f0f9ff',
    borderLeftColor: '#007AFF',
  },
  youIndicator: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginVertical: 4,
  },
  halfWidthButton: {
    flex: 1,
  },
  staffInfo: {
    flex: 1,
    marginLeft: 8,
  },
  phoneButton: {
    backgroundColor: '#f0f9ff',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007bff',
  },
  staffDetails: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
});