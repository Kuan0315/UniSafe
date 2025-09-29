import { Alert, Linking, Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

export interface SpeechToTextOptions {
  language?: string;
  prompt?: string;
  onResult?: (text: string) => void;
  onError?: (error: string) => void;
  onNoSpeech?: () => void;
}

class SpeechToTextService {
  private isSupported: boolean = false;
  private recording: Audio.Recording | null = null;
  private apiKey = process.env.EXPO_PUBLIC_GOOGLE_SPEECH_API_KEY || 'AIzaSyA6LhiERPIHt9wZRrUHsAIdGA3IIfaSz8Q'; // Fallback to provided key

  constructor() {
    this.checkSupport();
  }

  private async checkSupport() {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      this.isSupported = status === 'granted';
    } catch (error) {
      console.error('Audio permission error:', error);
      this.isSupported = false;
    }
  }

  /**
   * Start speech recognition for text input
   */
  async startSpeechRecognition(options: SpeechToTextOptions): Promise<void> {
    try {
      if (!this.isSupported) {
        this.showFallbackMessage();
        return;
      }

      // Start recording
      await this.startRecording();

      // Show recording started message
      Alert.alert(
        'Recording Started',
        'Speak now. Tap OK when finished.',
        [
          {
            text: 'Stop Recording',
            onPress: async () => {
              await this.stopRecordingAndTranscribe(options);
            },
          },
        ],
        { cancelable: false }
      );

    } catch (error) {
      console.error('Speech recognition error:', error);
      options.onError?.('Failed to start recording');
      this.showFallbackMessage();
    }
  }

  private async startRecording() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync({
        android: {
          extension: '.wav',
          outputFormat: 1, // THREE_GPP
          audioEncoder: 1, // AMR_NB
          sampleRate: 8000, // AMR requires 8000 Hz
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          audioQuality: 0x7f, // Low
          sampleRate: 16000, // LINEAR16 requires 16000 Hz
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {},
      });

      await this.recording.startAsync();
    } catch (error) {
      console.error('Recording start error:', error);
      throw error;
    }
  }

  private async stopRecordingAndTranscribe(options: SpeechToTextOptions) {
    try {
      if (!this.recording) return;

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;

      console.log('Recording URI:', uri);

      if (uri) {
        const audioBase64 = await this.convertAudioToBase64(uri);
        console.log('Audio converted to base64, length:', audioBase64.length);
        const text = await this.transcribeAudio(audioBase64, options.language || 'en-US', options);
        options.onResult?.(text);
      } else {
        throw new Error('No recording URI available');
      }
    } catch (error) {
      console.error('Recording stop error:', error);
      options.onError?.('Failed to process recording: ' + (error as Error).message);
    }
  }

  private async convertAudioToBase64(uri: string): Promise<string> {
    try {
      console.log('Converting audio file to base64:', uri);
      // Read the audio file as base64 using legacy API
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      console.log('Audio file converted, base64 length:', base64.length);
      return base64;
    } catch (error) {
      console.error('Error converting audio to base64:', error);
      throw error;
    }
  }

  private async transcribeAudio(audioBase64: string, language: string, options: SpeechToTextOptions): Promise<string> {
    try {
      console.log('Sending audio to Google Speech API, base64 length:', audioBase64.length);

      const response = await fetch(
        `https://speech.googleapis.com/v1/speech:recognize?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            config: {
              encoding: Platform.OS === 'ios' ? 'LINEAR16' : 'AMR',
              sampleRateHertz: Platform.OS === 'ios' ? 16000 : 8000,
              languageCode: language,
              enableAutomaticPunctuation: true,
            },
            audio: {
              content: audioBase64,
            },
          }),
        }
      );

      console.log('Speech API response status:', response.status);

      const data = await response.json();
      console.log('Speech API response:', data);

      if (data.error) {
        console.error('Speech API error:', data.error);
        throw new Error(data.error.message);
      }

      if (data.results && data.results.length > 0) {
        console.log('First result:', JSON.stringify(data.results[0], null, 2));
        if (data.results[0].alternatives && data.results[0].alternatives.length > 0) {
          const transcript = data.results[0].alternatives[0].transcript;
          console.log('Transcription result:', transcript);
          console.log('Transcript type:', typeof transcript);
          console.log('Transcript truthy check:', !!transcript);
          console.log('Full alternatives[0]:', JSON.stringify(data.results[0].alternatives[0]));
          
          if (!transcript || transcript.trim().length === 0) {
            console.log('Empty transcript detected, calling onNoSpeech');
            options.onNoSpeech?.(); // Notify that no speech was detected
            return '';
          }
          
          return transcript || '';
        } else {
          console.log('No alternatives in first result, calling onNoSpeech');
          options.onNoSpeech?.(); // Notify that no speech was detected
          return '';
        }
      } else {
        console.log('No results in response');
        options.onNoSpeech?.(); // Notify that no speech was detected
      }

      return '';
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  }

  /**
   * Show fallback message when speech recognition is not available
   */
  private showFallbackMessage() {
    Alert.alert(
      'Speech Recognition Unavailable',
      'Speech recognition is not available on this device. Please use text input instead.',
      [{ text: 'OK' }]
    );
  }
}

const speechToTextService = new SpeechToTextService();
export default speechToTextService;
