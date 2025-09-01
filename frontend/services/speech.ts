// services/speech.ts
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export const startRecording = async (): Promise<Audio.Recording> => {
  try {
    console.log('Requesting permissions..');
    const { status } = await Audio.requestPermissionsAsync();
    
    if (status !== 'granted') {
      throw new Error('Audio permission not granted');
    }
    
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    
    console.log('Starting recording..');
    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    
    return recording;
  } catch (err) {
    console.error('Failed to start recording', err);
    throw err;
  }
};

export const stopRecording = async (recording: Audio.Recording | null): Promise<string | null> => {
  try {
    if (!recording) return null;
    
    console.log('Stopping recording..');
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
    
    const uri = recording.getURI();
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