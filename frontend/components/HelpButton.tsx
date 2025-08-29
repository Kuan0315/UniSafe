import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import GeofencingService, { GeofenceStatus, University } from '../services/GeofencingService';

interface HelpButtonProps {
  userLocation: Location.LocationObject | null;
  currentUniversity: University | null;
}

export default function HelpButton({ userLocation, currentUniversity }: HelpButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [geofenceStatus, setGeofenceStatus] = useState<GeofenceStatus | null>(null);
  const [helpMessage, setHelpMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    if (userLocation && currentUniversity) {
      updateGeofenceStatus();
    }
  }, [userLocation, currentUniversity]);

  const updateGeofenceStatus = async () => {
    if (!userLocation || !currentUniversity) return;
    
    try {
      const status = await GeofencingService.getGeofenceStatus(userLocation);
      setGeofenceStatus(status);
    } catch (error) {
      console.error('Error getting geofence status:', error);
    }
  };

  const handleHelpPress = () => {
    if (!currentUniversity) {
      Alert.alert('No University Set', 'Please select your university first to use the help feature.');
      return;
    }

    if (!userLocation) {
      Alert.alert('Location Unavailable', 'Unable to get your current location. Please check your location settings.');
      return;
    }

    setShowModal(true);
    updateGeofenceStatus();
  };

  const handleSendHelp = async () => {
    if (!userLocation || !currentUniversity) return;

    setIsSending(true);
    try {
      // Set custom help message if provided
      if (helpMessage.trim()) {
        GeofencingService.setHelpMessage(helpMessage.trim());
      }

      const sentMessage = await GeofencingService.sendHelpMessage(userLocation);
      setShowModal(false);
      setHelpMessage('');
      
      // Update geofence status after sending
      updateGeofenceStatus();
      
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send help message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const getStatusColor = () => {
    if (!geofenceStatus) return '#ccc';
    
    switch (geofenceStatus.currentZone) {
      case 'campus':
        return '#34C759'; // Green for campus
      case 'coverage':
        return '#FF9500'; // Orange for coverage area
      case 'outside':
        return '#FF3B30'; // Red for outside
      default:
        return '#ccc';
    }
  };

  const getStatusText = () => {
    if (!geofenceStatus) return 'Checking location...';
    
    switch (geofenceStatus.currentZone) {
      case 'campus':
        return `On Campus (${geofenceStatus.distanceFromCenter.toFixed(1)}km from center)`;
      case 'coverage':
        return `Coverage Area (${geofenceStatus.distanceFromCenter.toFixed(1)}km from center)`;
      case 'outside':
        return `Outside Coverage (${geofenceStatus.distanceFromCenter.toFixed(1)}km from center)`;
      default:
        return 'Location unknown';
    }
  };

  const getHelpRecipient = () => {
    if (!geofenceStatus) return '';
    
    switch (geofenceStatus.currentZone) {
      case 'campus':
        return 'Campus Security Office';
      case 'coverage':
        return 'Emergency Contact';
      case 'outside':
        return 'No coverage';
      default:
        return '';
    }
  };

  const isHelpEnabled = geofenceStatus && geofenceStatus.currentZone !== 'outside';

  return (
    <View style={styles.container}>
      {/* Status Display */}
      {currentUniversity && (
        <TouchableOpacity
          style={styles.statusButton}
          onPress={() => setShowStatus(!showStatus)}
        >
          <View style={styles.statusContent}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
          <Ionicons 
            name={showStatus ? "chevron-up" : "chevron-down"} 
            size={16} 
            color="#666" 
          />
        </TouchableOpacity>
      )}

      {showStatus && geofenceStatus && (
        <View style={styles.statusDetails}>
          <View style={styles.statusRow}>
            <Ionicons name="location" size={16} color="#666" />
            <Text style={styles.statusDetailText}>
              Distance from campus: {geofenceStatus.distanceFromCenter.toFixed(2)}km
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Ionicons name="shield-checkmark" size={16} color="#666" />
            <Text style={styles.statusDetailText}>
              Help recipient: {getHelpRecipient()}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Ionicons name="information-circle" size={16} color="#666" />
            <Text style={styles.statusDetailText}>
              {geofenceStatus.currentZone === 'campus' 
                ? 'Direct to campus security' 
                : geofenceStatus.currentZone === 'coverage' 
                ? 'To emergency contacts' 
                : 'App disabled outside coverage'}
            </Text>
          </View>
        </View>
      )}

      {/* Help Button */}
      <TouchableOpacity
        style={[
          styles.helpButton,
          !isHelpEnabled && styles.helpButtonDisabled
        ]}
        onPress={handleHelpPress}
        disabled={!isHelpEnabled}
      >
        <Ionicons 
          name="help-circle" 
          size={32} 
          color={isHelpEnabled ? "#fff" : "#ccc"} 
        />
        <Text style={[
          styles.helpButtonText,
          !isHelpEnabled && styles.helpButtonTextDisabled
        ]}>
          HELP
        </Text>
      </TouchableOpacity>

      {/* Help Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Help Message</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              {/* Current Status */}
              <View style={styles.currentStatus}>
                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
                <View style={styles.statusInfo}>
                  <Text style={styles.statusLabel}>Current Location</Text>
                  <Text style={styles.statusValue}>{getStatusText()}</Text>
                  <Text style={styles.recipientInfo}>
                    Help will be sent to: {getHelpRecipient()}
                  </Text>
                </View>
              </View>

              {/* Custom Message */}
              <View style={styles.messageSection}>
                <Text style={styles.messageLabel}>Custom Help Message (Optional)</Text>
                <TextInput
                  style={styles.messageInput}
                  placeholder="I need immediate assistance..."
                  value={helpMessage}
                  onChangeText={setHelpMessage}
                  multiline
                  numberOfLines={3}
                />
                <Text style={styles.messageHint}>
                  Leave blank to use default message
                </Text>
              </View>

              {/* Send Button */}
              <TouchableOpacity
                style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
                onPress={handleSendHelp}
                disabled={isSending}
              >
                {isSending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send" size={20} color="#fff" />
                    <Text style={styles.sendButtonText}>Send Help Message</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  statusDetails: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  helpButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  helpButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
  helpButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  helpButtonTextDisabled: {
    color: '#ccc',
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
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    gap: 20,
  },
  currentStatus: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  statusIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
    marginTop: 2,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  recipientInfo: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  messageSection: {
    gap: 8,
  },
  messageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  messageHint: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  sendButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
