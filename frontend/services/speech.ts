// services/speech.ts
import * as ExpoAudio from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import { RecordingPresets } from 'expo-audio';

export const startRecording = async () => {
  try {
    console.log('Requesting permissions..');
    const { status } = await ExpoAudio.AudioModule.requestRecordingPermissionsAsync();
    
    if (status !== 'granted') {
      throw new Error('Audio permission not granted');
    }
    
    await ExpoAudio.setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    });
    
    console.log('Starting recording..');
    // In the new API, we need to create a recorder differently
    // The best approach is to refactor the app to use the useAudioRecorder hook directly in components
    // For this service function, we'll create a temporary recorder
    const recorder = ExpoAudio.AudioModule.createAudioRecorder(ExpoAudio.RecordingPresets.HIGH_QUALITY);
    
    await recorder.prepareToRecordAsync();
    recorder.record();
    
    return recorder;
  } catch (err) {
    console.error('Failed to start recording', err);
    throw err;
  }
};

export const stopRecording = async (recorder: any): Promise<string | null> => {
  try {
    if (!recorder) return null;
    
    console.log('Stopping recording..');
    await recorder.stop();
    
    await ExpoAudio.setAudioModeAsync({
      allowsRecording: false,
    });
    
    // In the new API, the uri is a property of the recorder
    const uri = recorder.uri;
    console.log('Recording stopped and stored at', uri);
    
    return uri;
  } catch (err) {
    console.error('Failed to stop recording', err);
    throw err;
  }
};

export const convertSpeechToText = async (audioUri: string | null): Promise<string> => {
  try {
    if (!audioUri) {
      throw new Error('No audio file provided');
    }
    
    // For production, you would send this to your backend
    // which would then call Google Cloud Speech-to-Text API
    
    // This is a mock implementation - replace with actual API call
    console.log('Converting speech to text...');
    
    // In a real implementation, you would:
    // 1. Read the audio file
    // 2. Convert to appropriate format (base64, etc.)
    // 3. Send to your backend API
    // 4. Backend calls Google Cloud Speech-to-Text
    // 5. Return the transcribed text
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock responses for demo purposes
    const mockResponses = [
      "stolen phone near library",
      "harassment at campus center",
      "suspicious activity at dormitory",
      "accident near engineering building",
      "medical emergency at student union"
    ];
    
    const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    return randomResponse;
    
  } catch (error) {
    console.error('Error in speech to text conversion:', error);
    throw new Error('Speech recognition failed');
  }
};