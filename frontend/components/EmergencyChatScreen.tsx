import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { getSOSChatMessages, sendSOSMessage } from '../services/SOSService';

interface Message {
  senderId: string;
  senderRole: 'student' | 'staff' | 'security';
  message: string;
  timestamp: Date;
  messageType: 'text' | 'location_update' | 'media_shared';
  mediaUrl?: string;
}

interface EmergencyChatScreenProps {
  visible: boolean;
  onClose: () => void;
  emergencyId?: string;
}

export default function EmergencyChatScreen({ 
  visible, 
  onClose, 
  emergencyId 
}: EmergencyChatScreenProps) {
  const [messageText, setMessageText] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Fetch messages when component becomes visible or emergencyId changes
  useEffect(() => {
    if (visible && emergencyId) {
      // Reset messages when reopening
      setChatMessages([]);
      setMessageText('');
      fetchMessages();
      // Set up polling for new messages every 5 seconds
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    } else if (!visible) {
      // Clear messages and stop polling when not visible
      setChatMessages([]);
      setMessageText('');
    }
  }, [visible, emergencyId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [chatMessages]);

  const fetchMessages = async () => {
    if (!emergencyId) return;
    
    try {
      setIsLoadingMessages(true);
      const messages = await getSOSChatMessages(emergencyId);
      setChatMessages(messages);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || isSendingMessage || !emergencyId) return;
    
    setIsSendingMessage(true);
    
    try {
      await sendSOSMessage(emergencyId, messageText.trim(), 'text');
      setMessageText('');
      
      // Refresh messages to show the sent message
      await fetchMessages();
      
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const renderMessage = (item: Message, index: number) => (
    <View
      key={`${item.senderId}-${item.timestamp.getTime()}`}
      style={[
        styles.messageContainer,
        item.senderRole === 'student' ? styles.studentMessage : styles.securityMessage
      ]}
    >
      <View style={styles.messageHeader}>
        <Text style={[
          styles.senderName,
          item.senderRole !== 'student' && { color: '#666666' }
        ]}>
          {item.senderRole === 'student' ? 'You' : 
           item.senderRole === 'staff' ? 'Staff' : 'Campus Security'}
        </Text>
        <Text style={[
          styles.messageTime,
          item.senderRole !== 'student' && { color: '#666666', opacity: 1 }
        ]}>
          {item.timestamp ? item.timestamp.toLocaleTimeString() : 'Unknown time'}
        </Text>
      </View>
      <Text style={[
        styles.messageText,
        item.senderRole !== 'student' && { color: '#000000' }
      ]}>
        {item.message}
      </Text>
      {item.messageType === 'location_update' && (
        <Text style={styles.locationUpdateText}>📍 Location shared</Text>
      )}
      {item.messageType === 'media_shared' && item.mediaUrl && (
        <Text style={styles.mediaSharedText}>📎 Media shared</Text>
      )}
    </View>
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Emergency Chat</Text>
            <Text style={styles.headerSubtitle}>Campus Security</Text>
          </View>
          <View style={styles.statusIndicator}>
            <View style={styles.onlineIndicator} />
            <Text style={styles.statusText}>Online</Text>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {chatMessages.map((item, index) => renderMessage(item, index))}
          
          {isSendingMessage && (
            <View style={[styles.messageContainer, styles.studentMessage, styles.sendingMessage]}>
              <Text style={styles.messageText}>Sending...</Text>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Type your message..."
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={500}
              editable={!isSendingMessage}
              placeholderTextColor="#8E8E93"
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!messageText.trim() || isSendingMessage) && styles.sendButtonDisabled
              ]}
              onPress={sendMessage}
              disabled={!messageText.trim() || isSendingMessage}
            >
              <Ionicons 
                name={isSendingMessage ? "hourglass" : "send"} 
                size={20} 
                color="#fff" 
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.inputHint}>
            Emergency chat is monitored 24/7 by campus security
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </Modal>
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  studentMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  securityMessage: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E1E1E1',
  },
  sendingMessage: {
    opacity: 0.7,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  messageText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  locationUpdateText: {
    fontSize: 14,
    color: '#34C759',
    fontStyle: 'italic',
    marginTop: 4,
  },
  mediaSharedText: {
    fontSize: 14,
    color: '#FF9500',
    fontStyle: 'italic',
    marginTop: 4,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#E1E1E1',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E1E1E1',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    maxHeight: 100,
    paddingVertical: 8,
    paddingHorizontal: 12,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  inputHint: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});