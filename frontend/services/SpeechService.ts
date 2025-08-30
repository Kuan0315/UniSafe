import * as Speech from 'expo-speech';

export interface SpeechOptions {
  language?: string;
  pitch?: number;
  rate?: number;
  volume?: number;
}

export function speak(text: string, options: SpeechOptions = {}) {
  if (!text) return;
  try {
    Speech.stop();
    Speech.speak(text, { 
      language: options.language || 'en-US', 
      pitch: options.pitch || 1.0, 
      rate: options.rate || 1.0,
      volume: options.volume || 1.0
    });
  } catch (error) {
    console.error('Speech error:', error);
  }
}

export function stopSpeaking() {
  try {
    Speech.stop();
  } catch (error) {
    console.error('Stop speech error:', error);
  }
}

export function speakPageTitle(title: string) {
  speak(`Navigated to ${title} page`);
}

export function speakButtonAction(action: string) {
  speak(action);
}

export function speakNotification(notification: string) {
  speak(`New notification: ${notification}`);
}

export function speakEmergencyAlert(alert: string) {
  speak(`Emergency alert: ${alert}`, { rate: 0.8, pitch: 1.2 });
}

export function speakGuardianStatus(status: string) {
  speak(`Guardian mode: ${status}`);
}

export function speakSOSCountdown(count: number) {
  speak(`SOS will be sent in ${count} seconds`, { rate: 0.7, pitch: 1.1 });
}

export function speakLocationUpdate(location: string) {
  speak(`Location: ${location}`);
}

export function speakContactInfo(name: string, relationship: string) {
  speak(`${name}, ${relationship}`);
}

export function speakSettingsChange(setting: string, value: string) {
  speak(`${setting} changed to ${value}`);
}


