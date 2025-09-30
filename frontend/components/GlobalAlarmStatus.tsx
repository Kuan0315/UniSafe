import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface GlobalAlarmStatusProps {
  isVisible: boolean;
  alarmType: 'fake-call' | 'ring' | null;
  onStopAlarm: () => void;
}

const GlobalAlarmStatus: React.FC<GlobalAlarmStatusProps> = ({
  isVisible,
  alarmType,
  onStopAlarm,
}) => {
  const insets = useSafeAreaInsets();
  const [pulseAnim] = React.useState(new Animated.Value(1));

  React.useEffect(() => {
    if (isVisible) {
      // Create pulsing animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isVisible, pulseAnim]);

  if (!isVisible || !alarmType) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.statusBar}>
        {/* SOS Indicator with pulsing animation */}
        <Animated.View style={[styles.sosContainer, { transform: [{ scale: pulseAnim }] }]}>
          <MaterialIcons name="emergency" size={20} color="#FFFFFF" />
          <Text style={styles.sosText}>SOS</Text>
        </Animated.View>

        {/* Alarm Type and Status */}
        <View style={styles.statusInfo}>
          <MaterialIcons 
            name={alarmType === 'fake-call' ? 'phone' : 'notifications'} 
            size={18} 
            color="#FFFFFF" 
          />
          <Text style={styles.statusText}>
            {alarmType === 'fake-call' ? 'Fake Call Active' : 'Ring Alarm Active'}
          </Text>
        </View>

        {/* Stop Button */}
        <TouchableOpacity 
          style={styles.stopButton}
          onPress={onStopAlarm}
          activeOpacity={0.8}
        >
          <MaterialIcons name="stop" size={18} color="#FF0000" />
          <Text style={styles.stopButtonText}>Stop</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: '#FF0000',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FF0000',
    minHeight: 44,
  },
  sosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CC0000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
  },
  sosText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  statusInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  stopButtonText: {
    color: '#FF0000',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});

export default GlobalAlarmStatus;