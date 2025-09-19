import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import StandardHeader from '../../components/StandardHeader';
import DateTimePicker from '@react-native-community/datetimepicker';

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
  timeLimit?: number; // Time limit in hours
  scheduledAt?: Date; // When to send the alert (for scheduled alerts)
  isActive: boolean;
  isAutoDeactivated: boolean;
  isScheduled: boolean; // Whether this is a scheduled alert
  sendPushNotification: boolean;
  sendEmail: boolean;
  sendSMS: boolean;
}

export default function SafetyAlerts() {
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAlert, setEditingAlert] = useState<SafetyAlert | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<SafetyAlert['type']>('info');
  const [priority, setPriority] = useState<SafetyAlert['priority']>('medium');
  const [category, setCategory] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeLimit, setTimeLimit] = useState<number | undefined>(24); // Default 24 hours
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [isScheduled, setIsScheduled] = useState(false);
  const [sendPushNotification, setSendPushNotification] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const [sendSMS, setSendSMS] = useState(false);
  
  // Date/Time picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      // Simulate API call - replace with actual API
      const mockAlerts: SafetyAlert[] = [
        {
          id: '1',
          title: 'Emergency: Campus Lockdown',
          message: 'Due to a security incident, all campus buildings are in lockdown. Please remain in your current location and await further instructions. Do not leave buildings until the all-clear is given.',
          type: 'critical',
          priority: 'high',
          category: 'security',
          createdBy: 'Security Office',
          createdAt: new Date(Date.now() - 3600000),
          isActive: true,
          timeLimit: undefined,
          isAutoDeactivated: false,
          isScheduled: false,
          sendPushNotification: true,
          sendEmail: true,
          sendSMS: true,
        },
        {
          id: '2',
          title: 'Weather Warning: Heavy Rain Expected',
          message: 'Heavy rainfall is expected from 2 PM to 6 PM today. Please exercise caution when walking on campus, especially near construction areas. Shuttle services may be delayed.',
          type: 'warning',
          priority: 'medium',
          category: 'weather',
          createdBy: 'Campus Operations',
          createdAt: new Date(Date.now() - 7200000),
          expiresAt: new Date(Date.now() + 14400000), // 4 hours from now
          isActive: true,
          timeLimit: 4,
          isAutoDeactivated: true,
          isScheduled: false,
          sendPushNotification: true,
          sendEmail: false,
          sendSMS: false,
        },
        {
          id: '3',
          title: 'Maintenance: Parking Lot B Closure',
          message: 'Parking Lot B will be closed for maintenance from March 15-17. Alternative parking is available in Lots A and C. We apologize for any inconvenience.',
          type: 'info',
          priority: 'low',
          category: 'maintenance',
          createdBy: 'Facilities Management',
          createdAt: new Date(Date.now() - 86400000),
          expiresAt: new Date(Date.now() + 172800000), // 2 days from now
          isActive: true,
          timeLimit: 48,
          isAutoDeactivated: true,
          isScheduled: false,
          sendPushNotification: true,
          sendEmail: true,
          sendSMS: false,
        },
        {
          id: '4',
          title: 'COVID-19 Update: Mask Guidelines',
          message: 'Effective immediately, masks are recommended but not required in outdoor campus areas. Masks are still required in all indoor spaces including classrooms, libraries, and dining halls.',
          type: 'info',
          priority: 'low',
          category: 'health',
          createdBy: 'Health Services',
          createdAt: new Date(Date.now() - 172800000),
          isActive: false,
          timeLimit: undefined,
          isAutoDeactivated: false,
          isScheduled: false,
          sendPushNotification: true,
          sendEmail: true,
          sendSMS: false,
        },
      ];

      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
      Alert.alert('Error', 'Failed to load alerts');
    }
  };

  const openCreateModal = () => {
    resetForm();
    setEditingAlert(null);
    setModalVisible(true);
  };

  const openEditModal = (alert: SafetyAlert) => {
    setTitle(alert.title);
    setMessage(alert.message);
    setType(alert.type);
    setPriority(alert.priority);
    setExpiresAt(alert.expiresAt || null);
    setScheduledAt(alert.scheduledAt || null);
    setIsScheduled(alert.isScheduled || false);
    setSendPushNotification(alert.sendPushNotification);
    setSendEmail(alert.sendEmail);
    setSendSMS(alert.sendSMS);
    setEditingAlert(alert);
    setModalVisible(true);
  };

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setType('info');
    setPriority('medium');
    setExpiresAt(null);
    setScheduledAt(null);
    setIsScheduled(false);
    setSendPushNotification(true);
    setSendEmail(false);
    setSendSMS(false);
  };

  const saveAlert = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in title and message');
      return;
    }

    try {
      const alertData: SafetyAlert = {
        id: editingAlert?.id || Date.now().toString(),
        title: title.trim(),
        message: message.trim(),
        type,
        priority,
        category,
        createdBy: 'Current Staff Member', // Replace with actual user
        createdAt: editingAlert?.createdAt || new Date(),
        expiresAt: expiresAt || undefined,
        scheduledAt: scheduledAt || undefined,
        isActive: !isScheduled, // If scheduled, not active yet
        timeLimit,
        isAutoDeactivated: timeLimit !== null && timeLimit !== undefined,
        isScheduled,
        sendPushNotification,
        sendEmail,
        sendSMS,
      };

      if (editingAlert) {
        setAlerts(prev => prev.map(alert => 
          alert.id === editingAlert.id ? alertData : alert
        ));
        Alert.alert('Success', 'Alert updated successfully');
      } else {
        setAlerts(prev => [alertData, ...prev]);
        
        // Simulate sending notification
        const deliveryMethods = [];
        if (sendPushNotification) deliveryMethods.push('Push Notification');
        if (sendEmail) deliveryMethods.push('Email');
        if (sendSMS) deliveryMethods.push('SMS');
        
        Alert.alert(
          'Alert Published',
          `Alert has been sent to everyone on campus via: ${deliveryMethods.join(', ')}`
        );
      }

      setModalVisible(false);
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to save alert');
    }
  };

  const toggleAlertStatus = async (alertId: string) => {
    try {
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, isActive: !alert.isActive }
          : alert
      ));
      Alert.alert('Success', 'Alert status updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update alert status');
    }
  };

  // Date/Time picker handlers
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      setTempDate(selectedDate);
      if (Platform.OS === 'ios') {
        // For iOS, directly set the date
        const newDateTime = scheduledAt ? new Date(scheduledAt) : new Date();
        newDateTime.setFullYear(selectedDate.getFullYear());
        newDateTime.setMonth(selectedDate.getMonth());
        newDateTime.setDate(selectedDate.getDate());
        setScheduledAt(newDateTime);
      } else {
        // For Android, continue to time picker
        setShowTimePicker(true);
      }
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    if (selectedTime) {
      const newDateTime = new Date(tempDate);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      setScheduledAt(newDateTime);
    }
  };

  const openDateTimePicker = () => {
    const now = new Date();
    setTempDate(scheduledAt || now);
    setShowDatePicker(true);
  };

  const deleteAlert = async (alertId: string) => {
    Alert.alert(
      'Delete Alert',
      'Are you sure you want to delete this alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setAlerts(prev => prev.filter(alert => alert.id !== alertId));
            Alert.alert('Success', 'Alert deleted');
          }
        }
      ]
    );
  };

  const getTypeColor = (alertType: string) => {
    switch (alertType) {
      case 'critical': return '#FF3B30';
      case 'warning': return '#FF9500';
      case 'info': return '#007AFF';
      default: return '#007AFF';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#FF3B30';
      case 'medium': return '#FF9500';
      case 'low': return '#34C759';
      default: return '#34C759';
    }
  };

  const getTypeIcon = (alertType: string) => {
    switch (alertType) {
      case 'critical': return 'warning';
      case 'warning': return 'alert-circle';
      case 'info': return 'information-circle';
      default: return 'information-circle';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const isExpired = (alert: SafetyAlert) => {
    return alert.expiresAt && new Date() > alert.expiresAt;
  };

  const getQuickTemplates = () => [
    {
      title: 'Weather Alert',
      message: 'Weather conditions may affect campus operations. Please check local weather reports and exercise caution.',
      type: 'warning' as const,
      priority: 'medium' as const,
    },
    {
      title: 'Emergency Drill',
      message: 'A scheduled emergency drill will take place today. Please participate and follow evacuation procedures.',
      type: 'info' as const,
      priority: 'low' as const,
    },
    {
      title: 'Maintenance Notice',
      message: 'Scheduled maintenance will affect [LOCATION] from [START TIME] to [END TIME]. Please plan accordingly.',
      type: 'info' as const,
      priority: 'low' as const,
    },
    {
      title: 'Security Alert',
      message: 'Please be aware of suspicious activity in the area. Report any concerns to campus security immediately.',
      type: 'critical' as const,
      priority: 'high' as const,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StandardHeader 
        title="Safety Alerts" 
        subtitle="Manage campus-wide safety communications"
        rightIcon="add"
        onRightPress={() => setModalVisible(true)}
        theme="blue"
        showBackButton={false}
        showLogo={true}
      />
      
      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{alerts.filter(a => a.isActive).length}</Text>
          <Text style={styles.statLabel}>Active Alerts</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{alerts.filter(a => a.priority === 'high').length}</Text>
          <Text style={styles.statLabel}>High Priority</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{alerts.filter(a => isExpired(a)).length}</Text>
          <Text style={styles.statLabel}>Expired</Text>
        </View>
      </View>

      {/* Alerts List */}
      <ScrollView style={styles.alertsList}>
        <Text style={styles.sectionTitle}>Recent Alerts</Text>
        
        {alerts.map((alert) => (
          <View
            key={alert.id}
            style={[
              styles.alertCard,
              !alert.isActive && styles.alertCardInactive,
              isExpired(alert) && styles.alertCardExpired
            ]}
          >
            <View style={styles.alertHeader}>
              <View style={styles.alertTypeIcon}>
                <Ionicons 
                  name={getTypeIcon(alert.type)} 
                  size={24} 
                  color={getTypeColor(alert.type)} 
                />
              </View>
              <View style={styles.alertInfo}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertMeta}>
                  By {alert.createdBy} • {formatTimeAgo(alert.createdAt)}
                </Text>
                {alert.expiresAt && (
                  <Text style={[
                    styles.alertExpiry,
                    isExpired(alert) && styles.alertExpiryExpired
                  ]}>
                    {isExpired(alert) ? 'Expired' : `Expires ${alert.expiresAt.toLocaleDateString()}`}
                  </Text>
                )}
              </View>
              <View style={styles.alertBadges}>
                <View style={[styles.priorityBadge, { backgroundColor: getTypeColor(alert.type) }]}>
                  <Text style={styles.badgeText}>{alert.type.toUpperCase()}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: alert.isActive ? '#34C759' : '#8E8E93' }
                ]}>
                  <Text style={styles.badgeText}>{alert.isActive ? 'ACTIVE' : 'INACTIVE'}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.alertMessage} numberOfLines={3}>
              {alert.message}
            </Text>

            <View style={styles.alertDelivery}>
              <Text style={styles.alertDeliveryLabel}>Sent to: Everyone on campus</Text>
              <View style={styles.deliveryMethods}>
                {alert.sendPushNotification && (
                  <View style={styles.deliveryMethod}>
                    <Ionicons name="notifications" size={16} color="#007AFF" />
                  </View>
                )}
                {alert.sendEmail && (
                  <View style={styles.deliveryMethod}>
                    <Ionicons name="mail" size={16} color="#007AFF" />
                  </View>
                )}
                {alert.sendSMS && (
                  <View style={styles.deliveryMethod}>
                    <Ionicons name="chatbox" size={16} color="#007AFF" />
                  </View>
                )}
              </View>
            </View>

            <View style={styles.alertActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => openEditModal(alert)}
              >
                <Ionicons name="create" size={16} color="#007AFF" />
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  alert.isActive ? styles.deactivateButton : styles.activateButton
                ]}
                onPress={() => toggleAlertStatus(alert.id)}
              >
                <Ionicons 
                  name={alert.isActive ? "pause-circle" : "play-circle"} 
                  size={16} 
                  color={alert.isActive ? "#FF9500" : "#34C759"} 
                />
                <Text style={[
                  styles.actionButtonText,
                  { color: alert.isActive ? "#FF9500" : "#34C759" }
                ]}>
                  {alert.isActive ? 'Deactivate' : 'Activate'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => deleteAlert(alert.id)}
              >
                <Ionicons name="trash" size={16} color="#FF3B30" />
                <Text style={[styles.actionButtonText, { color: '#FF3B30' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {alerts.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="megaphone-outline" size={64} color="#8E8E93" />
            <Text style={styles.emptyStateTitle}>No alerts created</Text>
            <Text style={styles.emptyStateText}>
              Create your first safety alert to notify campus users.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Create/Edit Alert Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAlert ? 'Edit Alert' : 'Create Alert'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Quick Templates */}
              {!editingAlert && (
                <View style={styles.templatesSection}>
                  <Text style={styles.sectionLabel}>Quick Templates</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {getQuickTemplates().map((template, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.templateCard}
                        onPress={() => {
                          setTitle(template.title);
                          setMessage(template.message);
                          setType(template.type);
                          setPriority(template.priority);
                        }}
                      >
                        <Text style={styles.templateTitle}>{template.title}</Text>
                        <Text style={styles.templateType}>{template.type}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Form Fields */}
              <View style={styles.formSection}>
                <Text style={styles.inputLabel}>Alert Title *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter alert title"
                  value={title}
                  onChangeText={setTitle}
                />

                <Text style={styles.inputLabel}>Message *</Text>
                <TextInput
                  style={[styles.textInput, styles.messageInput]}
                  placeholder="Enter alert message"
                  multiline
                  numberOfLines={4}
                  value={message}
                  onChangeText={setMessage}
                />

                <Text style={styles.inputLabel}>Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsContainer}>
                  {(['critical', 'warning', 'info'] as const).map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.optionButton,
                        type === option && styles.optionButtonActive,
                        { backgroundColor: type === option ? getTypeColor(option) : '#F2F2F7' }
                      ]}
                      onPress={() => setType(option)}
                    >
                      <Text style={[
                        styles.optionButtonText,
                        type === option && styles.optionButtonTextActive
                      ]}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>Priority</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsContainer}>
                  {(['high', 'medium', 'low'] as const).map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.optionButton,
                        priority === option && styles.optionButtonActive,
                        { backgroundColor: priority === option ? getPriorityColor(option) : '#F2F2F7' }
                      ]}
                      onPress={() => setPriority(option)}
                    >
                      <Text style={[
                        styles.optionButtonText,
                        priority === option && styles.optionButtonTextActive
                      ]}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>Category</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter category (e.g., security, weather, maintenance)"
                  value={category}
                  onChangeText={setCategory}
                />

                <Text style={styles.inputLabel}>Time Limit (Auto-Deactivation)</Text>
                <View style={styles.timeLimitContainer}>
                  <TextInput
                    style={[styles.textInput, { flex: 1, marginRight: 10 }]}
                    placeholder="Hours (optional)"
                    value={timeLimit?.toString() || ''}
                    onChangeText={(text) => {
                      const hours = parseInt(text);
                      setTimeLimit(isNaN(hours) ? undefined : hours);
                      if (!isNaN(hours)) {
                        const expiry = new Date();
                        expiry.setHours(expiry.getHours() + hours);
                        setExpiresAt(expiry);
                      } else {
                        setExpiresAt(null);
                      }
                    }}
                    keyboardType="numeric"
                  />
                  <Text style={styles.timeLimitLabel}>
                    {timeLimit ? `Expires in ${timeLimit} hours` : 'No expiration'}
                  </Text>
                </View>

                <Text style={styles.inputLabel}>Scheduling</Text>
                <View style={styles.switchContainer}>
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Send immediately</Text>
                    <Switch
                      value={!isScheduled}
                      onValueChange={(value) => setIsScheduled(!value)}
                      trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                    />
                  </View>
                  {isScheduled && (
                    <View style={styles.dateTimeContainer}>
                      <Text style={styles.subLabel}>Scheduled send time:</Text>
                      <TouchableOpacity
                        style={styles.dateTimeButton}
                        onPress={openDateTimePicker}
                      >
                        <Ionicons name="calendar-outline" size={20} color="#007AFF" />
                        <Text style={styles.dateTimeText}>
                          {scheduledAt ? scheduledAt.toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          }) : 'Select date and time'}
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color="#007AFF" />
                      </TouchableOpacity>
                      {scheduledAt && (
                        <TouchableOpacity
                          style={styles.clearButton}
                          onPress={() => setScheduledAt(null)}
                        >
                          <Ionicons name="close-circle" size={16} color="#FF3B30" />
                          <Text style={styles.clearButtonText}>Clear</Text>
                        </TouchableOpacity>
                      )}
                      
                      {/* Date and Time Pickers */}
                      {showDatePicker && (
                        <DateTimePicker
                          value={tempDate}
                          mode="date"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          onChange={handleDateChange}
                          minimumDate={new Date()}
                        />
                      )}
                      
                      {showTimePicker && Platform.OS === 'android' && (
                        <DateTimePicker
                          value={tempDate}
                          mode="time"
                          display="default"
                          onChange={handleTimeChange}
                        />
                      )}
                      
                      {Platform.OS === 'ios' && scheduledAt && (
                        <View style={styles.iosTimePickerContainer}>
                          <Text style={styles.subLabel}>Time:</Text>
                          <DateTimePicker
                            value={scheduledAt}
                            mode="time"
                            display="compact"
                            onChange={(event, selectedTime) => {
                              if (selectedTime && scheduledAt) {
                                const newDateTime = new Date(scheduledAt);
                                newDateTime.setHours(selectedTime.getHours());
                                newDateTime.setMinutes(selectedTime.getMinutes());
                                setScheduledAt(newDateTime);
                              }
                            }}
                          />
                        </View>
                      )}
                    </View>
                  )}
                </View>

                <Text style={styles.inputLabel}>Delivery Methods</Text>
                <View style={styles.switchContainer}>
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Push Notification</Text>
                    <Switch
                      value={sendPushNotification}
                      onValueChange={setSendPushNotification}
                      trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                    />
                  </View>
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Email</Text>
                    <Switch
                      value={sendEmail}
                      onValueChange={setSendEmail}
                      trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                    />
                  </View>
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>SMS</Text>
                    <Switch
                      value={sendSMS}
                      onValueChange={setSendSMS}
                      trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                    />
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={saveAlert}>
                <Text style={styles.saveButtonText}>
                  {editingAlert ? 'Update Alert' : 'Publish Alert'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  createButton: {
    marginLeft: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  alertsList: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 16,
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
  alertCardInactive: {
    opacity: 0.7,
  },
  alertCardExpired: {
    backgroundColor: '#F2F2F7',
  },
  alertHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  alertTypeIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  alertMeta: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  alertExpiry: {
    fontSize: 12,
    color: '#007AFF',
  },
  alertExpiryExpired: {
    color: '#FF3B30',
  },
  alertBadges: {
    gap: 4,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#fff',
  },
  alertMessage: {
    fontSize: 14,
    color: '#1D1D1F',
    marginBottom: 12,
    lineHeight: 20,
  },
  alertDelivery: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertDeliveryLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  deliveryMethods: {
    flexDirection: 'row',
    gap: 8,
  },
  deliveryMethod: {
    backgroundColor: '#F2F2F7',
    padding: 4,
    borderRadius: 6,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  editButton: {
    flex: 1,
  },
  activateButton: {
    flex: 1,
  },
  deactivateButton: {
    flex: 1,
  },
  deleteButton: {
    flex: 1,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
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
    maxHeight: '90%',
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
    maxHeight: 600,
  },
  templatesSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  templateCard: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
    minWidth: 120,
  },
  templateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  templateType: {
    fontSize: 12,
    color: '#8E8E93',
  },
  formSection: {
    padding: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  messageInput: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  optionsContainer: {
    marginBottom: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  optionButtonActive: {
    backgroundColor: '#007AFF',
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  optionButtonTextActive: {
    color: '#fff',
  },
  switchContainer: {
    marginTop: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#1D1D1F',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    margin: 20,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  timeLimitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  timeLimitLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  dateTimeContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  subLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 8,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#007AFF',
    flex: 1,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-end',
    marginTop: 8,
    gap: 4,
  },
  clearButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  iosTimePickerContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
});