import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Message {
  id: string;
  text: string;
  sender: 'staff' | 'student';
  timestamp: Date;
  senderName?: string;
}

interface StaffEmergencyChatProps {
  studentName: string;
  alertId: string;
  onMessageSummary?: (summary: string) => void;
}

const StaffEmergencyChat: React.FC<StaffEmergencyChatProps> = ({ 
  studentName, 
  alertId,
  onMessageSummary 
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `SOS Alert activated by ${studentName}. Emergency services have been notified.`,
      sender: 'staff',
      timestamp: new Date(),
      senderName: 'Security System'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // Simulate student responses for demonstration
  const simulateStudentResponse = (staffMessage: string) => {
    const responses = [
      "I'm okay now, thank you for checking",
      "Still need help, please come quickly",
      "The situation has escalated, urgent assistance needed",
      "False alarm, sorry for the confusion",
      "Medical emergency, need ambulance",
      "Someone is following me, I'm scared",
      "I'm in the library basement, can't find exit",
      "Everything is fine now, thanks for responding"
    ];

    // Simple keyword-based response selection
    let response = responses[0]; // default
    
    if (staffMessage.toLowerCase().includes('status') || staffMessage.toLowerCase().includes('okay')) {
      response = Math.random() > 0.5 ? responses[0] : responses[1];
    } else if (staffMessage.toLowerCase().includes('help') || staffMessage.toLowerCase().includes('assist')) {
      response = responses[1];
    } else if (staffMessage.toLowerCase().includes('location') || staffMessage.toLowerCase().includes('where')) {
      response = responses[6];
    } else if (staffMessage.toLowerCase().includes('medical') || staffMessage.toLowerCase().includes('hurt')) {
      response = responses[4];
    } else {
      response = responses[Math.floor(Math.random() * responses.length)];
    }

    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const newMessage: Message = {
          id: Date.now().toString(),
          text: response,
          sender: 'student',
          timestamp: new Date(),
          senderName: studentName
        };
        setMessages(prev => [...prev, newMessage]);
      }, 1500);
    }, 1000);
  };

  const sendMessage = () => {
    if (inputText.trim() === '') return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'staff',
      timestamp: new Date(),
      senderName: 'Campus Security'
    };

    setMessages(prev => [...prev, newMessage]);
    
    // Simulate student response
    simulateStudentResponse(inputText.trim());
    
    setInputText('');
  };

  const generateConciseSummary = () => {
    const studentMessages = messages.filter(m => m.sender === 'student');
    if (studentMessages.length === 0) {
      return 'Emergency alert activated - awaiting communication';
    }

    const allStudentText = studentMessages.map(m => m.text.toLowerCase()).join(' ');
    
    // Generate concise summary based on student messages
    if (allStudentText.includes('following') || allStudentText.includes('stalking') || allStudentText.includes('chasing')) {
      return 'Student reports being followed - security threat';
    } else if (allStudentText.includes('medical') || allStudentText.includes('hurt') || allStudentText.includes('pain') || allStudentText.includes('ambulance')) {
      return 'Medical emergency - student requires medical assistance';
    } else if (allStudentText.includes('fire') || allStudentText.includes('smoke') || allStudentText.includes('burning')) {
      return 'Fire emergency - immediate evacuation needed';
    } else if (allStudentText.includes('assault') || allStudentText.includes('attack') || allStudentText.includes('violent')) {
      return 'Physical assault reported - urgent security response needed';
    } else if (allStudentText.includes('harassment') || allStudentText.includes('threatening') || allStudentText.includes('scared')) {
      return 'Student experiencing harassment - security intervention required';
    } else if (allStudentText.includes('lost') || allStudentText.includes('trapped') || allStudentText.includes('stuck')) {
      return 'Student lost or trapped - location assistance needed';
    } else if (allStudentText.includes('false') || allStudentText.includes('accident') || allStudentText.includes('mistake')) {
      return 'False alarm - accidental activation confirmed';
    } else if (allStudentText.includes('okay') || allStudentText.includes('fine') || allStudentText.includes('safe')) {
      return 'Situation resolved - student confirms safety';
    } else if (allStudentText.includes('help') || allStudentText.includes('urgent') || allStudentText.includes('emergency')) {
      return 'Active emergency - student requests immediate assistance';
    } else {
      const lastMessage = studentMessages[studentMessages.length - 1];
      return `Student communication: ${lastMessage.text.substring(0, 50)}${lastMessage.text.length > 50 ? '...' : ''}`;
    }
  };

  const generateSummary = () => {
    if (messages.length <= 1) {
      Alert.alert('No Messages', 'No conversation to summarize yet.');
      return;
    }

    const conciseSummary = generateConciseSummary();
    const studentMessages = messages.filter(m => m.sender === 'student');
    const lastStudentMessage = studentMessages[studentMessages.length - 1];
    
    let detailedSummary = `Emergency Summary for ${studentName}:\n\n`;
    detailedSummary += `• Situation: ${conciseSummary}\n`;
    detailedSummary += `• Alert ID: ${alertId}\n`;
    detailedSummary += `• Total Messages: ${messages.length}\n`;
    detailedSummary += `• Student Communications: ${studentMessages.length}\n`;
    
    if (lastStudentMessage) {
      detailedSummary += `• Latest Update: "${lastStudentMessage.text}"\n`;
    }
    
    detailedSummary += `• Generated: ${new Date().toLocaleString()}`;
    
    Alert.alert('Emergency Summary', detailedSummary);
    
    // Send the concise summary to parent component for display in alert list
    if (onMessageSummary) {
      onMessageSummary(conciseSummary);
    }
  };

  // Auto-generate summary when student messages change
  useEffect(() => {
    if (messages.length > 1) {
      const conciseSummary = generateConciseSummary();
      if (onMessageSummary) {
        onMessageSummary(conciseSummary);
      }
    }
  }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="chatbubbles" size={20} color="#3182CE" />
          <Text style={styles.headerTitle}>Emergency Communication</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageContainer,
              message.sender === 'staff' ? styles.staffMessage : styles.studentMessage
            ]}
          >
            <View style={styles.messageHeader}>
              <Text style={styles.senderName}>
                {message.senderName || (message.sender === 'staff' ? 'Campus Security' : studentName)}
              </Text>
              <Text style={styles.messageTime}>{formatTime(message.timestamp)}</Text>
            </View>
            <Text style={[
              styles.messageText,
              message.sender === 'staff' ? styles.staffMessageText : styles.studentMessageText
            ]}>
              {message.text}
            </Text>
          </View>
        ))}
        
        {isTyping && (
          <View style={[styles.messageContainer, styles.studentMessage]}>
            <View style={styles.messageHeader}>
              <Text style={styles.senderName}>{studentName}</Text>
              <Text style={styles.messageTime}>typing...</Text>
            </View>
            <View style={styles.typingIndicator}>
              <View style={styles.typingDot} />
              <View style={styles.typingDot} />
              <View style={styles.typingDot} />
            </View>
          </View>
        )}
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message to the student..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, inputText.trim() === '' && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={inputText.trim() === ''}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={inputText.trim() === '' ? '#9CA3AF' : '#FFFFFF'} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 400,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  messagesContainer: {
    maxHeight: 250,
    backgroundColor: '#FFFFFF',
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '85%',
  },
  staffMessage: {
    alignSelf: 'flex-end',
  },
  studentMessage: {
    alignSelf: 'flex-start',
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
    color: '#6B7280',
  },
  messageTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    padding: 12,
    borderRadius: 16,
  },
  staffMessageText: {
    backgroundColor: '#007AFF',
    color: '#FFFFFF',
    borderBottomRightRadius: 6,
  },
  studentMessageText: {
    backgroundColor: '#F3F4F6',
    color: '#1F2937',
    borderBottomLeftRadius: 6,
  },
  typingIndicator: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    borderBottomLeftRadius: 6,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
    marginRight: 4,
    opacity: 0.6,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#3182CE',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
});

export default StaffEmergencyChat;