import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface DiscreetAlarmModalProps {
  visible: boolean;
  onClose: () => void;
  onTriggerFakeCall: (delaySeconds: number) => void;
  onTriggerLoudAlarm: (delaySeconds: number) => void;
}

const DiscreetAlarmModal: React.FC<DiscreetAlarmModalProps> = ({
  visible,
  onClose,
  onTriggerFakeCall,
  onTriggerLoudAlarm,
}) => {
  const [selectedDelay, setSelectedDelay] = useState(30);

  const delayOptions = [
    { value: 10, label: '10 seconds', description: 'Immediate' },
    { value: 30, label: '30 seconds', description: 'Quick response' },
    { value: 60, label: '1 minute', description: 'Standard delay' },
    { value: 120, label: '2 minutes', description: 'Longer delay' },
  ];

  const handleFakeCall = () => {
    Alert.alert(
      'Confirm Fake Call',
      `A fake incoming call will appear in ${selectedDelay} seconds. This will help you get out of an uncomfortable situation safely.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          onPress: () => {
            onTriggerFakeCall(selectedDelay);
            onClose();
          }
        }
      ]
    );
  };

  const handleLoudAlarm = () => {
    Alert.alert(
      'Confirm Loud Alarm',
      `A loud alarm will sound in ${selectedDelay} seconds. This will draw attention and potentially deter threats. Use only when safe to do so.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          style: 'destructive',
          onPress: () => {
            onTriggerLoudAlarm(selectedDelay);
            onClose();
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Discreet Alarm</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.infoSection}>
            <Ionicons name="shield-checkmark" size={48} color="#FF6B35" />
            <Text style={styles.infoTitle}>Safety Deterrent Options</Text>
            <Text style={styles.infoText}>
              These tools can help you get out of uncomfortable or dangerous situations by creating distractions or drawing attention.
            </Text>
          </View>

          {/* Delay Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Delay Time</Text>
            <View style={styles.delayOptions}>
              {delayOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.delayOption,
                    selectedDelay === option.value && styles.delayOptionSelected
                  ]}
                  onPress={() => setSelectedDelay(option.value)}
                >
                  <Text style={[
                    styles.delayOptionText,
                    selectedDelay === option.value && styles.delayOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={[
                    styles.delayOptionDescription,
                    selectedDelay === option.value && styles.delayOptionDescriptionSelected
                  ]}>
                    {option.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Alarm Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose Alarm Type</Text>
            
            {/* Fake Call Option */}
            <TouchableOpacity style={styles.alarmOption} onPress={handleFakeCall}>
              <View style={styles.alarmOptionIcon}>
                <Ionicons name="call" size={32} color="#007AFF" />
              </View>
              <View style={styles.alarmOptionContent}>
                <Text style={styles.alarmOptionTitle}>Fake Incoming Call</Text>
                <Text style={styles.alarmOptionDescription}>
                  Simulates a realistic incoming call that you can "answer" to excuse yourself from a situation.
                </Text>
                <View style={styles.alarmOptionFeatures}>
                  <Text style={styles.alarmOptionFeature}>• Looks like a real call</Text>
                  <Text style={styles.alarmOptionFeature}>• Customizable delay</Text>
                  <Text style={styles.alarmOptionFeature}>• Discreet and natural</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#007AFF" />
            </TouchableOpacity>

            {/* Loud Alarm Option */}
            <TouchableOpacity style={styles.alarmOption} onPress={handleLoudAlarm}>
              <View style={[styles.alarmOptionIcon, styles.alarmOptionIconRed]}>
                <Ionicons name="alarm" size={32} color="#DC3545" />
              </View>
              <View style={styles.alarmOptionContent}>
                <Text style={styles.alarmOptionTitle}>Loud Deterrent Alarm</Text>
                <Text style={styles.alarmOptionDescription}>
                  Activates a loud alarm sound to draw attention and potentially scare off threats. Use when safe to do so.
                </Text>
                <View style={styles.alarmOptionFeatures}>
                  <Text style={styles.alarmOptionFeature}>• Very loud sound</Text>
                  <Text style={styles.alarmOptionFeature}>• Draws immediate attention</Text>
                  <Text style={styles.alarmOptionFeature}>• Deters potential threats</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#DC3545" />
            </TouchableOpacity>
          </View>

          {/* Safety Notice */}
          <View style={styles.safetyNotice}>
            <Ionicons name="warning" size={20} color="#FF9500" />
            <Text style={styles.safetyNoticeText}>
              Use discreet alarms responsibly. Always prioritize your safety and call emergency services if you're in real danger.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoSection: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  delayOptions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
  },
  delayOption: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  delayOptionSelected: {
    backgroundColor: '#FF6B35',
  },
  delayOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  delayOptionTextSelected: {
    color: '#FFFFFF',
  },
  delayOptionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  delayOptionDescriptionSelected: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  alarmOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alarmOptionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  alarmOptionIconRed: {
    backgroundColor: '#FFF0F0',
  },
  alarmOptionContent: {
    flex: 1,
  },
  alarmOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  alarmOptionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  alarmOptionFeatures: {
    gap: 2,
  },
  alarmOptionFeature: {
    fontSize: 12,
    color: '#007AFF',
  },
  safetyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  safetyNoticeText: {
    flex: 1,
    fontSize: 14,
    color: '#B8860B',
    marginLeft: 12,
    lineHeight: 18,
  },
});

export default DiscreetAlarmModal;