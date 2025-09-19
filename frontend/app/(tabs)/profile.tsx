import React, { useState, useCallback } from 'react';
import { useAuth } from "../../contexts/AuthContext"; // adjust path
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  Switch,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Linking, Platform } from 'react-native';
import TextInputWithVoice from '../../components/TextInputWithVoice';
import { speakPageTitle, speakButtonAction, setTTSEnabled } from '../../services/SpeechService';

// Mock user data
const mockUser = {
  name: 'John Doe',
  email: 'john.doe@university.edu',
  studentId: 'STU2024001',
  avatar: null,
};

// Mock trusted circle contacts
const mockTrustedCircle = [
  { id: 1, name: 'Sarah Mom', phone: '+1 (555) 123-4567', relationship: 'Mother', isOnline: true },
  { id: 2, name: 'Mike Dad', phone: '+1 (555) 234-5678', relationship: 'Father', isOnline: false },
  { id: 3, name: 'Emma Friend', phone: '+1 (555) 345-6789', relationship: 'Best Friend', isOnline: true },
];

export default function ProfileScreen() {
  // Speak page title on load for accessibility
  useFocusEffect(
    useCallback(() => {
      speakPageTitle('Profile and Settings');
    }, [])
  );

  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [autoCaptureSOS, setAutoCaptureSOS] = useState(false);
  const [showChatbotModal, setShowChatbotModal] = useState(false);
  const [alarmType, setAlarmType] = useState<'fake-call' | 'ring'>('fake-call'); // New alarm type setting
  const [showAlarmTypeDropdown, setShowAlarmTypeDropdown] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [chatbotQuery, setChatbotQuery] = useState('');
  const [chatbotResponse, setChatbotResponse] = useState('');
  const [anonymousMode, setAnonymousMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedTheme, setSelectedTheme] = useState('Light');

  // New contact/emergency form states
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRelationship, setNewContactRelationship] = useState('');

  const [ttsEnabled, setTtsEnabled] = useState(true); // Default ON

  const [avatar, setAvatar] = useState<string | null>(mockUser.avatar);

  // Handle choosing/taking photo
  const handlePickImage = async () => {
    const options = ["Choose from Gallery", "Take a Photo", "Cancel"];
    const cancelButtonIndex = 2;

    Alert.alert(
      "Update Profile Picture",
      "Select an option",
      [
        {
          text: options[0],
          onPress: async () => {
            let result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 1,
            });
            if (!result.canceled) {
              setAvatar(result.assets[0].uri);
            }
          },
        },
        {
          text: options[1],
          onPress: async () => {
            let result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 1,
            });
            if (!result.canceled) {
              setAvatar(result.assets[0].uri);
            }
          },
        },
        { text: options[2], style: "cancel" },
      ]
    );
  };
  // ===== Load autoCaptureSOS setting from AsyncStorage =====
  React.useEffect(() => {
    const loadAutoCapture = async () => {
      try {
        const saved = await AsyncStorage.getItem('@autoCaptureSOS');
        if (saved !== null) {
          setAutoCaptureSOS(saved === 'true');
        }
      } catch (error) {
        console.log('Error loading autoCaptureSOS:', error);
      }
    };
    loadAutoCapture();
  }, []);

  // ===== Load alarmType setting from AsyncStorage =====
  React.useEffect(() => {
    const loadAlarmType = async () => {
      try {
        const saved = await AsyncStorage.getItem('@alarmType');
        if (saved !== null) {
          // Handle migration from old 'loud-alarm' to new 'ring'
          const migratedType = saved === 'loud-alarm' ? 'ring' : saved;
          setAlarmType(migratedType as 'fake-call' | 'ring');
        }
      } catch (error) {
        console.log('Error loading alarmType:', error);
      }
    };
    loadAlarmType();
  }, []);

  const toggleAutoCaptureSOS = async (value: boolean) => {
    try {
      setAutoCaptureSOS(value);
      await AsyncStorage.setItem('@autoCaptureSOS', value.toString());
    } catch (error) {
      console.log('Error saving autoCaptureSOS:', error);
    }
  };

  const setAlarmTypeSetting = async (type: 'fake-call' | 'ring') => {
    try {
      setAlarmType(type);
      await AsyncStorage.setItem('@alarmType', type);
    } catch (error) {
      console.log('Error saving alarmType:', error);
    }
  };



  const callContact = (phone: string) => {
    const url = Platform.select({ ios: `telprompt:${phone}`, default: `tel:${phone}` });
    Linking.openURL(url || `tel:${phone}`).catch(() => Alert.alert("Cannot place call", "Check your device call permissions."));
  };


  const { logout } = useAuth();
  const router = useRouter(); // Add this

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout(); // clears SecureStore + sets user = null
          },
        },
      ]
    );
  };


  const [trustedCircle, setTrustedCircle] = useState(mockTrustedCircle);

  const handleAddContact = () => {
    const newContact = {
      id: Date.now(),
      name: newContactName,
      phone: newContactPhone,
      relationship: newContactRelationship,
      isOnline: false,
    };
    setTrustedCircle([...trustedCircle, newContact]);
  };

  const handleRemoveContact = (contactId: number) => {
    setTrustedCircle(trustedCircle.filter(c => c.id !== contactId));
  };

  const handleChatbotQuery = () => {
    if (!chatbotQuery.trim()) {
      speakButtonAction('Please enter a question first');
      Alert.alert('Error', 'Please enter a question');
      return;
    }

    speakButtonAction(`Processing your question about ${chatbotQuery}`);

    // Simple FAQ responses based on keywords
    const query = chatbotQuery.toLowerCase();
    let response = '';

    if (query.includes('sos') || query.includes('emergency')) {
      response = '🚨 SOS: Triple-press the SOS button on the Home page to activate emergency mode. This will show your live location and provide options to call campus security, police, or notify trusted contacts.';
    } else if (query.includes('guardian') || query.includes('tracking')) {
      response = '🛡️ Virtual Guardian: Go to the Guardian tab to start a tracking session. Choose your destination and trusted contacts who will monitor your journey with safety check-ins.';
    } else if (query.includes('report') || query.includes('incident')) {
      response = '📝 Reporting: Use the Report tab to report incidents. You can include photos, descriptions, and choose to remain anonymous. All reports are reviewed by campus security.';
    } else if (query.includes('safe route') || query.includes('navigation')) {
      response = '🗺️ Safe Routes: View safe walking paths on the Map tab. These routes are regularly updated based on incident reports and campus security recommendations.';
    } else if (query.includes('trusted') || query.includes('contact')) {
      response = '👥 Trusted Circle: Add family and friends to your trusted circle in Profile settings. They can be notified during emergencies and guardian sessions.';
    } else if (query.includes('privacy') || query.includes('location')) {
      response = '🔒 Privacy: Control your location sharing and notification preferences in Profile settings. Location is only shared during active guardian sessions or emergencies.';
    } else if (query.includes('notification') || query.includes('alert')) {
      response = '🔔 Notifications: Get real-time alerts about nearby incidents and safety updates. Manage preferences in Profile settings.';
    } else if (query.includes('campus security') || query.includes('police')) {
      response = '🚓 Emergency Contacts: Campus Security: +1 (555) 911-0000, Police: 999, Hospital: +1 (555) 911-0002. Use the Emergency tab for quick access.';
    } else {
      response = '❓ I\'m here to help with safety questions! Try asking about SOS, Guardian mode, reporting incidents, safe routes, trusted contacts, privacy settings, or emergency numbers.';
    }

    setChatbotResponse(response);
  };

  const clearChatbot = () => {
    setChatbotQuery('');
    setChatbotResponse('');
  };

  const toggleTTS = () => {
    setTtsEnabled((prev) => {
      const newState = !prev;
      setTTSEnabled(newState); // Tell SpeechService
      speakButtonAction(newState ? 'Text-to-Speech enabled' : 'Text-to-Speech disabled');
      return newState;
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#fff" />
              </View>
            )}
            <TouchableOpacity style={styles.editAvatarButton} onPress={handlePickImage}>
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{mockUser.name}</Text>
          <Text style={styles.userEmail}>{mockUser.email}</Text>
          <Text style={styles.userId}>ID: {mockUser.studentId}</Text>
        </View>

        {/* Privacy & Safety Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Safety Settings</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="eye-off" size={20} color="#666" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Anonymous Mode</Text>
                <Text style={styles.settingDescription}>Hide your identity in reports</Text>
              </View>
            </View>
            <Switch
              value={anonymousMode}
              onValueChange={setAnonymousMode}
              trackColor={{ false: '#e1e5e9', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications" size={20} color="#666" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDescription}>Receive safety alerts</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#e1e5e9', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="location" size={20} color="#666" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Location Sharing</Text>
                <Text style={styles.settingDescription}>Share location with trusted contacts</Text>
              </View>
            </View>
            <Switch
              value={locationSharing}
              onValueChange={setLocationSharing}
              trackColor={{ false: '#e1e5e9', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="warning" size={20} color="#666" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Smart Guardian Alerts</Text>
                <Text style={styles.settingDescription}>Get alerts for route deviation and unusual stops</Text>
              </View>
            </View>
            <Switch
              value={true}
              onValueChange={() => { }}
              trackColor={{ false: '#e1e5e9', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="volume-high" size={20} color="#666" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Text-to-Speech</Text>
                <Text style={styles.settingDescription}>Enable voice feedback throughout the app</Text>
              </View>
            </View>
            <Switch
              value={ttsEnabled}
              onValueChange={toggleTTS}
              trackColor={{ false: '#e1e5e9', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="camera" size={20} color="#666" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Auto-capture on SOS</Text>
                <Text style={styles.settingDescription}>
                  {autoCaptureSOS
                    ? "Automatically start camera recording during SOS"
                    : "Disabled - manual capture only during SOS"}
                </Text>
              </View>
            </View>
            <Switch
              value={autoCaptureSOS}
              onValueChange={toggleAutoCaptureSOS}
              trackColor={{ false: '#e1e5e9', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>

          {/* Discreet Alarm Type Setting */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="alarm" size={20} color="#666" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Discreet Alarm Type</Text>
                <Text style={styles.settingDescription}>
                  {alarmType === 'fake-call' 
                    ? "Fake incoming call to help you exit situations"
                    : "Phone ring sound to deter threats"}
                </Text>
              </View>
            </View>
            
            {/* Clean Modern Dropdown */}
            <View style={styles.cleanDropdownContainer}>
              <TouchableOpacity
                style={[
                  styles.cleanDropdownButton,
                  showAlarmTypeDropdown && styles.cleanDropdownButtonActive
                ]}
                onPress={() => setShowAlarmTypeDropdown(!showAlarmTypeDropdown)}
              >
                <Ionicons 
                  name={alarmType === 'fake-call' ? "call" : "notifications"} 
                  size={16} 
                  color="#007AFF" 
                />
                <Text style={styles.cleanDropdownButtonText} numberOfLines={1}>
                  {alarmType === 'fake-call' ? 'Call' : 'Ring'}
                </Text>
                <Ionicons 
                  name={showAlarmTypeDropdown ? "chevron-up" : "chevron-down"} 
                  size={14} 
                  color="#999" 
                />
              </TouchableOpacity>
              
              {showAlarmTypeDropdown && (
                <View style={styles.cleanDropdownOptions}>
                  <TouchableOpacity
                    style={[
                      styles.cleanDropdownOption,
                      alarmType === 'fake-call' && styles.cleanDropdownOptionSelected
                    ]}
                    onPress={() => {
                      setAlarmTypeSetting('fake-call');
                      setShowAlarmTypeDropdown(false);
                    }}
                  >
                    <Ionicons 
                      name="call" 
                      size={16} 
                      color={alarmType === 'fake-call' ? '#007AFF' : '#666'} 
                    />
                    <Text style={[
                      styles.cleanDropdownOptionText,
                      alarmType === 'fake-call' && styles.cleanDropdownOptionTextSelected
                    ]}>
                      Call
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.cleanDropdownOption,
                      alarmType === 'ring' && styles.cleanDropdownOptionSelected
                    ]}
                    onPress={() => {
                      setAlarmTypeSetting('ring');
                      setShowAlarmTypeDropdown(false);
                    }}
                  >
                    <Ionicons 
                      name="notifications" 
                      size={16} 
                      color={alarmType === 'ring' ? '#007AFF' : '#666'} 
                    />
                    <Text style={[
                      styles.cleanDropdownOptionText,
                      alarmType === 'ring' && styles.cleanDropdownOptionTextSelected
                    ]}>
                      Ring
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

        </View>

        {/* Trusted Circle */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trusted Circle</Text>
            <TouchableOpacity onPress={() => setShowAddContactModal(true)}>
              <Ionicons name="add-circle" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {mockTrustedCircle.map((contact) => (
            <View key={contact.id} style={styles.contactItem}>
              <View style={styles.contactInfo}>
                <View style={styles.contactAvatar}>
                  <Ionicons name="person" size={20} color="#007AFF" />
                </View>
                <View style={styles.contactDetails}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactPhone}>{contact.phone}</Text>
                  <Text style={styles.contactRelationship}>{contact.relationship}</Text>
                  <View style={styles.contactStatus}>
                    <View style={[styles.statusDot, { backgroundColor: contact.isOnline ? '#34C759' : '#999' }]} />
                    <Text style={styles.statusText}>
                      {contact.isOnline ? 'Available' : 'Last seen 2h ago'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.contactActions}>
                <TouchableOpacity
                  style={styles.contactActionButton}
                  onPress={() => callContact(contact.phone)}
                >
                  <Ionicons name="call" size={16} color="#34C759" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.contactActionButton}>
                  <Ionicons name="location" size={16} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.contactActionButton}
                  onPress={() => handleRemoveContact(contact.id)}
                >
                  <Ionicons name="trash" size={16} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>



        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>

          <TouchableOpacity style={styles.settingButton} onPress={() => setShowLanguageModal(true)}>
            <Ionicons name="language" size={20} color="#666" />
            <Text style={styles.settingButtonText}>Language</Text>
            <Text style={styles.settingValue}>{selectedLanguage}</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingButton} onPress={() => setShowThemeModal(true)}>
            <Ionicons name="color-palette" size={20} color="#666" />
            <Text style={styles.settingButtonText}>Theme</Text>
            <Text style={styles.settingValue}>{selectedTheme}</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingButton} onPress={() => setShowTermsModal(true)}>
            <Ionicons name="document-text" size={20} color="#666" />
            <Text style={styles.settingButtonText}>Terms & Privacy</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Help & Support Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="help-circle" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Help & Support</Text>
          </View>
          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => setShowChatbotModal(true)}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color="#007AFF" />
            <Text style={styles.helpButtonText}>Chat with Safety Assistant</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color="#FF3B30" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Contact Modal */}
      <Modal
        visible={showAddContactModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddContactModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Trusted Contact</Text>
            <TouchableOpacity onPress={handleAddContact}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <TextInputWithVoice
              label="Name *"
              value={newContactName}
              onChangeText={setNewContactName}
              placeholder="Enter contact name"
              prompt="contact name"
            />

            <TextInputWithVoice
              label="Phone Number *"
              value={newContactPhone}
              onChangeText={setNewContactPhone}
              placeholder="Enter phone number"
              prompt="phone number"
              keyboardType="phone-pad"
            />

            <TextInputWithVoice
              label="Relationship *"
              value={newContactRelationship}
              onChangeText={setNewContactRelationship}
              placeholder="e.g., Mother, Father, Friend"
              prompt="relationship"
            />
          </View>
        </SafeAreaView>
      </Modal>



      {/* Language Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Language</Text>
            <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            {['English', 'Spanish', 'French', 'German', 'Chinese', 'Arabic'].map((language) => (
              <TouchableOpacity
                key={language}
                style={styles.languageOption}
                onPress={() => {
                  setSelectedLanguage(language);
                  setShowLanguageModal(false);
                }}
              >
                <Text style={styles.languageText}>{language}</Text>
                {selectedLanguage === language && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Theme Modal */}
      <Modal
        visible={showThemeModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowThemeModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Theme</Text>
            <TouchableOpacity onPress={() => setShowThemeModal(false)}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            {['Light', 'Dark', 'Auto'].map((theme) => (
              <TouchableOpacity
                key={theme}
                style={styles.themeOption}
                onPress={() => {
                  setSelectedTheme(theme);
                  setShowThemeModal(false);
                }}
              >
                <View style={[styles.themePreview, { backgroundColor: theme === 'Light' ? '#fff' : theme === 'Dark' ? '#1a1a1a' : '#f0f0f0' }]}>
                  <View style={[styles.themeDot, { backgroundColor: theme === 'Light' ? '#007AFF' : theme === 'Dark' ? '#fff' : '#007AFF' }]} />
                </View>
                <Text style={styles.themeText}>{theme}</Text>
                {selectedTheme === theme && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Terms & Privacy Modal */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTermsModal(false)}>
              <Text style={styles.cancelButton}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Terms & Privacy</Text>
            <View style={{ width: 50 }} />
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.termsSection}>
              <Text style={styles.termsTitle}>Terms of Service</Text>
              <Text style={styles.termsText}>
                By using UniSafe, you agree to our terms of service. This app is designed for campus safety and emergency response. Users must provide accurate information and use the app responsibly.
              </Text>
            </View>
            <View style={styles.termsSection}>
              <Text style={styles.termsTitle}>Privacy Policy</Text>
              <Text style={styles.termsText}>
                Your privacy is important to us. Location data is only shared during active guardian sessions or emergencies. Personal information is protected and never sold to third parties.
              </Text>
            </View>
            <View style={styles.termsSection}>
              <Text style={styles.termsTitle}>Data Usage</Text>
              <Text style={styles.termsText}>
                We collect minimal data necessary for safety features. This includes location (when needed), contact information, and incident reports. Data is encrypted and stored securely.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Chatbot FAQ Modal */}
      <Modal
        visible={showChatbotModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowChatbotModal(false)}>
              <Text style={styles.cancelButton}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Safety Assistant</Text>
            <TouchableOpacity onPress={clearChatbot}>
              <Text style={styles.clearButton}>Clear</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.chatbotContainer}>
              <View style={styles.chatbotHeader}>
                <Ionicons name="shield-checkmark" size={32} color="#007AFF" />
                <Text style={styles.chatbotTitle}>How can I help you stay safe?</Text>
                <Text style={styles.chatbotSubtitle}>Ask me about SOS, Guardian mode, reporting, safe routes, and more!</Text>
              </View>

              <View style={styles.queryInputContainer}>
                <TextInputWithVoice
                  value={chatbotQuery}
                  onChangeText={setChatbotQuery}
                  placeholder="Ask a safety question..."
                  prompt="safety question"
                  multiline
                  numberOfLines={3}
                  style={{ flex: 1, marginRight: 8 }}
                  inputStyle={styles.queryInput}
                />
                <TouchableOpacity
                  style={styles.askButton}
                  onPress={handleChatbotQuery}
                >
                  <Ionicons name="send" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {chatbotResponse ? (
                <View style={styles.responseContainer}>
                  <View style={styles.responseHeader}>
                    <Ionicons name="bulb" size={20} color="#FF9500" />
                    <Text style={styles.responseTitle}>Response</Text>
                  </View>
                  <Text style={styles.responseText}>{chatbotResponse}</Text>
                </View>
              ) : null}

              <View style={styles.faqSuggestions}>
                <Text style={styles.faqTitle}>Quick Questions:</Text>
                <TouchableOpacity
                  style={styles.faqSuggestion}
                  onPress={() => {
                    setChatbotQuery('How does SOS work?');
                    handleChatbotQuery();
                  }}
                >
                  <Text style={styles.faqSuggestionText}>How does SOS work?</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.faqSuggestion}
                  onPress={() => {
                    setChatbotQuery('What is Virtual Guardian?');
                    handleChatbotQuery();
                  }}
                >
                  <Text style={styles.faqSuggestionText}>What is Virtual Guardian?</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.faqSuggestion}
                  onPress={() => {
                    setChatbotQuery('How do I report an incident?');
                    handleChatbotQuery();
                  }}
                >
                  <Text style={styles.faqSuggestionText}>How do I report an incident?</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.faqSuggestion}
                  onPress={() => {
                    setChatbotQuery('How do I add trusted contacts?');
                    handleChatbotQuery();
                  }}
                >
                  <Text style={styles.faqSuggestionText}>How do I add trusted contacts?</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.faqSuggestion}
                  onPress={() => {
                    setChatbotQuery('Where are emergency contacts?');
                    handleChatbotQuery();
                  }}
                >
                  <Text style={styles.faqSuggestionText}>Where are emergency contacts?</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  userId: {
    fontSize: 14,
    color: '#999',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  alarmTypeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    gap: 6,
  },
  alarmTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF6B35',
  },
  alarmTypeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  alarmOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B35',
    backgroundColor: '#FFFFFF',
    gap: 6,
    minWidth: 80,
    justifyContent: 'center',
  },
  alarmOptionActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  alarmOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FF6B35',
  },
  alarmOptionTextActive: {
    color: '#FFFFFF',
  },
  // Clean Simple Dropdown Styles
  cleanDropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  cleanDropdownButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 110,
    maxWidth: 130,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cleanDropdownButtonActive: {
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOpacity: 0.1,
  },
  cleanDropdownButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    flex: 1,
    textAlign: 'center',
  },
  cleanDropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1001,
    marginTop: 4,
    overflow: 'hidden',
  },
  cleanDropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  cleanDropdownOptionSelected: {
    backgroundColor: '#F0F8FF',
  },
  cleanDropdownOptionText: {
    fontSize: 14,
    color: '#1C1C1E',
    flex: 1,
  },
  cleanDropdownOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '500',
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  contactRelationship: {
    fontSize: 12,
    color: '#999',
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  contactActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },

  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingButtonText: {
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 12,
    flex: 1,
  },
  settingValue: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    margin: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#f8f9fa',
  },

  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  helpButtonText: {
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 12,
    flex: 1,
  },
  chatbotContainer: {
    padding: 20,
  },
  chatbotHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  chatbotTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 10,
    textAlign: 'center',
  },
  chatbotSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  queryInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  queryInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    paddingRight: 10,
    paddingBottom: 0,
  },
  askButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  responseContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  responseTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  responseText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  faqSuggestions: {
    marginTop: 20,
  },
  faqTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  faqSuggestion: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
  },
  faqSuggestionText: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  clearButton: {
    fontSize: 16,
    color: '#FF3B30',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  languageText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  themePreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e1e5e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  themeText: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
    marginLeft: 16,
  },
  termsSection: {
    marginBottom: 24,
  },
  termsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  termsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
});