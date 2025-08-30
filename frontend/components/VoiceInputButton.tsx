import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import speechToTextService from '../services/SpeechToTextService';

interface VoiceInputButtonProps {
  onPress?: () => void;
  prompt?: string;
  size?: number;
  color?: string;
  style?: any;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export default function VoiceInputButton({
  onPress,
  prompt,
  size = 24,
  color = '#007AFF',
  style,
  accessibilityLabel = 'Voice input',
  accessibilityHint = 'Tap to use voice input for this field'
}: VoiceInputButtonProps) {
  
  const handlePress = async () => {
    if (onPress) {
      onPress();
    } else {
      // Default behavior: show speech recognition instructions
      await speechToTextService.startSpeechRecognition({
        prompt,
        onResult: (text) => {
          console.log('Speech recognition result:', text);
          // This would typically update the parent component's text input
        },
        onError: (error) => {
          console.error('Speech recognition error:', error);
        }
      });
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handlePress}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
    >
      <Ionicons name="mic" size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
