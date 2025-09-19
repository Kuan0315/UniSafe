import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface PostIncidentResourceProps {
  visible: boolean;
  incidentType?: string;
  incidentId?: string;
  onClose?: () => void;
}

const PostIncidentResourceScreen: React.FC<PostIncidentResourceProps> = ({
  visible,
  incidentType = 'general',
  incidentId,
  onClose
}) => {

  const handleResourceLink = (type: string, contact: string) => {
    switch (type) {
      case 'call':
        Linking.openURL(`tel:${contact}`);
        break;
      case 'email':
        Linking.openURL(`mailto:${contact}`);
        break;
      case 'web':
        Linking.openURL(contact);
        break;
      default:
        Alert.alert('Resource', `Contact: ${contact}`);
    }
  };

  const handleBackToHome = () => {
    if (onClose) {
      onClose();
    } else {
      router.replace('/(tabs)');
    }
  };

  const resources = [
    {
      category: 'Immediate Support',
      icon: 'medical' as const,
      color: '#E53E3E',
      items: [
        {
          title: 'Campus Security Follow-up',
          description: 'Schedule a follow-up meeting with campus security',
          contact: '+60123456789',
          type: 'call' as const,
          icon: 'shield-checkmark' as const
        },
        {
          title: 'Emergency Medical Services',
          description: 'If you need medical attention or assessment',
          contact: '999',
          type: 'call' as const,
          icon: 'medical' as const
        },
        {
          title: 'Campus Health Center',
          description: 'University medical services and health support',
          contact: '+60123456700',
          type: 'call' as const,
          icon: 'fitness' as const
        }
      ]
    },
    {
      category: 'Counseling & Mental Health',
      icon: 'heart' as const,
      color: '#38A169',
      items: [
        {
          title: 'Student Counseling Center',
          description: 'Professional counseling and psychological support',
          contact: '+60123456701',
          type: 'call' as const,
          icon: 'chatbubble-ellipses' as const
        },
        {
          title: 'Crisis Hotline',
          description: '24/7 mental health crisis support',
          contact: '+60323821007',
          type: 'call' as const,
          icon: 'call' as const
        },
        {
          title: 'Online Counseling Portal',
          description: 'Book appointments and access resources online',
          contact: 'https://counseling.university.edu.my',
          type: 'web' as const,
          icon: 'globe' as const
        }
      ]
    },
    {
      category: 'Academic Support',
      icon: 'school' as const,
      color: '#3182CE',
      items: [
        {
          title: 'Academic Advisor',
          description: 'Discuss academic accommodations or support',
          contact: 'advisor@university.edu.my',
          type: 'email' as const,
          icon: 'person' as const
        },
        {
          title: 'Student Services',
          description: 'General student support and resources',
          contact: '+60123456702',
          type: 'call' as const,
          icon: 'help-circle' as const
        },
        {
          title: 'Disability Services',
          description: 'Support for students with special needs',
          contact: 'disability@university.edu.my',
          type: 'email' as const,
          icon: 'accessibility' as const
        }
      ]
    },
    {
      category: 'Legal & Safety Resources',
      icon: 'library' as const,
      color: '#805AD5',
      items: [
        {
          title: 'Legal Aid Office',
          description: 'Free legal consultation and advice',
          contact: '+60123456703',
          type: 'call' as const,
          icon: 'library' as const
        },
        {
          title: 'Title IX Office',
          description: 'Report harassment, discrimination, or misconduct',
          contact: 'titleix@university.edu.my',
          type: 'email' as const,
          icon: 'document-text' as const
        },
        {
          title: 'Safety Escort Service',
          description: 'Request a safety escort anywhere on campus',
          contact: '+60123456704',
          type: 'call' as const,
          icon: 'walk' as const
        }
      ]
    },
    {
      category: 'Emergency Contacts',
      icon: 'call' as const,
      color: '#F56565',
      items: [
        {
          title: 'Police Emergency',
          description: 'For serious emergencies requiring police',
          contact: '999',
          type: 'call' as const,
          icon: 'car-sport' as const
        },
        {
          title: 'Fire Department',
          description: 'Fire emergencies and medical emergencies',
          contact: '994',
          type: 'call' as const,
          icon: 'flame' as const
        },
        {
          title: 'Campus Emergency Line',
          description: '24/7 campus emergency hotline',
          contact: '+60123456705',
          type: 'call' as const,
          icon: 'warning' as const
        }
      ]
    }
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleBackToHome}
    >
      <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackToHome} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post-Incident Resources</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introSection}>
          <Ionicons name="checkmark-circle" size={48} color="#38A169" />
          <Text style={styles.introTitle}>Incident Response Complete</Text>
          <Text style={styles.introText}>
            Your safety is our priority. Below are resources available to support you during this time.
          </Text>
          {incidentId && (
            <Text style={styles.incidentId}>Incident ID: {incidentId}</Text>
          )}
        </View>

        {resources.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name={section.icon} size={24} color={section.color} />
              <Text style={[styles.sectionTitle, { color: section.color }]}>
                {section.category}
              </Text>
            </View>

            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={styles.resourceCard}
                onPress={() => handleResourceLink(item.type, item.contact)}
              >
                <View style={styles.resourceContent}>
                  <View style={styles.resourceLeft}>
                    <View style={[styles.resourceIcon, { backgroundColor: section.color + '20' }]}>
                      <Ionicons name={item.icon} size={20} color={section.color} />
                    </View>
                    <View style={styles.resourceText}>
                      <Text style={styles.resourceTitle}>{item.title}</Text>
                      <Text style={styles.resourceDescription}>{item.description}</Text>
                      <Text style={styles.resourceContact}>
                        {item.type === 'call' ? `📞 ${item.contact}` : 
                         item.type === 'email' ? `📧 ${item.contact}` : 
                         `🌐 ${item.contact}`}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <View style={styles.footerSection}>
          <Text style={styles.footerTitle}>Need Immediate Help?</Text>
          <Text style={styles.footerText}>
            If you're experiencing a medical emergency or are in immediate danger, please call 999 immediately.
          </Text>
          
          <TouchableOpacity
            style={styles.emergencyButton}
            onPress={() => handleResourceLink('call', '999')}
          >
            <Ionicons name="warning" size={20} color="#FFFFFF" />
            <Text style={styles.emergencyButtonText}>Call 999 Emergency</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeButton}
            onPress={handleBackToHome}
          >
            <Ionicons name="home" size={20} color="#3182CE" />
            <Text style={styles.homeButtonText}>Return to Home</Text>
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
    backgroundColor: '#3182CE',
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
    marginBottom: 12,
  },
  incidentId: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  resourceCard: {
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resourceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resourceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resourceText: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 4,
  },
  resourceContact: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
  },
  footerSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emergencyButton: {
    backgroundColor: '#E53E3E',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
    justifyContent: 'center',
  },
  emergencyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  homeButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#3182CE',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    justifyContent: 'center',
  },
  homeButtonText: {
    color: '#3182CE',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default PostIncidentResourceScreen;