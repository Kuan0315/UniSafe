import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import VoiceInputButton from './VoiceInputButton';
import speechToTextService from '../services/SpeechToTextService';

interface TextInputWithVoiceProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  prompt?: string;
  style?: any;
  inputStyle?: any;
  multiline?: boolean;
  numberOfLines?: number;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  editable?: boolean;
  maxLength?: number;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export default function TextInputWithVoice({
  value,
  onChangeText,
  placeholder,
  label,
  prompt,
  style,
  inputStyle,
  multiline = false,
  numberOfLines = 1,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  editable = true,
  maxLength,
  accessibilityLabel,
  accessibilityHint
}: TextInputWithVoiceProps) {
  const [isListening, setIsListening] = useState(false);

  const handleVoiceInput = async () => {
    if (!editable) return;

    setIsListening(true);
    
    try {
      await speechToTextService.startSpeechRecognition({
        prompt: prompt || label || 'this field',
        onResult: (text) => {
          console.log('Voice input result:', text);
          onChangeText(text);
          setIsListening(false);
        },
        onError: (error) => {
          console.error('Voice input error:', error);
          setIsListening(false);
          Alert.alert('Voice Input Error', 'Unable to process voice input. Please try again or use the keyboard.');
        }
      });
    } catch (error) {
      setIsListening(false);
      console.error('Voice input failed:', error);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            multiline && styles.multilineInput,
            inputStyle
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          multiline={multiline}
          numberOfLines={numberOfLines}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={editable}
          maxLength={maxLength}
          accessibilityLabel={accessibilityLabel || label}
          accessibilityHint={accessibilityHint || `Enter ${label || 'text'} or use voice input`}
        />
        
        <VoiceInputButton
          onPress={handleVoiceInput}
          prompt={prompt || label}
          size={20}
          color={isListening ? '#FF3B30' : '#007AFF'}
          style={[
            styles.voiceButton,
            isListening && styles.listeningButton
          ]}
          accessibilityLabel={`Voice input for ${label || 'this field'}`}
          accessibilityHint="Tap to use voice input instead of typing"
        />
      </View>
      
      {isListening && (
        <View style={styles.listeningIndicator}>
          <Ionicons name="radio-button-on" size={12} color="#FF3B30" />
          <Text style={styles.listeningText}>Listening...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    textAlignVertical: 'top',
  },
  multilineInput: {
    minHeight: 80,
  },
  voiceButton: {
    margin: 8,
    marginLeft: 4,
  },
  listeningButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
  },
  listeningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 4,
  },
  listeningText: {
    fontSize: 12,
    color: '#FF3B30',
    marginLeft: 4,
    fontStyle: 'italic',
  },
});
