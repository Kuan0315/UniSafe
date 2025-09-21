import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  StatusBar,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface FakeCallScreenProps {
  visible: boolean;
  onEndCall: () => void;
  callerName?: string;
  callerNumber?: string;
  callerImage?: string;
}

const { width, height } = Dimensions.get('window');

export default function FakeCallScreen({
  visible,
  onEndCall,
  callerName = "Mom",
  callerNumber = "+1 (555) 123-4567",
  callerImage
}: FakeCallScreenProps) {
  const [callDuration, setCallDuration] = useState(0);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [isAnswered, setIsAnswered] = useState(false);

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Pulse animation for incoming call
  useEffect(() => {
    if (!isAnswered) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isAnswered]);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnswered && visible) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isAnswered, visible]);

  // Auto-answer after 3 seconds for realism
  useEffect(() => {
    if (visible && !isAnswered) {
      const timer = setTimeout(() => {
        setIsAnswered(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, isAnswered]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setIsAnswered(false);
      setCallDuration(0);
    }
  }, [visible]);

  const handleAnswer = () => {
    setIsAnswered(true);
  };

  const handleEndCall = () => {
    onEndCall();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
    >
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      <View style={styles.container}>
        {/* Background Blur Effect */}
        <BlurView intensity={20} style={StyleSheet.absoluteFill}>
          <View style={styles.backgroundOverlay} />
        </BlurView>

        {/* Call Status */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {isAnswered ? 'Connected' : 'Incoming call'}
          </Text>
          {isAnswered && (
            <Text style={styles.durationText}>
              {formatDuration(callDuration)}
            </Text>
          )}
        </View>

        {/* Caller Info */}
        <View style={styles.callerContainer}>
          <View style={styles.avatarContainer}>
            {callerImage ? (
              <Image source={{ uri: callerImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={80} color="#FFFFFF" />
              </View>
            )}
            
            {/* Pulse animation ring for incoming call */}
            {!isAnswered && (
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              />
            )}
          </View>

          <Text style={styles.callerName}>{callerName}</Text>
          <Text style={styles.callerNumber}>{callerNumber}</Text>
          
          {isAnswered && (
            <View style={styles.callFeatures}>
              <TouchableOpacity style={styles.featureButton}>
                <Ionicons name="mic-off" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.featureButton}>
                <Ionicons name="volume-high" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.featureButton}>
                <Ionicons name="add" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Call Actions */}
        <View style={styles.actionsContainer}>
          {!isAnswered ? (
            // Incoming call actions
            <View style={styles.incomingActions}>
              <TouchableOpacity 
                style={styles.declineButton}
                onPress={handleEndCall}
              >
                <Ionicons name="call" size={28} color="#FFFFFF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.answerButton}
                onPress={handleAnswer}
              >
                <Ionicons name="call" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            // Active call actions
            <View style={styles.activeCallActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="keypad" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="videocam-off" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.endCallButton}
                onPress={handleEndCall}
              >
                <Ionicons name="call" size={28} color="#FFFFFF" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="person-add" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="chatbubble" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Slide to answer (iOS style) */}
        {!isAnswered && (
          <View style={styles.slideToAnswer}>
            <Text style={styles.slideText}>slide to answer</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 40,
  },
  backgroundOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  statusText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 4,
  },
  durationText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  callerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  avatar: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#666666',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  pulseRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    opacity: 0.6,
    top: -10,
    left: -10,
  },
  callerName: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
    marginBottom: 8,
    textAlign: 'center',
  },
  callerNumber: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 30,
  },
  callFeatures: {
    flexDirection: 'row',
    gap: 40,
    marginTop: 20,
  },
  featureButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  incomingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: width * 0.7,
    alignItems: 'center',
  },
  declineButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '135deg' }],
  },
  answerButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCallActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: width * 0.9,
    alignItems: 'center',
  },
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endCallButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '135deg' }],
  },
  slideToAnswer: {
    alignItems: 'center',
    marginTop: 20,
  },
  slideText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.6,
  },
});