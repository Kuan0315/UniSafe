import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface ReasonFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details?: string) => void;
}

const ReasonForm: React.FC<ReasonFormProps> = ({
  visible,
  onClose,
  onSubmit
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [additionalDetails, setAdditionalDetails] = useState<string>('');

  const reasons = [
    {
      id: 'accidental_press',
      title: 'Accidental Button Press',
      description: 'Pressed SOS button by mistake',
      icon: 'finger-print' as const
    },
    {
      id: 'pocket_dial',
      title: 'Pocket Activation',
      description: 'SOS activated while phone was in pocket/bag',
      icon: 'phone-portrait' as const
    },
    {
      id: 'child_play',
      title: 'Child/Others Activated',
      description: 'Someone else activated SOS without emergency',
      icon: 'people' as const
    },
    {
      id: 'app_malfunction',
      title: 'App Malfunction',
      description: 'Technical issue or app error',
      icon: 'bug' as const
    },
    {
      id: 'testing',
      title: 'Testing the System',
      description: 'Wanted to see how SOS works',
      icon: 'flask' as const
    },
    {
      id: 'other',
      title: 'Other Reason',
      description: 'Different reason (please specify below)',
      icon: 'ellipsis-horizontal' as const
    }
  ];

  const handleSubmit = () => {
    if (!selectedReason) {
      Alert.alert('Missing Information', 'Please select a reason for the false alarm.');
      return;
    }

    if (selectedReason === 'other' && !additionalDetails.trim()) {
      Alert.alert('Missing Information', 'Please provide details for "Other Reason".');
      return;
    }

    const selectedReasonData = reasons.find(r => r.id === selectedReason);
    const reasonText = selectedReasonData?.title || 'Unknown reason';
    
    onSubmit(reasonText, additionalDetails.trim() || undefined);
    
    // Reset form
    setSelectedReason('');
    setAdditionalDetails('');
  };

  const handleCancel = () => {
    setSelectedReason('');
    setAdditionalDetails('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleCancel}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>False Alarm Report</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.introSection}>
            <Ionicons name="information-circle" size={48} color="#FF8C00" />
            <Text style={styles.introTitle}>SOS Cancelled</Text>
            <Text style={styles.introText}>
              To help us improve our emergency response system, please let us know why this SOS was activated by mistake.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Please select the reason:</Text>
            
            {reasons.map((reason) => (
              <TouchableOpacity
                key={reason.id}
                style={[
                  styles.reasonCard,
                  selectedReason === reason.id && styles.reasonCardSelected
                ]}
                onPress={() => setSelectedReason(reason.id)}
              >
                <View style={styles.reasonContent}>
                  <View style={[
                    styles.reasonIcon,
                    selectedReason === reason.id && styles.reasonIconSelected
                  ]}>
                    <Ionicons 
                      name={reason.icon} 
                      size={24} 
                      color={selectedReason === reason.id ? '#FFFFFF' : '#3182CE'} 
                    />
                  </View>
                  <View style={styles.reasonText}>
                    <Text style={[
                      styles.reasonTitle,
                      selectedReason === reason.id && styles.reasonTitleSelected
                    ]}>
                      {reason.title}
                    </Text>
                    <Text style={[
                      styles.reasonDescription,
                      selectedReason === reason.id && styles.reasonDescriptionSelected
                    ]}>
                      {reason.description}
                    </Text>
                  </View>
                  <View style={styles.radioButton}>
                    {selectedReason === reason.id && (
                      <Ionicons name="checkmark-circle" size={24} color="#3182CE" />
                    )}
                    {selectedReason !== reason.id && (
                      <View style={styles.radioButtonEmpty} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {(selectedReason === 'other' || selectedReason) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {selectedReason === 'other' ? 'Please provide details:' : 'Additional details (optional):'}
              </Text>
              <TextInput
                style={styles.textInput}
                value={additionalDetails}
                onChangeText={setAdditionalDetails}
                placeholder={selectedReason === 'other' ? 'Please explain what happened...' : 'Any additional information...'}
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                maxLength={500}
              />
              <Text style={styles.characterCount}>
                {additionalDetails.length}/500 characters
              </Text>
            </View>
          )}

          <View style={styles.footerSection}>
            <TouchableOpacity
              style={[styles.submitButton, !selectedReason && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!selectedReason}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Submit Report</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Ionicons name="close-circle" size={20} color="#8E8E93" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF8C00',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  introSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A202C',
    marginTop: 16,
    marginBottom: 8,
  },
  introText: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 16,
  },
  reasonCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F7FAFC',
  },
  reasonCardSelected: {
    borderColor: '#3182CE',
    backgroundColor: '#EBF4FF',
  },
  reasonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reasonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF4FF',
    marginRight: 12,
  },
  reasonIconSelected: {
    backgroundColor: '#3182CE',
  },
  reasonText: {
    flex: 1,
  },
  reasonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 4,
  },
  reasonTitleSelected: {
    color: '#1A202C',
  },
  reasonDescription: {
    fontSize: 14,
    color: '#4A5568',
  },
  reasonDescriptionSelected: {
    color: '#4A5568',
  },
  radioButton: {
    marginLeft: 12,
  },
  radioButtonEmpty: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E0',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  footerSection: {
    padding: 24,
    gap: 12,
  },
  submitButton: {
    backgroundColor: '#3182CE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#CBD5E0',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#8E8E93',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ReasonForm;