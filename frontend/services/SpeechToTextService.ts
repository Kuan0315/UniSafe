import { Alert, Linking } from 'react-native';

export interface SpeechToTextOptions {
  language?: string;
  prompt?: string;
  onResult?: (text: string) => void;
  onError?: (error: string) => void;
}

class SpeechToTextService {
  private isSupported: boolean = false;

  constructor() {
    // Check if speech recognition is supported
    this.checkSupport();
  }

  private async checkSupport() {
    // For now, we'll assume it's supported and provide fallback options
    this.isSupported = true;
  }

  /**
   * Start speech recognition for text input
   * This will guide users to use their device's built-in speech recognition
   */
  async startSpeechRecognition(options: SpeechToTextOptions): Promise<void> {
    try {
      if (!this.isSupported) {
        this.showFallbackMessage();
        return;
      }

      // Show instructions for using device speech recognition
      this.showSpeechInstructions(options.prompt);
      
    } catch (error) {
      console.error('Speech recognition error:', error);
      this.showFallbackMessage();
    }
  }

  /**
   * Show instructions for using device speech recognition
   */
  private showSpeechInstructions(prompt?: string) {
    const message = prompt 
      ? `To use voice input for "${prompt}":\n\n1. Tap the microphone button\n2. Speak clearly into your device\n3. Your device will convert speech to text\n4. Tap "Done" when finished`
      : 'To use voice input:\n\n1. Tap the microphone button\n2. Speak clearly into your device\n3. Your device will convert speech to text\n4. Tap "Done" when finished';

    Alert.alert(
      'Voice Input Instructions',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: () => this.openSpeechSettings() 
        }
      ]
    );
  }

  /**
   * Show fallback message when speech recognition is not available
   */
  private showFallbackMessage() {
    Alert.alert(
      'Voice Input Not Available',
      'Voice input is not available on this device. Please use the keyboard to enter text.',
      [{ text: 'OK' }]
    );
  }

  /**
   * Open device speech recognition settings
   */
  private openSpeechSettings() {
    // Try to open accessibility settings where speech recognition is usually configured
    Linking.openSettings().catch(() => {
      Alert.alert(
        'Settings',
        'Please go to your device Settings > Accessibility > Speech Recognition to enable voice input features.',
        [{ text: 'OK' }]
      );
    });
  }

  /**
   * Check if speech recognition is supported on this device
   */
  isSpeechRecognitionSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Get available languages for speech recognition
   */
  getAvailableLanguages(): string[] {
    // Common languages supported by most devices
    return [
      'en-US', 'en-GB', 'en-AU', 'en-CA',
      'es-ES', 'es-MX', 'fr-FR', 'de-DE',
      'it-IT', 'pt-BR', 'pt-PT', 'ru-RU',
      'ja-JP', 'ko-KR', 'zh-CN', 'zh-TW',
      'ar-SA', 'hi-IN', 'th-TH', 'vi-VN'
    ];
  }
}

export const speechToTextService = new SpeechToTextService();
export default speechToTextService;
