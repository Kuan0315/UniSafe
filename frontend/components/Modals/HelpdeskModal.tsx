import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface HelpdeskModalProps {
  visible: boolean;
  onClose: () => void;
  onContactHelpdesk: (method: 'call' | 'chat' | 'email') => void;
}

const HelpdeskModal: React.FC<HelpdeskModalProps> = ({
  visible,
  onClose,
  onContactHelpdesk,
}) => {

  const helpdeskServices = [
    {
      id: 'technical',
      title: 'Technical Support',
      icon: 'settings-outline',
      color: '#007AFF',
      description: 'App issues, login problems, account help',
      contact: '+60123456700',
      email: 'tech-support@university.edu.my'
    },
    {
      id: 'academic',
      title: 'Academic Support',
      icon: 'school-outline',
      color: '#34C759',
      description: 'Course help, academic guidance, tutoring',
      contact: '+60123456701',
      email: 'academic-support@university.edu.my'
    },
    {
      id: 'student',
      title: 'Student Services',
      icon: 'people-outline',
      color: '#FF9500',
      description: 'General inquiries, campus services, activities',
      contact: '+60123456702',
      email: 'student-services@university.edu.my'
    },
    {
      id: 'counseling',
      title: 'Counseling Services',
      icon: 'heart-outline',
      color: '#FF3B30',
      description: 'Mental health support, personal counseling',
      contact: '+60323821007',
      email: 'counseling@university.edu.my'
    },
    {
      id: 'security',
      title: 'Campus Security',
      icon: 'shield-outline',
      color: '#8B5CF6',
      description: 'Security concerns, safety issues, lost items',
      contact: '+60123456789',
      email: 'security@university.edu.my'
    },
    {
      id: 'facilities',
      title: 'Facilities Management',
      icon: 'construct-outline',
      color: '#6B7280',
      description: 'Maintenance issues, room booking, facilities',
      contact: '+60123456703',
      email: 'facilities@university.edu.my'
    }
  ];

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
    onClose();
  };

  const handleEmail = (email: string, subject: string) => {
    Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(subject)}`);
    // Don't close the modal - let user return to helpdesk after email
    // Optional: Show brief feedback that email app was opened
  };

  const handleGeneralContact = (method: 'call' | 'chat' | 'email') => {
    onContactHelpdesk(method);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Campus Helpdesk</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoSection}>
            <Ionicons name="help-circle" size={48} color="#8B5CF6" />
            <Text style={styles.infoTitle}>How can we help you?</Text>
            <Text style={styles.infoText}>
              Get support for academic, technical, and personal matters. Our campus support team is here to assist you 24/7.
            </Text>
          </View>

          {/* Quick Contact Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Contact</Text>
            <View style={styles.quickContactContainer}>
              <TouchableOpacity 
                style={styles.quickContactButton}
                onPress={() => handleGeneralContact('call')}
              >
                <Ionicons name="call" size={24} color="#007AFF" />
                <Text style={styles.quickContactText}>Call Now</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickContactButton}
                onPress={() => handleGeneralContact('chat')}
              >
                <Ionicons name="chatbubbles" size={24} color="#34C759" />
                <Text style={styles.quickContactText}>Live Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickContactButton}
                onPress={() => handleGeneralContact('email')}
              >
                <Ionicons name="mail" size={24} color="#FF9500" />
                <Text style={styles.quickContactText}>Email</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Specialized Services */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specialized Support</Text>
            {helpdeskServices.map((service) => (
              <View key={service.id} style={styles.serviceCard}>
                <View style={[styles.serviceIcon, { backgroundColor: `${service.color}15` }]}>
                  <Ionicons name={service.icon as any} size={24} color={service.color} />
                </View>
                <View style={styles.serviceContent}>
                  <Text style={styles.serviceTitle}>{service.title}</Text>
                  <Text style={styles.serviceDescription}>{service.description}</Text>
                  <View style={styles.serviceActions}>
                    <TouchableOpacity 
                      style={styles.serviceActionButton}
                      onPress={() => handleCall(service.contact)}
                    >
                      <Ionicons name="call" size={16} color={service.color} />
                      <Text style={[styles.serviceActionText, { color: service.color }]}>Call</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.serviceActionButton}
                      onPress={() => handleEmail(service.email, `${service.title} - Support Request`)}
                    >
                      <Ionicons name="mail" size={16} color={service.color} />
                      <Text style={[styles.serviceActionText, { color: service.color }]}>Email</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Emergency Contact Notice */}
          <View style={styles.emergencyNotice}>
            <Ionicons name="warning" size={20} color="#FF3B30" />
            <View style={styles.emergencyNoticeContent}>
              <Text style={styles.emergencyNoticeTitle}>Emergency?</Text>
              <Text style={styles.emergencyNoticeText}>
                For immediate emergencies, use the SOS button or call campus security directly at +60123456789
              </Text>
            </View>
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
  contentContainer: {
    paddingBottom: 40, // Add extra bottom padding to ensure content is fully visible
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
  quickContactContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickContactButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickContactText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 8,
  },
  serviceCard: {
    flexDirection: 'row',
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
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  serviceContent: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
  },
  serviceActions: {
    flexDirection: 'row',
    gap: 16,
  },
  serviceActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emergencyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 20, // Add bottom margin to ensure it's visible
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  emergencyNoticeContent: {
    flex: 1,
    marginLeft: 12,
  },
  emergencyNoticeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 4,
  },
  emergencyNoticeText: {
    fontSize: 14,
    color: '#8B0000',
    lineHeight: 18,
  },
});

export default HelpdeskModal;